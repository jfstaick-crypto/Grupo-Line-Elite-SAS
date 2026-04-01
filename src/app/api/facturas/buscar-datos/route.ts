import { NextResponse } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { unsealData } from "iron-session";

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

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");

  if (!patientId || !date) {
    return NextResponse.json(
      { error: "patientId y date son requeridos" },
      { status: 400 }
    );
  }

  try {
    const { getDb } = await import("@/db");
    const { clinicalHistories, transfers, admissions } = await import(
      "@/db/schema"
    );
    const db = getDb();

    const targetDate = new Date(date);
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59
    );

    const pid = parseInt(patientId);

    const histories = await db
      .select({
        id: clinicalHistories.id,
        hcCode: clinicalHistories.hcCode,
        diagnosis: clinicalHistories.diagnosis,
        symptoms: clinicalHistories.symptoms,
        treatment: clinicalHistories.treatment,
        admissionId: clinicalHistories.admissionId,
        createdAt: clinicalHistories.createdAt,
      })
      .from(clinicalHistories)
      .where(
        and(
          eq(clinicalHistories.patientId, pid),
          gte(clinicalHistories.createdAt, startOfDay),
          lte(clinicalHistories.createdAt, endOfDay)
        )
      );

    const patientTransfers = await db
      .select({
        id: transfers.id,
        cupsCode: transfers.cupsCode,
        cupsDescription: transfers.cupsDescription,
        diagnosis: transfers.diagnosis,
        value: transfers.value,
        authorizationNumber: transfers.authorizationNumber,
        responsibleEntity: transfers.responsibleEntity,
        transferDate: transfers.transferDate,
      })
      .from(transfers)
      .where(
        and(
          eq(transfers.patientId, pid),
          gte(transfers.transferDate, startOfDay),
          lte(transfers.transferDate, endOfDay)
        )
      );

    return NextResponse.json({ histories, transfers: patientTransfers });
  } catch (error) {
    console.error("Buscar datos factura error:", error);
    return NextResponse.json(
      { error: "Error al buscar datos" },
      { status: 500 }
    );
  }
}
