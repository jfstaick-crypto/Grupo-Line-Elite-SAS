import { NextResponse } from "next/server";
import { db } from "@/db";
import { admissions, patients, transfers, clinicalHistories, users } from "@/db/schema";
import { getSession, hasPermission } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "exportar")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

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
