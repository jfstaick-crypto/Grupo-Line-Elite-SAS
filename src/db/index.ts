import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _initialized = false;

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    signature TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type TEXT NOT NULL DEFAULT 'CC',
    document_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    second_last_name TEXT,
    birth_date TEXT NOT NULL,
    gender TEXT NOT NULL,
    marital_status TEXT,
    address TEXT,
    city TEXT,
    locality TEXT,
    dane_code TEXT,
    municipality TEXT,
    municipality_dane_code TEXT,
    neighborhood TEXT,
    phone TEXT,
    email TEXT,
    insurance TEXT,
    regime TEXT,
    user_type TEXT,
    affiliate_number TEXT,
    occupation TEXT,
    country TEXT,
    country_code TEXT,
    birth_country TEXT,
    birth_country_code TEXT,
    birth_department TEXT,
    birth_department_code TEXT,
    birth_city TEXT,
    birth_city_code TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    admitted_by INTEGER NOT NULL REFERENCES users(id),
    assigned_doctor_id INTEGER REFERENCES users(id),
    assigned_nurse_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    department TEXT NOT NULL,
    bed TEXT,
    status TEXT NOT NULL DEFAULT 'activa',
    companion_name TEXT,
    companion_relationship TEXT,
    companion_phone TEXT,
    admission_date INTEGER NOT NULL,
    discharge_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL REFERENCES admissions(id),
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    transferred_by INTEGER NOT NULL REFERENCES users(id),
    authorization_number TEXT,
    diagnosis TEXT,
    origin_city TEXT,
    origin_institution TEXT,
    origin_phone TEXT,
    destination_city TEXT,
    destination_institution TEXT,
    destination_phone TEXT,
    ambulance_plate TEXT,
    tam TEXT,
    tab TEXT,
    request_date TEXT,
    responsible_entity TEXT,
    call_time TEXT,
    promise_time TEXT,
    origin_departure_city TEXT,
    pickup_location TEXT,
    arrival_ips_origin_time TEXT,
    pickup_date TEXT,
    pickup_time TEXT,
    destination_city_arrival TEXT,
    destination_location TEXT,
    arrival_ips_destination_time TEXT,
    delivery_date TEXT,
    delivery_time TEXT,
    return_date TEXT,
    return_time TEXT,
    driver_name TEXT,
    auxiliary_name TEXT,
    auxiliary_document TEXT,
    doctor_name TEXT,
    doctor_document TEXT,
    cups_code TEXT,
    cups_description TEXT,
    value TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente',
    receiver_name TEXT,
    receiver_document TEXT,
    receiver_signature TEXT,
    delivery_observations TEXT,
    transfer_date INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clinical_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hc_code TEXT NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    admission_id INTEGER NOT NULL REFERENCES admissions(id),
    doctor_id INTEGER REFERENCES users(id),
    nurse_id INTEGER REFERENCES users(id),
    driver_id INTEGER REFERENCES users(id),
    diagnosis TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    physical_exam TEXT,
    treatment TEXT NOT NULL,
    notes TEXT,
    vital_signs TEXT,
    discharge_conditions TEXT,
    evolutions TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    nit TEXT NOT NULL DEFAULT '',
    nit_digit_verifier TEXT DEFAULT '',
    habilitacion_code TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    dane_code_city TEXT DEFAULT '',
    dane_code_dept TEXT DEFAULT '',
    department TEXT DEFAULT '',
    tax_regime TEXT DEFAULT '',
    fiscal_responsibility TEXT DEFAULT '',
    ciiu_code TEXT DEFAULT '',
    ciiu_description TEXT DEFAULT '',
    matricula_mercantil TEXT DEFAULT '',
    invoice_prefix TEXT DEFAULT 'FE',
    dian_resolution_number TEXT DEFAULT '',
    dian_resolution_date TEXT DEFAULT '',
    dian_authorized_from TEXT DEFAULT 'FE00000001',
    dian_authorized_to TEXT DEFAULT 'FE99999999',
    dian_software_id TEXT DEFAULT '',
    dian_software_pin TEXT DEFAULT '',
    dian_test_set_id TEXT DEFAULT '',
    dian_production_mode INTEGER DEFAULT 0,
    slogan TEXT,
    logo TEXT,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_prefix TEXT DEFAULT 'FE',
    invoice_type TEXT DEFAULT '01',
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    admission_id INTEGER REFERENCES admissions(id),
    transfer_id INTEGER REFERENCES transfers(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    diagnosis_code TEXT,
    diagnosis TEXT,
    contract_number TEXT,
    payment_modality TEXT,
    benefit_plan TEXT,
    currency TEXT DEFAULT 'COP',
    subtotal TEXT NOT NULL DEFAULT '0',
    discount TEXT DEFAULT '0',
    tax TEXT NOT NULL DEFAULT '0',
    total TEXT NOT NULL DEFAULT '0',
    status TEXT NOT NULL DEFAULT 'pendiente',
    payment_method TEXT,
    payment_method_code TEXT,
    insurance_company TEXT,
    authorization_number TEXT,
    notes TEXT,
    due_date INTEGER,
    cufe TEXT,
    cuv TEXT,
    dian_status TEXT,
    rips_status TEXT,
    xml_content TEXT,
    created_at INTEGER NOT NULL,
    paid_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS invoice_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    line_number INTEGER NOT NULL,
    cups_code TEXT,
    cups_description TEXT,
    cie10_code TEXT,
    authorization_number TEXT,
    quantity TEXT NOT NULL DEFAULT '1',
    unit_measure TEXT DEFAULT 'UND',
    unit_price TEXT NOT NULL DEFAULT '0',
    discount_percent TEXT DEFAULT '0',
    discount_value TEXT DEFAULT '0',
    tax_rate TEXT DEFAULT '0',
    tax_value TEXT DEFAULT '0',
    total_line TEXT NOT NULL DEFAULT '0'
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id INTEGER,
    details TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS accounts_receivable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    document_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    insurance_company TEXT,
    contract_number TEXT,
    total_amount TEXT NOT NULL DEFAULT '0',
    paid_amount TEXT DEFAULT '0',
    pending_amount TEXT NOT NULL DEFAULT '0',
    aging_days INTEGER NOT NULL DEFAULT 0,
    aging_bucket TEXT NOT NULL DEFAULT 'corriente',
    status TEXT NOT NULL DEFAULT 'pendiente',
    due_date INTEGER,
    first_billing_date INTEGER,
    last_payment_date INTEGER,
    payment_count INTEGER NOT NULL DEFAULT 0,
    observations TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_receivable_id INTEGER NOT NULL REFERENCES accounts_receivable(id),
    invoice_id INTEGER REFERENCES invoices(id),
    amount TEXT NOT NULL DEFAULT '0',
    payment_method TEXT,
    payment_method_code TEXT,
    reference_number TEXT,
    bank_name TEXT,
    payment_date INTEGER NOT NULL,
    collected_by INTEGER NOT NULL REFERENCES users(id),
    observations TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ambulances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL,
    year INTEGER,
    vin TEXT,
    engine_number TEXT,
    soat_number TEXT,
    soat_expiration INTEGER,
    rtmc_number TEXT,
    rtmc_expiration INTEGER,
    habilitacion_number TEXT,
    habilitacion_expiration INTEGER,
    license_plate TEXT,
    license_expiration INTEGER,
    status TEXT NOT NULL DEFAULT 'disponible',
    current_km INTEGER DEFAULT 0,
    insurance_company TEXT,
    policy_number TEXT,
    insurance_expiration INTEGER,
    equipment_kit TEXT,
    last_maintenance_date INTEGER,
    next_maintenance_km INTEGER,
    observations TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ambulance_id INTEGER NOT NULL REFERENCES ambulances(id),
    maintenance_type TEXT NOT NULL,
    description TEXT NOT NULL,
    maintenance_date INTEGER NOT NULL,
    next_maintenance_date INTEGER,
    cost TEXT DEFAULT '0',
    provider TEXT,
    invoice_number TEXT,
    km_reading INTEGER,
    observations TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ambulance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ambulance_id INTEGER NOT NULL REFERENCES ambulances(id),
    service_date INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    origin_city TEXT,
    destination_city TEXT,
    km_start INTEGER,
    km_end INTEGER,
    driver_id INTEGER REFERENCES users(id),
    auxiliary_id INTEGER REFERENCES users(id),
    patient_name TEXT,
    authorization_number TEXT,
    value TEXT,
    observations TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pqrs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    patient_document_id TEXT,
    patient_name TEXT,
    patient_phone TEXT,
    patient_email TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    related_module TEXT,
    related_id INTEGER,
    status TEXT NOT NULL DEFAULT 'recibido',
    assigned_to INTEGER REFERENCES users(id),
    response TEXT,
    response_date INTEGER,
    closure_date INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    incident_date INTEGER NOT NULL,
    location TEXT,
    transfer_id INTEGER REFERENCES transfers(id),
    patient_id INTEGER REFERENCES patients(id),
    patient_name TEXT,
    ambulance_plate TEXT,
    involved_users TEXT,
    description TEXT NOT NULL,
    causes TEXT,
    consequences TEXT,
    immediate_actions TEXT,
    recommendations TEXT,
    reported_by INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'en_investigacion',
    investigation_report TEXT,
    closure_date INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS informed_consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    transfer_id INTEGER REFERENCES transfers(id),
    consent_type TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    patient_full_name TEXT NOT NULL,
    representative_name TEXT,
    representative_document TEXT,
    relationship TEXT,
    procedure TEXT NOT NULL,
    risks TEXT,
    benefits TEXT,
    alternatives TEXT,
    authorization INTEGER NOT NULL DEFAULT 0,
    signature_data TEXT,
    signed_at INTEGER,
    witness1_name TEXT,
    witness1_document TEXT,
    witness2_name TEXT,
    witness2_document TEXT,
    professional_name TEXT,
    professional_document TEXT,
    professional_license TEXT,
    professional_signature TEXT,
    observations TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    all_day INTEGER DEFAULT 1,
    recurrence TEXT,
    ambulance_id INTEGER REFERENCES ambulances(id),
    assigned_user_id INTEGER REFERENCES users(id),
    related_module TEXT,
    related_id INTEGER,
    status TEXT NOT NULL DEFAULT 'programado',
    reminder_date INTEGER,
    observations TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS vehicle_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ambulance_id INTEGER NOT NULL REFERENCES ambulances(id),
    document_type TEXT NOT NULL,
    document_number TEXT,
    issue_date INTEGER,
    expiration_date INTEGER,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'vigente',
    observations TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
`;

export function getDb() {
  if (!_db) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      const { createClient } = require("@libsql/client");
      const { drizzle } = require("drizzle-orm/libsql");
      const client = createClient({ url: tursoUrl, authToken: tursoToken });
      _db = drizzle(client, { schema });
      _db._client = client;
    } else {
      const { drizzle } = require("drizzle-orm/better-sqlite3");
      const Database = require("better-sqlite3");
      const path = require("path");
      const fs = require("fs");

      const DB_PATH = path.join(process.cwd(), "data", "hospital.db");
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const sqlite = new Database(DB_PATH);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      sqlite.exec(CREATE_TABLES_SQL);

      runLocalMigrations(sqlite);

      const userCount = sqlite
        .prepare("SELECT COUNT(*) as count FROM users")
        .get() as { count: number };
      if (userCount.count === 0) {
        const now = Date.now();
        const insert = sqlite.prepare(
          `INSERT INTO users (username, password, full_name, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)`
        );
        insert.run("admin", "admin123", "Administrador del Sistema", "administrador", now);
        insert.run("admision", "admision123", "Usuario de Admision", "admision", now);
        insert.run("medico", "medico123", "Dr. Medico General", "medico", now);
      }

      _db = drizzle(sqlite, { schema });
      _db._sqlite = sqlite;
    }
  }
  return _db;
}

export async function ensureInitialized() {
  if (_initialized) return;
  _initialized = true;

  const db = getDb();
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl && db._client) {
    try {
      const statements = CREATE_TABLES_SQL.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            await db._client.execute(stmt);
          } catch (e) {
            // Ignore errors for existing tables
          }
        }
      }

      const result = await db._client.execute(
        "SELECT COUNT(*) as count FROM users"
      );
      const count = result.rows[0]?.count || 0;

      if (count === 0) {
        const now = Date.now();
        await db._client.execute(
          "INSERT INTO users (username, password, full_name, role, active, created_at) VALUES ('admin', 'admin123', 'Administrador del Sistema', 'administrador', 1, ?)",
          [now]
        );
        await db._client.execute(
          "INSERT INTO users (username, password, full_name, role, active, created_at) VALUES ('admision', 'admision123', 'Usuario de Admision', 'admision', 1, ?)",
          [now]
        );
        await db._client.execute(
          "INSERT INTO users (username, password, full_name, role, active, created_at) VALUES ('medico', 'medico123', 'Dr. Medico General', 'medico', 1, ?)",
          [now]
        );
      }
    } catch (e) {
      console.error("ensureInitialized error:", e);
    }
  }
}

function runLocalMigrations(sqlite: { exec(sql: string): void }) {
  const migrations = [
    "ALTER TABLE patients ADD COLUMN document_type TEXT NOT NULL DEFAULT 'CC'",
    "ALTER TABLE patients ADD COLUMN middle_name TEXT",
    "ALTER TABLE patients ADD COLUMN second_last_name TEXT",
    "ALTER TABLE patients ADD COLUMN marital_status TEXT",
    "ALTER TABLE patients ADD COLUMN city TEXT",
    "ALTER TABLE patients ADD COLUMN locality TEXT",
    "ALTER TABLE patients ADD COLUMN neighborhood TEXT",
    "ALTER TABLE patients ADD COLUMN insurance TEXT",
    "ALTER TABLE patients ADD COLUMN regime TEXT",
    "ALTER TABLE patients ADD COLUMN occupation TEXT",
    "ALTER TABLE patients ADD COLUMN dane_code TEXT",
    "ALTER TABLE patients ADD COLUMN municipality TEXT",
    "ALTER TABLE patients ADD COLUMN municipality_dane_code TEXT",
    "ALTER TABLE patients ADD COLUMN email TEXT",
    "ALTER TABLE patients ADD COLUMN user_type TEXT",
    "ALTER TABLE patients ADD COLUMN affiliate_number TEXT",
    "ALTER TABLE patients ADD COLUMN country TEXT",
    "ALTER TABLE patients ADD COLUMN country_code TEXT",
    "ALTER TABLE patients ADD COLUMN birth_country TEXT",
    "ALTER TABLE patients ADD COLUMN birth_country_code TEXT",
    "ALTER TABLE patients ADD COLUMN birth_department TEXT",
    "ALTER TABLE patients ADD COLUMN birth_department_code TEXT",
    "ALTER TABLE patients ADD COLUMN birth_city TEXT",
    "ALTER TABLE patients ADD COLUMN birth_city_code TEXT",
    "ALTER TABLE admissions ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id)",
    "ALTER TABLE admissions ADD COLUMN assigned_nurse_id INTEGER REFERENCES users(id)",
    "ALTER TABLE admissions ADD COLUMN companion_name TEXT",
    "ALTER TABLE admissions ADD COLUMN companion_relationship TEXT",
    "ALTER TABLE admissions ADD COLUMN companion_phone TEXT",
    "ALTER TABLE transfers ADD COLUMN authorization_number TEXT",
    "ALTER TABLE transfers ADD COLUMN diagnosis TEXT",
    "ALTER TABLE transfers ADD COLUMN origin_city TEXT",
    "ALTER TABLE transfers ADD COLUMN origin_institution TEXT",
    "ALTER TABLE transfers ADD COLUMN origin_phone TEXT",
    "ALTER TABLE transfers ADD COLUMN destination_city TEXT",
    "ALTER TABLE transfers ADD COLUMN destination_institution TEXT",
    "ALTER TABLE transfers ADD COLUMN destination_phone TEXT",
    "ALTER TABLE transfers ADD COLUMN ambulance_plate TEXT",
    "ALTER TABLE transfers ADD COLUMN tam TEXT",
    "ALTER TABLE transfers ADD COLUMN tab TEXT",
    "ALTER TABLE transfers ADD COLUMN request_date TEXT",
    "ALTER TABLE transfers ADD COLUMN responsible_entity TEXT",
    "ALTER TABLE transfers ADD COLUMN call_time TEXT",
    "ALTER TABLE transfers ADD COLUMN promise_time TEXT",
    "ALTER TABLE transfers ADD COLUMN origin_departure_city TEXT",
    "ALTER TABLE transfers ADD COLUMN pickup_location TEXT",
    "ALTER TABLE transfers ADD COLUMN arrival_ips_origin_time TEXT",
    "ALTER TABLE transfers ADD COLUMN pickup_date TEXT",
    "ALTER TABLE transfers ADD COLUMN pickup_time TEXT",
    "ALTER TABLE transfers ADD COLUMN destination_city_arrival TEXT",
    "ALTER TABLE transfers ADD COLUMN destination_location TEXT",
    "ALTER TABLE transfers ADD COLUMN arrival_ips_destination_time TEXT",
    "ALTER TABLE transfers ADD COLUMN delivery_date TEXT",
    "ALTER TABLE transfers ADD COLUMN delivery_time TEXT",
    "ALTER TABLE transfers ADD COLUMN return_date TEXT",
    "ALTER TABLE transfers ADD COLUMN return_time TEXT",
    "ALTER TABLE transfers ADD COLUMN driver_name TEXT",
    "ALTER TABLE transfers ADD COLUMN auxiliary_name TEXT",
    "ALTER TABLE transfers ADD COLUMN auxiliary_document TEXT",
    "ALTER TABLE transfers ADD COLUMN doctor_name TEXT",
    "ALTER TABLE transfers ADD COLUMN doctor_document TEXT",
    "ALTER TABLE transfers ADD COLUMN value TEXT",
    "ALTER TABLE transfers ADD COLUMN status TEXT NOT NULL DEFAULT 'pendiente'",
    "ALTER TABLE transfers ADD COLUMN cups_code TEXT",
    "ALTER TABLE transfers ADD COLUMN cups_description TEXT",
    "ALTER TABLE transfers ADD COLUMN receiver_name TEXT",
    "ALTER TABLE transfers ADD COLUMN receiver_document TEXT",
    "ALTER TABLE transfers ADD COLUMN receiver_signature TEXT",
    "ALTER TABLE transfers ADD COLUMN delivery_observations TEXT",
    "ALTER TABLE users ADD COLUMN address TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT",
    "ALTER TABLE users ADD COLUMN email TEXT",
    "ALTER TABLE users ADD COLUMN signature TEXT",
    "ALTER TABLE clinical_histories ADD COLUMN discharge_conditions TEXT",
    "ALTER TABLE clinical_histories ADD COLUMN evolutions TEXT",
    "ALTER TABLE clinical_histories ADD COLUMN nurse_id INTEGER REFERENCES users(id)",
    "ALTER TABLE clinical_histories ADD COLUMN driver_id INTEGER REFERENCES users(id)",
    "ALTER TABLE clinical_histories ADD COLUMN hc_code TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE clinical_histories ADD COLUMN physical_exam TEXT",
    "ALTER TABLE company_settings ADD COLUMN slogan TEXT",
    "ALTER TABLE company_settings ADD COLUMN nit_digit_verifier TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dane_code_city TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dane_code_dept TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN department TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN tax_regime TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN fiscal_responsibility TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN ciiu_code TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN ciiu_description TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN matricula_mercantil TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN invoice_prefix TEXT DEFAULT 'FE'",
    "ALTER TABLE company_settings ADD COLUMN dian_resolution_number TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dian_resolution_date TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dian_authorized_from TEXT DEFAULT 'FE00000001'",
    "ALTER TABLE company_settings ADD COLUMN dian_authorized_to TEXT DEFAULT 'FE99999999'",
    "ALTER TABLE company_settings ADD COLUMN dian_software_id TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dian_software_pin TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dian_test_set_id TEXT DEFAULT ''",
    "ALTER TABLE company_settings ADD COLUMN dian_production_mode INTEGER DEFAULT 0",
    "ALTER TABLE invoices ADD COLUMN invoice_prefix TEXT DEFAULT 'FE'",
    "ALTER TABLE invoices ADD COLUMN invoice_type TEXT DEFAULT '01'",
    "ALTER TABLE invoices ADD COLUMN diagnosis_code TEXT",
    "ALTER TABLE invoices ADD COLUMN contract_number TEXT",
    "ALTER TABLE invoices ADD COLUMN payment_modality TEXT",
    "ALTER TABLE invoices ADD COLUMN benefit_plan TEXT",
    "ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'COP'",
    "ALTER TABLE invoices ADD COLUMN discount TEXT DEFAULT '0'",
    "ALTER TABLE invoices ADD COLUMN payment_method_code TEXT",
    "ALTER TABLE invoices ADD COLUMN due_date INTEGER",
    "ALTER TABLE invoices ADD COLUMN cufe TEXT",
    "ALTER TABLE invoices ADD COLUMN cuv TEXT",
    "ALTER TABLE invoices ADD COLUMN dian_status TEXT",
    "ALTER TABLE invoices ADD COLUMN rips_status TEXT",
    "ALTER TABLE invoices ADD COLUMN xml_content TEXT",
    "ALTER TABLE accounts_receivable ADD COLUMN invoice_id INTEGER REFERENCES invoices(id)",
    "ALTER TABLE accounts_receivable ADD COLUMN patient_id INTEGER REFERENCES patients(id)",
    "ALTER TABLE accounts_receivable ADD COLUMN document_id TEXT NOT NULL",
    "ALTER TABLE accounts_receivable ADD COLUMN patient_name TEXT NOT NULL",
    "ALTER TABLE accounts_receivable ADD COLUMN insurance_company TEXT",
    "ALTER TABLE accounts_receivable ADD COLUMN contract_number TEXT",
    "ALTER TABLE accounts_receivable ADD COLUMN total_amount TEXT NOT NULL DEFAULT '0'",
    "ALTER TABLE accounts_receivable ADD COLUMN paid_amount TEXT DEFAULT '0'",
    "ALTER TABLE accounts_receivable ADD COLUMN pending_amount TEXT NOT NULL DEFAULT '0'",
    "ALTER TABLE accounts_receivable ADD COLUMN aging_days INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE accounts_receivable ADD COLUMN aging_bucket TEXT NOT NULL DEFAULT 'corriente'",
    "ALTER TABLE accounts_receivable ADD COLUMN status TEXT NOT NULL DEFAULT 'pendiente'",
    "ALTER TABLE accounts_receivable ADD COLUMN due_date INTEGER",
    "ALTER TABLE accounts_receivable ADD COLUMN first_billing_date INTEGER",
    "ALTER TABLE accounts_receivable ADD COLUMN last_payment_date INTEGER",
    "ALTER TABLE accounts_receivable ADD COLUMN payment_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE accounts_receivable ADD COLUMN observations TEXT",
    "ALTER TABLE accounts_receivable ADD COLUMN created_at INTEGER NOT NULL",
    "ALTER TABLE accounts_receivable ADD COLUMN updated_at INTEGER",
    "ALTER TABLE payments ADD COLUMN account_receivable_id INTEGER REFERENCES accounts_receivable(id)",
    "ALTER TABLE payments ADD COLUMN invoice_id INTEGER REFERENCES invoices(id)",
    "ALTER TABLE payments ADD COLUMN amount TEXT NOT NULL DEFAULT '0'",
    "ALTER TABLE payments ADD COLUMN payment_method TEXT",
    "ALTER TABLE payments ADD COLUMN payment_method_code TEXT",
    "ALTER TABLE payments ADD COLUMN reference_number TEXT",
    "ALTER TABLE payments ADD COLUMN bank_name TEXT",
    "ALTER TABLE payments ADD COLUMN payment_date INTEGER NOT NULL",
    "ALTER TABLE payments ADD COLUMN collected_by INTEGER REFERENCES users(id)",
    "ALTER TABLE payments ADD COLUMN observations TEXT",
    "ALTER TABLE payments ADD COLUMN created_at INTEGER NOT NULL",
  ];

  for (const sql of migrations) {
    try {
      sqlite.exec(sql);
    } catch {
      // Column already exists
    }
  }
}
