import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sealData } from "iron-session";

export const dynamic = "force-dynamic";

const SESSION_PASSWORD =
  "complex_password_at_least_32_characters_long_for_security";
const COOKIE_NAME = "si";

export async function POST(request: Request) {
  try {
    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const db = getDb();

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      await db.insert(users).values([
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

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
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

    const encrypted = await sealData(
      {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      { password: SESSION_PASSWORD }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
