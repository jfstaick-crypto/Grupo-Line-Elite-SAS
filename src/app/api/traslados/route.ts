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
  if (!session || !hasPermission(session.role, "traslados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { db } = await import("@/db");
  const { transfers, patients, users } = await import("@/db/schema");

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
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "traslados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { db } = await import("@/db");
    const { transfers, admissions } = await import("@/db/schema");

    const body = await request.json();
    const { admissionId, patientId, fromDepartment, toDepartment, reason } =
      body;

    if (
      !admissionId ||
      !patientId ||
      !fromDepartment ||
      !toDepartment ||
      !reason
    ) {
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
