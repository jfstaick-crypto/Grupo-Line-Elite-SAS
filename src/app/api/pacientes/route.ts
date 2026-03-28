import { NextResponse } from "next/server";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allPatients = await db.select().from(patients);
  return NextResponse.json(allPatients);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { documentId, firstName, lastName, birthDate, gender, phone, address } = body;

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
