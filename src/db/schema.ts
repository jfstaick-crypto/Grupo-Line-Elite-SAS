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

export const GENDERS = ["M", "F", "Indefinido"] as const;

export const MARITAL_STATUS = [
  "Soltero", "Casado", "Viudo", "Union Libre",
] as const;

export const REGIMES = [
  "Subsidiado", "Contributivo", "Especial", "Extranjero", "Particular", "Otros",
] as const;

export const SIGNATURE_ROLES = [
  "medico", "auxiliar_enfermeria", "enfermera_jefe",
] as const;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().$type<Role>(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  signature: text("signature"),
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
  daneCode: text("dane_code"),
  municipality: text("municipality"),
  municipalityDaneCode: text("municipality_dane_code"),
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
  transferredBy: integer("transferred_by")
    .notNull()
    .references(() => users.id),
  authorizationNumber: text("authorization_number"),
  diagnosis: text("diagnosis"),
  // Origen
  originCity: text("origin_city"),
  originInstitution: text("origin_institution"),
  originPhone: text("origin_phone"),
  // Destino
  destinationCity: text("destination_city"),
  destinationInstitution: text("destination_institution"),
  destinationPhone: text("destination_phone"),
  // Ambulancia
  ambulancePlate: text("ambulance_plate"),
  tam: text("tam"),
  tab: text("tab"),
  // Timeline del servicio
  requestDate: text("request_date"),
  responsibleEntity: text("responsible_entity"),
  callTime: text("call_time"),
  promiseTime: text("promise_time"),
  originDepartureCity: text("origin_departure_city"),
  pickupLocation: text("pickup_location"),
  arrivalIpsOriginTime: text("arrival_ips_origin_time"),
  pickupDate: text("pickup_date"),
  pickupTime: text("pickup_time"),
  destinationCityArrival: text("destination_city_arrival"),
  destinationLocation: text("destination_location"),
  arrivalIpsDestinationTime: text("arrival_ips_destination_time"),
  deliveryDate: text("delivery_date"),
  deliveryTime: text("delivery_time"),
  returnDate: text("return_date"),
  returnTime: text("return_time"),
  // Personal
  driverName: text("driver_name"),
  auxiliaryName: text("auxiliary_name"),
  auxiliaryDocument: text("auxiliary_document"),
  doctorName: text("doctor_name"),
  doctorDocument: text("doctor_document"),
  // Valor y estado
  cupsCode: text("cups_code"),
  cupsDescription: text("cups_description"),
  value: text("value"),
  status: text("status").notNull().default("pendiente"),
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
  dischargeConditions: text("discharge_conditions"),
  evolutions: text("evolutions"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const companySettings = sqliteTable("company_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default(""),
  nit: text("nit").notNull().default(""),
  habilitacionCode: text("habilitacion_code").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  city: text("city").notNull().default(""),
  logo: text("logo"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
