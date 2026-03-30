import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
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
  const { invoices, patients, users } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (patientId) {
    const patientInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.patientId, parseInt(patientId)))
      .orderBy(desc(invoices.createdAt));
    return NextResponse.json(patientInvoices);
  }

  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      patientId: invoices.patientId,
      admissionId: invoices.admissionId,
      transferId: invoices.transferId,
      cupsCode: invoices.cupsCode,
      cupsDescription: invoices.cupsDescription,
      diagnosis: invoices.diagnosis,
      subtotal: invoices.subtotal,
      tax: invoices.tax,
      total: invoices.total,
      status: invoices.status,
      paymentMethod: invoices.paymentMethod,
      insuranceCompany: invoices.insuranceCompany,
      authorizationNumber: invoices.authorizationNumber,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      paidAt: invoices.paidAt,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDocumentId: patients.documentId,
      createdByName: users.fullName,
    })
    .from(invoices)
    .leftJoin(patients, eq(invoices.patientId, patients.id))
    .leftJoin(users, eq(invoices.createdBy, users.id))
    .orderBy(desc(invoices.createdAt));

  return NextResponse.json(allInvoices);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { invoices } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { patientId, admissionId, transferId, cupsCode, cupsDescription, diagnosis, subtotal, tax, total, paymentMethod, insuranceCompany, authorizationNumber, notes } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Paciente es requerido" }, { status: 400 });
    }

    const invoiceCount = await db.select().from(invoices);
    const invoiceNumber = `FAC-${String(invoiceCount.length + 1).padStart(6, "0")}`;

    await db.insert(invoices).values({
      invoiceNumber,
      patientId,
      admissionId: admissionId || null,
      transferId: transferId || null,
      createdBy: session.userId,
      cupsCode: cupsCode || null,
      cupsDescription: cupsDescription || null,
      diagnosis: diagnosis || null,
      subtotal: subtotal || "0",
      tax: tax || "0",
      total: total || "0",
      paymentMethod: paymentMethod || null,
      insuranceCompany: insuranceCompany || null,
      authorizationNumber: authorizationNumber || null,
      notes: notes || null,
      status: "pendiente",
    });

    return NextResponse.json({ success: true, invoiceNumber }, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { invoices } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status, paymentMethod, paidAt } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (status === "pagada") updateData.paidAt = new Date();

    await db.update(invoices).set(updateData).where(eq(invoices.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 });
  }
}
