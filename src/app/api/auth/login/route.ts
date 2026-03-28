import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sealData } from "iron-session";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "si";
const SESSION_PASSWORD =
  "complex_password_at_least_32_characters_long_for_security";

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

    const db = getDb();

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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
