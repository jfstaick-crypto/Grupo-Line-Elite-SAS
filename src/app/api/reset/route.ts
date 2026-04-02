import { NextResponse } from "next/server";
import { getDb, ensureInitialized } from "@/db";
import { users, patients, admissions, transfers, clinicalHistories, invoices, invoiceLines, companySettings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureInitialized();
    const db = getDb();

    // Delete all data (in order due to foreign keys)
    await db.delete(invoiceLines).catch(() => {});
    await db.delete(invoices).catch(() => {});
    await db.delete(clinicalHistories).catch(() => {});
    await db.delete(transfers).catch(() => {});
    await db.delete(admissions).catch(() => {});
    await db.delete(patients).catch(() => {});
    await db.delete(companySettings).catch(() => {});
    await db.delete(users).catch(() => {});

    // Re-seed default users
    const now = new Date();
    await db.insert(users).values([
      {
        username: "admin",
        password: "admin123",
        fullName: "Administrador del Sistema",
        role: "administrador",
        active: true,
        createdAt: now,
      },
      {
        username: "admision",
        password: "admision123",
        fullName: "Usuario de Admision",
        role: "admision",
        active: true,
        createdAt: now,
      },
      {
        username: "medico",
        password: "medico123",
        fullName: "Dr. Medico General",
        role: "medico",
        active: true,
        createdAt: now,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Base de datos limpia. Usuarios recreados: admin/admin123, admision/admision123, medico/medico123",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureInitialized();
    const db = getDb();
    const allUsers = await db.select().from(users);

    return NextResponse.json({
      status: "ok",
      database: process.env.TURSO_DATABASE_URL ? "Turso (nube)" : "SQLite (local)",
      userCount: allUsers.length,
      users: allUsers.map((u: { username: string; role: string; fullName: string }) => ({
        username: u.username,
        role: u.role,
        name: u.fullName,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
