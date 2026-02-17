import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import {
  users,
  appointments,
  hospitals,
  patients,
  medicalRecords,
  vitalSigns,
  auditLogs,
  accessRequests,
  securityAlerts,
  recordMatchRequests,
  type User,
  type UpsertUser,
  type InsertUser,
  type Hospital,
  type InsertHospital,
  type Patient,
  type InsertPatient,
  type MedicalRecord,
  type InsertMedicalRecord,
  type VitalSigns,
  type InsertVitalSigns,
  type AuditLog,
  type InsertAuditLog,
  type AccessRequest,
  type InsertAccessRequest,
  type SecurityAlert,
  type InsertSecurityAlert,
  type Appointment,
  type InsertAppointment,
<<<<<<< HEAD
  type RecordMatchRequest,
  type InsertRecordMatchRequest,
=======
>>>>>>> 12d8793313f04c5f0fda3ece8d8cb4c9aadd8541
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
<<<<<<< HEAD
  createUser(user: Omit<InsertUser, "id"> & { id?: string }): Promise<User>;
=======
>>>>>>> 12d8793313f04c5f0fda3ece8d8cb4c9aadd8541
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserCredentials(id: string, data: { email?: string; password?: string }): Promise<User | undefined>;

  // Hospitals
  getHospitals(): Promise<Hospital[]>;
  getHospital(id: number): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;

  // Patients
  getPatients(): Promise<(Patient & { user: User | null })[]>;
  getPatient(id: number): Promise<(Patient & { user: User | null }) | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;

  // Medical Records
  getMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]>;
  getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;

  // Vital Signs
  getVitalSigns(): Promise<VitalSigns[]>;
  getVitalSignsByRecord(recordId: number): Promise<VitalSigns[]>;
  createVitalSigns(vitals: InsertVitalSigns): Promise<VitalSigns>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Access Requests
  getAccessRequests(): Promise<AccessRequest[]>;
  getAccessRequestsByRequester(requesterId: string): Promise<AccessRequest[]>;
  getAccessRequestsByPatient(patientId: number): Promise<AccessRequest[]>;
  getLatestAccessStatus(requesterId: string, patientId: number): Promise<string | null>;
  hasApprovedAccess(requesterId: string, patientId: number): Promise<boolean>;
  hasDeniedAccess(requesterId: string, patientId: number): Promise<boolean>;
  getApprovedPatientIdsForDoctor(doctorId: string): Promise<number[]>;
  getDeniedPatientIdsForDoctor(doctorId: string): Promise<number[]>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequestStatus(id: number, status: string, approvedBy: string): Promise<AccessRequest | undefined>;

  // Security Alerts
  getSecurityAlerts(): Promise<SecurityAlert[]>;
  createSecurityAlert(alert: InsertSecurityAlert): Promise<SecurityAlert>;
  resolveSecurityAlert(id: number, resolvedBy: string): Promise<SecurityAlert | undefined>;

  // Appointments
  getAppointments(): Promise<(Appointment & { patient: Patient; doctor: User; hospital: Hospital })[]>;
  getAppointment(id: number): Promise<(Appointment & { patient: Patient; doctor: User; hospital: Hospital }) | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: User; hospital: Hospital })[]>;
  getAppointmentsByDoctor(doctorId: string): Promise<(Appointment & { patient: Patient; hospital: Hospital })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
<<<<<<< HEAD

  // Record Match Requests
  findMatchingPatients(firstName: string, lastName: string, dateOfBirth: string, bloodGroup?: string | null): Promise<Patient[]>;
  getAllPatientsWithUserInfo(): Promise<(Patient & { user: User | null })[]>;
  getRecordMatchRequests(): Promise<RecordMatchRequest[]>;
  getRecordMatchRequest(id: number): Promise<RecordMatchRequest | undefined>;
  createRecordMatchRequest(request: InsertRecordMatchRequest): Promise<RecordMatchRequest>;
  updateRecordMatchRequestStatus(id: number, status: string, reviewedBy: string): Promise<RecordMatchRequest | undefined>;
  mergePatientRecords(existingPatientId: number, newPatientId: number): Promise<void>;
=======
>>>>>>> 12d8793313f04c5f0fda3ece8d8cb4c9aadd8541
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
<<<<<<< HEAD
    return user;
  }

  async createUser(userData: Omit<InsertUser, "id"> & { id?: string }): Promise<User> {
    const id = userData.id ?? crypto.randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id,
        email: userData.email ?? null,
        password: userData.password ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "patient",
        hospitalId: userData.hospitalId ?? null,
        phone: userData.phone ?? null,
        isActive: userData.isActive ?? true,
      })
      .returning();
=======
>>>>>>> 12d8793313f04c5f0fda3ece8d8cb4c9aadd8541
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCredentials(
    id: string,
    data: { email?: string; password?: string },
  ): Promise<User | undefined> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.email) set.email = data.email;
    if (data.password) set.password = data.password;
    const [user] = await db
      .update(users)
      .set(set)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    return db.select().from(hospitals).orderBy(hospitals.name);
  }

  async getHospital(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [created] = await db.insert(hospitals).values(hospital).returning();
    return created;
  }

  // Patients
  async getPatients(): Promise<(Patient & { user: User | null })[]> {
    const result = await db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id))
      .orderBy(desc(patients.createdAt));
    return result.map((r) => ({ ...r.patients, user: r.users }));
  }

  async getPatient(id: number): Promise<(Patient & { user: User | null }) | undefined> {
    const [result] = await db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id))
      .where(eq(patients.id, id));
    return result ? { ...result.patients, user: result.users } : undefined;
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [created] = await db.insert(patients).values(patient).returning();
    return created;
  }

  // Medical Records
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return db.select().from(medicalRecords).orderBy(desc(medicalRecords.visitDate));
  }

  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return record;
  }

  async getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]> {
    return db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.visitDate));
  }

  async getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    return db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.doctorId, doctorId))
      .orderBy(desc(medicalRecords.visitDate));
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [created] = await db.insert(medicalRecords).values(record).returning();
    return created;
  }

  // Vital Signs
  async getVitalSigns(): Promise<VitalSigns[]> {
    return db.select().from(vitalSigns).orderBy(desc(vitalSigns.recordedAt));
  }

  async getVitalSignsByRecord(recordId: number): Promise<VitalSigns[]> {
    return db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.medicalRecordId, recordId))
      .orderBy(desc(vitalSigns.recordedAt));
  }

  async createVitalSigns(vitals: InsertVitalSigns): Promise<VitalSigns> {
    const [created] = await db.insert(vitalSigns).values(vitals).returning();
    return created;
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(500);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // Access Requests
  async getAccessRequests(): Promise<AccessRequest[]> {
    return db.select().from(accessRequests).orderBy(desc(accessRequests.requestedAt));
  }

  async getAccessRequestsByRequester(requesterId: string): Promise<AccessRequest[]> {
    return db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.requesterId, requesterId))
      .orderBy(desc(accessRequests.requestedAt));
  }

  async getAccessRequestsByPatient(patientId: number): Promise<AccessRequest[]> {
    return db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.patientId, patientId))
      .orderBy(desc(accessRequests.requestedAt));
  }

  /**
   * Returns the status of the MOST RECENT access request for a doctor–patient pair.
   * This ensures a new approval overrides a previous denial, and vice-versa.
   */
  async getLatestAccessStatus(requesterId: string, patientId: number): Promise<string | null> {
    const [row] = await db
      .select({ status: accessRequests.status })
      .from(accessRequests)
      .where(
        and(
          eq(accessRequests.requesterId, requesterId),
          eq(accessRequests.patientId, patientId),
        ),
      )
      .orderBy(desc(accessRequests.requestedAt))
      .limit(1);
    return row?.status ?? null;
  }

  async hasApprovedAccess(requesterId: string, patientId: number): Promise<boolean> {
    const latest = await this.getLatestAccessStatus(requesterId, patientId);
    return latest === "approved";
  }

  async hasDeniedAccess(requesterId: string, patientId: number): Promise<boolean> {
    const latest = await this.getLatestAccessStatus(requesterId, patientId);
    return latest === "denied";
  }

  async getApprovedPatientIdsForDoctor(doctorId: string): Promise<number[]> {
    // Get all unique patient IDs this doctor has requested access to
    const rows = await db
      .select({ patientId: accessRequests.patientId })
      .from(accessRequests)
      .where(eq(accessRequests.requesterId, doctorId))
      .groupBy(accessRequests.patientId);

    // Filter to only those whose latest request is approved
    const approved: number[] = [];
    for (const { patientId } of rows) {
      const latest = await this.getLatestAccessStatus(doctorId, patientId);
      if (latest === "approved") approved.push(patientId);
    }
    return approved;
  }

  async getDeniedPatientIdsForDoctor(doctorId: string): Promise<number[]> {
    const rows = await db
      .select({ patientId: accessRequests.patientId })
      .from(accessRequests)
      .where(eq(accessRequests.requesterId, doctorId))
      .groupBy(accessRequests.patientId);

    const denied: number[] = [];
    for (const { patientId } of rows) {
      const latest = await this.getLatestAccessStatus(doctorId, patientId);
      if (latest === "denied") denied.push(patientId);
    }
    return denied;
  }

  async createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest> {
    const [created] = await db.insert(accessRequests).values(request).returning();
    return created;
  }

  async updateAccessRequestStatus(
    id: number,
    status: string,
    approvedBy: string
  ): Promise<AccessRequest | undefined> {
    const [updated] = await db
      .update(accessRequests)
      .set({ status, approvedBy, reviewedAt: new Date() })
      .where(eq(accessRequests.id, id))
      .returning();
    return updated;
  }

  // Security Alerts
  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    return db.select().from(securityAlerts).orderBy(desc(securityAlerts.createdAt));
  }

  async createSecurityAlert(alert: InsertSecurityAlert): Promise<SecurityAlert> {
    const [created] = await db.insert(securityAlerts).values(alert).returning();
    return created;
  }

  async resolveSecurityAlert(id: number, resolvedBy: string): Promise<SecurityAlert | undefined> {
    const [updated] = await db
      .update(securityAlerts)
      .set({ isResolved: true, resolvedBy, resolvedAt: new Date() })
      .where(eq(securityAlerts.id, id))
      .returning();
    return updated;
  }

  // Appointments
  async getAppointments(): Promise<(Appointment & { patient: Patient; doctor: User; hospital: Hospital })[]> {
    const rows = await db
      .select({
        appointment: appointments,
        patient: patients,
        doctor: users,
        hospital: hospitals,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .orderBy(desc(appointments.startTime));

    return rows.map((row) => ({
      ...row.appointment,
      patient: row.patient,
      doctor: row.doctor,
      hospital: row.hospital,
    }));
  }

  async getAppointment(id: number): Promise<(Appointment & { patient: Patient; doctor: User; hospital: Hospital }) | undefined> {
    const [row] = await db
      .select({
        appointment: appointments,
        patient: patients,
        doctor: users,
        hospital: hospitals,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .where(eq(appointments.id, id));

    if (!row) return undefined;

    return {
      ...row.appointment,
      patient: row.patient,
      doctor: row.doctor,
      hospital: row.hospital,
    };
  }

  async getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: User; hospital: Hospital })[]> {
    const rows = await db
      .select({
        appointment: appointments,
        doctor: users,
        hospital: hospitals,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.startTime));

    return rows.map((row) => ({
      ...row.appointment,
      doctor: row.doctor,
      hospital: row.hospital,
    }));
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<(Appointment & { patient: Patient; hospital: Hospital })[]> {
    const rows = await db
      .select({
        appointment: appointments,
        patient: patients,
        hospital: hospitals,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.startTime));

    return rows.map((row) => ({
      ...row.appointment,
      patient: row.patient,
      hospital: row.hospital,
    }));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }
<<<<<<< HEAD

  // Record Match Requests

  async findMatchingPatients(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    bloodGroup?: string | null,
  ): Promise<Patient[]> {
    // Find existing patients whose user name + DOB match (case-insensitive)
    const rows = await db
      .select({ patient: patients, user: users })
      .from(patients)
      .innerJoin(users, eq(patients.userId, users.id))
      .where(
        and(
          sql`lower(${users.firstName}) = lower(${firstName})`,
          sql`lower(${users.lastName}) = lower(${lastName})`,
          eq(patients.dateOfBirth, dateOfBirth),
        ),
      );

    // Filter further by blood group if provided
    if (bloodGroup) {
      return rows
        .filter((r) => r.patient.bloodGroup?.toLowerCase() === bloodGroup.toLowerCase())
        .map((r) => r.patient);
    }

    return rows.map((r) => r.patient);
  }

  async getAllPatientsWithUserInfo(): Promise<(Patient & { user: User | null })[]> {
    const rows = await db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id));
    return rows.map((r) => ({ ...r.patients, user: r.users }));
  }

  async getRecordMatchRequests(): Promise<RecordMatchRequest[]> {
    return db
      .select()
      .from(recordMatchRequests)
      .orderBy(desc(recordMatchRequests.createdAt));
  }

  async getRecordMatchRequest(id: number): Promise<RecordMatchRequest | undefined> {
    const [row] = await db
      .select()
      .from(recordMatchRequests)
      .where(eq(recordMatchRequests.id, id));
    return row;
  }

  async createRecordMatchRequest(request: InsertRecordMatchRequest): Promise<RecordMatchRequest> {
    const [created] = await db
      .insert(recordMatchRequests)
      .values(request)
      .returning();
    return created;
  }

  async updateRecordMatchRequestStatus(
    id: number,
    status: string,
    reviewedBy: string,
  ): Promise<RecordMatchRequest | undefined> {
    const [updated] = await db
      .update(recordMatchRequests)
      .set({ status, reviewedBy, reviewedAt: new Date() })
      .where(eq(recordMatchRequests.id, id))
      .returning();
    return updated;
  }

  async mergePatientRecords(existingPatientId: number, newPatientId: number): Promise<void> {
    // Re-link all medical records from the old patient to the new patient
    await db
      .update(medicalRecords)
      .set({ patientId: newPatientId })
      .where(eq(medicalRecords.patientId, existingPatientId));

    // Re-link all appointments
    await db
      .update(appointments)
      .set({ patientId: newPatientId })
      .where(eq(appointments.patientId, existingPatientId));

    // Re-link all access requests
    await db
      .update(accessRequests)
      .set({ patientId: newPatientId })
      .where(eq(accessRequests.patientId, existingPatientId));

    // Mark the old patient as merged by setting a placeholder updatedAt
    await db
      .update(patients)
      .set({ updatedAt: new Date() })
      .where(eq(patients.id, existingPatientId));
  }
=======
>>>>>>> 12d8793313f04c5f0fda3ece8d8cb4c9aadd8541
}

export const storage = new DatabaseStorage();
