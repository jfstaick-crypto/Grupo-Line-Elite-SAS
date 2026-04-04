import { NextResponse } from "next/server";
import { eq, desc, and, gte, lte } from "drizzle-orm";
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

interface ScheduleRow {
  status: string;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { getDb } = await import("@/db");
  const { schedules, ambulances, users } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const scheduleType = searchParams.get("type");

  let allSchedules = await db.select({
    id: schedules.id,
    scheduleType: schedules.scheduleType,
    title: schedules.title,
    description: schedules.description,
    startDate: schedules.startDate,
    endDate: schedules.endDate,
    allDay: schedules.allDay,
    recurrence: schedules.recurrence,
    ambulanceId: schedules.ambulanceId,
    assignedUserId: schedules.assignedUserId,
    relatedModule: schedules.relatedModule,
    relatedId: schedules.relatedId,
    status: schedules.status,
    reminderDate: schedules.reminderDate,
    observations: schedules.observations,
    createdAt: schedules.createdAt,
  }).from(schedules).orderBy(desc(schedules.startDate));

  const summary = {
    total: allSchedules.length,
    programados: allSchedules.filter((s: ScheduleRow) => s.status === "programado").length,
    en_curso: allSchedules.filter((s: ScheduleRow) => s.status === "en_curso").length,
    completados: allSchedules.filter((s: ScheduleRow) => s.status === "completado").length,
    cancelados: allSchedules.filter((s: ScheduleRow) => s.status === "cancelado").length,
  };

  return NextResponse.json({ schedules: allSchedules, summary });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { schedules } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { scheduleType, title, description, startDate, endDate, allDay, recurrence, ambulanceId, assignedUserId, relatedModule, relatedId, reminderDate, observations } = body;

    if (!scheduleType || !title || !startDate) {
      return NextResponse.json({ error: "Tipo, título y fecha de inicio son requeridos" }, { status: 400 });
    }

    const newSchedule = await db.insert(schedules).values({
      scheduleType,
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay !== false,
      recurrence: recurrence || null,
      ambulanceId: ambulanceId || null,
      assignedUserId: assignedUserId || null,
      relatedModule: relatedModule || null,
      relatedId: relatedId || null,
      reminderDate: reminderDate ? new Date(reminderDate) : null,
      observations: observations || null,
      createdBy: session.userId,
      status: "programado",
    }).returning({ id: schedules.id });

    return NextResponse.json({ success: true, id: newSchedule[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    return NextResponse.json({ error: "Error al crear agenda" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { schedules } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;

    await db.update(schedules).set(updateData).where(eq(schedules.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: "Error al actualizar agenda" }, { status: 500 });
  }
}