import { NextResponse } from "next/server";
import { unsealData } from "iron-session";

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

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { db } = await import("@/db");
  const { patients } = await import("@/db/schema");

  const allPatients = await db.select().from(patients);
  return NextResponse.json(allPatients);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { db } = await import("@/db");
    const { patients } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const body = await request.json();
    const { documentId, firstName, lastName, birthDate, gender, phone, address } =
      body;

    if (!documentId || !firstName || !lastName || !birthDate || !gender) {
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(patients)
      .where(eq(patients.documentId, documentId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Paciente con este documento ya existe" },
        { status: 400 }
      );
    }

    await db.insert(patients).values({
      documentId,
      firstName,
      lastName,
      birthDate,
      gender,
      phone: phone || null,
      address: address || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}
