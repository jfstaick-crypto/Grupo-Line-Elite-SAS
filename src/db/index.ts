import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "hospital.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    _db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        gender TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS admissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        admitted_by INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        department TEXT NOT NULL,
        bed TEXT,
        status TEXT NOT NULL DEFAULT 'activa',
        admission_date INTEGER NOT NULL,
        discharge_date INTEGER
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_id INTEGER NOT NULL REFERENCES admissions(id),
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        from_department TEXT NOT NULL,
        to_department TEXT NOT NULL,
        reason TEXT NOT NULL,
        transferred_by INTEGER NOT NULL REFERENCES users(id),
        transfer_date INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clinical_histories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        admission_id INTEGER NOT NULL REFERENCES admissions(id),
        doctor_id INTEGER NOT NULL REFERENCES users(id),
        diagnosis TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        treatment TEXT NOT NULL,
        notes TEXT,
        vital_signs TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    const userCount = sqlite
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    if (userCount.count === 0) {
      const insertUser = sqlite.prepare(`
        INSERT INTO users (username, password, full_name, role, active, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
      `);
      const now = Date.now();
      insertUser.run(
        "admin",
        "admin123",
        "Administrador del Sistema",
        "administrador",
        now
      );
      insertUser.run(
        "admision",
        "admision123",
        "Usuario de Admisión",
        "admision",
        now
      );
      insertUser.run(
        "medico",
        "medico123",
        "Dr. Médico General",
        "medico",
        now
      );
    }
  }
  return _db;
}
