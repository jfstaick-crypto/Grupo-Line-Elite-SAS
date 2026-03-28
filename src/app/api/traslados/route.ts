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

  const { getDb } = await import("@/db");
  const { transfers, patients, users } = await import("@/db/schema");
  const db = getDb();

  const allTransfers = await db
    .select({
      id: transfers.id,
      admissionId: transfers.admissionId,
      patientId: transfers.patientId,
      authorizationNumber: transfers.authorizationNumber,
      diagnosis: transfers.diagnosis,
      originCity: transfers.originCity,
      originInstitution: transfers.originInstitution,
      destinationCity: transfers.destinationCity,
      destinationInstitution: transfers.destinationInstitution,
      ambulancePlate: transfers.ambulancePlate,
      requestDate: transfers.requestDate,
      responsibleEntity: transfers.responsibleEntity,
      driverName: transfers.driverName,
      auxiliaryName: transfers.auxiliaryName,
      doctorName: transfers.doctorName,
      value: transfers.value,
      status: transfers.status,
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
    const { getDb } = await import("@/db");
    const { transfers } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { admissionId, patientId } = body;

    if (!admissionId || !patientId) {
      return NextResponse.json(
        { error: "Admisión y paciente son requeridos" },
        { status: 400 }
      );
    }

    await db.insert(transfers).values({
      admissionId,
      patientId,
      transferredBy: session.userId,
      authorizationNumber: body.authorizationNumber || null,
      diagnosis: body.diagnosis || null,
      originCity: body.originCity || null,
      originInstitution: body.originInstitution || null,
      originPhone: body.originPhone || null,
      destinationCity: body.destinationCity || null,
      destinationInstitution: body.destinationInstitution || null,
      destinationPhone: body.destinationPhone || null,
      ambulancePlate: body.ambulancePlate || null,
      tam: body.tam || null,
      tab: body.tab || null,
      requestDate: body.requestDate || null,
      responsibleEntity: body.responsibleEntity || null,
      callTime: body.callTime || null,
      promiseTime: body.promiseTime || null,
      originDepartureCity: body.originDepartureCity || null,
      pickupLocation: body.pickupLocation || null,
      arrivalIpsOriginTime: body.arrivalIpsOriginTime || null,
      pickupDate: body.pickupDate || null,
      pickupTime: body.pickupTime || null,
      destinationCityArrival: body.destinationCityArrival || null,
      destinationLocation: body.destinationLocation || null,
      arrivalIpsDestinationTime: body.arrivalIpsDestinationTime || null,
      deliveryDate: body.deliveryDate || null,
      deliveryTime: body.deliveryTime || null,
      returnDate: body.returnDate || null,
      returnTime: body.returnTime || null,
      driverName: body.driverName || null,
      auxiliaryName: body.auxiliaryName || null,
      auxiliaryDocument: body.auxiliaryDocument || null,
      doctorName: body.doctorName || null,
      doctorDocument: body.doctorDocument || null,
      cupsCode: body.cupsCode || null,
      cupsDescription: body.cupsDescription || null,
      value: body.value || null,
      status: body.status || "pendiente",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create transfer error:", error);
    return NextResponse.json(
      { error: "Error al crear traslado" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || !hasPermission(session.role, "traslados")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { transfers } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    await db.update(transfers).set(updateData).where(eq(transfers.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update transfer error:", error);
    return NextResponse.json(
      { error: "Error al actualizar traslado" },
      { status: 500 }
    );
  }
}
