import type { Express, Request, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isReplitAuthAvailable } from "./replitAuth";
import { hashPassword } from "./password";
import type { InsertAuditLog, User } from "@shared/schema";
import { analyzeAuditLogs, type AuditLogWithUser } from "./ai-audit";

/** Remove password from user object before sending to client */
function stripPassword(user: User): Omit<User, "password"> {
  const { password: _pw, ...safe } = user;
  return safe;
}

const isAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as { role?: string } | undefined;
  if (user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/** Get current user id from request (works in both dev and production) */
function getReqUserId(req: Request): string {
  const u = req.user as any;
  return u?.claims?.sub ?? u?.id ?? "unknown";
}

/** Fire-and-forget audit log — never crashes the request */
async function logAudit(data: InsertAuditLog): Promise<void> {
  try {
    await storage.createAuditLog(data);
  } catch (err) {
    console.error("Audit log failed (non-fatal):", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app, storage);

  // Auth status
  app.get("/api/auth/user", async (req, res) => {
    // Check if user is authenticated (works in both dev and production)
    if (req.isAuthenticated() && req.user) {
      return res.json(req.user);
    }

    // Not authenticated
    res.status(401).json({ message: "Not authenticated" });
  });

  // Users
  app.get("/api/users", isAuthenticated, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(stripPassword));
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    const { role } = req.body;
    const targetUser = await storage.getUser(req.params.id);
    const oldRole = targetUser?.role;
    const user = await storage.updateUserRole(req.params.id, role);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If role changed to patient, ensure a patient profile exists
    if (role === "patient") {
      const existingPatient = await storage.getPatientByUserId(user.id);
      if (!existingPatient) {
        await storage.createPatient({
          userId: user.id,
          dateOfBirth: "2000-01-01", // placeholder
        });
      }
    }

    logAudit({
      userId: getReqUserId(req),
      action: "update_user_role",
      resourceType: "user",
      ipAddress: req.ip,
      details: {
        targetUserId: req.params.id,
        targetEmail: user.email,
        oldRole,
        newRole: role,
      },
    });
    res.json(stripPassword(user));
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    const { password, ...rest } = req.body;
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const hashed = await hashPassword(password);
    const user = await storage.createUser({ ...rest, password: hashed });

    // If the new user is a patient, auto-create a patient profile
    if (user.role === "patient") {
      const existingPatient = await storage.getPatientByUserId(user.id);
      if (!existingPatient) {
        await storage.createPatient({
          userId: user.id,
          dateOfBirth: "2000-01-01", // placeholder — admin can update later
        });
      }
    }

    logAudit({
      userId: getReqUserId(req),
      action: "create_user",
      resourceType: "user",
      ipAddress: req.ip,
    });
    res.status(201).json(stripPassword(user));
  });

  // Hospitals
  app.get("/api/hospitals", isAuthenticated, async (req, res) => {
    const hospitals = await storage.getHospitals();
    res.json(hospitals);
  });

  app.get("/api/hospitals/:id", isAuthenticated, async (req, res) => {
    const hospitalId = Number(req.params.id);
    if (Number.isNaN(hospitalId)) {
      return res.status(400).json({ message: "Invalid hospital id" });
    }

    const hospital = await storage.getHospital(hospitalId);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.json(hospital);
  });

  app.post("/api/hospitals", isAuthenticated, async (req, res) => {
    const hospital = await storage.createHospital(req.body);
    logAudit({
      userId: getReqUserId(req),
      action: "create_hospital",
      resourceType: "hospital",
      resourceId: hospital.id,
      ipAddress: req.ip,
    });
    res.status(201).json(hospital);
  });

  // Patients
  // ── Patient's own profile (must be before /api/patients/:id) ──
  app.get("/api/patients/me", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub ?? user?.id;

    const patient = await storage.getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const full = await storage.getPatient(patient.id);
    if (!full) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    res.json(full);
  });

  app.get("/api/patients/me/records", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub ?? user?.id;

    const patient = await storage.getPatientByUserId(userId);
    if (!patient) return res.json([]);

    const records = await storage.getMedicalRecordsByPatient(patient.id);
    res.json(records);
  });

  app.get("/api/patients/me/vitals", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub ?? user?.id;

    const patient = await storage.getPatientByUserId(userId);
    if (!patient) return res.json([]);

    const records = await storage.getMedicalRecordsByPatient(patient.id);
    const allVitals = [];
    for (const r of records) {
      const vitals = await storage.getVitalSignsByRecord(r.id);
      allVitals.push(...vitals);
    }
    allVitals.sort((a, b) => {
      const da = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
      const dbi = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
      return dbi - da;
    });
    res.json(allVitals);
  });

  app.get("/api/patients", isAuthenticated, async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    const patientId = Number(req.params.id);
    if (Number.isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient id" });
    }

    const user = req.user as any;
    const userId = user?.claims?.sub ?? user?.id;

    // Doctors with denied access cannot view this patient
    if (user.role === "doctor") {
      const denied = await storage.hasDeniedAccess(userId, patientId);
      if (denied) {
        return res.status(403).json({
          message: "Access denied. This patient has denied your access request. You cannot view their records.",
        });
      }
    }

    const patient = await storage.getPatient(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const records = await storage.getMedicalRecordsByPatient(patient.id);
    logAudit({
      userId,
      action: "view_patient",
      resourceType: "patient",
      resourceId: patient.id,
      patientId: patient.id,
      ipAddress: req.ip,
    });
    res.json({ ...patient, medicalRecords: records });
  });

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    const patient = await storage.createPatient(req.body);
    logAudit({
      userId: getReqUserId(req),
      action: "create_patient",
      resourceType: "patient",
      resourceId: patient.id,
      patientId: patient.id,
      ipAddress: req.ip,
    });
    res.status(201).json(patient);
  });

  // Register patient: creates user (role patient) + patient record (for staff who are not admin)
  app.post("/api/patients/register", isAuthenticated, async (req, res) => {
    const body = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth: string;
      gender?: string;
      bloodGroup?: string;
      address?: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianRelation?: string;
      emergencyContact?: string;
      allergies?: string;
    };
    const { dateOfBirth, gender, bloodGroup, address, guardianName, guardianPhone, guardianRelation, emergencyContact, allergies, password, ...userFields } = body;
    const hashed = password ? await hashPassword(password) : null;
    const user = await storage.createUser({
      ...userFields,
      role: "patient",
      password: hashed,
    });
    const patient = await storage.createPatient({
      userId: user.id,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      guardianName,
      guardianPhone,
      guardianRelation,
      emergencyContact,
      allergies,
    });
    logAudit({
      userId: getReqUserId(req),
      action: "create_patient",
      resourceType: "patient",
      resourceId: patient.id,
      patientId: patient.id,
      ipAddress: req.ip,
    });
    res.status(201).json({ ...patient, user });
  });

  // Medical Records
  app.get("/api/medical-records", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = getReqUserId(req);
    const { patientId } = req.query;

    // Doctors can only see records of patients they have approved access to
    // and are explicitly blocked from viewing records of patients who denied access
    if (user.role === "doctor") {
      const [approvedIds, deniedIds] = await Promise.all([
        storage.getApprovedPatientIdsForDoctor(userId),
        storage.getDeniedPatientIdsForDoctor(userId),
      ]);
      if (patientId) {
        const parsed = Number(patientId);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ message: "Invalid patient id" });
        }
        if (deniedIds.includes(parsed)) {
          return res.status(403).json({ message: "Access denied. This patient has denied your access request." });
        }
        if (!approvedIds.includes(parsed)) {
          return res.status(403).json({ message: "You do not have approved access to this patient's records" });
        }
        const records = await storage.getMedicalRecordsByPatient(parsed);
        return res.json(records);
      }
      // No patientId specified — return records for approved patients, exclude denied
      if (approvedIds.length === 0) return res.json([]);
      const allRecords = await storage.getMedicalRecords();
      const filtered = allRecords.filter(
        (r: any) => approvedIds.includes(r.patientId) && !deniedIds.includes(r.patientId)
      );
      return res.json(filtered);
    }

    // Admin / Nurse — see all
    if (patientId) {
      const parsed = Number(patientId);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ message: "Invalid patient id" });
      }
      const records = await storage.getMedicalRecordsByPatient(parsed);
      return res.json(records);
    }
    const records = await storage.getMedicalRecords();
    res.json(records);
  });

  app.get("/api/medical-records/:id", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = getReqUserId(req);
    const recordId = Number(req.params.id);
    if (Number.isNaN(recordId)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await storage.getMedicalRecord(recordId);
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Doctors must have approved access; denied doctors are explicitly blocked
    if (user.role === "doctor") {
      const denied = await storage.hasDeniedAccess(userId, record.patientId);
      if (denied) {
        return res.status(403).json({
          message: "Access denied. This patient has denied your access request. You cannot view their records.",
        });
      }
      const hasAccess = await storage.hasApprovedAccess(userId, record.patientId);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. You need approved access from this patient to view their records.",
        });
      }
    }

    const vitals = await storage.getVitalSignsByRecord(record.id);
    logAudit({
      userId,
      action: "view_medical_record",
      resourceType: "medical_record",
      resourceId: record.id,
      patientId: record.patientId,
      ipAddress: req.ip,
    });
    res.json({ ...record, vitalSigns: vitals });
  });

  app.post("/api/medical-records", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const user = await storage.getUser(userId);
    const body = req.body as { visitDate?: string | Date; patientId?: number; [k: string]: unknown };

    // Doctors must have approved access; denied doctors cannot create records
    if (user?.role === "doctor" && body.patientId) {
      const denied = await storage.hasDeniedAccess(userId, body.patientId);
      if (denied) {
        return res.status(403).json({
          message: "Access denied. This patient has denied your access request. You cannot create records for them.",
        });
      }
      const hasAccess = await storage.hasApprovedAccess(userId, body.patientId);
      if (!hasAccess) {
        return res.status(403).json({
          message: "You need approved access from this patient to create records for them.",
        });
      }
    }

    const visitDate = body.visitDate instanceof Date ? body.visitDate : new Date(body.visitDate as string);
    const record = await storage.createMedicalRecord({
      ...body,
      doctorId: userId,
      hospitalId: user?.hospitalId || 1,
      visitDate,
    });
    logAudit({
      userId,
      action: "create_medical_record",
      resourceType: "medical_record",
      resourceId: record.id,
      patientId: record.patientId,
      ipAddress: req.ip,
    });
    res.status(201).json(record);
  });

  // My Records (for patients)
  app.get("/api/my-records", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const patient = await storage.getPatientByUserId(userId);
    if (!patient) return res.json([]);
    const records = await storage.getMedicalRecordsByPatient(patient.id);
    res.json(records);
  });

  // Vital Signs
  app.get("/api/vital-signs", isAuthenticated, async (req, res) => {
    const vitals = await storage.getVitalSigns();
    res.json(vitals);
  });

  app.post("/api/vital-signs", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const vitals = await storage.createVitalSigns({
      ...req.body,
      recordedBy: userId,
    });
    logAudit({
      userId,
      action: "record_vital_signs",
      resourceType: "vital_signs",
      resourceId: vitals.id,
      ipAddress: req.ip,
    });
    res.status(201).json(vitals);
  });

  // My Vitals (for patients)
  app.get("/api/my-vitals", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const patient = await storage.getPatientByUserId(userId);
    if (!patient) return res.json([]);
    const records = await storage.getMedicalRecordsByPatient(patient.id);
    const allVitals = [];
    for (const record of records) {
      const vitals = await storage.getVitalSignsByRecord(record.id);
      allVitals.push(...vitals);
    }
    allVitals.sort((a, b) =>
      new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime()
    );
    res.json(allVitals);
  });

  // Audit Logs
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  // Access Requests
  app.get("/api/access-requests", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = getReqUserId(req);

    if (user.role === "admin") {
      // Admin sees all requests
      const requests = await storage.getAccessRequests();
      return res.json(requests);
    }

    if (user.role === "doctor") {
      // Doctor sees only their own requests
      const requests = await storage.getAccessRequestsByRequester(userId);
      return res.json(requests);
    }

    if (user.role === "patient") {
      // Patient sees requests for their records
      const patient = await storage.getPatientByUserId(userId);
      if (!patient) return res.json([]);
      const requests = await storage.getAccessRequestsByPatient(patient.id);
      return res.json(requests);
    }

    // Nurse or other — see all (nurses may need to see for coordination)
    const requests = await storage.getAccessRequests();
    res.json(requests);
  });

  app.post("/api/access-requests", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const { patientId, reason } = req.body;

    if (!patientId || !reason) {
      return res.status(400).json({ message: "Patient and reason are required" });
    }

    // Check if there's already an approved or pending request
    const latestStatus = await storage.getLatestAccessStatus(userId, patientId);
    if (latestStatus === "approved") {
      return res.status(409).json({ message: "You already have approved access to this patient" });
    }
    if (latestStatus === "pending") {
      return res.status(409).json({ message: "You already have a pending access request for this patient" });
    }
    // If latest was "denied", the doctor CAN re-request — patient gets another chance to decide

    const request = await storage.createAccessRequest({
      ...req.body,
      requesterId: userId,
    });
    logAudit({
      userId,
      action: "create_access_request",
      resourceType: "access_request",
      resourceId: request.id,
      patientId: request.patientId,
      ipAddress: req.ip,
    });
    res.status(201).json(request);
  });

  app.patch("/api/access-requests/:id", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const user = req.user as any;
    const { status } = req.body;

    if (status !== "approved" && status !== "denied") {
      return res.status(400).json({ message: "Status must be 'approved' or 'denied'" });
    }

    // Patients can only approve/deny requests for THEIR OWN records
    if (user.role === "patient") {
      const patient = await storage.getPatientByUserId(userId);
      if (!patient) {
        return res.status(403).json({ message: "Patient profile not found" });
      }
      // Fetch the request to verify it belongs to this patient
      const allRequests = await storage.getAccessRequestsByPatient(patient.id);
      const targetRequest = allRequests.find((r) => r.id === parseInt(req.params.id));
      if (!targetRequest) {
        return res.status(403).json({ message: "You can only review requests for your own records" });
      }
    } else if (user.role !== "admin") {
      return res.status(403).json({ message: "Only patients and admins can approve or deny access requests" });
    }

    const request = await storage.updateAccessRequestStatus(
      parseInt(req.params.id),
      status,
      userId
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    logAudit({
      userId,
      action: `${status}_access_request`,
      resourceType: "access_request",
      resourceId: request.id,
      patientId: request.patientId,
      ipAddress: req.ip,
    });
    res.json(request);
  });

  // Security Alerts
  app.get("/api/security-alerts", isAuthenticated, async (req, res) => {
    const alerts = await storage.getSecurityAlerts();
    res.json(alerts);
  });

  app.post("/api/security-alerts", isAuthenticated, async (req, res) => {
    const alert = await storage.createSecurityAlert(req.body);
    logAudit({
      userId: getReqUserId(req),
      action: "create_security_alert",
      resourceType: "security_alert",
      resourceId: alert.id,
      ipAddress: req.ip,
      details: { severity: alert.severity, alertType: alert.alertType },
    });
    res.status(201).json(alert);
  });

  app.patch("/api/security-alerts/:id", isAuthenticated, async (req, res) => {
    const userId = getReqUserId(req);
    const alert = await storage.resolveSecurityAlert(parseInt(req.params.id), userId);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    logAudit({
      userId,
      action: "resolve_security_alert",
      resourceType: "security_alert",
      resourceId: alert.id,
      ipAddress: req.ip,
      details: { alertType: alert.alertType, severity: alert.severity },
    });
    res.json(alert);
  });

  // ── AI Audit Log Analysis (admin only) ──
  app.post("/api/ai/analyze-logs", isAuthenticated, isAdmin, async (req, res) => {
    const { hours = 24 } = req.body;
    const hoursBack = Math.min(Math.max(parseInt(hours) || 24, 1), 168); // 1h – 7 days

    try {
      // Fetch audit logs from the time window
      const allLogs = await storage.getAuditLogs();
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const recentLogs = allLogs.filter(
        (l) => l.timestamp && new Date(l.timestamp) >= cutoff,
      );

      // Enrich with user info
      const userCache = new Map<string, User | undefined>();
      const enriched: AuditLogWithUser[] = [];
      for (const log of recentLogs) {
        let user: User | undefined | null = null;
        if (log.userId) {
          if (!userCache.has(log.userId)) {
            userCache.set(log.userId, await storage.getUser(log.userId));
          }
          user = userCache.get(log.userId) || null;
        }
        enriched.push({ ...log, user });
      }

      const analysis = await analyzeAuditLogs(enriched, hoursBack);

      // Auto-create security alerts for detected anomalies
      let alertsCreated = 0;
      for (const anomaly of analysis.anomalies) {
        await storage.createSecurityAlert({
          alertType: `AI: ${anomaly.alertType}`,
          severity: anomaly.severity,
          userId: anomaly.userId,
          description: anomaly.description,
          anomalyScore: anomaly.anomalyScore.toFixed(4),
        });
        alertsCreated++;
      }

      logAudit({
        userId: getReqUserId(req),
        action: "ai_audit_analysis",
        resourceType: "audit_log",
        ipAddress: req.ip,
        details: {
          hoursBack,
          logsAnalyzed: analysis.totalLogsAnalyzed,
          anomaliesFound: analysis.anomalies.length,
          alertsCreated,
        },
      });

      res.json({
        ...analysis,
        alertsCreated,
      });
    } catch (err) {
      console.error("AI audit analysis failed:", err);
      res.status(500).json({ message: "AI analysis failed. Please try again." });
    }
  });

  // Dashboard stats
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    const [users, hospitals, patients, records, requests, alerts] = await Promise.all([
      storage.getUsers(),
      storage.getHospitals(),
      storage.getPatients(),
      storage.getMedicalRecords(),
      storage.getAccessRequests(),
      storage.getSecurityAlerts(),
    ]);
    res.json({
      totalUsers: users.length,
      totalHospitals: hospitals.length,
      totalPatients: patients.length,
      totalRecords: records.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      unresolvedAlerts: alerts.filter((a) => !a.isResolved).length,
    });
  });

  // ── Admin Dashboard Stats ──
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    const [hospitalList, userList, patientList, requestList] = await Promise.all([
      storage.getHospitals(),
      storage.getUsers(),
      storage.getPatients(),
      storage.getAccessRequests(),
    ]);
    res.json({
      totalHospitals: hospitalList.length,
      totalUsers: userList.length,
      totalPatients: patientList.length,
      pendingRequests: requestList.filter((r) => r.status === "pending").length,
    });
  });

  // ── Doctor Dashboard Stats ──
  app.get("/api/doctor/stats", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const doctorId = user?.claims?.sub ?? user?.id;

    const [doctorRecords, doctorAppointments, doctorRequests] = await Promise.all([
      storage.getMedicalRecordsByDoctor(doctorId),
      storage.getAppointmentsByDoctor(doctorId),
      storage.getAccessRequestsByRequester(doctorId),
    ]);

    // Unique patients this doctor has records for
    const uniquePatientIds = new Set(doctorRecords.map((r) => r.patientId));

    // Today's appointments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayVisits = doctorAppointments.filter((a) => {
      const st = new Date(a.startTime);
      return st >= todayStart && st <= todayEnd;
    }).length;

    res.json({
      totalPatients: uniquePatientIds.size,
      totalRecords: doctorRecords.length,
      todayVisits,
      pendingRequests: doctorRequests.filter((r) => r.status === "pending").length,
    });
  });

  // Appointments
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user.id;
    const userRole = user.role;

    let appointments;
    if (userRole === "patient") {
      const patient = await storage.getPatientByUserId(userId);
      if (!patient) return res.json([]);
      appointments = await storage.getAppointmentsByPatient(patient.id);
    } else if (userRole === "doctor") {
      appointments = await storage.getAppointmentsByDoctor(userId);
    } else {
      // Admin/Nurse see all
      appointments = await storage.getAppointments();
    }
    res.json(appointments);
  });

  app.get("/api/appointments/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const appointment = await storage.getAppointment(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // Access control: only involved parties or admins
    const user = req.user as any;
    if (
      user.role === "patient" &&
      appointment.patient.userId !== user.id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (
      user.role === "doctor" &&
      appointment.doctorId !== user.id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(appointment);
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let patientId = req.body.patientId;

    // If patient, force their own ID — auto-create profile if missing
    if (user.role === "patient") {
      let patient = await storage.getPatientByUserId(user.id);
      if (!patient) {
        patient = await storage.createPatient({
          userId: user.id,
          dateOfBirth: "2000-01-01", // placeholder
        });
      }
      patientId = patient.id;
    }

    const body = req.body as { startTime?: string | Date; endTime?: string | Date; [k: string]: unknown };
    const startTime = body.startTime instanceof Date ? body.startTime : new Date(body.startTime as string);
    const endTime = body.endTime instanceof Date ? body.endTime : new Date(body.endTime as string);

    const appointment = await storage.createAppointment({
      ...body,
      patientId,
      hospitalId: 1, // Defaulting to 1 for now, similar to other routes
      startTime,
      endTime,
    });

    logAudit({
      userId: getReqUserId(req),
      action: "create_appointment",
      resourceType: "appointment",
      resourceId: appointment.id,
      patientId: appointment.patientId,
      ipAddress: req.ip,
    });

    res.status(201).json(appointment);
  });

  app.patch("/api/appointments/:id/status", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const appointment = await storage.updateAppointmentStatus(id, status);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    logAudit({
      userId: getReqUserId(req),
      action: "update_appointment_status",
      resourceType: "appointment",
      resourceId: appointment.id,
      patientId: appointment.patientId,
      details: { oldStatus: appointment.status, newStatus: status },
      ipAddress: req.ip,
    });

    res.json(appointment);
  });

  // ── Record Match Requests (admin only) ──

  app.get("/api/record-matches", isAuthenticated, isAdmin, async (req, res) => {
    const matches = await storage.getRecordMatchRequests();
    res.json(matches);
  });

  // Get full details for a single match (with patient + user info for both sides)
  app.get("/api/record-matches/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const match = await storage.getRecordMatchRequest(id);
    if (!match) return res.status(404).json({ message: "Match request not found" });

    // Fetch both patient profiles with their user info + medical record counts
    const newPatient = await storage.getPatient(match.newPatientId);
    const existingPatient = await storage.getPatient(match.existingPatientId);

    const existingRecords = existingPatient
      ? await storage.getMedicalRecordsByPatient(existingPatient.id)
      : [];

    res.json({
      ...match,
      newPatient,
      existingPatient,
      existingRecordCount: existingRecords.length,
      existingRecords,
    });
  });

  // Approve a match — merge the old patient's records into the new patient
  app.patch("/api/record-matches/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = getReqUserId(req);
    const { status } = req.body;

    if (status !== "approved" && status !== "denied") {
      return res.status(400).json({ message: "Status must be 'approved' or 'denied'" });
    }

    const match = await storage.getRecordMatchRequest(id);
    if (!match) return res.status(404).json({ message: "Match request not found" });

    if (match.status !== "pending") {
      return res.status(409).json({ message: "This match has already been reviewed" });
    }

    if (status === "approved") {
      // Merge: move all records from existingPatient to newPatient
      try {
        await storage.mergePatientRecords(match.existingPatientId, match.newPatientId);
      } catch (err) {
        console.error("Merge failed:", err);
        return res.status(500).json({ message: "Failed to merge patient records" });
      }
    }

    const updated = await storage.updateRecordMatchRequestStatus(id, status, userId);

    logAudit({
      userId,
      action: status === "approved" ? "approve_record_match" : "deny_record_match",
      resourceType: "record_match",
      resourceId: id,
      patientId: match.newPatientId,
      ipAddress: req.ip,
      details: {
        newPatientId: match.newPatientId,
        existingPatientId: match.existingPatientId,
        matchConfidence: match.matchConfidence,
      },
    });

    res.json(updated);
  });

  return httpServer;
}
