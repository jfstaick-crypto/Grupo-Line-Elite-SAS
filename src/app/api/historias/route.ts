import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinicalHistories, patients, users, admissions } from "@/db/schema";
import { getSession, hasPermission } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const allHistories = await db
    .select({
      id: clinicalHistories.id,
      patientId: clinicalHistories.patientId,
      admissionId: clinicalHistories.admissionId,
      diagnosis: clinicalHistories.diagnosis,
      symptoms: clinicalHistories.symptoms,
      treatment: clinicalHistories.treatment,
      notes: clinicalHistories.notes,
      vitalSigns: clinicalHistories.vitalSigns,
      createdAt: clinicalHistories.createdAt,
      updatedAt: clinicalHistories.updatedAt,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDocumentId: patients.documentId,
      doctorName: users.fullName,
      department: admissions.department,
    })
    .from(clinicalHistories)
    .leftJoin(patients, eq(clinicalHistories.patientId, patients.id))
    .leftJoin(users, eq(clinicalHistories.doctorId, users.id))
    .leftJoin(admissions, eq(clinicalHistories.admissionId, admissions.id))
    .orderBy(desc(clinicalHistories.createdAt));

  return NextResponse.json(allHistories);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { patientId, admissionId, diagnosis, symptoms, treatment, notes, vitalSigns } =
      body;

    if (!patientId || !admissionId || !diagnosis || !symptoms || !treatment) {
      return NextResponse.json(
        { error: "Paciente, admisión, diagnóstico, síntomas y tratamiento son requeridos" },
        { status: 400 }
      );
    }

    await db.insert(clinicalHistories).values({
      patientId,
      admissionId,
      doctorId: session.userId,
      diagnosis,
      symptoms,
      treatment,
      notes: notes || null,
      vitalSigns: vitalSigns || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create clinical history error:", error);
    return NextResponse.json(
      { error: "Error al crear historia clínica" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, diagnosis, symptoms, treatment, notes, vitalSigns } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (symptoms) updateData.symptoms = symptoms;
    if (treatment) updateData.treatment = treatment;
    if (notes !== undefined) updateData.notes = notes;
    if (vitalSigns !== undefined) updateData.vitalSigns = vitalSigns;

    await db
      .update(clinicalHistories)
      .set(updateData)
      .where(eq(clinicalHistories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update clinical history error:", error);
    return NextResponse.json(
      { error: "Error al actualizar historia clínica" },
      { status: 500 }
    );
  }
}
