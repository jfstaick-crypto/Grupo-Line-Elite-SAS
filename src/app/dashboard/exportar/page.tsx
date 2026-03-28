"use client";

import { useState } from "react";

type ExportType = "admissions" | "transfers" | "histories";

const EXPORT_LABELS: Record<ExportType, string> = {
  admissions: "Admisiones",
  transfers: "Traslados",
  histories: "Historias Clínicas",
};

export default function ExportarPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const fetchData = async (type: ExportType) => {
    const res = await fetch(`/api/exportar?type=${type}`);
    if (!res.ok) throw new Error("Error al obtener datos");
    return res.json();
  };

  const exportPDF = async (type: ExportType) => {
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
        columns = ["Paciente", "Documento", "Razón", "Departamento", "Cama", "Estado"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName} ${d.patientLastName}`,
          d.documentId as string,
          d.reason as string,
          d.department as string,
          (d.bed as string) || "-",
          d.status as string,
        ]);
      } else if (type === "transfers") {
        columns = ["Paciente", "Documento", "Origen", "Destino", "Razón", "Realizado por"];
        rows = data.map((d: Record<string, unknown>) => [
          `${d.patientName} ${d.patientLastName}`,
          d.documentId as string,
          d.fromDepartment as string,
          d.toDepartment as string,
          d.reason as string,
          d.transferredBy as string,
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
      }

      autoTable(doc, {
        startY: 35,
        head: [columns],
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

  const exportExcel = async (type: ExportType) => {
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
          Cama: d.bed || "-",
          Estado: d.status,
        }));
      } else if (type === "transfers") {
        formattedData = data.map((d: Record<string, unknown>) => ({
          Paciente: `${d.patientName} ${d.patientLastName}`,
          Documento: d.documentId,
          "Depto. Origen": d.fromDepartment,
          "Depto. Destino": d.toDepartment,
          Razón: d.reason,
          "Realizado por": d.transferredBy,
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

  const exportOptions: { type: ExportType; description: string }[] = [
    { type: "admissions", description: "Listado completo de admisiones de pacientes" },
    { type: "transfers", description: "Historial de traslados entre departamentos" },
    { type: "histories", description: "Historias clínicas con diagnósticos y tratamientos" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exportar Información</h1>
        <p className="text-gray-500 text-sm">Descargue reportes en formato PDF o Excel</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exportOptions.map((opt) => (
          <div key={opt.type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
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
