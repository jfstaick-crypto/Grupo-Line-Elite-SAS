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
  if (!session || !hasPermission(session.role, "admision")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { db } = await import("@/db");
  const { admissions, patients, users } = await import("@/db/schema");

  const allAdmissions = await db
    .select({
      id: admissions.id,
      patientId: admissions.patientId,
      reason: admissions.reason,
      department: admissions.department,
      bed: admissions.bed,
      status: admissions.status,
      admissionDate: admissions.admissionDate,
      dischargeDate: admissions.dischargeDate,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDocumentId: patients.documentId,
      admittedByName: users.fullName,
    })
    .from(admissions)
    .leftJoin(patients, eq(admissions.patientId, patients.id))
    .leftJoin(users, eq(admissions.admittedBy, users.id));

  return NextResponse.json(allAdmissions);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "admision")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { db } = await import("@/db");
    const { admissions } = await import("@/db/schema");

    const body = await request.json();
    const { patientId, reason, department, bed } = body;

    if (!patientId || !reason || !department) {
      return NextResponse.json(
        { error: "Paciente, razón y departamento son requeridos" },
        { status: 400 }
      );
    }

    await db.insert(admissions).values({
      patientId,
      admittedBy: session.userId,
      reason,
      department,
      bed: bed || null,
      status: "activa",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create admission error:", error);
    return NextResponse.json(
      { error: "Error al crear admisión" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "admision")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { db } = await import("@/db");
    const { admissions } = await import("@/db/schema");

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "cerrada") {
        updateData.dischargeDate = new Date();
      }
    }

    await db.update(admissions).set(updateData).where(eq(admissions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update admission error:", error);
    return NextResponse.json(
      { error: "Error al actualizar admisión" },
      { status: 500 }
    );
  }
}
