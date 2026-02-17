/**
 * Seed audit logs that trigger AI anomaly detection.
 * Run: npx tsx seed-audit-anomalies.ts
 *
 * Creates test data for:
 * - bulk_record_access (>10 view_patient)
 * - bulk_medical_record_access (>15 view_medical_record)
 * - off_hours_activity (>5 actions 11 PM - 5 AM)
 * - multiple_access_denials (>=3 denied_access_request)
 * - rapid_actions (30+ actions within 10 minutes)
 */

import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:newpassword123@localhost:5432/medrecord_db",
});

async function seed() {
  const client = await pool.connect();
  try {
    // Get a doctor and patient IDs
    const doctorRes = await client.query(
      `SELECT id FROM users WHERE role = 'doctor' LIMIT 1`
    );
    const patientRes = await client.query(
      `SELECT id FROM patients ORDER BY id LIMIT 25`
    );

    const doctorId = doctorRes.rows[0]?.id;
    const patientIds = patientRes.rows.map((r: { id: number }) => r.id) as number[];

    if (!doctorId || patientIds.length < 5) {
      console.error("Need at least one doctor and 5+ patients. Run seed-patients.ts first.");
      process.exit(1);
    }

    const now = new Date();
    const baseTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    const insertLog = async (log: {
      user_id: string | null;
      action: string;
      resource_type: string | null;
      resource_id: number | null;
      patient_id: number | null;
      ip_address: string | null;
      timestamp: Date;
    }) => {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, patient_id, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          log.user_id,
          log.action,
          log.resource_type,
          log.resource_id,
          log.patient_id,
          log.ip_address || "127.0.0.1",
          log.timestamp,
        ]
      );
    };

    console.log("Inserting anomaly test audit logs (doctor:", doctorId, ", patients:", patientIds.length, ")...\n");

    // 1. Bulk view_patient (15+) -> triggers bulk_record_access
    for (let i = 0; i < 15; i++) {
      const t = new Date(baseTime.getTime() + i * 3 * 60 * 1000);
      await insertLog({
        user_id: doctorId,
        action: "view_patient",
        resource_type: "patient",
        resource_id: patientIds[i % patientIds.length],
        patient_id: patientIds[i % patientIds.length],
        ip_address: "192.168.1.10",
        timestamp: t,
      });
    }
    console.log("✓ 15 view_patient logs (bulk_record_access)");

    // 2. Bulk view_medical_record (20+) -> triggers bulk_medical_record_access
    for (let i = 0; i < 20; i++) {
      const t = new Date(baseTime.getTime() + 60 * 60 * 1000 + i * 2 * 60 * 1000); // 1h after base
      await insertLog({
        user_id: doctorId,
        action: "view_medical_record",
        resource_type: "medical_record",
        resource_id: 100 + i,
        patient_id: patientIds[i % patientIds.length],
        ip_address: "192.168.1.10",
        timestamp: t,
      });
    }
    console.log("✓ 20 view_medical_record logs (bulk_medical_record_access)");

    // 3. Off-hours activity (6+ actions between 11 PM - 5 AM), within last 24h
    const offHoursBase = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    offHoursBase.setHours(2, 0, 0, 0); // 2 AM, ~10 hours ago
    for (let i = 0; i < 6; i++) {
      const t = new Date(offHoursBase.getTime() + i * 5 * 60 * 1000);
      await insertLog({
        user_id: doctorId,
        action: "view_medical_record",
        resource_type: "medical_record",
        resource_id: 200 + i,
        patient_id: patientIds[i % patientIds.length],
        ip_address: "10.0.0.5",
        timestamp: t,
      });
    }
    console.log("✓ 6 off-hours (2 AM) logs (off_hours_activity)");

    // 4. Multiple denied access requests (4x) -> triggers multiple_access_denials
    const deniedTime = new Date(baseTime.getTime() + 3 * 60 * 60 * 1000);
    for (let i = 0; i < 4; i++) {
      const t = new Date(deniedTime.getTime() + i * 10 * 60 * 1000);
      await insertLog({
        user_id: doctorId,
        action: "denied_access_request",
        resource_type: "access_request",
        resource_id: 301 + i,
        patient_id: patientIds[i],
        ip_address: "192.168.1.10",
        timestamp: t,
      });
    }
    console.log("✓ 4 denied_access_request logs (multiple_access_denials)");

    // 5. Rapid actions (35 actions within 10 minutes) -> triggers rapid_actions
    const rapidStart = new Date(baseTime.getTime() + 5 * 60 * 60 * 1000);
    for (let i = 0; i < 35; i++) {
      const t = new Date(rapidStart.getTime() + i * 15 * 1000); // 15 sec apart, total ~8.75 min
      await insertLog({
        user_id: doctorId,
        action: i % 2 === 0 ? "view_patient" : "view_medical_record",
        resource_type: i % 2 === 0 ? "patient" : "medical_record",
        resource_id: 400 + i,
        patient_id: patientIds[i % patientIds.length],
        ip_address: "192.168.1.10",
        timestamp: t,
      });
    }
    console.log("✓ 35 rapid actions in ~9 min (rapid_actions)");

    console.log("\nDone. Run AI Analysis (e.g. Last 24 hours) on Security Alerts to see detected anomalies.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
