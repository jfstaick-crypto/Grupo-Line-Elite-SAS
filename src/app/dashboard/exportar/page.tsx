"use client";

import { useState } from "react";

type ExportType = "admissions" | "transfers" | "histories" | "rips_indicators";

const EXPORT_LABELS: Record<string, string> = {
  admissions: "Admisiones",
  transfers: "Traslados",
  histories: "Historias Clínicas",
  rips_indicators: "Indicadores RIPS",
};

export default function ExportarPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [searchDoc, setSearchDoc] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [searching, setSearching] = useState(false);

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
          if (admRes.ok) {
            const admissions = await admRes.json();
            const filtered = admissions.filter(
              (a: Record<string, unknown>) => a.patientDocumentId === searchDoc
            );
            results.push(...filtered.map((a: Record<string, unknown>) => ({ ...a, type: "admision" })));
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

  const exportSinglePDF = async (record: Record<string, unknown>) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("HISTORIA CLÍNICA", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 25);

    let y = 35;
    const addField = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", 60, y);
      y += 7;
    };

    addField("Paciente", `${record.patientFirstName} ${record.patientLastName}`);
    addField("Documento", record.patientDocumentId as string);
    addField("Diagnóstico", record.diagnosis as string);
    addField("Síntomas", record.symptoms as string);
    addField("Tratamiento", record.treatment as string);
    addField("Médico", record.doctorName as string);
    addField("Signos Vitales", record.vitalSigns as string);
    addField("Notas", record.notes as string);

    doc.save(`historia_${record.patientDocumentId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportPDF = async (type: string) => {
    setLoading({ ...loading, [type + "_pdf"]: true });
    setError("");
    try {
      const data = await fetchData(type);
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Reporte de ${EXPORT_LABELS[type]}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 28);

      let columns: string[] = [];
      let rows: string[][] = [];

      if (type === "admissions") {
        columns = ["Paciente", "Documento", "Razón", "Departamento", "Médico", "Estado"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName} ${d.patientLastName}`,
          d.documentId as string,
          d.reason as string,
          d.department as string,
          (d.dischargedBy as string) || "-",
          d.status as string,
        ]);
      } else if (type === "transfers") {
        columns = ["Paciente", "Doc", "Origen", "Destino", "Diagnóstico", "Tipo Amb", "Estado"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName} ${d.patientLastName}`,
          d.documentId as string,
          `${d.originCity || ""} - ${d.originInstitution || ""}`,
          `${d.destinationCity || ""} - ${d.destinationInstitution || ""}`,
          (d.diagnosis as string) || "-",
          d.ambulancePlate ? "TAM/TAB" : "-",
          d.status as string,
        ]);
      } else if (type === "histories") {
        columns = ["Paciente", "Documento", "Diagnóstico", "Médico", "Fecha"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName} ${d.patientLastName}`,
          d.documentId as string,
          d.diagnosis as string,
          d.doctorName as string,
          d.createdAt ? new Date(d.createdAt as string).toLocaleDateString("es-ES") : "-",
        ]);
      } else if (type === "rips_indicators") {
        const indicators = generateRIPSIndicators(data);
        columns = ["Indicador", "Valor"];
        rows = indicators.map((i) => [i.name, String(i.value)]);
      }

      autoTable(doc, {
        startY: 35,
        head: columns.length > 0 ? [columns] : undefined,
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`${type}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch {
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

      if (type === "admissions") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          Paciente: `${d.patientName} ${d.patientLastName}`,
          Documento: d.documentId,
          Razón: d.reason,
          Departamento: d.department,
          Médico: d.dischargedBy || "-",
          Estado: d.status,
        }));
      } else if (type === "transfers") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          Paciente: `${d.patientName} ${d.patientLastName}`,
          Documento: d.documentId,
          "Ciu. Origen": d.originCity,
          "Inst. Origen": d.originInstitution,
          "Ciu. Destino": d.destinationCity,
          "Inst. Destino": d.destinationInstitution,
          Diagnóstico: d.diagnosis,
          "CUPS": d.cupsCode || "-",
          Estado: d.status,
          Conductor: d.driverName || "-",
          Médico: d.doctorName || "-",
        }));
      } else if (type === "histories") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          Paciente: `${d.patientName} ${d.patientLastName}`,
          Documento: d.documentId,
          Diagnóstico: d.diagnosis,
          Síntomas: d.symptoms,
          Tratamiento: d.treatment,
          Médico: d.doctorName,
          "Signos Vitales": d.vitalSigns || "-",
        }));
      } else if (type === "rips_indicators") {
        const indicators = generateRIPSIndicators(data);
        formattedData = indicators.map((i) => ({
          Indicador: i.name,
          Valor: i.value,
        }));
      }

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, EXPORT_LABELS[type]);
      XLSX.writeFile(wb, `${type}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch {
      setError(`Error al exportar ${EXPORT_LABELS[type]} a Excel`);
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

    const byCity: Record<string, number> = {};
    data.forEach((d) => {
      const city = (d.destinationCity as string) || "Sin especificar";
      byCity[city] = (byCity[city] || 0) + 1;
    });

    return [
      { name: "Total de Traslados", value: total },
      { name: "Traslados Completados", value: completados },
      { name: "Traslados Pendientes", value: pendientes },
      { name: "Traslados En Proceso", value: enProceso },
      { name: "Traslados Cancelados", value: cancelados },
      { name: "% Completados", value: total > 0 ? `${((completados / total) * 100).toFixed(1)}%` : "0%" },
      { name: "--- Por Institución Destino ---", value: "" },
      ...Object.entries(byInstitution).map(([k, v]) => ({ name: k, value: v })),
      { name: "--- Por Ciudad Destino ---", value: "" },
      ...Object.entries(byCity).map(([k, v]) => ({ name: k, value: v })),
    ];
  };

  const exportOptions = [
    { type: "admissions", description: "Listado completo de admisiones de pacientes", icon: "📋" },
    { type: "transfers", description: "Historial de traslados interinstitucionales", icon: "🚑" },
    { type: "histories", description: "Historias clínicas con diagnósticos y tratamientos", icon: "📝" },
    { type: "rips_indicators", description: "Indicadores de traslado asistencial según norma vigente", icon: "📊" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exportar Información</h1>
        <p className="text-gray-500 text-sm">Descargue reportes y busque historias por paciente</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar Historia por Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
            <input
              type="text"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              placeholder="Ingrese documento"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (opcional)</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchByDocument}
              disabled={searching || !searchDoc.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer"
            >
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
                    <span className="text-sm font-medium text-gray-800">
                      {(r.type as string) === "historia" ? "Historia Clínica" : "Admisión"}:
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      {(r.diagnosis as string) || (r.reason as string) || "-"}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("es-ES") : ""}
                    </span>
                  </div>
                  {(r.type as string) === "historia" && (
                    <button
                      onClick={() => exportSinglePDF(r)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                    >
                      Exportar PDF
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && searchDoc && !searching && !error && (
          <p className="mt-4 text-sm text-gray-400">No se encontraron resultados</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {exportOptions.map((opt) => (
          <div key={opt.type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-2xl">
              {opt.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{EXPORT_LABELS[opt.type]}</h3>
            <p className="text-sm text-gray-500 mb-6">{opt.description}</p>
            <div className="flex gap-3">
              <button
                onClick={() => exportPDF(opt.type)}
                disabled={loading[opt.type + "_pdf"]}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer"
              >
                {loading[opt.type + "_pdf"] ? "..." : "PDF"}
              </button>
              <button
                onClick={() => exportExcel(opt.type)}
                disabled={loading[opt.type + "_excel"]}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer"
              >
                {loading[opt.type + "_excel"] ? "..." : "Excel"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
