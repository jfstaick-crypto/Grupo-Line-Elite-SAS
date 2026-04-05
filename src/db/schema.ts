import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ROLES = {
  ADMINISTRADOR: "administrador",
  ADMISION: "admision",
  AUDITOR: "auditor",
  MEDICO: "medico",
  ENFERMERA: "enfermera",
  AUXILIAR_ENFERMERIA: "auxiliar_enfermeria",
  ENFERMERA_JEFE: "enfermera_jefe",
  CHOFER: "chofer",
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
  "medico", "enfermera", "auxiliar_enfermeria", "enfermera_jefe",
] as const;

export const PAYMENT_METHODS_DIAN = [
  { code: "10", name: "Efectivo" },
  { code: "20", name: "Cheque" },
  { code: "22", name: "Giro" },
  { code: "30", name: "Transferencia" },
  { code: "31", name: "Tarjeta débito" },
  { code: "32", name: "Tarjeta crédito" },
  { code: "42", name: "Consignación" },
  { code: "46", name: "Compensación" },
  { code: "ZZZ", name: "Otro" },
] as const;

export const INVOICE_TYPES = [
  { code: "01", name: "Factura de venta" },
  { code: "02", name: "Factura de exportación" },
  { code: "03", name: "Factura de contingencia" },
  { code: "04", name: "Nota crédito" },
  { code: "05", name: "Nota débito" },
] as const;

export const PAYMENT_MODALITIES = [
  "Evento", "Cápita", "Global", "Pago directo", "Otro",
] as const;

export const USER_TYPES = [
  "Cotizante", "Beneficiario", "Adicional",
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
  email: text("email"),
  insurance: text("insurance"),
  regime: text("regime"),
  userType: text("user_type"),
  affiliateNumber: text("affiliate_number"),
  occupation: text("occupation"),
  country: text("country"),
  countryCode: text("country_code"),
  birthCountry: text("birth_country"),
  birthCountryCode: text("birth_country_code"),
  birthDepartment: text("birth_department"),
  birthDepartmentCode: text("birth_department_code"),
  birthCity: text("birth_city"),
  birthCityCode: text("birth_city_code"),
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
  assignedNurseId: integer("assigned_nurse_id")
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
  // Confirmación de entrega
  receiverName: text("receiver_name"),
  receiverDocument: text("receiver_document"),
  receiverSignature: text("receiver_signature"),
  deliveryObservations: text("delivery_observations"),
  transferDate: integer("transfer_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const clinicalHistories = sqliteTable("clinical_histories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hcCode: text("hc_code").notNull(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  admissionId: integer("admission_id")
    .notNull()
    .references(() => admissions.id),
  doctorId: integer("doctor_id")
    .references(() => users.id),
  nurseId: integer("nurse_id")
    .references(() => users.id),
  driverId: integer("driver_id")
    .references(() => users.id),
  diagnosis: text("diagnosis").notNull(),
  symptoms: text("symptoms").notNull(),
  physicalExam: text("physical_exam"),
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
  nitDigitVerifier: text("nit_digit_verifier").default(""),
  habilitacionCode: text("habilitacion_code").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  city: text("city").notNull().default(""),
  daneCodeCity: text("dane_code_city").default(""),
  daneCodeDept: text("dane_code_dept").default(""),
  department: text("department").default(""),
  taxRegime: text("tax_regime").default(""),
  fiscalResponsibility: text("fiscal_responsibility").default(""),
  ciiuCode: text("ciiu_code").default(""),
  ciiuDescription: text("ciiu_description").default(""),
  matriculaMercantil: text("matricula_mercantil").default(""),
  invoicePrefix: text("invoice_prefix").default("FE"),
  dianResolutionNumber: text("dian_resolution_number").default(""),
  dianResolutionDate: text("dian_resolution_date").default(""),
  dianAuthorizedFrom: text("dian_authorized_from").default("FE00000001"),
  dianAuthorizedTo: text("dian_authorized_to").default("FE99999999"),
  dianSoftwareId: text("dian_software_id").default(""),
  dianSoftwarePin: text("dian_software_pin").default(""),
  dianTestSetId: text("dian_test_set_id").default(""),
  dianProductionMode: integer("dian_production_mode", { mode: "boolean" }).default(false),
  slogan: text("slogan"),
  logo: text("logo"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoicePrefix: text("invoice_prefix").default("FE"),
  invoiceType: text("invoice_type").default("01"),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  admissionId: integer("admission_id")
    .references(() => admissions.id),
  transferId: integer("transfer_id")
    .references(() => transfers.id),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  diagnosisCode: text("diagnosis_code"),
  diagnosis: text("diagnosis"),
  contractNumber: text("contract_number"),
  paymentModality: text("payment_modality"),
  benefitPlan: text("benefit_plan"),
  currency: text("currency").default("COP"),
  subtotal: text("subtotal").notNull().default("0"),
  discount: text("discount").default("0"),
  tax: text("tax").notNull().default("0"),
  total: text("total").notNull().default("0"),
  status: text("status").notNull().default("pendiente"),
  paymentMethod: text("payment_method"),
  paymentMethodCode: text("payment_method_code"),
  insuranceCompany: text("insurance_company"),
  authorizationNumber: text("authorization_number"),
  notes: text("notes"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  cufe: text("cufe"),
  cuv: text("cuv"),
  dianStatus: text("dian_status"),
  ripsStatus: text("rips_status"),
  xmlContent: text("xml_content"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  paidAt: integer("paid_at", { mode: "timestamp" }),
});

export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  lineNumber: integer("line_number").notNull(),
  cupsCode: text("cups_code"),
  cupsDescription: text("cups_description"),
  cie10Code: text("cie10_code"),
  authorizationNumber: text("authorization_number"),
  quantity: text("quantity").notNull().default("1"),
  unitMeasure: text("unit_measure").default("UND"),
  unitPrice: text("unit_price").notNull().default("0"),
  discountPercent: text("discount_percent").default("0"),
  discountValue: text("discount_value").default("0"),
  taxRate: text("tax_rate").default("0"),
  taxValue: text("tax_value").default("0"),
  totalLine: text("total_line").notNull().default("0"),
});

export const accountsReceivable = sqliteTable("accounts_receivable", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  documentId: text("document_id").notNull(),
  patientName: text("patient_name").notNull(),
  insuranceCompany: text("insurance_company"),
  contractNumber: text("contract_number"),
  totalAmount: text("total_amount").notNull().default("0"),
  paidAmount: text("paid_amount").default("0"),
  pendingAmount: text("pending_amount").notNull().default("0"),
  agingDays: integer("aging_days").notNull().default(0),
  agingBucket: text("aging_bucket").notNull().default("corriente"),
  status: text("status").notNull().default("pendiente"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  firstBillingDate: integer("first_billing_date", { mode: "timestamp" }),
  lastPaymentDate: integer("last_payment_date", { mode: "timestamp" }),
  paymentCount: integer("payment_count").notNull().default(0),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountReceivableId: integer("account_receivable_id")
    .notNull()
    .references(() => accountsReceivable.id),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id),
  amount: text("amount").notNull().default("0"),
  paymentMethod: text("payment_method"),
  paymentMethodCode: text("payment_method_code"),
  referenceNumber: text("reference_number"),
  bankName: text("bank_name"),
  paymentDate: integer("payment_date", { mode: "timestamp" }).notNull(),
  collectedBy: integer("collected_by")
    .notNull()
    .references(() => users.id),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  module: text("module").notNull(),
  recordId: integer("record_id"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const agingBuckets = [
  "corriente",
  "1_30",
  "31_60",
  "61_90",
  "91_180",
  "181_360",
  "mas_360",
] as const;

export const receivableStatuses = [
  "pendiente",
  "parcial",
  "pagada",
  "cobro_judicial",
  "castigada",
  "negociada",
] as const;

export type AgingBucket = (typeof agingBuckets)[number];
export type ReceivableStatus = (typeof receivableStatuses)[number];

export const ambulances = sqliteTable("ambulances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  type: text("type").notNull(),
  year: integer("year"),
  vin: text("vin"),
  engineNumber: text("engine_number"),
  soatNumber: text("soat_number"),
  soatExpiration: integer("soat_expiration", { mode: "timestamp" }),
  rtmcNumber: text("rtmc_number"),
  rtmcExpiration: integer("rtmc_expiration", { mode: "timestamp" }),
  habilitacionNumber: text("habilitacion_number"),
  habilitacionExpiration: integer("habilitacion_expiration", { mode: "timestamp" }),
  licensePlate: text("license_plate"),
  licenseExpiration: integer("license_expiration", { mode: "timestamp" }),
  status: text("status").notNull().default("disponible"),
  currentKm: integer("current_km").default(0),
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  insuranceExpiration: integer("insurance_expiration", { mode: "timestamp" }),
  equipmentKit: text("equipment_kit"),
  lastMaintenanceDate: integer("last_maintenance_date", { mode: "timestamp" }),
  nextMaintenanceKm: integer("next_maintenance_km"),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const maintenanceRecords = sqliteTable("maintenance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ambulanceId: integer("ambulance_id")
    .notNull()
    .references(() => ambulances.id),
  maintenanceType: text("maintenance_type").notNull(),
  description: text("description").notNull(),
  maintenanceDate: integer("maintenance_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  nextMaintenanceDate: integer("next_maintenance_date", { mode: "timestamp" }),
  cost: text("cost").default("0"),
  provider: text("provider"),
  invoiceNumber: text("invoice_number"),
  kmReading: integer("km_reading"),
  observations: text("observations"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ambulanceLogs = sqliteTable("ambulance_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ambulanceId: integer("ambulance_id")
    .notNull()
    .references(() => ambulances.id),
  serviceDate: integer("service_date", { mode: "timestamp" }).notNull(),
  serviceType: text("service_type").notNull(),
  originCity: text("origin_city"),
  destinationCity: text("destination_city"),
  kmStart: integer("km_start"),
  kmEnd: integer("km_end"),
  driverId: integer("driver_id").references(() => users.id),
  auxiliaryId: integer("auxiliary_id").references(() => users.id),
  patientName: text("patient_name"),
  authorizationNumber: text("authorization_number"),
  value: text("value"),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pqrs = sqliteTable("pqrs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  patientDocumentId: text("patient_document_id"),
  patientName: text("patient_name"),
  patientPhone: text("patient_phone"),
  patientEmail: text("patient_email"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  relatedModule: text("related_module"),
  relatedId: integer("related_id"),
  status: text("status").notNull().default("recibido"),
  assignedTo: integer("assigned_to").references(() => users.id),
  response: text("response"),
  responseDate: integer("response_date", { mode: "timestamp" }),
  closureDate: integer("closure_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentType: text("incident_type").notNull(),
  severity: text("severity").notNull(),
  incidentDate: integer("incident_date", { mode: "timestamp" }).notNull(),
  location: text("location"),
  transferId: integer("transfer_id").references(() => transfers.id),
  patientId: integer("patient_id").references(() => patients.id),
  patientName: text("patient_name"),
  ambulancePlate: text("ambulance_plate"),
  involvedUsers: text("involved_users"),
  description: text("description").notNull(),
  causes: text("causes"),
  consequences: text("consequences"),
  immediateActions: text("immediate_actions"),
  recommendations: text("recommendations"),
  reportedBy: integer("reported_by")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("en_investigacion"),
  investigationReport: text("investigation_report"),
  closureDate: integer("closure_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const informedConsents = sqliteTable("informed_consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  transferId: integer("transfer_id").references(() => transfers.id),
  consentType: text("consent_type").notNull(),
  documentType: text("document_type").notNull(),
  documentId: text("document_id").notNull(),
  patientFullName: text("patient_full_name").notNull(),
  representativeName: text("representative_name"),
  representativeDocument: text("representative_document"),
  relationship: text("relationship"),
  procedure: text("procedure").notNull(),
  risks: text("risks"),
  benefits: text("benefits"),
  alternatives: text("alternatives"),
  authorization: integer("authorization", { mode: "boolean" }).notNull().default(false),
  signatureData: text("signature_data"),
  signedAt: integer("signed_at", { mode: "timestamp" }),
  witness1Name: text("witness1_name"),
  witness1Document: text("witness1_document"),
  witness2Name: text("witness2_name"),
  witness2Document: text("witness2_document"),
  professionalName: text("professional_name"),
  professionalDocument: text("professional_document"),
  professionalLicense: text("professional_license"),
  professionalSignature: text("professional_signature"),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scheduleType: text("schedule_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  allDay: integer("all_day", { mode: "boolean" }).default(true),
  recurrence: text("recurrence"),
  ambulanceId: integer("ambulance_id").references(() => ambulances.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  relatedModule: text("related_module"),
  relatedId: integer("related_id"),
  status: text("status").notNull().default("programado"),
  reminderDate: integer("reminder_date", { mode: "timestamp" }),
  observations: text("observations"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const vehicleDocuments = sqliteTable("vehicle_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ambulanceId: integer("ambulance_id")
    .notNull()
    .references(() => ambulances.id),
  documentType: text("document_type").notNull(),
  documentNumber: text("document_number"),
  issueDate: integer("issue_date", { mode: "timestamp" }),
  expirationDate: integer("expiration_date", { mode: "timestamp" }),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("vigente"),
  observations: text("observations"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
