import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const allUsers = await db.select().from(users).limit(5);

    return NextResponse.json({
      status: "ok",
      database: process.env.TURSO_DATABASE_URL ? "Turso (nube)" : "SQLite (local)",
      tursoUrl: process.env.TURSO_DATABASE_URL ? "Configurado" : "No configurado",
      userCount: allUsers.length,
      users: allUsers.map((u: Record<string, unknown>) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        active: u.active,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
