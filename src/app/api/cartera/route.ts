import { NextResponse } from "next/server";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
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

function calculateAgingBucket(dueDate: Date | null, firstBillingDate: Date | null): { days: number; bucket: string } {
  const now = new Date();
  const referenceDate = dueDate || firstBillingDate || now;
  const diffTime = now.getTime() - referenceDate.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let bucket = "corriente";
  if (days <= 0) bucket = "corriente";
  else if (days <= 30) bucket = "1_30";
  else if (days <= 60) bucket = "31_60";
  else if (days <= 90) bucket = "61_90";
  else if (days <= 180) bucket = "91_180";
  else if (days <= 360) bucket = "181_360";
  else bucket = "mas_360";
  
  return { days, bucket };
}

function getBucketLabel(bucket: string): string {
  const labels: Record<string, string> = {
    corriente: "Corriente",
    "1_30": "1-30 días",
    "31_60": "31-60 días",
    "61_90": "61-90 días",
    "91_180": "91-180 días",
    "181_360": "181-360 días",
    "mas_360": ">360 días",
  };
  return labels[bucket] || bucket;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    parcial: "Parcial",
    pagada: "Pagada",
    cobro_judicial: "Cobro Judicial",
    castigada: "Castigada",
    negociada: "Negociada",
  };
  return labels[status] || status;
}

interface ReceivableRow {
  id: number;
  invoiceId: number;
  patientId: number;
  documentId: string;
  patientName: string;
  insuranceCompany: string | null;
  contractNumber: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  agingDays: number;
  agingBucket: string;
  status: string;
  dueDate: Date | null;
  firstBillingDate: Date | null;
  lastPaymentDate: Date | null;
  paymentCount: number;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { getDb } = await import("@/db");
  const { accountsReceivable, patients: patientsTable, invoices } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket");
  const status = searchParams.get("status");

  let filters = [];
  if (bucket) filters.push(eq(accountsReceivable.agingBucket, bucket));
  if (status) filters.push(eq(accountsReceivable.status, status));

  const allReceivables = await db
    .select({
      id: accountsReceivable.id,
      invoiceId: accountsReceivable.invoiceId,
      patientId: accountsReceivable.patientId,
      documentId: accountsReceivable.documentId,
      patientName: accountsReceivable.patientName,
      insuranceCompany: accountsReceivable.insuranceCompany,
      contractNumber: accountsReceivable.contractNumber,
      totalAmount: accountsReceivable.totalAmount,
      paidAmount: accountsReceivable.paidAmount,
      pendingAmount: accountsReceivable.pendingAmount,
      agingDays: accountsReceivable.agingDays,
      agingBucket: accountsReceivable.agingBucket,
      status: accountsReceivable.status,
      dueDate: accountsReceivable.dueDate,
      firstBillingDate: accountsReceivable.firstBillingDate,
      lastPaymentDate: accountsReceivable.lastPaymentDate,
      paymentCount: accountsReceivable.paymentCount,
      observations: accountsReceivable.observations,
      createdAt: accountsReceivable.createdAt,
      updatedAt: accountsReceivable.updatedAt,
    })
    .from(accountsReceivable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(accountsReceivable.createdAt));

  const enrichedReceivables = allReceivables.map((r: ReceivableRow) => ({
    ...r,
    agingBucketLabel: getBucketLabel(r.agingBucket),
    statusLabel: getStatusLabel(r.status),
  }));

  const summary = {
    total: enrichedReceivables.length,
    totalAmount: enrichedReceivables.reduce((sum: number, r: ReceivableRow) => sum + parseFloat(r.totalAmount || "0"), 0),
    totalPending: enrichedReceivables.reduce((sum: number, r: ReceivableRow) => sum + parseFloat(r.pendingAmount || "0"), 0),
    totalPaid: enrichedReceivables.reduce((sum: number, r: ReceivableRow) => sum + parseFloat(r.paidAmount || "0"), 0),
    byBucket: {} as Record<string, { count: number; amount: number }>,
    byStatus: {} as Record<string, { count: number; amount: number }>,
    byInsurance: {} as Record<string, { count: number; amount: number }>,
  };

  enrichedReceivables.forEach((r: ReceivableRow) => {
    const bucketLabel = getBucketLabel(r.agingBucket);
    if (!summary.byBucket[bucketLabel]) summary.byBucket[bucketLabel] = { count: 0, amount: 0 };
    summary.byBucket[bucketLabel].count++;
    summary.byBucket[bucketLabel].amount += parseFloat(r.pendingAmount || "0");

    const statusLabel = getStatusLabel(r.status);
    if (!summary.byStatus[statusLabel]) summary.byStatus[statusLabel] = { count: 0, amount: 0 };
    summary.byStatus[statusLabel].count++;
    summary.byStatus[statusLabel].amount += parseFloat(r.pendingAmount || "0");

    const ins = r.insuranceCompany || "Particular";
    if (!summary.byInsurance[ins]) summary.byInsurance[ins] = { count: 0, amount: 0 };
    summary.byInsurance[ins].count++;
    summary.byInsurance[ins].amount += parseFloat(r.pendingAmount || "0");
  });

  return NextResponse.json({ receivables: enrichedReceivables, summary });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { accountsReceivable, invoices, patients: patientsTable } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { invoiceId, patientId, observations } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Factura es requerida" }, { status: 400 });
    }

    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice.length) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const inv = invoice[0];
    const patient = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, inv.patientId))
      .limit(1);

    const firstBillingDate = inv.createdAt;
    const dueDate = inv.dueDate || new Date(firstBillingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { days, bucket } = calculateAgingBucket(dueDate, firstBillingDate);

    const newReceivable = await db.insert(accountsReceivable).values({
      invoiceId,
      patientId: inv.patientId,
      documentId: patient.length ? patient[0].documentId : "",
      patientName: patient.length ? `${patient[0].firstName} ${patient[0].lastName}` : "",
      insuranceCompany: inv.insuranceCompany,
      contractNumber: inv.contractNumber,
      totalAmount: inv.total,
      paidAmount: "0",
      pendingAmount: inv.total,
      agingDays: days,
      agingBucket: bucket,
      status: "pendiente",
      dueDate: dueDate,
      firstBillingDate: firstBillingDate,
      paymentCount: 0,
      observations: observations || null,
    }).returning({ id: accountsReceivable.id });

    return NextResponse.json({ success: true, id: newReceivable[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create receivable error:", error);
    return NextResponse.json({ error: "Error al crear cartera" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { accountsReceivable } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { id, status, observations } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (status) updateData.status = status;
    if (observations !== undefined) updateData.observations = observations;

    await db.update(accountsReceivable).set(updateData).where(eq(accountsReceivable.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update receivable error:", error);
    return NextResponse.json({ error: "Error al actualizar cartera" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { accountsReceivable } = await import("@/db/schema");
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    await db.delete(accountsReceivable).where(eq(accountsReceivable.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete receivable error:", error);
    return NextResponse.json({ error: "Error al eliminar cartera" }, { status: 500 });
  }
}