import { NextResponse } from "next/server";
import { getDb, ensureInitialized } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!tursoUrl) {
      return NextResponse.json({
        status: "ERROR",
        error: "Variable TURSO_DATABASE_URL no configurada",
        tursoUrl: "No definida",
        tursoToken: tursoToken ? "Configurado" : "No definido",
      });
    }
    
    if (!tursoToken) {
      return NextResponse.json({
        status: "ERROR",
        error: "Variable TURSO_AUTH_TOKEN no configurada",
        tursoUrl: tursoUrl,
        tursoToken: "No definido",
      });
    }

    await ensureInitialized();
    const db = getDb();
    
    if (!db) {
      return NextResponse.json({
        status: "ERROR",
        error: "No se pudo inicializar la base de datos",
        tursoUrl: "Configurado",
        tursoToken: "Configurado",
        dbStatus: "null",
      });
    }

    const allUsers = await db.select().from(users).limit(10);

    return NextResponse.json({
      status: "ok",
      database: "Turso (nube)",
      tursoUrl: "Configurado",
      tursoToken: "Configurado",
      userCount: allUsers.length,
      users: allUsers.map((u: Record<string, unknown>) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        active: u.active,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Debug error:", error);
    
    return NextResponse.json({
      status: "ERROR",
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      tursoUrl: process.env.TURSO_DATABASE_URL ? "Configurado" : "No definido",
      tursoToken: process.env.TURSO_AUTH_TOKEN ? "Configurado" : "No definido",
    });
  }
}
