import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unsealData } from "iron-session";
import { ROLE_PERMISSIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SESSION_PASSWORD =
  "complex_password_at_least_32_characters_long_for_security";

async function getSessionFromRequest(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)si=([^;]*)/);
    if (!match) return null;
    return await unsealData<{
      userId: number;
      username: string;
      fullName: string;
      role: string;
    }>(decodeURIComponent(match[1]), { password: SESSION_PASSWORD });
  } catch {
    return null;
  }
}

function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "usuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { getDb } = await import("@/db");
  const { users } = await import("@/db/schema");
  const db = getDb();

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      signature: users.signature,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users);

  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "usuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { username, password, fullName, role, signature } = body;

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    await db.insert(users).values({
      username,
      password,
      fullName,
      role,
      signature: signature || null,
      active: true,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "usuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, username, password, fullName, role, signature, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (signature !== undefined) updateData.signature = signature;
    if (active !== undefined) updateData.active = active;

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "usuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
