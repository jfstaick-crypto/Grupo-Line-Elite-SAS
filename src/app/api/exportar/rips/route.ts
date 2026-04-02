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

function formatDate(ts: unknown): string {
  if (!ts) return "";
  const d = new Date(ts as string);
  return d.toISOString().split("T")[0];
}

function formatDateTime(ts: unknown): string {
  if (!ts) return "";
  const d = new Date(ts as string);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resolution = searchParams.get("resolution") || "2275";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const { getDb } = await import("@/db");
  const {
    companySettings,
    patients,
    admissions,
    transfers,
    clinicalHistories,
    invoices,
  } = await import("@/db/schema");
  const { eq, gte, lte, and } = await import("drizzle-orm");
  const db = getDb();

  const company = (await db.select().from(companySettings).limit(1))[0] || {};

  const dateFilter = [];
  if (dateFrom) dateFilter.push(gte(invoices.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const dt = new Date(dateTo);
    dt.setHours(23, 59, 59);
    dateFilter.push(lte(invoices.createdAt, dt));
  }

  const allInvoices = await db
    .select()
    .from(invoices)
    .where(dateFilter.length > 0 ? and(...dateFilter) : undefined)
    .orderBy(invoices.createdAt);

  const allPatients = await db.select().from(patients);
  const patientMap = Object.fromEntries(allPatients.map((p: Record<string, unknown>) => [p.id, p]));

  if (resolution === "3374") {
    return generateRes3374(company, allInvoices, patientMap, db);
  } else {
    return generateRes2275(company, allInvoices, patientMap, db);
  }
}

async function generateRes3374(
  company: Record<string, unknown>,
  invoices: Record<string, unknown>[],
  patientMap: Record<number, Record<string, unknown>>,
  db: ReturnType<typeof import("@/db").getDb>
) {
  const { transfers, clinicalHistories } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const acRows: string[][] = [];
  const apRows: string[][] = [];

  for (const inv of invoices) {
    const patient = patientMap[inv.patientId as number];
    if (!patient) continue;

    const docType = (patient.documentType as string) || "CC";
    const docId = (patient.documentId as string) || "";
    const fechaAtencion = formatDate(inv.createdAt);
    const prestador = (company.habilitacionCode as string) || "000000";

    const hcRecords = await db
      .select()
      .from(clinicalHistories)
      .where(eq(clinicalHistories.patientId, patient.id as number));

    for (const hc of hcRecords) {
      acRows.push([
        docType,
        docId,
        fechaAtencion,
        prestador,
        "1",
        (hc.diagnosis as string) || "",
        "",
        "1",
        (hc.diagnosis as string) || "",
      ]);
    }

    const transferRecords = await db
      .select()
      .from(transfers)
      .where(eq(transfers.patientId, patient.id as number));

    for (const tr of transferRecords) {
      apRows.push([
        docType,
        docId,
        formatDate(tr.transferDate),
        prestador,
        (tr.cupsCode as string) || "",
        (tr.diagnosis as string) || "",
        "1",
        (tr.value as string) || "0",
      ]);
    }
  }

  return NextResponse.json({
    resolution: "3374",
    company: {
      nit: company.nit || "",
      name: company.name || "",
      habilitacionCode: company.habilitacionCode || "",
    },
    totalRecords: acRows.length + apRows.length,
    files: {
      AC: {
        description: "Archivo de Consulta (Res. 3374)",
        headers: [
          "TipoDocumentoIdentificacion",
          "NumeroDocumentoIdentificacion",
          "FechaAtencion",
          "CodigoPrestador",
          "CodigoConsulta",
          "DiagnosticoPrincipal",
          "DiagnosticoRelacionado1",
          "TipoConsulta",
          "CausaExterna",
        ],
        rows: acRows,
      },
      AP: {
        description: "Archivo de Procedimientos (Res. 3374)",
        headers: [
          "TipoDocumentoIdentificacion",
          "NumeroDocumentoIdentificacion",
          "FechaAtencion",
          "CodigoPrestador",
          "CodigoProcedimiento",
          "DiagnosticoPrincipal",
          "ViaAcceso",
          "ValorProcedimiento",
        ],
        rows: apRows,
      },
    },
  });
}

async function generateRes2275(
  company: Record<string, unknown>,
  invoices: Record<string, unknown>[],
  patientMap: Record<number, Record<string, unknown>>,
  db: ReturnType<typeof import("@/db").getDb>
) {
  const { transfers, clinicalHistories, invoiceLines } = await import(
    "@/db/schema"
  );
  const { eq } = await import("drizzle-orm");

  const usuarios: Record<string, unknown>[] = [];
  const consultas: Record<string, unknown>[] = [];
  const procedimientos: Record<string, unknown>[] = [];

  for (const inv of invoices) {
    const patient = patientMap[inv.patientId as number];
    if (!patient) continue;

    const userId = (patient.documentId as string) || "";
    const existingUser = usuarios.find(
      (u) => u.numeroDocumentoIdentificacion === userId
    );

    if (!existingUser) {
      usuarios.push({
        tipoDocumentoIdentificacion: patient.documentType || "CC",
        numeroDocumentoIdentificacion: patient.documentId || "",
        tipoUsuario: patient.userType || "Cotizante",
        fechaNacimiento: patient.birthDate || "",
        sexo: patient.gender || "M",
        municipioResidencia: patient.municipalityDaneCode || "",
        departamentoResidencia: patient.daneCode || "",
        telefono: patient.phone || "",
        correoElectronico: patient.email || "",
        aseguradora: patient.insurance || "",
        regimen: patient.regime || "",
      });
    }

    const hcRecords = await db
      .select()
      .from(clinicalHistories)
      .where(eq(clinicalHistories.patientId, patient.id as number));

    for (const hc of hcRecords) {
      consultas.push({
        tipoDocumentoIdentificacion: patient.documentType || "CC",
        numeroDocumentoIdentificacion: patient.documentId || "",
        fechaAtencion: formatDateTime(hc.createdAt),
        codigoPrestador: company.habilitacionCode || "",
        nombrePrestador: company.name || "",
        codigoCUPS: "",
        diagnosticoPrincipal: hc.diagnosis || "",
        tipoConsulta: "1",
        causaExterna: "13",
        codigoConsulta: "",
      });
    }

    const lines = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, inv.id as number));

    for (const line of lines) {
      procedimientos.push({
        tipoDocumentoIdentificacion: patient.documentType || "CC",
        numeroDocumentoIdentificacion: patient.documentId || "",
        fechaAtencion: formatDateTime(inv.createdAt),
        codigoPrestador: company.habilitacionCode || "",
        nombrePrestador: company.name || "",
        codigoProcedimiento: line.cupsCode || "",
        descripcionProcedimiento: line.cupsDescription || "",
        diagnosticoPrincipal: line.cie10Code || "",
        cantidad: line.quantity || "1",
        valorUnitario: line.unitPrice || "0",
        valorTotal: line.totalLine || "0",
        numeroAutorizacion: line.authorizationNumber || "",
      });
    }

    const transferRecords = await db
      .select()
      .from(transfers)
      .where(eq(transfers.patientId, patient.id as number));

    for (const tr of transferRecords) {
      procedimientos.push({
        tipoDocumentoIdentificacion: patient.documentType || "CC",
        numeroDocumentoIdentificacion: patient.documentId || "",
        fechaAtencion: formatDateTime(tr.transferDate),
        codigoPrestador: company.habilitacionCode || "",
        nombrePrestador: company.name || "",
        codigoProcedimiento: tr.cupsCode || "",
        descripcionProcedimiento: tr.cupsDescription || "",
        diagnosticoPrincipal: tr.diagnosis || "",
        cantidad: "1",
        valorUnitario: tr.value || "0",
        valorTotal: tr.value || "0",
        numeroAutorizacion: tr.authorizationNumber || "",
      });
    }
  }

  const ripsJson = {
    noFactura: invoices.length > 0 ? (invoices[0].invoiceNumber as string) : "",
    codigoPrestador: company.habilitacionCode || "",
    nombrePrestador: company.name || "",
    habilitacion: company.habilitacionCode || "",
    usuarios,
    servicios: {
      consultas: consultas.length > 0 ? consultas : undefined,
      procedimientos: procedimientos.length > 0 ? procedimientos : undefined,
    },
    totales: {
      valorTotal: invoices.reduce(
        (acc, inv) => acc + parseFloat((inv.total as string) || "0"),
        0
      ),
      cantidadFacturas: invoices.length,
      cantidadUsuarios: usuarios.length,
    },
  };

  return NextResponse.json({
    resolution: "2275",
    format: "JSON",
    description: "RIPS JSON según Resolución 2275 de 2023",
    company: {
      nit: company.nit || "",
      nitDigitVerifier: company.nitDigitVerifier || "",
      name: company.name || "",
      habilitacionCode: company.habilitacionCode || "",
    },
    data: ripsJson,
  });
}
