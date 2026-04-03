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
  const { payments, accountsReceivable, users } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const receivableId = searchParams.get("receivableId");

  if (receivableId) {
    const receivablePayments = await db
      .select({
        id: payments.id,
        accountReceivableId: payments.accountReceivableId,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentMethodCode: payments.paymentMethodCode,
        referenceNumber: payments.referenceNumber,
        bankName: payments.bankName,
        paymentDate: payments.paymentDate,
        collectedBy: payments.collectedBy,
        observations: payments.observations,
        createdAt: payments.createdAt,
        collectorName: users.fullName,
      })
      .from(payments)
      .leftJoin(users, eq(payments.collectedBy, users.id))
      .where(eq(payments.accountReceivableId, parseInt(receivableId)))
      .orderBy(desc(payments.paymentDate));
    return NextResponse.json(receivablePayments);
  }

  const allPayments = await db
    .select({
      id: payments.id,
      accountReceivableId: payments.accountReceivableId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentMethodCode: payments.paymentMethodCode,
      referenceNumber: payments.referenceNumber,
      bankName: payments.bankName,
      paymentDate: payments.paymentDate,
      collectedBy: payments.collectedBy,
      observations: payments.observations,
      createdAt: payments.createdAt,
      collectorName: users.fullName,
      patientName: accountsReceivable.patientName,
      documentId: accountsReceivable.documentId,
    })
    .from(payments)
    .leftJoin(users, eq(payments.collectedBy, users.id))
    .leftJoin(accountsReceivable, eq(payments.accountReceivableId, accountsReceivable.id))
    .orderBy(desc(payments.paymentDate));

  return NextResponse.json(allPayments);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { payments, accountsReceivable } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const {
      accountReceivableId,
      invoiceId,
      amount,
      paymentMethod,
      paymentMethodCode,
      referenceNumber,
      bankName,
      paymentDate,
      observations,
    } = body;

    if (!accountReceivableId || !amount) {
      return NextResponse.json({ error: "Cartera y monto son requeridos" }, { status: 400 });
    }

    const receivable = await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.id, accountReceivableId))
      .limit(1);

    if (!receivable.length) {
      return NextResponse.json({ error: "Cartera no encontrada" }, { status: 404 });
    }

    const rec = receivable[0];
    const paymentAmount = parseFloat(amount);
    const newPaidAmount = parseFloat(rec.paidAmount || "0") + paymentAmount;
    const newPendingAmount = parseFloat(rec.totalAmount || "0") - newPaidAmount;

    let newStatus = rec.status;
    if (newPendingAmount <= 0) {
      newStatus = "pagada";
    } else if (newPaidAmount > 0) {
      newStatus = "parcial";
    }

    const paymentDateValue = paymentDate ? new Date(paymentDate) : new Date();

    const newPayment = await db.insert(payments).values({
      accountReceivableId,
      invoiceId: invoiceId || null,
      amount: String(paymentAmount),
      paymentMethod: paymentMethod || null,
      paymentMethodCode: paymentMethodCode || null,
      referenceNumber: referenceNumber || null,
      bankName: bankName || null,
      paymentDate: paymentDateValue,
      collectedBy: session.userId,
      observations: observations || null,
    }).returning({ id: payments.id });

    await db.update(accountsReceivable).set({
      paidAmount: String(newPaidAmount),
      pendingAmount: String(Math.max(0, newPendingAmount)),
      status: newStatus,
      lastPaymentDate: paymentDateValue,
      paymentCount: (rec.paymentCount || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(accountsReceivable.id, accountReceivableId));

    return NextResponse.json({ success: true, id: newPayment[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { payments, accountsReceivable } = await import("@/db/schema");
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.id, parseInt(id)))
      .limit(1);

    if (!payment.length) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const p = payment[0];
    const receivable = await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.id, p.accountReceivableId))
      .limit(1);

    if (receivable.length) {
      const rec = receivable[0];
      const newPaidAmount = parseFloat(rec.paidAmount || "0") - parseFloat(p.amount || "0");
      const newPendingAmount = parseFloat(rec.totalAmount || "0") - newPaidAmount;

      let newStatus = "pendiente";
      if (newPendingAmount <= 0) newStatus = "pagada";
      else if (newPaidAmount > 0) newStatus = "parcial";

      await db.update(accountsReceivable).set({
        paidAmount: String(Math.max(0, newPaidAmount)),
        pendingAmount: String(Math.max(0, newPendingAmount)),
        status: newStatus,
        paymentCount: Math.max(0, (rec.paymentCount || 0) - 1),
        updatedAt: new Date(),
      }).where(eq(accountsReceivable.id, p.accountReceivableId));
    }

    await db.delete(payments).where(eq(payments.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Error al eliminar pago" }, { status: 500 });
  }
}