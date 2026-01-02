import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  district: varchar("district", { length: 50 }).default("Kathmandu"),
  phone: varchar("phone", { length: 15 }),
  email: varchar("email", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
});
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("patient"),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  phone: varchar("phone", { length: 15 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [users.hospitalId],
    references: [hospitals.id],
  }),
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  medicalRecords: many(medicalRecords),
  vitalSigns: many(vitalSigns),
  auditLogs: many(auditLogs),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Patients table (extends users with patient-specific info)
export const patients = pgTable("patients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: varchar("gender", { length: 10 }),
  bloodGroup: varchar("blood_group", { length: 5 }),
  address: varchar("address", { length: 255 }),
  guardianName: varchar("guardian_name", { length: 100 }),
  guardianPhone: varchar("guardian_phone", { length: 15 }),
  guardianRelation: varchar("guardian_relation", { length: 50 }),
  emergencyContact: varchar("emergency_contact", { length: 15 }),
  allergies: text("allergies"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  medicalRecords: many(medicalRecords),
  accessRequests: many(accessRequests),
}));

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Medical Records table
export const medicalRecords = pgTable("medical_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: varchar("doctor_id").references(() => users.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  visitDate: timestamp("visit_date").notNull(),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  prescription: text("prescription"),
  labResults: text("lab_results"),
  treatmentPlan: text("treatment_plan"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [medicalRecords.doctorId],
    references: [users.id],
  }),
  hospital: one(hospitals, {
    fields: [medicalRecords.hospitalId],
    references: [hospitals.id],
  }),
  vitalSigns: many(vitalSigns),
}));

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

// Vital Signs table
export const vitalSigns = pgTable("vital_signs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  medicalRecordId: integer("medical_record_id").references(() => medicalRecords.id).notNull(),
  recordedBy: varchar("recorded_by").references(() => users.id).notNull(),
  temperature: decimal("temperature", { precision: 4, scale: 2 }),
  bloodPressure: varchar("blood_pressure", { length: 10 }),
  pulseRate: integer("pulse_rate"),
  respiratoryRate: integer("respiratory_rate"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  bmi: decimal("bmi", { precision: 4, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const vitalSignsRelations = relations(vitalSigns, ({ one }) => ({
  medicalRecord: one(medicalRecords, {
    fields: [vitalSigns.medicalRecordId],
    references: [medicalRecords.id],
  }),
  recorder: one(users, {
    fields: [vitalSigns.recordedBy],
    references: [users.id],
  }),
}));

export const insertVitalSignsSchema = createInsertSchema(vitalSigns).omit({
  id: true,
  recordedAt: true,
});
export type InsertVitalSigns = z.infer<typeof insertVitalSignsSchema>;
export type VitalSigns = typeof vitalSigns.$inferSelect;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: integer("resource_id"),
  patientId: integer("patient_id").references(() => patients.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  details: jsonb("details"),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [auditLogs.patientId],
    references: [patients.id],
  }),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Access Requests table
export const accessRequests = pgTable("access_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  requester: one(users, {
    fields: [accessRequests.requesterId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [accessRequests.patientId],
    references: [patients.id],
  }),
  approver: one(users, {
    fields: [accessRequests.approvedBy],
    references: [users.id],
  }),
}));

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  status: true,
  approvedBy: true,
  requestedAt: true,
  reviewedAt: true,
});
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;

// Security Alerts table
export const securityAlerts = pgTable("security_alerts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  alertType: varchar("alert_type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }),
  userId: varchar("user_id").references(() => users.id),
  description: text("description"),
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 4 }),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const securityAlertsRelations = relations(securityAlerts, ({ one }) => ({
  user: one(users, {
    fields: [securityAlerts.userId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [securityAlerts.resolvedBy],
    references: [users.id],
  }),
}));

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({
  id: true,
  isResolved: true,
  resolvedBy: true,
  createdAt: true,
  resolvedAt: true,
});
export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type SecurityAlert = typeof securityAlerts.$inferSelect;

// Role type for type safety
export type UserRole = "admin" | "doctor" | "nurse" | "patient";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type RequestStatus = "pending" | "approved" | "denied";

// Appointments table
export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: varchar("doctor_id").references(() => users.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, no_show
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  hospital: one(hospitals, {
    fields: [appointments.hospitalId],
    references: [hospitals.id],
  }),
}));

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
