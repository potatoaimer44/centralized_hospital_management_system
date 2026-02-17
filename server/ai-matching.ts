/**
 * Hybrid AI Record Matching Service
 *
 * Two-stage pipeline:
 *   Stage 1 — Fast fuzzy string matching to pre-filter candidates from the DB
 *   Stage 2 — Google Gemini LLM verification for confidence scoring & reasoning
 */

import stringSimilarity from "string-similarity";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Types ──

export interface PatientCandidate {
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  gender: string | null;
  address: string | null;
}

export interface FieldScore {
  match: boolean;
  similarity: number; // 0–1
}

export interface MatchResult {
  existingPatientId: number;
  matchConfidence: "high" | "medium" | "low";
  matchedFields: {
    firstName: FieldScore;
    lastName: FieldScore;
    dateOfBirth: FieldScore;
    bloodGroup: FieldScore;
    gender: FieldScore;
    address: FieldScore;
  };
  fuzzyScore: number;   // Stage-1 aggregate score
  aiScore: number;       // Stage-2 LLM confidence (0–1)
  aiReasoning: string;   // LLM-generated explanation
}

// ── Stage 1: Fuzzy Pre-Filter ──

const FUZZY_THRESHOLD = 0.4; // minimum aggregate score to pass to Stage 2

function fieldSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  return stringSimilarity.compareTwoStrings(a.toLowerCase().trim(), b.toLowerCase().trim());
}

function dobSimilarity(a: string, b: string): number {
  // Exact date match = 1.0, same year = 0.5, otherwise 0
  if (a === b) return 1.0;
  const yearA = a.split("-")[0];
  const yearB = b.split("-")[0];
  if (yearA === yearB) return 0.5;
  return 0;
}

export function fuzzyScoreCandidate(
  newPatient: PatientCandidate,
  existing: PatientCandidate,
): { score: number; fields: MatchResult["matchedFields"] } {
  const firstNameSim = fieldSimilarity(newPatient.firstName, existing.firstName);
  const lastNameSim = fieldSimilarity(newPatient.lastName, existing.lastName);
  const dobSim = dobSimilarity(newPatient.dateOfBirth, existing.dateOfBirth);
  const bloodSim = fieldSimilarity(newPatient.bloodGroup, existing.bloodGroup);
  const genderSim = fieldSimilarity(newPatient.gender, existing.gender);
  const addressSim = fieldSimilarity(newPatient.address, existing.address);

  // Weighted aggregate: name + DOB are most important
  const score =
    firstNameSim * 0.25 +
    lastNameSim * 0.25 +
    dobSim * 0.25 +
    bloodSim * 0.10 +
    genderSim * 0.05 +
    addressSim * 0.10;

  const mkField = (sim: number, threshold = 0.7): FieldScore => ({
    match: sim >= threshold,
    similarity: parseFloat(sim.toFixed(4)),
  });

  return {
    score: parseFloat(score.toFixed(4)),
    fields: {
      firstName: mkField(firstNameSim),
      lastName: mkField(lastNameSim),
      dateOfBirth: mkField(dobSim, 0.9),
      bloodGroup: mkField(bloodSim, 0.9),
      gender: mkField(genderSim, 0.9),
      address: mkField(addressSim, 0.5),
    },
  };
}

export function fuzzyPreFilter(
  newPatient: PatientCandidate,
  allCandidates: PatientCandidate[],
): { candidate: PatientCandidate; score: number; fields: MatchResult["matchedFields"] }[] {
  return allCandidates
    .map((c) => {
      const { score, fields } = fuzzyScoreCandidate(newPatient, c);
      return { candidate: c, score, fields };
    })
    .filter((r) => r.score >= FUZZY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

// ── Stage 2: LLM Verification via Google Gemini ──

let geminiModel: any = null;

function getGeminiModel() {
  if (geminiModel) return geminiModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  return geminiModel;
}

async function llmVerify(
  newPatient: PatientCandidate,
  existing: PatientCandidate,
  fuzzyFields: MatchResult["matchedFields"],
): Promise<{ aiScore: number; aiReasoning: string }> {
  const model = getGeminiModel();

  if (!model) {
    // No API key configured — fall back to fuzzy score only
    const avgSim =
      Object.values(fuzzyFields).reduce((sum, f) => sum + f.similarity, 0) /
      Object.values(fuzzyFields).length;
    return {
      aiScore: parseFloat(avgSim.toFixed(4)),
      aiReasoning:
        "AI verification unavailable (no GEMINI_API_KEY configured). Score based on fuzzy string matching only.",
    };
  }

  const prompt = `You are a medical record deduplication assistant for a centralized hospital management system in Nepal.

Compare these two patient records and determine if they belong to the SAME person.

=== NEWLY REGISTERED PATIENT ===
Name: ${newPatient.firstName} ${newPatient.lastName}
Date of Birth: ${newPatient.dateOfBirth}
Blood Group: ${newPatient.bloodGroup || "Not provided"}
Gender: ${newPatient.gender || "Not provided"}
Address: ${newPatient.address || "Not provided"}

=== EXISTING PATIENT IN DATABASE ===
Name: ${existing.firstName} ${existing.lastName}
Date of Birth: ${existing.dateOfBirth}
Blood Group: ${existing.bloodGroup || "Not provided"}
Gender: ${existing.gender || "Not provided"}
Address: ${existing.address || "Not provided"}

=== FUZZY MATCHING RESULTS (Stage 1) ===
First Name similarity: ${fuzzyFields.firstName.similarity} (${fuzzyFields.firstName.match ? "MATCH" : "NO MATCH"})
Last Name similarity: ${fuzzyFields.lastName.similarity} (${fuzzyFields.lastName.match ? "MATCH" : "NO MATCH"})
Date of Birth similarity: ${fuzzyFields.dateOfBirth.similarity} (${fuzzyFields.dateOfBirth.match ? "MATCH" : "NO MATCH"})
Blood Group similarity: ${fuzzyFields.bloodGroup.similarity} (${fuzzyFields.bloodGroup.match ? "MATCH" : "NO MATCH"})
Gender similarity: ${fuzzyFields.gender.similarity} (${fuzzyFields.gender.match ? "MATCH" : "NO MATCH"})
Address similarity: ${fuzzyFields.address.similarity} (${fuzzyFields.address.match ? "MATCH" : "NO MATCH"})

Consider:
- Nepali names may have spelling variations (e.g., "Shrestha" vs "Shresta", "Sita" vs "Seeta")
- Addresses in Nepal may be written differently (e.g., "Pokhara" vs "Pokhara-8, Kaski")
- Blood group and date of birth are strong identifiers
- Same name + same DOB is a very strong signal

Respond in EXACTLY this JSON format (no markdown, no code fences):
{"confidence": 0.XX, "reasoning": "Your 1-2 sentence explanation"}

Where "confidence" is a number between 0.0 and 1.0, and "reasoning" explains your assessment.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON from the response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      aiScore: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      aiReasoning: parsed.reasoning || "No reasoning provided by AI.",
    };
  } catch (err) {
    console.error("Gemini AI verification failed (non-fatal):", err);
    // Fallback: use fuzzy score
    const avgSim =
      Object.values(fuzzyFields).reduce((sum, f) => sum + f.similarity, 0) /
      Object.values(fuzzyFields).length;
    return {
      aiScore: parseFloat(avgSim.toFixed(4)),
      aiReasoning: "AI verification failed. Score based on fuzzy string matching only.",
    };
  }
}

// ── Combined Pipeline ──

function confidenceLevel(aiScore: number): "high" | "medium" | "low" {
  if (aiScore >= 0.80) return "high";
  if (aiScore >= 0.55) return "medium";
  return "low";
}

/**
 * Run the full hybrid matching pipeline:
 *   1. Fuzzy pre-filter all existing patients
 *   2. Send top candidates to LLM for verification
 *   Returns matches sorted by AI confidence (descending)
 */
export async function hybridMatch(
  newPatient: PatientCandidate,
  allExistingPatients: PatientCandidate[],
): Promise<MatchResult[]> {
  // Stage 1: fuzzy filter
  const fuzzyCandidates = fuzzyPreFilter(newPatient, allExistingPatients);

  if (fuzzyCandidates.length === 0) return [];

  // Stage 2: LLM verification (top 5 candidates max to control cost/latency)
  const top = fuzzyCandidates.slice(0, 5);

  const results: MatchResult[] = [];

  for (const { candidate, score: fuzzyScore, fields } of top) {
    const { aiScore, aiReasoning } = await llmVerify(newPatient, candidate, fields);

    // Only include if AI score is meaningful
    if (aiScore >= 0.40) {
      results.push({
        existingPatientId: candidate.patientId,
        matchConfidence: confidenceLevel(aiScore),
        matchedFields: fields,
        fuzzyScore,
        aiScore,
        aiReasoning,
      });
    }
  }

  return results.sort((a, b) => b.aiScore - a.aiScore);
}
