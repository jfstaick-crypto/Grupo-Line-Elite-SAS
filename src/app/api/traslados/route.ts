import { NextResponse } from "next/server";
import { db } from "@/db";
import { transfers, patients, users, admissions } from "@/db/schema";
import { getSession, hasPermission } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "traslados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const allTransfers = await db
    .select({
      id: transfers.id,
      admissionId: transfers.admissionId,
      patientId: transfers.patientId,
      fromDepartment: transfers.fromDepartment,
      toDepartment: transfers.toDepartment,
      reason: transfers.reason,
      transferDate: transfers.transferDate,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDocumentId: patients.documentId,
      transferredByName: users.fullName,
    })
    .from(transfers)
    .leftJoin(patients, eq(transfers.patientId, patients.id))
    .leftJoin(users, eq(transfers.transferredBy, users.id));

  return NextResponse.json(allTransfers);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "traslados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { admissionId, patientId, fromDepartment, toDepartment, reason } =
      body;

    if (!admissionId || !patientId || !fromDepartment || !toDepartment || !reason) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    await db.insert(transfers).values({
      admissionId,
      patientId,
      fromDepartment,
      toDepartment,
      reason,
      transferredBy: session.userId,
    });

    await db
      .update(admissions)
      .set({ department: toDepartment })
      .where(eq(admissions.id, admissionId));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create transfer error:", error);
    return NextResponse.json(
      { error: "Error al crear traslado" },
      { status: 500 }
    );
  }
}
