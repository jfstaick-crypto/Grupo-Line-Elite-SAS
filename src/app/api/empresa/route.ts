import { NextResponse } from "next/server";
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

  const { getDb } = await import("@/db");
  const { companySettings } = await import("@/db/schema");
  const db = getDb();

  const settings = await db.select().from(companySettings).limit(1);
  if (settings.length === 0) {
    return NextResponse.json({
      name: "",
      nit: "",
      habilitacionCode: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      city: "",
      logo: null,
    });
  }

  return NextResponse.json(settings[0]);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "administrador") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  try {
    const { getDb } = await import("@/db");
    const { companySettings } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const existing = await db.select().from(companySettings).limit(1);

    const data = {
      name: body.name || "",
      nit: body.nit || "",
      habilitacionCode: body.habilitacionCode || "",
      address: body.address || "",
      phone: body.phone || "",
      email: body.email || "",
      website: body.website || "",
      city: body.city || "",
      logo: body.logo || null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(companySettings).set(data);
    } else {
      await db.insert(companySettings).values(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
