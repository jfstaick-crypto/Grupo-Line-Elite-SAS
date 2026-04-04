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

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { getDb } = await import("@/db");
  const { informedConsents, patients } = await import("@/db/schema");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  const filter = patientId ? eq(informedConsents.patientId, parseInt(patientId)) : undefined;
  const allConsents = await db.select({
    id: informedConsents.id,
    patientId: informedConsents.patientId,
    transferId: informedConsents.transferId,
    consentType: informedConsents.consentType,
    documentType: informedConsents.documentType,
    documentId: informedConsents.documentId,
    patientFullName: informedConsents.patientFullName,
    representativeName: informedConsents.representativeName,
    relationship: informedConsents.relationship,
    procedure: informedConsents.procedure,
    authorization: informedConsents.authorization,
    signedAt: informedConsents.signedAt,
    professionalName: informedConsents.professionalName,
    observations: informedConsents.observations,
    createdAt: informedConsents.createdAt,
  }).from(informedConsents).where(filter).orderBy(desc(informedConsents.createdAt));

  return NextResponse.json({ consents: allConsents });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { getDb } = await import("@/db");
    const { informedConsents } = await import("@/db/schema");
    const db = getDb();

    const body = await request.json();
    const { patientId, transferId, consentType, documentType, documentId, patientFullName, representativeName, representativeDocument, relationship, procedure, risks, benefits, alternatives, authorization, signatureData, witness1Name, witness1Document, witness2Name, witness2Document, professionalName, professionalDocument, professionalLicense, professionalSignature, observations } = body;

    if (!patientId || !consentType || !documentType || !documentId || !patientFullName || !procedure) {
      return NextResponse.json({ error: "Paciente, tipo de consentimiento, documento, nombre y procedimiento son requeridos" }, { status: 400 });
    }

    const newConsent = await db.insert(informedConsents).values({
      patientId,
      transferId: transferId || null,
      consentType,
      documentType,
      documentId,
      patientFullName,
      representativeName: representativeName || null,
      representativeDocument: representativeDocument || null,
      relationship: relationship || null,
      procedure,
      risks: risks || null,
      benefits: benefits || null,
      alternatives: alternatives || null,
      authorization: authorization || false,
      signatureData: signatureData || null,
      signedAt: authorization ? new Date() : null,
      witness1Name: witness1Name || null,
      witness1Document: witness1Document || null,
      witness2Name: witness2Name || null,
      witness2Document: witness2Document || null,
      professionalName: professionalName || null,
      professionalDocument: professionalDocument || null,
      professionalLicense: professionalLicense || null,
      professionalSignature: professionalSignature || null,
      observations: observations || null,
    }).returning({ id: informedConsents.id });

    return NextResponse.json({ success: true, id: newConsent[0]?.id }, { status: 201 });
  } catch (error) {
    console.error("Create consent error:", error);
    return NextResponse.json({ error: "Error al crear consentimiento" }, { status: 500 });
  }
}