import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ROLES = {
  ADMINISTRADOR: "administrador",
  ADMISION: "admision",
  MEDICO: "medico",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DOCUMENT_TYPES = [
  "CC", "TI", "RC", "CE", "AS", "MS", "PS", "PT",
] as const;

export const GENDERS = ["M", "F"] as const;

export const MARITAL_STATUS = [
  "Soltero", "Casado", "Viudo", "Union Libre",
] as const;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().$type<Role>(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentType: text("document_type").notNull(),
  documentId: text("document_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name"),
  birthDate: text("birth_date").notNull(),
  gender: text("gender").notNull(),
  maritalStatus: text("marital_status"),
  address: text("address"),
  city: text("city"),
  locality: text("locality"),
  neighborhood: text("neighborhood"),
  phone: text("phone"),
  insurance: text("insurance"),
  regime: text("regime"),
  occupation: text("occupation"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const admissions = sqliteTable("admissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  admittedBy: integer("admitted_by")
    .notNull()
    .references(() => users.id),
  assignedDoctorId: integer("assigned_doctor_id")
    .references(() => users.id),
  reason: text("reason").notNull(),
  department: text("department").notNull(),
  bed: text("bed"),
  status: text("status").notNull().default("activa"),
  companionName: text("companion_name"),
  companionRelationship: text("companion_relationship"),
  companionPhone: text("companion_phone"),
  admissionDate: integer("admission_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  dischargeDate: integer("discharge_date", { mode: "timestamp" }),
});

export const transfers = sqliteTable("transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  admissionId: integer("admission_id")
    .notNull()
    .references(() => admissions.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  fromDepartment: text("from_department").notNull(),
  toDepartment: text("to_department").notNull(),
  reason: text("reason").notNull(),
  transferredBy: integer("transferred_by")
    .notNull()
    .references(() => users.id),
  transferDate: integer("transfer_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const clinicalHistories = sqliteTable("clinical_histories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  admissionId: integer("admission_id")
    .notNull()
    .references(() => admissions.id),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => users.id),
  diagnosis: text("diagnosis").notNull(),
  symptoms: text("symptoms").notNull(),
  treatment: text("treatment").notNull(),
  notes: text("notes"),
  vitalSigns: text("vital_signs"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
