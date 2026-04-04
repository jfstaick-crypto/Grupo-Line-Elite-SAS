import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { unsealData } from "iron-session";

export const dynamic = "force-dynamic";

const SESSION_PASSWORD = "complex_password_at_least_32_characters_long_for_security";

async function getSessionFromRequest(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)si=([^;]*)/);
    if (!match) return null;
    return await unsealData<{ userId: number; username: string; fullName: string; role: string }>(
      decodeURIComponent(match[1]), { password: SESSION_PASSWORD }
    );
  } catch { return null; }
}

interface Ambulance {
  id: number;
  plate: string;
  status: string;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { getDb } = await import("@/db");
  const { ambulances } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const filter = status ? eq(ambulances.status, status) : undefined;
  const allAmbulances = await db.select().from(ambulances).where(filter).orderBy(desc(ambulances.plate));

  const summary = {
    total: allAmbulances.length,
    disponibles: allAmbulances.filter((a: Ambulance) => a.status === "disponible").length,
    en_servicio: allAmbulances.filter((a: Ambulance) => a.status === "en_servicio").length,
    mantenimiento: allAmbulances.filter((a: Ambulance) => a.status === "mantenimiento").length,
    fuera_servicio: allAmbulances.filter((a: Ambulance) => a.status === "fuera_servicio").length,
  };

  return NextResponse.json({ ambulances: allAmbulances, summary });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { ambulances } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { plate, brand, model, type, year, vin, engineNumber, soatNumber, soatExpiration, rtmcNumber, rtmcExpiration, habilitacionNumber, habilitacionExpiration, licensePlate, licenseExpiration, insuranceCompany, policyNumber, insuranceExpiration, equipmentKit, observations } = body;

    if (!plate || !brand || !model || !type) {
      return NextResponse.json({ error: "Placa, marca, modelo y tipo son requeridos" }, { status: 400 });
    }

    const newAmbulance = await db.insert(ambulances).values({
      plate, brand, model, type, year: year || null,
      vin: vin || null, engineNumber: engineNumber || null,
      soatNumber: soatNumber || null, soatExpiration: soatExpiration ? new Date(soatExpiration) : null,
      rtmcNumber: rtmcNumber || null, rtmcExpiration: rtmcExpiration ? new Date(rtmcExpiration) : null,
      habilitacionNumber: habilitacionNumber || null, habilitacionExpiration: habilitacionExpiration ? new Date(habilitacionExpiration) : null,
      licensePlate: licensePlate || null, licenseExpiration: licenseExpiration ? new Date(licenseExpiration) : null,
      insuranceCompany: insuranceCompany || null, policyNumber: policyNumber || null,
      insuranceExpiration: insuranceExpiration ? new Date(insuranceExpiration) : null,
      equipmentKit: equipmentKit || null, observations: observations || null,
      status: "disponible",
    }).returning({ id: ambulances.id });

    return NextResponse.json({ success: true, id: newAmbulance[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create ambulance error:", error);
    return NextResponse.json({ error: "Error al crear ambulancia" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { ambulances } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status, currentKm, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (currentKm !== undefined) updateData.currentKm = currentKm;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== "id") {
        updateData[key] = updates[key];
      }
    });

    await db.update(ambulances).set(updateData).where(eq(ambulances.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update ambulance error:", error);
    return NextResponse.json({ error: "Error al actualizar ambulancia" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { ambulances } = await import("@/db/schema");
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    await db.delete(ambulances).where(eq(ambulances.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete ambulance error:", error);
    return NextResponse.json({ error: "Error al eliminar ambulancia" }, { status: 500 });
  }
}