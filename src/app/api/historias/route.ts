import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
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
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { getDb } = await import("@/db");
  const { clinicalHistories, patients, users, admissions } = await import(
    "@/db/schema"
  );
  const db = getDb();

  const { aliasedTable } = await import("drizzle-orm");
  const doctor = aliasedTable(users, "doctor");
  const nurse = aliasedTable(users, "nurse");
  const driver = aliasedTable(users, "driver");

  const allHistories = await db
    .select({
      id: clinicalHistories.id,
      patientId: clinicalHistories.patientId,
      admissionId: clinicalHistories.admissionId,
      doctorId: clinicalHistories.doctorId,
      nurseId: clinicalHistories.nurseId,
      driverId: clinicalHistories.driverId,
      diagnosis: clinicalHistories.diagnosis,
      symptoms: clinicalHistories.symptoms,
      treatment: clinicalHistories.treatment,
      notes: clinicalHistories.notes,
      vitalSigns: clinicalHistories.vitalSigns,
      dischargeConditions: clinicalHistories.dischargeConditions,
      evolutions: clinicalHistories.evolutions,
      createdAt: clinicalHistories.createdAt,
      updatedAt: clinicalHistories.updatedAt,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDocumentId: patients.documentId,
      patientBirthDate: patients.birthDate,
      patientGender: patients.gender,
      patientInsurance: patients.insurance,
      patientRegime: patients.regime,
      doctorName: doctor.fullName,
      doctorSignature: doctor.signature,
      nurseName: nurse.fullName,
      nurseSignature: nurse.signature,
      driverName: driver.fullName,
      driverSignature: driver.signature,
      department: admissions.department,
    })
    .from(clinicalHistories)
    .leftJoin(patients, eq(clinicalHistories.patientId, patients.id))
    .leftJoin(doctor, eq(clinicalHistories.doctorId, doctor.id))
    .leftJoin(nurse, eq(clinicalHistories.nurseId, nurse.id))
    .leftJoin(driver, eq(clinicalHistories.driverId, driver.id))
    .leftJoin(admissions, eq(clinicalHistories.admissionId, admissions.id))
    .orderBy(desc(clinicalHistories.createdAt));

  return NextResponse.json(allHistories);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { clinicalHistories } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const {
      patientId,
      admissionId,
      doctorId,
      nurseId,
      driverId,
      diagnosis,
      symptoms,
      treatment,
      notes,
      vitalSigns,
      dischargeConditions,
      evolutions,
    } = body;

    if (!patientId || !admissionId || !diagnosis || !symptoms || !treatment) {
      return NextResponse.json(
        {
          error:
            "Paciente, admisión, diagnóstico, síntomas y tratamiento son requeridos",
        },
        { status: 400 }
      );
    }

    await db.insert(clinicalHistories).values({
      patientId,
      admissionId,
      doctorId: doctorId || session.userId,
      nurseId: nurseId || null,
      driverId: driverId || null,
      diagnosis,
      symptoms,
      treatment,
      notes: notes || null,
      vitalSigns: vitalSigns || null,
      dischargeConditions: dischargeConditions || null,
      evolutions: evolutions || null,
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
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "historia-clinica")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { clinicalHistories } = await import("@/db/schema");
    const db = getDb();

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
