import pg from "pg";
import crypto from "crypto";

const pool = new pg.Pool({
  connectionString: "postgres://postgres:newpassword123@localhost:5432/medrecord_db",
});

// 10 Nepali teenage patients (ages 12-18)
const patientData = [
  { firstName: "Sita", lastName: "Thapa", dob: "2010-03-15", gender: "female", bloodGroup: "A+", address: "Pokhara-8, Kaski", allergies: "Penicillin", guardianName: "Hari Thapa", guardianPhone: "9841234567", guardianRelation: "Father", emergencyContact: "9841234567" },
  { firstName: "Bikash", lastName: "Gurung", dob: "2008-07-22", gender: "male", bloodGroup: "B+", address: "Lakeside, Pokhara", allergies: null, guardianName: "Dipak Gurung", guardianPhone: "9856123456", guardianRelation: "Father", emergencyContact: "9856123456" },
  { firstName: "Anita", lastName: "Shrestha", dob: "2012-11-05", gender: "female", bloodGroup: "O+", address: "Baneswor, Kathmandu", allergies: "Sulfa drugs", guardianName: "Ram Shrestha", guardianPhone: "9812345678", guardianRelation: "Father", emergencyContact: "9812345678" },
  { firstName: "Rajesh", lastName: "Rai", dob: "2009-01-30", gender: "male", bloodGroup: "AB+", address: "Dharan-5, Sunsari", allergies: null, guardianName: "Kamala Rai", guardianPhone: "9842123456", guardianRelation: "Mother", emergencyContact: "9842123456" },
  { firstName: "Sunita", lastName: "Magar", dob: "2011-06-18", gender: "female", bloodGroup: "A-", address: "Butwal-11, Rupandehi", allergies: "Aspirin", guardianName: "Bir Bahadur Magar", guardianPhone: "9867123456", guardianRelation: "Father", emergencyContact: "9867123456" },
  { firstName: "Dipendra", lastName: "Tamang", dob: "2007-09-10", gender: "male", bloodGroup: "O-", address: "Jorpati, Kathmandu", allergies: null, guardianName: "Dhan Kumari Tamang", guardianPhone: "9813456789", guardianRelation: "Mother", emergencyContact: "9813456789" },
  { firstName: "Kamala", lastName: "Adhikari", dob: "2013-04-25", gender: "female", bloodGroup: "B-", address: "Bharatpur-10, Chitwan", allergies: "Ibuprofen, Latex", guardianName: "Krishna Adhikari", guardianPhone: "9855123456", guardianRelation: "Father", emergencyContact: "9855123456" },
  { firstName: "Nabin", lastName: "Karki", dob: "2010-12-08", gender: "male", bloodGroup: "A+", address: "Biratnagar-7, Morang", allergies: null, guardianName: "Sarita Karki", guardianPhone: "9852123456", guardianRelation: "Mother", emergencyContact: "9852123456" },
  { firstName: "Pramila", lastName: "Limbu", dob: "2008-02-14", gender: "female", bloodGroup: "O+", address: "Dhankuta-3, Dhankuta", allergies: "Codeine", guardianName: "Tika Limbu", guardianPhone: "9843567890", guardianRelation: "Father", emergencyContact: "9843567890" },
  { firstName: "Santosh", lastName: "Bhattarai", dob: "2007-08-01", gender: "male", bloodGroup: "AB-", address: "Hetauda-2, Makwanpur", allergies: null, guardianName: "Gita Bhattarai", guardianPhone: "9845678901", guardianRelation: "Mother", emergencyContact: "9845678901" },
];

// Medical record templates — teenager-appropriate conditions
const medicalTemplates = [
  { complaint: "Fever and body ache for 3 days", diagnosis: "Viral fever (Dengue suspected)", prescription: "Paracetamol 250mg TDS, ORS, Rest", lab: "CBC: WBC 3200, Platelet 98000, NS1 Positive", treatment: "Oral hydration, platelet monitoring, follow-up in 2 days", notes: "Guardian advised to use mosquito net at home. Avoid aspirin in children." },
  { complaint: "Sore throat and difficulty swallowing for 4 days", diagnosis: "Acute tonsillitis (Group A Streptococcal)", prescription: "Amoxicillin 250mg TDS x 10 days, Ibuprofen 200mg PRN for pain", lab: "Throat swab: Rapid strep test positive", treatment: "Complete antibiotic course, warm salt-water gargle, soft diet", notes: "School absence note provided. Follow-up in 5 days if not improving." },
  { complaint: "Wheezing and shortness of breath during sports", diagnosis: "Exercise-induced asthma", prescription: "Salbutamol inhaler 2 puffs PRN before exercise, Budesonide 100mcg BD", lab: "Spirometry: FEV1 72% predicted, reversible with bronchodilator", treatment: "Inhaled corticosteroids, pre-exercise inhaler use, avoid cold air triggers", notes: "Inhaler technique demonstrated to patient and guardian. Asthma action plan given to school." },
  { complaint: "Stomach pain and nausea after eating for 2 weeks", diagnosis: "Functional dyspepsia / Gastritis", prescription: "Omeprazole 20mg OD before breakfast, Domperidone 10mg before meals", lab: "Abdominal USG: Normal, H.pylori stool antigen: Negative", treatment: "Dietary modification, avoid spicy/junk food, regular meal timings", notes: "Patient reports eating irregularly due to school schedule. Counseled on healthy eating habits." },
  { complaint: "Right ankle pain and swelling after football", diagnosis: "Grade 2 lateral ankle sprain", prescription: "Ibuprofen 200mg TDS x 5 days, Crepe bandage", lab: "X-ray ankle: No fracture. Soft tissue swelling lateral aspect", treatment: "RICE protocol (Rest, Ice, Compression, Elevation), ankle brace, physiotherapy after 1 week", notes: "Advised no sports for 3-4 weeks. Crutches provided. School PT excuse note given." },
  { complaint: "Itchy red patches on elbows and knees for 3 weeks", diagnosis: "Atopic dermatitis (Eczema)", prescription: "Cetirizine 10mg OD, Mometasone cream topical BD, Moisturizer QID", lab: "No lab tests ordered. Clinical diagnosis.", treatment: "Topical steroids short course, regular moisturizing, avoid irritants", notes: "Family history of atopy. Advised cotton clothing and fragrance-free soap." },
  { complaint: "Persistent headaches affecting school for 1 month", diagnosis: "Tension-type headache / Migraine without aura", prescription: "Ibuprofen 200mg PRN, Amitriptyline 10mg at bedtime (prophylaxis)", lab: "Neurological exam: Normal. Vision test: 6/6 bilateral", treatment: "Headache diary, stress management, regular sleep schedule, screen time reduction", notes: "Patient reports 6+ hours daily screen time. Exam stress noted. Referred for counseling." },
  { complaint: "Acne on face and back worsening for 6 months", diagnosis: "Acne vulgaris (moderate, inflammatory)", prescription: "Adapalene 0.1% gel topical at night, Clindamycin 1% gel BD, Doxycycline 50mg OD x 6 weeks", lab: "No labs required", treatment: "Topical retinoid + antibiotic, gentle cleanser BD, avoid picking, sun protection", notes: "Affecting patient's self-esteem. Counseled on treatment timeline (8-12 weeks for improvement)." },
  { complaint: "Abdominal pain right lower quadrant, fever", diagnosis: "Acute appendicitis", prescription: "IV Ceftriaxone 50mg/kg BD, IV Metronidazole 7.5mg/kg TDS (pre-op)", lab: "CBC: WBC 15400, Neutrophils 82%, USG: Appendix 11mm, peri-appendiceal fluid", treatment: "Emergency laparoscopic appendectomy, IV antibiotics, NPO", notes: "Parents counseled. Surgical consent obtained from guardian. Post-op recovery expected 3-5 days." },
  { complaint: "Frequent urination, increased thirst, weight loss for 2 months", diagnosis: "Type 1 Diabetes Mellitus (newly diagnosed)", prescription: "Insulin Glargine 10U at bedtime, Insulin Aspart per sliding scale before meals", lab: "FBS: 320 mg/dL, HbA1c: 11.5%, C-peptide: Low, GAD antibodies: Positive", treatment: "Insulin therapy, carb counting education, blood glucose self-monitoring QID", notes: "Patient and parents counseled on insulin injection technique, hypoglycemia management. School nurse informed." },
  { complaint: "Feeling sad, loss of interest, difficulty sleeping for 2 months", diagnosis: "Major depressive episode (adolescent)", prescription: "Fluoxetine 10mg OD (to increase to 20mg after 2 weeks if tolerated)", lab: "Thyroid function: Normal (TSH 2.1), CBC: Normal", treatment: "SSRI antidepressant, cognitive behavioral therapy referral, regular exercise", notes: "PHQ-A score: 18 (moderate-severe). Safety assessment: no active suicidal ideation. Weekly follow-up for first month. Guardian counseled." },
  { complaint: "Left wrist pain after fall during basketball", diagnosis: "Distal radius buckle fracture (torus fracture)", prescription: "Ibuprofen 200mg TDS x 5 days for pain, Below-elbow cast", lab: "X-ray wrist: Torus fracture distal radius, no displacement", treatment: "Below-elbow cast for 3-4 weeks, sling support, follow-up X-ray in 3 weeks", notes: "Common fracture in adolescents. Good prognosis. No sports until cast removal and clearance." },
];

const doctorIds = ["dev-doctor", "ba598f67-bb8f-4e15-a224-a3ffc05cb9bd"];
const hospitalIds = [1, 2];

function randomDate(yearStart: number, yearEnd: number): Date {
  const start = new Date(yearStart, 0, 1);
  const end = new Date(yearEnd, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomEl<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const p of patientData) {
      // Create user
      const userId = crypto.randomUUID();
      const userRes = await client.query(
        `INSERT INTO users (id, email, first_name, last_name, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'patient', true, NOW(), NOW()) RETURNING id`,
        [userId, `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@example.com`, p.firstName, p.lastName]
      );
      const uId = userRes.rows[0].id;

      // Create patient
      const patientRes = await client.query(
        `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, guardian_name, guardian_phone, guardian_relation, emergency_contact, allergies, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING id`,
        [uId, p.dob, p.gender, p.bloodGroup, p.address, p.guardianName, p.guardianPhone, p.guardianRelation, p.emergencyContact, p.allergies]
      );
      const patientId = patientRes.rows[0].id;

      // Create 1-3 random medical records per patient
      const numRecords = 1 + Math.floor(Math.random() * 3);
      const usedTemplates = new Set<number>();

      for (let i = 0; i < numRecords; i++) {
        let idx: number;
        do { idx = Math.floor(Math.random() * medicalTemplates.length); } while (usedTemplates.has(idx));
        usedTemplates.add(idx);

        const t = medicalTemplates[idx];
        const visitDate = randomDate(2024, 2025);
        const doctorId = randomEl(doctorIds);
        const hospitalId = randomEl(hospitalIds);

        const recRes = await client.query(
          `INSERT INTO medical_records (patient_id, doctor_id, hospital_id, visit_date, chief_complaint, diagnosis, prescription, lab_results, treatment_plan, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING id`,
          [patientId, doctorId, hospitalId, visitDate.toISOString(), t.complaint, t.diagnosis, t.prescription, t.lab, t.treatment, t.notes]
        );
        const recordId = recRes.rows[0].id;

        // Add vital signs for each record
        const temp = (36 + Math.random() * 3).toFixed(1);
        const sysBP = 100 + Math.floor(Math.random() * 60);
        const diaBP = 60 + Math.floor(Math.random() * 35);
        const pulse = 60 + Math.floor(Math.random() * 40);
        const respRate = 14 + Math.floor(Math.random() * 10);
        const weight = (45 + Math.random() * 40).toFixed(1);
        const height = (150 + Math.random() * 30).toFixed(1);
        const bmi = (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1);

        await client.query(
          `INSERT INTO vital_signs (medical_record_id, recorded_by, temperature, blood_pressure, pulse_rate, respiratory_rate, weight, height, bmi, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [recordId, doctorId, temp, `${sysBP}/${diaBP}`, pulse, respRate, weight, height, bmi]
        );
      }

      console.log(`✓ Created patient: ${p.firstName} ${p.lastName} (ID: ${patientId}) with ${numRecords} medical record(s)`);
    }

    await client.query("COMMIT");
    console.log("\nDone! 10 Nepali patients with medical records inserted.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
