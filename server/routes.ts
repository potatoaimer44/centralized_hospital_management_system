import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isReplitAuthAvailable } from "./replitAuth";

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
    res.json(users);
  });

  app.patch("/api/users/:id/role", isAuthenticated, async (req, res) => {
    const { role } = req.body;
    const user = await storage.updateUserRole(req.params.id, role);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
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
    await storage.createAuditLog({
      userId: (req.user as any)?.claims?.sub,
      action: "create_hospital",
      resourceType: "hospital",
      resourceId: hospital.id,
      ipAddress: req.ip,
    });
    res.status(201).json(hospital);
  });

  // Patients
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    const patientId = Number(req.params.id);
    if (Number.isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient id" });
    }

    const patient = await storage.getPatient(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const records = await storage.getMedicalRecordsByPatient(patient.id);
    res.json({ ...patient, medicalRecords: records });
  });

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    const patient = await storage.createPatient(req.body);
    await storage.createAuditLog({
      userId: (req.user as any)?.claims?.sub,
      action: "create_patient",
      resourceType: "patient",
      resourceId: patient.id,
      patientId: patient.id,
      ipAddress: req.ip,
    });
    res.status(201).json(patient);
  });

  // Medical Records
  app.get("/api/medical-records", isAuthenticated, async (req, res) => {
    const { patientId } = req.query;
    let records;
    if (patientId) {
      const parsed = Number(patientId);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ message: "Invalid patient id" });
      }
      records = await storage.getMedicalRecordsByPatient(parsed);
    } else {
      records = await storage.getMedicalRecords();
    }
    res.json(records);
  });

  app.get("/api/medical-records/:id", isAuthenticated, async (req, res) => {
    const recordId = Number(req.params.id);
    if (Number.isNaN(recordId)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await storage.getMedicalRecord(recordId);
    if (!record) return res.status(404).json({ message: "Record not found" });
    const vitals = await storage.getVitalSignsByRecord(record.id);
    await storage.createAuditLog({
      userId: (req.user as any)?.claims?.sub,
      action: "view_medical_record",
      resourceType: "medical_record",
      resourceId: record.id,
      patientId: record.patientId,
      ipAddress: req.ip,
    });
    res.json({ ...record, vitalSigns: vitals });
  });

  app.post("/api/medical-records", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const user = await storage.getUser(userId);
    const record = await storage.createMedicalRecord({
      ...req.body,
      doctorId: userId,
      hospitalId: user?.hospitalId || 1,
    });
    await storage.createAuditLog({
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
    const userId = (req.user as any)?.claims?.sub;
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
    const userId = (req.user as any)?.claims?.sub;
    const vitals = await storage.createVitalSigns({
      ...req.body,
      recordedBy: userId,
    });
    await storage.createAuditLog({
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
    const userId = (req.user as any)?.claims?.sub;
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
    const requests = await storage.getAccessRequests();
    res.json(requests);
  });

  app.post("/api/access-requests", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const request = await storage.createAccessRequest({
      ...req.body,
      requesterId: userId,
    });
    await storage.createAuditLog({
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
    const userId = (req.user as any)?.claims?.sub;
    const { status } = req.body;
    const request = await storage.updateAccessRequestStatus(
      parseInt(req.params.id),
      status,
      userId
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    await storage.createAuditLog({
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
    res.status(201).json(alert);
  });

  app.patch("/api/security-alerts/:id", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const alert = await storage.resolveSecurityAlert(parseInt(req.params.id), userId);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json(alert);
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

    // If patient, force their own ID
    if (user.role === "patient") {
      const patient = await storage.getPatientByUserId(user.id);
      if (!patient) return res.status(400).json({ message: "Patient profile not found" });
      patientId = patient.id;
    }

    const appointment = await storage.createAppointment({
      ...req.body,
      patientId,
      hospitalId: 1, // Defaulting to 1 for now, similar to other routes
    });

    await storage.createAuditLog({
      userId: user.id,
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
    const user = req.user as any;

    const appointment = await storage.updateAppointmentStatus(id, status);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await storage.createAuditLog({
      userId: user.id,
      action: "update_appointment_status",
      resourceType: "appointment",
      resourceId: appointment.id,
      patientId: appointment.patientId,
      details: { oldStatus: appointment.status, newStatus: status },
      ipAddress: req.ip,
    });

    res.json(appointment);
  });

  return httpServer;
}
