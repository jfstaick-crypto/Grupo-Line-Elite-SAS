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
  const { patients } = await import("@/db/schema");
  const { eq, like } = await import("drizzle-orm");
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (documentId) {
    const found = await db
      .select()
      .from(patients)
      .where(eq(patients.documentId, documentId))
      .limit(1);
    return NextResponse.json(found.length > 0 ? found[0] : null);
  }

  const search = searchParams.get("search");
  if (search) {
    const found = await db
      .select()
      .from(patients)
      .where(like(patients.documentId, `%${search}%`));
    return NextResponse.json(found);
  }

  const allPatients = await db.select().from(patients);
  return NextResponse.json(allPatients);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { getDb } = await import("@/db");
    const { patients } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();

    const body = await request.json();
    const {
      documentType,
      documentId,
      firstName,
      middleName,
      lastName,
      secondLastName,
      birthDate,
      gender,
      maritalStatus,
      address,
      city,
      locality,
      daneCode,
      municipality,
      municipalityDaneCode,
      neighborhood,
      phone,
      insurance,
      regime,
      occupation,
      country,
      countryCode,
      birthCountry,
      birthCountryCode,
      birthDepartment,
      birthDepartmentCode,
      birthCity,
      birthCityCode,
    } = body;

    if (!documentType || !documentId || !firstName || !lastName || !birthDate || !gender) {
      return NextResponse.json(
        { error: "Tipo doc, número, nombre, apellido, fecha nacimiento y sexo son obligatorios" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(patients)
      .where(eq(patients.documentId, documentId))
      .limit(1);

    if (existing.length > 0) {
      const patient = existing[0];
      await db
        .update(patients)
        .set({
          documentType,
          firstName,
          middleName: middleName || null,
          lastName,
          secondLastName: secondLastName || null,
          birthDate,
          gender,
          maritalStatus: maritalStatus || null,
          address: address || null,
          city: city || null,
          locality: locality || null,
          daneCode: daneCode || null,
          municipality: municipality || null,
          municipalityDaneCode: municipalityDaneCode || null,
          neighborhood: neighborhood || null,
          phone: phone || null,
          insurance: insurance || null,
          regime: regime || null,
          occupation: occupation || null,
          country: country || null,
          countryCode: countryCode || null,
          birthCountry: birthCountry || null,
          birthCountryCode: birthCountryCode || null,
          birthDepartment: birthDepartment || null,
          birthDepartmentCode: birthDepartmentCode || null,
          birthCity: birthCity || null,
          birthCityCode: birthCityCode || null,
        })
        .where(eq(patients.documentId, documentId));

      return NextResponse.json({
        success: true,
        message: "Paciente actualizado",
        patient: { ...patient, ...body },
      });
    }

    await db.insert(patients).values({
      documentType,
      documentId,
      firstName,
      middleName: middleName || null,
      lastName,
      secondLastName: secondLastName || null,
      birthDate,
      gender,
      maritalStatus: maritalStatus || null,
      address: address || null,
      city: city || null,
      locality: locality || null,
      daneCode: daneCode || null,
      municipality: municipality || null,
      municipalityDaneCode: municipalityDaneCode || null,
      neighborhood: neighborhood || null,
      phone: phone || null,
      insurance: insurance || null,
      regime: regime || null,
      occupation: occupation || null,
      country: country || null,
      countryCode: countryCode || null,
      birthCountry: birthCountry || null,
      birthCountryCode: birthCountryCode || null,
      birthDepartment: birthDepartment || null,
      birthDepartmentCode: birthDepartmentCode || null,
      birthCity: birthCity || null,
      birthCityCode: birthCityCode || null,
    });

    return NextResponse.json({ success: true, message: "Paciente registrado" }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}
