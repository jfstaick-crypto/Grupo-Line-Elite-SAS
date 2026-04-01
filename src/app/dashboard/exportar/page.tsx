"use client";

import { useState, useEffect } from "react";

type ExportType = "admissions" | "transfers" | "histories" | "invoices" | "billing_indicators" | "rips_indicators";

interface CompanyData {
  name: string;
  nit: string;
  habilitacionCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  slogan: string | null;
  logo: string | null;
}

const EXPORT_LABELS: Record<string, string> = {
  admissions: "Admisiones",
  transfers: "Formato de Traslado",
  histories: "Historias Clínicas",
  invoices: "Facturación",
  billing_indicators: "Indicadores Facturación",
  rips_indicators: "Indicadores RIPS",
};

export default function ExportarPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [searchDoc, setSearchDoc] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [searching, setSearching] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [ripsResolution, setRipsResolution] = useState("2275");
  const [ripsDateFrom, setRipsDateFrom] = useState("");
  const [ripsDateTo, setRipsDateTo] = useState("");
  const [ripsLoading, setRipsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/empresa").then(r => r.json()).then(setCompany).catch(() => {});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addCompanyHeader = (doc: any, startY: number = 15) => {
    let y = startY;
    if (company?.logo) {
      try { doc.addImage(company.logo, "JPEG", 14, y - 5, 20, 20); } catch {}
    }
    const xText = company?.logo ? 38 : 14;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name || "EMPRESA DE SALUD", xText, y);
    if (company?.slogan) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(company.slogan, xText, y + 5);
      y += 3;
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${company?.nit || "N/A"}  |  Cód. Habilitación: ${company?.habilitacionCode || "N/A"}`, xText, y + 5);
    doc.text(`${company?.address || ""} ${company?.city ? "- " + company.city : ""}`, xText, y + 9);
    doc.text(`Tel: ${company?.phone || ""}  |  Email: ${company?.email || ""}  |  Web: ${company?.website || ""}`, xText, y + 13);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, y + 17, 196, y + 17);
    return y + 22;
  };

  const fetchData = async (type: string) => {
    const res = await fetch(`/api/exportar?type=${type}`);
    if (!res.ok) throw new Error("Error al obtener datos");
    return res.json();
  };

  const searchByDocument = async () => {
    if (!searchDoc.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/pacientes?documentId=${searchDoc}`);
      if (res.ok) {
        const patient = await res.json();
        if (patient && patient.id) {
          const [histRes, admRes] = await Promise.all([
            fetch("/api/historias"),
            fetch("/api/admisiones"),
          ]);
          const results: Record<string, unknown>[] = [];
          if (histRes.ok) {
            const histories = await histRes.json();
            const filtered = histories.filter(
              (h: Record<string, unknown>) =>
                h.patientDocumentId === searchDoc &&
                (!searchDate || new Date(h.createdAt as string).toISOString().split("T")[0] === searchDate)
            );
            results.push(...filtered.map((h: Record<string, unknown>) => ({ ...h, type: "historia" })));
          }
          setSearchResults(results);
        } else {
          setSearchResults([]);
          setError("Paciente no encontrado");
        }
      }
    } catch {
      setError("Error en la búsqueda");
    } finally {
      setSearching(false);
    }
  };

  const exportSingleHistoryPDF = async (record: Record<string, unknown>) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = addCompanyHeader(doc);

    const addField = (label: string, value: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(value || "-", 130);
      doc.text(lines, 60, y);
      y += lines.length * 4.5 + 1;
    };

    const addSection = (title: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 3;
      doc.setDrawColor(37, 99, 235);
      doc.setFillColor(239, 246, 255);
      doc.rect(14, y - 4, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text(title, 16, y + 1);
      doc.setTextColor(0, 0, 0);
      y += 8;
    };

    // TÍTULO
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("HISTORIA CLÍNICA - FORMATO COMPLETO", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Código HC: ${record.hcCode || "N/A"}`, 14, y);
    doc.text(`Fecha: ${record.createdAt ? new Date(record.createdAt as string).toLocaleDateString("es-ES") : "N/A"}`, 150, y);
    y += 10;

    // DATOS DEL PACIENTE
    addSection("DATOS DEL PACIENTE");
    addField("Tipo Documento", record.patientDocumentType as string);
    addField("N° Documento", record.patientDocumentId as string);
    addField("Primer Nombre", record.patientFirstName as string);
    addField("Segundo Nombre", record.patientMiddleName as string);
    addField("Primer Apellido", record.patientLastName as string);
    addField("Segundo Apellido", record.patientSecondLastName as string);
    addField("Fecha Nacimiento", record.patientBirthDate as string);
    addField("Sexo", record.patientGender === "M" ? "Masculino" : record.patientGender === "F" ? "Femenino" : "Indefinido");
    addField("Estado Civil", record.patientMaritalStatus as string);
    addField("Dirección", record.patientAddress as string);
    addField("Teléfono", record.patientPhone as string);
    addField("EPS", record.patientInsurance as string);
    addField("Régimen", record.patientRegime as string);
    addField("Ocupación", record.patientOccupation as string);

    // DATOS DE ADMISIÓN
    addSection("DATOS DE ADMISIÓN");
    addField("Departamento", record.department as string);
    addField("Médico Asignado", record.assignedDoctorName as string);
    addField("Companion", `${record.companionName || "-"} (${record.companionRelationship || "-"})`);

    // DIAGNÓSTICO Y TRATAMIENTO
    addSection("INFORMACIÓN CLÍNICA");
    addField("Diagnóstico CIE-10", record.diagnosis as string);
    addField("Síntomas", record.symptoms as string);
    addField("Examen Físico", record.physicalExam as string);
    addField("Tratamiento", record.treatment as string);
    addField("Notas", record.notes as string);

    // CONDICIONES A LA SALIDA
    if (record.dischargeConditions) {
      try {
        const dc = JSON.parse(record.dischargeConditions as string);
        addSection("CONDICIONES A LA SALIDA");
        addField("Glasgow", dc.glasgow || "-");
        addField("Estado Consciencia", dc.consciousness || "Alerta");
        addField("FC", dc.fc ? `${dc.fc} lpm` : "-");
        addField("PA", dc.pa ? `${dc.pa} mmHg` : "-");
        addField("PR", dc.pr ? `${dc.pr} rpm` : "-");
        addField("Temperatura", dc.temperatura ? `${dc.temperatura} °C` : "-");
        addField("SatO2", dc.satO2 ? `${dc.satO2}%` : "-");
        addField("FCF", dc.fcf ? `${dc.fcf} lpm` : "-");
        addField("Alergias", dc.alergias || "Ninguna");
        addField("Semanas Gestación", dc.semanasGestacion || "-");
        addField("Manilla Riesgo", dc.manillaRiesgo || "No");
        addField("Acceso Venoso", dc.accesoVenoso || "No");
        addField("Oxígeno", dc.oxigeno || "No");
        addField("Sonda Vesical", dc.sondaVesical || "No");
        if (dc.otro === "Sí") addField("Otro", dc.otroCual || "-");
      } catch {}
    }

    // EVOLUCIONES
    if (record.evolutions) {
      try {
        const evos = JSON.parse(record.evolutions as string);
        if (evos.length > 0) {
          addSection("EVOLUCIONES DURANTE EL TRASLADO");
          evos.forEach((evo: { fecha: string; hora: string; observacion: string }) => {
            addField(`${evo.fecha} ${evo.hora}`, evo.observacion);
          });
        }
      } catch {}
    }

    // FIRMAS
    addSection("FIRMAS");
    y += 5;
    
    // Firma del médico
    if (record.doctorSignature) {
      try { doc.addImage(record.doctorSignature as string, "JPEG", 14, y, 30, 15); } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("_________________________", 14, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.doctorName || "Médico"}`, 14, y + 22);
    doc.text("Médico Tratante", 14, y + 25);

    // Firma de la enfermera
    if (record.nurseSignature) {
      try { doc.addImage(record.nurseSignature as string, "JPEG", 80, y, 30, 15); } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.text("_________________________", 80, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.nurseName || "Enfermera"}`, 80, y + 22);
    doc.text("Enfermera", 80, y + 25);

    // Firma del chófer
    if (record.driverSignature) {
      try { doc.addImage(record.driverSignature as string, "JPEG", 150, y, 30, 15); } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.text("_________________________", 150, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(`${record.driverName || "Chófer"}`, 150, y + 22);
    doc.text("Chófer", 150, y + 25);

    doc.save(`HC_${record.patientDocumentId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportPDF = async (type: string) => {
    setLoading({ ...loading, [type + "_pdf"]: true });
    setError("");
    try {
      const data = await fetchData(type);
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF("landscape");
      let y = addCompanyHeader(doc);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Reporte de ${EXPORT_LABELS[type]}`, 148, y, { align: "center" });
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}`, 148, y, { align: "center" });
      y += 8;

      let columns: string[] = [];
      let rows: string[][] = [];

      if (type === "admissions") {
        columns = ["Paciente", "Documento", "Razón", "Depto", "Cama", "Médico", "Estado"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName || d.patientFirstName || ""} ${d.patientLastName || ""}`,
          (d.documentId || d.patientDocumentId || "") as string,
          d.reason as string,
          d.department as string,
          (d.bed as string) || "-",
          (d.dischargedBy || d.assignedDoctorName || "-") as string,
          d.status as string,
        ]);
      } else if (type === "transfers") {
        columns = ["Paciente", "Doc", "Origen", "Destino", "Diagnóstico", "CUPS", "Amb", "Estado", "Conductor", "Médico"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName || ""} ${d.patientLastName || ""}`,
          (d.documentId || "") as string,
          `${d.originCity || ""} - ${d.originInstitution || ""}`,
          `${d.destinationCity || ""} - ${d.destinationInstitution || ""}`,
          (d.diagnosis || "-") as string,
          (d.cupsCode || "-") as string,
          (d.ambulancePlate || "-") as string,
          (d.status || "-") as string,
          (d.driverName || "-") as string,
          (d.doctorName || "-") as string,
        ]);
      } else if (type === "histories") {
        columns = ["Paciente", "Documento", "Diagnóstico", "Médico", "Depto", "Fecha"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName || d.patientFirstName || ""} ${d.patientLastName || ""}`,
          (d.documentId || d.patientDocumentId || "") as string,
          (d.diagnosis as string).substring(0, 40),
          (d.doctorName || d.doctor_id || "-") as string,
          (d.department || "-") as string,
          d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        ]);
      } else if (type === "invoices") {
        columns = ["N° Factura", "Paciente", "Doc", "CIE-10", "Diagnóstico", "EPS", "Contrato", "Modalidad", "Moneda", "Subtotal", "Desc.", "IVA", "Total", "Método Pago", "Estado", "Fecha"];
        rows = data.map((d: Record<string, unknown>) => [
          (d.invoiceNumber || "-") as string,
          `${d.patientName || ""} ${d.patientLastName || ""}`,
          (d.documentId || "") as string,
          (d.diagnosisCode || "-") as string,
          ((d.diagnosis as string) || "-").substring(0, 30),
          (d.insuranceCompany || "-") as string,
          (d.contractNumber || "-") as string,
          (d.paymentModality || "-") as string,
          (d.currency || "COP") as string,
          `$${parseFloat((d.subtotal as string) || "0").toLocaleString("es-CO")}`,
          `$${parseFloat((d.discount as string) || "0").toLocaleString("es-CO")}`,
          `$${parseFloat((d.tax as string) || "0").toLocaleString("es-CO")}`,
          `$${parseFloat((d.total as string) || "0").toLocaleString("es-CO")}`,
          (d.paymentMethod || "-") as string,
          (d.status || "-") as string,
          d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        ]);
      } else if (type === "billing_indicators") {
        const indicators = generateBillingIndicators(data);
        columns = ["Indicador", "Valor"];
        rows = indicators.map((i) => [i.name, String(i.value)]);
      } else if (type === "rips_indicators") {
        const indicators = generateRIPSIndicators(data);
        columns = ["Indicador", "Valor"];
        rows = indicators.map((i) => [i.name, String(i.value)]);
      }

      autoTable(doc, {
        startY: y,
        head: columns.length > 0 ? [columns] : undefined,
        body: rows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 7 },
        margin: { top: y },
      });

      doc.save(`${type}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
      setError(`Error al exportar ${EXPORT_LABELS[type]} a PDF`);
    } finally {
      setLoading({ ...loading, [type + "_pdf"]: false });
    }
  };

  const exportExcel = async (type: string) => {
    setLoading({ ...loading, [type + "_excel"]: true });
    setError("");
    try {
      const data = await fetchData(type);
      const XLSX = await import("xlsx");
      let formattedData: Record<string, unknown>[] = [];

      if (type === "transfers") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          "Paciente": `${d.patientName} ${d.patientLastName}`,
          "Documento": d.documentId,
          "Ciudad Origen": d.originCity,
          "Inst. Origen": d.originInstitution,
          "Tel. Origen": d.originPhone || "-",
          "Ciudad Destino": d.destinationCity,
          "Inst. Destino": d.destinationInstitution,
          "Tel. Destino": d.destinationPhone || "-",
          "N° Autorización": d.authorizationNumber || "-",
          "Diagnóstico": d.diagnosis,
          "Placa Ambulancia": d.ambulancePlate || "-",
          "Tipo Amb": d.tam || d.tab || "-",
          "Fecha Solicitud": d.requestDate || "-",
          "Entidad Pago": d.responsibleEntity || "-",
          "Hora Llamado": d.callTime || "-",
          "Hora Promesa": d.promiseTime || "-",
          "Fecha Recogida": d.pickupDate || "-",
          "Hora Recogida": d.pickupTime || "-",
          "Lugar Recogida": d.pickupLocation || "-",
          "Hora Llegada IPS Origen": d.arrivalIpsOriginTime || "-",
          "Lugar Destino": d.destinationLocation || "-",
          "Hora Llegada IPS Destino": d.arrivalIpsDestinationTime || "-",
          "Fecha Entrega": d.deliveryDate || "-",
          "Hora Entrega": d.deliveryTime || "-",
          "Fecha Retorno": d.returnDate || "-",
          "Hora Retorno": d.returnTime || "-",
          "Conductor": d.driverName || "-",
          "Auxiliar/APH": d.auxiliaryName || "-",
          "Doc. Auxiliar": d.auxiliaryDocument || "-",
          "Médico": d.doctorName || "-",
          "Doc. Médico": d.doctorDocument || "-",
          "CUPS": d.cupsCode || "-",
          "Desc. CUPS": d.cupsDescription || "-",
          "Valor": d.value || "-",
          "Estado": d.status,
          "Registrado por": d.transferredBy,
        }));
      } else if (type === "histories") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          "Paciente": `${d.patientName} ${d.patientLastName}`,
          "Documento": d.documentId,
          "Diagnóstico": d.diagnosis,
          "Síntomas": d.symptoms,
          "Tratamiento": d.treatment,
          "Médico": d.doctorName,
          "Signos Vitales": d.vitalSigns || "-",
          "Notas": d.notes || "-",
        }));
      } else if (type === "invoices") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          "N° Factura": d.invoiceNumber,
          "Prefijo": d.invoicePrefix || "FE",
          "Tipo": d.invoiceType === "01" ? "Venta" : d.invoiceType || "-",
          "Paciente": `${d.patientName} ${d.patientLastName}`,
          "Documento": d.documentId,
          "CIE-10": d.diagnosisCode || "-",
          "Diagnóstico": d.diagnosis || "-",
          "EPS": d.insuranceCompany || "-",
          "N° Contrato": d.contractNumber || "-",
          "Modalidad Pago": d.paymentModality || "-",
          "N° Autorización": d.authorizationNumber || "-",
          "Moneda": d.currency || "COP",
          "Subtotal": parseFloat((d.subtotal as string) || "0"),
          "Descuento": parseFloat((d.discount as string) || "0"),
          "IVA": parseFloat((d.tax as string) || "0"),
          "Total": parseFloat((d.total as string) || "0"),
          "Método Pago": d.paymentMethod || "-",
          "Estado": d.status,
          "CUFE": d.cufe || "-",
          "CUV": d.cuv || "-",
          "Estado DIAN": d.dianStatus || "-",
          "Registrado por": d.createdByName || "-",
          "Fecha": d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        }));
      } else if (type === "billing_indicators") {
        formattedData = data;
      }

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, EXPORT_LABELS[type]);
      XLSX.writeFile(wb, `${type}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch {
      setError(`Error al exportar a Excel`);
    } finally {
      setLoading({ ...loading, [type + "_excel"]: false });
    }
  };

  const generateRIPSIndicators = (data: Record<string, unknown>[]) => {
    const total = data.length;
    const completados = data.filter((d) => d.status === "completado").length;
    const pendientes = data.filter((d) => d.status === "pendiente").length;
    const enProceso = data.filter((d) => d.status === "en_proceso").length;
    const cancelados = data.filter((d) => d.status === "cancelado").length;
    const byInstitution: Record<string, number> = {};
    data.forEach((d) => {
      const inst = (d.destinationInstitution as string) || "Sin especificar";
      byInstitution[inst] = (byInstitution[inst] || 0) + 1;
    });
    return [
      { name: "Total de Traslados", value: total },
      { name: "Completados", value: completados },
      { name: "Pendientes", value: pendientes },
      { name: "En Proceso", value: enProceso },
      { name: "Cancelados", value: cancelados },
      { name: "% Completados", value: total > 0 ? `${((completados / total) * 100).toFixed(1)}%` : "0%" },
      ...Object.entries(byInstitution).map(([k, v]) => ({ name: k, value: v })),
    ];
  };

  const generateBillingIndicators = (data: Record<string, unknown>[]): { name: string; value: string | number }[] => {
    const total = data.length;
    const pagadas = data.filter((d) => d.status === "pagada").length;
    const pendientes = data.filter((d) => d.status === "pendiente").length;
    const anuladas = data.filter((d) => d.status === "anulada").length;
    const totalFacturado = data.reduce((acc, d) => acc + parseFloat((d.total as string) || "0"), 0);
    const totalPagado = data.filter((d) => d.status === "pagada").reduce((acc, d) => acc + parseFloat((d.total as string) || "0"), 0);
    const totalPendiente = data.filter((d) => d.status === "pendiente").reduce((acc, d) => acc + parseFloat((d.total as string) || "0"), 0);

    const byEPS: Record<string, { count: number; total: number }> = {};
    data.forEach((d) => {
      const eps = (d.insuranceCompany as string) || "Particular";
      if (!byEPS[eps]) byEPS[eps] = { count: 0, total: 0 };
      byEPS[eps].count++;
      byEPS[eps].total += parseFloat((d.total as string) || "0");
    });

    const byPaymentMethod: Record<string, number> = {};
    data.forEach((d) => {
      const pm = (d.paymentMethod as string) || "Sin especificar";
      byPaymentMethod[pm] = (byPaymentMethod[pm] || 0) + 1;
    });

    const byModality: Record<string, number> = {};
    data.forEach((d) => {
      const mod = (d.paymentModality as string) || "Sin especificar";
      byModality[mod] = (byModality[mod] || 0) + 1;
    });

    const promedioFactura = total > 0 ? totalFacturado / total : 0;
    const tasaPago = total > 0 ? (pagadas / total) * 100 : 0;

    return [
      { name: "Total Facturas", value: total },
      { name: "Facturas Pagadas", value: pagadas },
      { name: "Facturas Pendientes", value: pendientes },
      { name: "Facturas Anuladas", value: anuladas },
      { name: "% Pagadas", value: `${tasaPago.toFixed(1)}%` },
      { name: "Total Facturado", value: `$${totalFacturado.toLocaleString("es-CO")}` },
      { name: "Total Pagado", value: `$${totalPagado.toLocaleString("es-CO")}` },
      { name: "Total Pendiente Cobro", value: `$${totalPendiente.toLocaleString("es-CO")}` },
      { name: "Promedio por Factura", value: `$${promedioFactura.toLocaleString("es-CO", { maximumFractionDigits: 0 })}` },
      { name: "--- Por EPS ---", value: "" },
      ...Object.entries(byEPS).map(([k, v]) => ({ name: `${k}: ${v.count} facturas`, value: `$${v.total.toLocaleString("es-CO")}` })),
      { name: "--- Por Método de Pago ---", value: "" },
      ...Object.entries(byPaymentMethod).map(([k, v]) => ({ name: k, value: v })),
      { name: "--- Por Modalidad ---", value: "" },
      ...Object.entries(byModality).map(([k, v]) => ({ name: k, value: v })),
    ];
  };

  const exportOptions = [
    { type: "admissions", description: "Listado de admisiones con encabezado institucional", icon: "📋" },
    { type: "transfers", description: "Formato de traslado según normatividad vigente", icon: "🚑" },
    { type: "histories", description: "Historias clínicas completas con condiciones de salida", icon: "📝" },
    { type: "invoices", description: "Facturación con todos los campos DIAN y RIPS", icon: "💰" },
    { type: "billing_indicators", description: "Indicadores: facturación, cobro, EPS, métodos de pago", icon: "📊" },
    { type: "rips_indicators", description: "Indicadores de gestión de traslados", icon: "📈" },
  ];

  const exportRIPS = async (format: "pdf" | "excel" | "json") => {
    setRipsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        resolution: ripsResolution,
        ...(ripsDateFrom && { dateFrom: ripsDateFrom }),
        ...(ripsDateTo && { dateTo: ripsDateTo }),
      });
      const res = await fetch(`/api/exportar/rips?${params}`);
      if (!res.ok) throw new Error("Error al obtener datos RIPS");
      const data = await res.json();

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `RIPS_Res${ripsResolution}_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF("landscape");
        let y = 15;

        if (company?.logo) {
          try {
            doc.addImage(company.logo, "JPEG", 14, y - 5, 20, 20);
          } catch {}
        }
        const xT = company?.logo ? 38 : 14;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(company?.name || "EMPRESA", xT, y);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`NIT: ${company?.nit || "N/A"} | Hab: ${company?.habilitacionCode || "N/A"}`, xT, y + 5);
        y += 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 283, y);
        y += 5;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const resTitle =
          ripsResolution === "3374"
            ? "RIPS - Resolución 3374 de 2021 (AC/AP)"
            : "RIPS - Resolución 2275 de 2023 (JSON)";
        doc.text(resTitle, 148, y, { align: "center" });
        y += 8;

        if (ripsResolution === "3374" && data.files) {
          for (const [fileKey, fileData] of Object.entries(
            data.files as Record<string, Record<string, unknown>>
          )) {
            if (y > 180) {
              doc.addPage();
              y = 20;
            }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235);
            doc.text(
              `${fileKey}: ${fileData.description as string}`,
              14,
              y
            );
            doc.setTextColor(0, 0, 0);
            y += 5;

            autoTable(doc, {
              startY: y,
              head: [fileData.headers as string[]],
              body: fileData.rows as string[][],
              styles: { fontSize: 6 },
              headStyles: { fillColor: [37, 99, 235], fontSize: 6 },
              margin: { left: 14, right: 14 },
            });
            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
          }
        } else if (ripsResolution === "2275" && data.data) {
          const d = data.data as Record<string, unknown>;
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`Código Prestador: ${d.codigoPrestador || "-"}`, 14, y);
          doc.text(`Factura: ${d.noFactura || "-"}`, 14, y + 5);
          y += 12;

          const usuarios = (d.usuarios as Record<string, unknown>[]) || [];
          if (usuarios.length > 0) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Usuarios (${usuarios.length})`, 14, y);
            y += 4;
            autoTable(doc, {
              startY: y,
              head: [["Tipo Doc", "Documento", "Tipo Usuario", "Fecha Nac", "Sexo", "Mpio", "Depto", "EPS"]],
              body: usuarios.map((u) => [
                (u.tipoDocumentoIdentificacion as string) || "-",
                (u.numeroDocumentoIdentificacion as string) || "-",
                (u.tipoUsuario as string) || "-",
                (u.fechaNacimiento as string) || "-",
                (u.sexo as string) || "-",
                (u.municipioResidencia as string) || "-",
                (u.departamentoResidencia as string) || "-",
                (u.aseguradora as string) || "-",
              ]),
              styles: { fontSize: 6 },
              headStyles: { fillColor: [37, 99, 235], fontSize: 6 },
            });
            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
          }

          const servicios = (d.servicios as Record<string, unknown>) || {};
          const consultas = (servicios.consultas as Record<string, unknown>[]) || [];
          const procedimientos = (servicios.procedimientos as Record<string, unknown>[]) || [];

          if (consultas.length > 0) {
            if (y > 180) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Consultas (${consultas.length})`, 14, y);
            y += 4;
            autoTable(doc, {
              startY: y,
              head: [["Doc", "Fecha", "CUPS", "Diagnóstico", "Tipo"]],
              body: consultas.map((c) => [
                (c.numeroDocumentoIdentificacion as string) || "-",
                (c.fechaAtencion as string) || "-",
                (c.codigoCUPS as string) || "-",
                ((c.diagnosticoPrincipal as string) || "-").substring(0, 30),
                (c.tipoConsulta as string) || "-",
              ]),
              styles: { fontSize: 6 },
              headStyles: { fillColor: [34, 139, 34], fontSize: 6 },
            });
            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
          }

          if (procedimientos.length > 0) {
            if (y > 180) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Procedimientos (${procedimientos.length})`, 14, y);
            y += 4;
            autoTable(doc, {
              startY: y,
              head: [["Doc", "Fecha", "CUPS", "Descripción", "CIE-10", "Cant", "Valor"]],
              body: procedimientos.map((p) => [
                (p.numeroDocumentoIdentificacion as string) || "-",
                (p.fechaAtencion as string) || "-",
                (p.codigoProcedimiento as string) || "-",
                ((p.descripcionProcedimiento as string) || "-").substring(0, 25),
                (p.diagnosticoPrincipal as string) || "-",
                (p.cantidad as string) || "1",
                `$${parseFloat((p.valorTotal as string) || "0").toLocaleString("es-CO")}`,
              ]),
              styles: { fontSize: 6 },
              headStyles: { fillColor: [255, 140, 0], fontSize: 6 },
            });
          }
        }

        doc.save(`RIPS_Res${ripsResolution}_${new Date().toISOString().split("T")[0]}.pdf`);
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        if (ripsResolution === "3374" && data.files) {
          for (const [fileKey, fileData] of Object.entries(
            data.files as Record<string, Record<string, unknown>>
          )) {
            const rows = (fileData.rows as string[][]).map((row) => {
              const obj: Record<string, string> = {};
              (fileData.headers as string[]).forEach((h, i) => {
                obj[h] = row[i] || "";
              });
              return obj;
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, fileKey);
          }
        } else if (ripsResolution === "2275" && data.data) {
          const d = data.data as Record<string, unknown>;
          const usuarios = (d.usuarios as Record<string, unknown>[]) || [];
          if (usuarios.length > 0) {
            const ws = XLSX.utils.json_to_sheet(usuarios);
            XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
          }
          const servicios = (d.servicios as Record<string, unknown>) || {};
          const consultas = (servicios.consultas as Record<string, unknown>[]) || [];
          const procedimientos = (servicios.procedimientos as Record<string, unknown>[]) || [];
          if (consultas.length > 0) {
            const ws = XLSX.utils.json_to_sheet(consultas);
            XLSX.utils.book_append_sheet(wb, ws, "Consultas");
          }
          if (procedimientos.length > 0) {
            const ws = XLSX.utils.json_to_sheet(procedimientos);
            XLSX.utils.book_append_sheet(wb, ws, "Procedimientos");
          }
        }

        XLSX.writeFile(
          wb,
          `RIPS_Res${ripsResolution}_${new Date().toISOString().split("T")[0]}.xlsx`
        );
      }
    } catch (e) {
      console.error(e);
      setError("Error al exportar RIPS");
    } finally {
      setRipsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exportar Información</h1>
        <p className="text-gray-500 text-sm">Reportes con encabezado institucional y firma</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar Historia por Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
            <input type="text" value={searchDoc} onChange={(e) => setSearchDoc(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="Ingrese documento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (opcional)</label>
            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
          </div>
          <div className="flex items-end">
            <button onClick={searchByDocument} disabled={searching || !searchDoc.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Resultados ({searchResults.length})</h3>
            <div className="divide-y divide-gray-100">
              {searchResults.map((r, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{r.type === "historia" ? "Historia Clínica" : "Registro"}:</span>
                    <span className="text-sm text-gray-600 ml-2">{(r.diagnosis as string) || "-"}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("es-ES") : ""}</span>
                  </div>
                  <button onClick={() => exportSingleHistoryPDF(r)} className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer">Exportar PDF</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Exportar RIPS</h2>
        <p className="text-sm text-gray-500 mb-4">Seleccione la resolución y formato de exportación</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolución</label>
            <select value={ripsResolution} onChange={(e) => setRipsResolution(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
              <option value="2275">Res. 2275/2023 - JSON (actual)</option>
              <option value="3374">Res. 3374/2021 - AC/AP/AT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde Fecha</label>
            <input type="date" value={ripsDateFrom} onChange={(e) => setRipsDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta Fecha</label>
            <input type="date" value={ripsDateTo} onChange={(e) => setRipsDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
          </div>
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 w-full">
              {ripsResolution === "2275" ? (
                <span><strong>Res. 2275:</strong> Formato JSON con usuarios, consultas y procedimientos según MinSalud</span>
              ) : (
                <span><strong>Res. 3374:</strong> Archivos AC (consultas) y AP (procedimientos) formato texto</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportRIPS("pdf")} disabled={ripsLoading} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
            {ripsLoading ? "Generando..." : "PDF"}
          </button>
          <button onClick={() => exportRIPS("excel")} disabled={ripsLoading} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
            {ripsLoading ? "Generando..." : "Excel"}
          </button>
          <button onClick={() => exportRIPS("json")} disabled={ripsLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
            {ripsLoading ? "Generando..." : "JSON"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {exportOptions.map((opt) => (
          <div key={opt.type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-2xl">{opt.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{EXPORT_LABELS[opt.type]}</h3>
            <p className="text-sm text-gray-500 mb-6">{opt.description}</p>
            <div className="flex gap-3">
              <button onClick={() => exportPDF(opt.type)} disabled={loading[opt.type + "_pdf"]} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
                {loading[opt.type + "_pdf"] ? "..." : "PDF"}
              </button>
              <button onClick={() => exportExcel(opt.type)} disabled={loading[opt.type + "_excel"]} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
                {loading[opt.type + "_excel"] ? "..." : "Excel"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
