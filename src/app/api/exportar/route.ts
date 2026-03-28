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
  if (!session || !hasPermission(session.role, "exportar")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const { getDb } = await import("@/db");
  const { admissions, patients, transfers, clinicalHistories, users } =
    await import("@/db/schema");
  const db = getDb();

  if (type === "admissions") {
    const data = await db
      .select({
        id: admissions.id,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        documentId: patients.documentId,
        reason: admissions.reason,
        department: admissions.department,
        bed: admissions.bed,
        status: admissions.status,
        admissionDate: admissions.admissionDate,
        dischargedBy: users.fullName,
      })
      .from(admissions)
      .leftJoin(patients, eq(admissions.patientId, patients.id))
      .leftJoin(users, eq(admissions.admittedBy, users.id));
    return NextResponse.json(data);
  }

  if (type === "transfers") {
    const data = await db
      .select({
        id: transfers.id,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        documentId: patients.documentId,
        fromDepartment: transfers.fromDepartment,
        toDepartment: transfers.toDepartment,
        reason: transfers.reason,
        transferDate: transfers.transferDate,
        transferredBy: users.fullName,
      })
      .from(transfers)
      .leftJoin(patients, eq(transfers.patientId, patients.id))
      .leftJoin(users, eq(transfers.transferredBy, users.id));
    return NextResponse.json(data);
  }

  if (type === "histories") {
    const data = await db
      .select({
        id: clinicalHistories.id,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        documentId: patients.documentId,
        diagnosis: clinicalHistories.diagnosis,
        symptoms: clinicalHistories.symptoms,
        treatment: clinicalHistories.treatment,
        notes: clinicalHistories.notes,
        vitalSigns: clinicalHistories.vitalSigns,
        doctorName: users.fullName,
        createdAt: clinicalHistories.createdAt,
      })
      .from(clinicalHistories)
      .leftJoin(patients, eq(clinicalHistories.patientId, patients.id))
      .leftJoin(users, eq(clinicalHistories.doctorId, users.id));
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
}
