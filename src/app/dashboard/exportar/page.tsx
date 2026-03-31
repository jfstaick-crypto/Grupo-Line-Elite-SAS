"use client";

import { useState, useEffect } from "react";

type ExportType = "admissions" | "transfers" | "histories" | "invoices" | "rips_indicators";

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
        columns = ["N° Factura", "Paciente", "Documento", "CUPS", "Diagnóstico", "EPS", "Subtotal", "IVA", "Total", "Estado", "Fecha"];
        rows = data.map((d: Record<string, unknown>) => [
          (d.invoiceNumber || "-") as string,
          `${d.patientName || ""} ${d.patientLastName || ""}`,
          (d.documentId || "") as string,
          (d.cupsCode || "-") as string,
          (d.diagnosis || "-") as string,
          (d.insuranceCompany || "-") as string,
          `$${parseFloat((d.subtotal as string) || "0").toLocaleString("es-CO")}`,
          `${(d.tax || "0")}%`,
          `$${parseFloat((d.total as string) || "0").toLocaleString("es-CO")}`,
          (d.status || "-") as string,
          d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        ]);
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
          "Paciente": `${d.patientName} ${d.patientLastName}`,
          "Documento": d.documentId,
          "Código CUPS": d.cupsCode || "-",
          "Descripción CUPS": d.cupsDescription || "-",
          "Diagnóstico": d.diagnosis || "-",
          "EPS": d.insuranceCompany || "-",
          "N° Autorización": d.authorizationNumber || "-",
          "Subtotal": `$${parseFloat((d.subtotal as string) || "0").toLocaleString("es-CO")}`,
          "IVA": `${(d.tax || "0")}%`,
          "Total": `$${parseFloat((d.total as string) || "0").toLocaleString("es-CO")}`,
          "Método Pago": d.paymentMethod || "-",
          "Estado": d.status,
          "Registrado por": d.createdByName || "-",
          "Fecha": d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        }));
      } else {
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

  const exportOptions = [
    { type: "admissions", description: "Listado de admisiones con encabezado institucional", icon: "📋" },
    { type: "transfers", description: "Formato de traslado según normatividad vigente", icon: "🚑" },
    { type: "histories", description: "Historias clínicas completas con condiciones de salida", icon: "📝" },
    { type: "invoices", description: "Facturación con todos los campos según norma RIPS", icon: "💰" },
    { type: "rips_indicators", description: "Indicadores de gestión de traslados", icon: "📊" },
  ];

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
