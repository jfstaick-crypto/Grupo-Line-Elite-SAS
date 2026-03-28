import { NextResponse } from "next/server";
import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sealData } from "iron-session";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "si";
const SESSION_PASSWORD = "complex_password_at_least_32_characters_long_for_security";

function getDatabase() {
  const url = process.env.DB_URL;
  const token = process.env.DB_TOKEN;

  if (!url || !token) {
    throw new Error(`DB not configured: URL=${url ? "OK" : "MISSING"}, TOKEN=${token ? "OK" : "MISSING"}`);
  }

  return createDatabase(schema);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      console.error("Database init error:", dbError);
      return NextResponse.json(
        { error: "Base de datos no configurada" },
        { status: 500 }
      );
    }

    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length === 0) {
      await db.insert(schema.users).values([
        {
          username: "admin",
          password: "admin123",
          fullName: "Administrador del Sistema",
          role: "administrador",
          active: true,
        },
        {
          username: "admision",
          password: "admision123",
          fullName: "Usuario de Admisión",
          role: "admision",
          active: true,
        },
        {
          username: "medico",
          password: "medico123",
          fullName: "Dr. Médico General",
          role: "medico",
          active: true,
        },
      ]);
    }

    const foundUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const user = foundUsers[0];
    if (user.password !== password || !user.active) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const sessionData = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };

    const encrypted = await sealData(sessionData, {
      password: SESSION_PASSWORD,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    response.cookies.set(COOKIE_NAME, encrypted, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error: ${message}` },
      { status: 500 }
    );
  }
}
