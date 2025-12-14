import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  hospitals,
  patients,
  medicalRecords,
  vitalSigns,
  auditLogs,
  accessRequests,
  securityAlerts,
  type User,
  type UpsertUser,
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
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;

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
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequestStatus(id: number, status: string, approvedBy: string): Promise<AccessRequest | undefined>;

  // Security Alerts
  getSecurityAlerts(): Promise<SecurityAlert[]>;
  createSecurityAlert(alert: InsertSecurityAlert): Promise<SecurityAlert>;
  resolveSecurityAlert(id: number, resolvedBy: string): Promise<SecurityAlert | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
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
}

export const storage = new DatabaseStorage();
