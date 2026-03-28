import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { getDb } = await import("@/db");
    const { users, patients, admissions, transfers, clinicalHistories } =
      await import("@/db/schema");
    const db = getDb();

    // Delete all data
    await db.delete(clinicalHistories);
    await db.delete(transfers);
    await db.delete(admissions);
    await db.delete(patients);
    await db.delete(users);

    // Re-seed default users
    const { eq } = await import("drizzle-orm");
    const now = Date.now();
    await db.insert(users).values([
      {
        username: "admin",
        password: "admin123",
        fullName: "Administrador del Sistema",
        role: "administrador",
        active: true,
        createdAt: new Date(now),
      },
      {
        username: "admision",
        password: "admision123",
        fullName: "Usuario de Admisión",
        role: "admision",
        active: true,
        createdAt: new Date(now),
      },
      {
        username: "medico",
        password: "medico123",
        fullName: "Dr. Médico General",
        role: "medico",
        active: true,
        createdAt: new Date(now),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Base de datos limpiada y usuarios recreados",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { error: "Error al limpiar base de datos" },
      { status: 500 }
    );
  }
}
