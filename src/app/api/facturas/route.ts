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
      invoicePrefix: invoices.invoicePrefix,
      invoiceType: invoices.invoiceType,
      patientId: invoices.patientId,
      admissionId: invoices.admissionId,
      transferId: invoices.transferId,
      diagnosisCode: invoices.diagnosisCode,
      diagnosis: invoices.diagnosis,
      contractNumber: invoices.contractNumber,
      paymentModality: invoices.paymentModality,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      discount: invoices.discount,
      tax: invoices.tax,
      total: invoices.total,
      status: invoices.status,
      paymentMethod: invoices.paymentMethod,
      paymentMethodCode: invoices.paymentMethodCode,
      insuranceCompany: invoices.insuranceCompany,
      authorizationNumber: invoices.authorizationNumber,
      notes: invoices.notes,
      dueDate: invoices.dueDate,
      cufe: invoices.cufe,
      cuv: invoices.cuv,
      dianStatus: invoices.dianStatus,
      ripsStatus: invoices.ripsStatus,
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
    const {
      patientId, admissionId, transferId,
      diagnosisCode, diagnosis,
      contractNumber, paymentModality, benefitPlan,
      currency, subtotal, discount, tax, total,
      paymentMethod, paymentMethodCode,
      insuranceCompany, authorizationNumber,
      notes, invoiceType, dueDate,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Paciente es requerido" }, { status: 400 });
    }

    const invoiceCount = await db.select().from(invoices);
    const invoiceNumber = `FE-${String(invoiceCount.length + 1).padStart(6, "0")}`;

    const newInvoice = await db.insert(invoices).values({
      invoiceNumber,
      invoicePrefix: "FE",
      invoiceType: invoiceType || "01",
      patientId,
      admissionId: admissionId || null,
      transferId: transferId || null,
      createdBy: session.userId,
      diagnosisCode: diagnosisCode || null,
      diagnosis: diagnosis || null,
      contractNumber: contractNumber || null,
      paymentModality: paymentModality || null,
      benefitPlan: benefitPlan || null,
      currency: currency || "COP",
      subtotal: subtotal || "0",
      discount: discount || "0",
      tax: tax || "0",
      total: total || "0",
      paymentMethod: paymentMethod || null,
      paymentMethodCode: paymentMethodCode || null,
      insuranceCompany: insuranceCompany || null,
      authorizationNumber: authorizationNumber || null,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pendiente",
    }).returning({ id: invoices.id });

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
