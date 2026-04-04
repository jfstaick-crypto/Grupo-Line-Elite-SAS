import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
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

interface IncidentRow {
  status: string;
  severity: string;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { getDb } = await import("@/db");
  const { incidents } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");

  const filter = status ? eq(incidents.status, status) : undefined;
  const allIncidents = await db.select().from(incidents).where(filter).orderBy(desc(incidents.incidentDate));

  const summary = {
    total: allIncidents.length,
    en_investigacion: allIncidents.filter((i: IncidentRow) => i.status === "en_investigacion").length,
    pendiente_accion: allIncidents.filter((i: IncidentRow) => i.status === "pendiente_accion").length,
    cerrado: allIncidents.filter((i: IncidentRow) => i.status === "cerrado").length,
    criticos: allIncidents.filter((i: IncidentRow) => i.severity === "critico").length,
    graves: allIncidents.filter((i: IncidentRow) => i.severity === "grave").length,
    leves: allIncidents.filter((i: IncidentRow) => i.severity === "leve").length,
  };

  return NextResponse.json({ incidents: allIncidents, summary });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { incidents } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { incidentType, severity, incidentDate, location, transferId, patientId, patientName, ambulancePlate, involvedUsers, description, causes, consequences, immediateActions, recommendations } = body;

    if (!incidentType || !severity || !description) {
      return NextResponse.json({ error: "Tipo, severidad y descripción son requeridos" }, { status: 400 });
    }

    const newIncident = await db.insert(incidents).values({
      incidentType,
      severity,
      incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
      location: location || null,
      transferId: transferId || null,
      patientId: patientId || null,
      patientName: patientName || null,
      ambulancePlate: ambulancePlate || null,
      involvedUsers: involvedUsers || null,
      description,
      causes: causes || null,
      consequences: consequences || null,
      immediateActions: immediateActions || null,
      recommendations: recommendations || null,
      reportedBy: session.userId,
      status: "en_investigacion",
    }).returning({ id: incidents.id });

    return NextResponse.json({ success: true, id: newIncident[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create incident error:", error);
    return NextResponse.json({ error: "Error al crear incidente" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { incidents } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status, investigationReport, closureDate } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      updateData.status = status;
      if (status === "cerrado") {
        updateData.closureDate = new Date();
      }
    }
    if (investigationReport !== undefined) updateData.investigationReport = investigationReport;

    await db.update(incidents).set(updateData).where(eq(incidents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update incident error:", error);
    return NextResponse.json({ error: "Error al actualizar incidente" }, { status: 500 });
  }
}