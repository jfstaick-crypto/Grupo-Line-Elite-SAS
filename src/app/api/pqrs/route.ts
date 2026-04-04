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

interface PqrsRow {
  status: string;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { getDb } = await import("@/db");
  const { pqrs, users } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  let filters = [];
  if (status) filters.push(eq(pqrs.status, status));
  if (type) filters.push(eq(pqrs.type, type));

  const allPqrs = await db.select({
    id: pqrs.id,
    type: pqrs.type,
    category: pqrs.category,
    priority: pqrs.priority,
    patientDocumentId: pqrs.patientDocumentId,
    patientName: pqrs.patientName,
    patientPhone: pqrs.patientPhone,
    patientEmail: pqrs.patientEmail,
    subject: pqrs.subject,
    description: pqrs.description,
    relatedModule: pqrs.relatedModule,
    relatedId: pqrs.relatedId,
    status: pqrs.status,
    assignedTo: pqrs.assignedTo,
    response: pqrs.response,
    responseDate: pqrs.responseDate,
    closureDate: pqrs.closureDate,
    createdAt: pqrs.createdAt,
    updatedAt: pqrs.updatedAt,
  }).from(pqrs).where(filters.length > 0 ? eq(pqrs.status, status as string) : undefined).orderBy(desc(pqrs.createdAt));

  const summary = {
    total: allPqrs.length,
    recibidos: allPqrs.filter((p: PqrsRow) => p.status === "recibido").length,
    en_proceso: allPqrs.filter((p: PqrsRow) => p.status === "en_proceso").length,
    respondidos: allPqrs.filter((p: PqrsRow) => p.status === "respondido").length,
    cerrados: allPqrs.filter((p: PqrsRow) => p.status === "cerrado").length,
  };

  return NextResponse.json({ pqrs: allPqrs, summary });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { pqrs } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { type, category, priority, patientDocumentId, patientName, patientPhone, patientEmail, subject, description, relatedModule, relatedId } = body;

    if (!type || !category || !subject || !description) {
      return NextResponse.json({ error: "Tipo, categoría, asunto y descripción son requeridos" }, { status: 400 });
    }

    const newPqrs = await db.insert(pqrs).values({
      type, category, priority: priority || "normal",
      patientDocumentId: patientDocumentId || null,
      patientName: patientName || null,
      patientPhone: patientPhone || null,
      patientEmail: patientEmail || null,
      subject, description,
      relatedModule: relatedModule || null,
      relatedId: relatedId || null,
      status: "recibido",
    }).returning({ id: pqrs.id });

    return NextResponse.json({ success: true, id: newPqrs[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create PQRS error:", error);
    return NextResponse.json({ error: "Error al crear PQRS" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { pqrs } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status, assignedTo, response } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      updateData.status = status;
      if (status === "respondido") {
        updateData.responseDate = new Date();
        if (response) updateData.response = response;
      }
      if (status === "cerrado") updateData.closureDate = new Date();
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (response !== undefined) updateData.response = response;

    await db.update(pqrs).set(updateData).where(eq(pqrs.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update PQRS error:", error);
    return NextResponse.json({ error: "Error al actualizar PQRS" }, { status: 500 });
  }
}