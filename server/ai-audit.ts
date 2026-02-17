/**
 * AI-Powered Audit Log Anomaly Detection
 *
 * Analyzes recent audit logs using Google Gemini to detect:
 *   - Unusual access patterns (bulk record viewing)
 *   - Suspicious login activity (odd hours, multiple failures)
 *   - Unauthorized data access attempts
 *   - Data exfiltration patterns
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AuditLog, User } from "@shared/schema";

export interface AuditLogWithUser extends AuditLog {
  user?: User | null;
}

export interface AnomalyResult {
  alertType: string;
  severity: "low" | "medium" | "high" | "critical";
  userId: string | null;
  description: string;
  anomalyScore: number;
}

export interface AnalysisSummary {
  summary: string;
  anomalies: AnomalyResult[];
  totalLogsAnalyzed: number;
  timeRange: string;
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

/**
 * Prepare audit logs into a readable format for the LLM
 */
function formatLogsForAI(logs: AuditLogWithUser[]): string {
  return logs
    .map((log, i) => {
      const userName = log.user
        ? `${log.user.firstName || ""} ${log.user.lastName || ""} (${log.user.role || "unknown"}, id:${log.userId})`
        : `Unknown user (id:${log.userId})`;
      const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : "unknown";
      return `[${i + 1}] ${time} | ${userName} | Action: ${log.action} | Resource: ${log.resourceType || "N/A"} #${log.resourceId || "N/A"} | Patient: ${log.patientId || "N/A"} | IP: ${log.ipAddress || "N/A"}`;
    })
    .join("\n");
}

/**
 * Run anomaly detection on audit logs using the Gemini LLM
 */
export async function analyzeAuditLogs(
  logs: AuditLogWithUser[],
  hoursBack: number = 24,
): Promise<AnalysisSummary> {
  if (logs.length === 0) {
    return {
      summary: "No audit logs found in the specified time range.",
      anomalies: [],
      totalLogsAnalyzed: 0,
      timeRange: `Last ${hoursBack} hours`,
    };
  }

  const model = getGeminiModel();

  if (!model) {
    // No API key — run rule-based analysis only
    return ruleBasedAnalysis(logs, hoursBack);
  }

  const formattedLogs = formatLogsForAI(logs);

  const prompt = `You are a healthcare system security analyst AI. Analyze the following audit logs from a centralized hospital management system in Nepal and detect any suspicious or anomalous activities.

=== SYSTEM CONTEXT ===
- This is a hospital management system with roles: admin, doctor, nurse, patient
- Logged actions include: user_login, user_logout, user_signup, view_patient, create_medical_record, view_medical_record, record_vital_signs, create_access_request, approved_access_request, denied_access_request, update_user_role, create_user, create_hospital, create_patient, create_appointment, update_appointment_status, create_security_alert, resolve_security_alert

=== AUDIT LOGS (Last ${hoursBack} hours, ${logs.length} entries) ===
${formattedLogs}

=== ANALYSIS INSTRUCTIONS ===
Look for these types of anomalies:
1. **Bulk access**: A user viewing many patient records in a short time (potential data harvesting)
2. **Off-hours access**: Actions at unusual hours (e.g., 11 PM – 5 AM) that could indicate unauthorized access
3. **Failed/denied patterns**: Multiple denied access requests from same doctor
4. **Privilege escalation**: Role changes or admin actions by unexpected users
5. **Rapid actions**: Too many actions in a very short window (bot-like behavior)
6. **Cross-patient access**: A doctor accessing many different patients without appointments
7. **Unusual login patterns**: Multiple logins from different IPs in short time

For each anomaly found, assign:
- severity: "low", "medium", "high", or "critical"
- anomalyScore: 0.0 to 1.0 (how confident you are this is a real threat)

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "summary": "2-3 sentence overview of the system activity and any concerns",
  "anomalies": [
    {
      "alertType": "short_label_like_bulk_access",
      "severity": "high",
      "userId": "the-user-id-or-null",
      "description": "Detailed description of the suspicious activity",
      "anomalyScore": 0.85
    }
  ]
}

If no anomalies are found, return an empty anomalies array with a positive summary.
Important: Be realistic. Normal daily usage patterns (a doctor viewing a few patients, regular logins) are NOT anomalies. Only flag genuinely suspicious patterns.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || "Analysis complete.",
      anomalies: (parsed.anomalies || []).map((a: any) => ({
        alertType: a.alertType || "unknown_anomaly",
        severity: ["low", "medium", "high", "critical"].includes(a.severity) ? a.severity : "medium",
        userId: a.userId || null,
        description: a.description || "No description provided.",
        anomalyScore: Math.min(1, Math.max(0, parseFloat(a.anomalyScore) || 0.5)),
      })),
      totalLogsAnalyzed: logs.length,
      timeRange: `Last ${hoursBack} hours`,
    };
  } catch (err) {
    console.error("AI audit analysis failed, falling back to rule-based:", err);
    return ruleBasedAnalysis(logs, hoursBack);
  }
}

/**
 * Fallback rule-based analysis when AI is unavailable
 */
function ruleBasedAnalysis(logs: AuditLogWithUser[], hoursBack: number): AnalysisSummary {
  const anomalies: AnomalyResult[] = [];

  // Group logs by userId
  const byUser = new Map<string, AuditLogWithUser[]>();
  for (const log of logs) {
    const uid = log.userId || "unknown";
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(log);
  }

  for (const [userId, userLogs] of byUser) {
    // Check for bulk patient viewing (>10 view_patient in the window)
    const viewPatientLogs = userLogs.filter((l) => l.action === "view_patient");
    if (viewPatientLogs.length > 10) {
      const uniquePatients = new Set(viewPatientLogs.map((l) => l.patientId)).size;
      anomalies.push({
        alertType: "bulk_record_access",
        severity: viewPatientLogs.length > 20 ? "high" : "medium",
        userId,
        description: `User viewed ${viewPatientLogs.length} patient records (${uniquePatients} unique patients) in the last ${hoursBack} hours. This may indicate unauthorized bulk data access.`,
        anomalyScore: Math.min(1, viewPatientLogs.length / 30),
      });
    }

    // Check for bulk medical record viewing (>15 in window)
    const viewRecordLogs = userLogs.filter((l) => l.action === "view_medical_record");
    if (viewRecordLogs.length > 15) {
      anomalies.push({
        alertType: "bulk_medical_record_access",
        severity: "high",
        userId,
        description: `User accessed ${viewRecordLogs.length} medical records in the last ${hoursBack} hours. Possible data exfiltration attempt.`,
        anomalyScore: Math.min(1, viewRecordLogs.length / 25),
      });
    }

    // Check for off-hours activity (11 PM – 5 AM)
    const offHoursLogs = userLogs.filter((l) => {
      if (!l.timestamp) return false;
      const hour = new Date(l.timestamp).getHours();
      return hour >= 23 || hour < 5;
    });
    if (offHoursLogs.length > 5) {
      anomalies.push({
        alertType: "off_hours_activity",
        severity: "medium",
        userId,
        description: `User had ${offHoursLogs.length} actions during off-hours (11 PM – 5 AM). Review if this access is expected.`,
        anomalyScore: Math.min(1, offHoursLogs.length / 15),
      });
    }

    // Check for multiple denied access requests
    const deniedRequests = userLogs.filter((l) => l.action === "denied_access_request");
    if (deniedRequests.length >= 3) {
      anomalies.push({
        alertType: "multiple_access_denials",
        severity: "medium",
        userId,
        description: `User had ${deniedRequests.length} access requests denied. This may indicate attempts to access unauthorized patient data.`,
        anomalyScore: Math.min(1, deniedRequests.length / 5),
      });
    }

    // Check rapid actions (>30 actions in 10 minutes)
    const sortedLogs = [...userLogs].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
    for (let i = 0; i < sortedLogs.length - 30; i++) {
      const start = sortedLogs[i].timestamp ? new Date(sortedLogs[i].timestamp!).getTime() : 0;
      const end = sortedLogs[i + 30].timestamp ? new Date(sortedLogs[i + 30].timestamp!).getTime() : 0;
      if (end - start < 10 * 60 * 1000) {
        anomalies.push({
          alertType: "rapid_actions",
          severity: "high",
          userId,
          description: `User performed 30+ actions within 10 minutes. This pattern suggests automated/bot-like behavior.`,
          anomalyScore: 0.85,
        });
        break;
      }
    }
  }

  const uniqueUsers = byUser.size;
  const actionCounts = new Map<string, number>();
  for (const log of logs) {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
  }
  const topActions = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([action, count]) => `${action} (${count})`)
    .join(", ");

  return {
    summary: `Analyzed ${logs.length} audit logs from ${uniqueUsers} users over the last ${hoursBack} hours. Top actions: ${topActions}. ${anomalies.length > 0 ? `Found ${anomalies.length} potential anomalies.` : "No anomalies detected."}` +
      (process.env.GEMINI_API_KEY ? "" : " (Rule-based analysis — configure GEMINI_API_KEY for AI-powered detection.)"),
    anomalies,
    totalLogsAnalyzed: logs.length,
    timeRange: `Last ${hoursBack} hours`,
  };
}
