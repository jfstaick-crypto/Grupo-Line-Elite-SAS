"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoicePrefix: string | null;
  invoiceType: string | null;
  patientId: number;
  diagnosisCode: string | null;
  diagnosis: string | null;
  contractNumber: string | null;
  paymentModality: string | null;
  benefitPlan: string | null;
  currency: string | null;
  subtotal: string;
  discount: string | null;
  tax: string;
  total: string;
  status: string;
  paymentMethod: string | null;
  paymentMethodCode: string | null;
  insuranceCompany: string | null;
  authorizationNumber: string | null;
  notes: string | null;
  dueDate: string | null;
  cufe: string | null;
  cuv: string | null;
  dianStatus: string | null;
  ripsStatus: string | null;
  createdAt: string;
  paidAt: string | null;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  createdByName: string | null;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  insurance: string | null;
}

const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Tarjeta", "Consignación", "EPS", "Otro"];

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patientId: 0,
    date: "",
    admissionId: 0,
    transferId: 0,
    cupsCode: "",
    cupsDescription: "",
    diagnosis: "",
    subtotal: "",
    tax: "0",
    total: "",
    paymentMethod: "EPS",
    insuranceCompany: "",
    authorizationNumber: "",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [invRes, patRes] = await Promise.all([
        fetch("/api/facturas"),
        fetch("/api/pacientes"),
      ]);
      if (!cancelled) {
        if (invRes.ok) setInvoices(await invRes.json());
        if (patRes.ok) setPatients(await patRes.json());
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!form.patientId || !form.date) return;
    let cancelled = false;
    const fetchDatos = async () => {
      const res = await fetch(
        `/api/facturas/buscar-datos?patientId=${form.patientId}&date=${form.date}`
      );
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const hc = data.histories?.[0];
      const tr = data.transfers?.[0];
      if (hc || tr) {
        setForm((prev) => ({
          ...prev,
          admissionId: hc?.admissionId || prev.admissionId,
          transferId: tr?.id || prev.transferId,
          cupsCode: tr?.cupsCode || "",
          cupsDescription: tr?.cupsDescription || "",
          diagnosis: hc?.diagnosis || tr?.diagnosis || "",
          subtotal: tr?.value || prev.subtotal,
          authorizationNumber:
            tr?.authorizationNumber || prev.authorizationNumber,
          insuranceCompany: tr?.responsibleEntity || prev.insuranceCompany,
        }));
      }
    };
    fetchDatos();
    return () => { cancelled = true; };
  }, [form.patientId, form.date]);

  const calculateTotal = () => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    const total = sub + (sub * tax / 100);
    setForm({ ...form, total: total.toFixed(2) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.patientId || !form.subtotal) {
      setError("Paciente y subtotal son requeridos");
      return;
    }

    const res = await fetch("/api/facturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(`Factura ${data.invoiceNumber} creada exitosamente`);
    setShowForm(false);
    setForm({
      patientId: 0, date: "", admissionId: 0, transferId: 0,
      cupsCode: "", cupsDescription: "", diagnosis: "",
      subtotal: "", tax: "0", total: "", paymentMethod: "EPS",
      insuranceCompany: "", authorizationNumber: "", notes: "",
    });
    const invRes = await fetch("/api/facturas");
    if (invRes.ok) setInvoices(await invRes.json());
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch("/api/facturas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const invRes = await fetch("/api/facturas");
    if (invRes.ok) setInvoices(await invRes.json());
  };

  const addToCartera = async (invoiceId: number) => {
    const res = await fetch("/api/cartera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    if (res.ok) {
      setSuccess("Factura agregada a cartera exitosamente");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Error al agregar a cartera");
      setTimeout(() => setError(""), 3000);
    }
  };

  const exportInvoicePDF = async (inv: Invoice) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const companyRes = await fetch("/api/empresa");
    const company = companyRes.ok ? await companyRes.json() : null;

    const linesRes = await fetch(`/api/facturas?invoiceId=${inv.id}`);
    const invLines = linesRes.ok ? await linesRes.json() : [];

    let y = 15;
    if (company?.logo) {
      try { doc.addImage(company.logo, "JPEG", 14, y - 5, 20, 20); } catch {}
    }
    const x = company?.logo ? 38 : 14;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name || "EMPRESA DE SALUD", x, y);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const nitStr = company?.nitDigitVerifier
      ? `${company.nit}-${company.nitDigitVerifier}`
      : company?.nit || "N/A";
    doc.text(`NIT: ${nitStr}  |  Habilitación: ${company?.habilitacionCode || "N/A"}`, x, y + 5);
    if (company?.taxRegime) doc.text(`Régimen: ${company.taxRegime}  |  CIIU: ${company?.ciiuCode || "-"}`, x, y + 8);
    doc.text(`${company?.address || ""} - ${company?.department || ""} - ${company?.city || ""}`, x, y + 11);
    doc.text(`Tel: ${company?.phone || ""}  |  Email: ${company?.email || ""}`, x, y + 14);

    y += 20;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURA ELECTRÓNICA DE VENTA", 105, y, { align: "center" });
    y += 7;
    doc.setFontSize(10);
    doc.text(`${inv.invoiceNumber}`, 105, y, { align: "center" });
    if (inv.cufe) {
      y += 5;
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`CUFE: ${inv.cufe}`, 105, y, { align: "center" });
    }
    y += 8;

    doc.setFontSize(9);
    const addField = (label: string, value: string) => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", 70, y);
      y += 5;
    };

    addField("Fecha Emisión", new Date(inv.createdAt).toLocaleDateString("es-ES"));
    addField("Tipo Factura", inv.invoiceType === "01" ? "Factura de Venta" : inv.invoiceType || "-");
    addField("Moneda", inv.currency || "COP");
    if (inv.dueDate) addField("Fecha Vencimiento", new Date(inv.dueDate).toLocaleDateString("es-ES"));

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("DATOS DEL PACIENTE", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
    doc.setFontSize(8);
    addField("Paciente", `${inv.patientFirstName} ${inv.patientLastName}`);
    addField("Documento", inv.patientDocumentId || "-");
    if (inv.insuranceCompany) addField("EPS / Entidad", inv.insuranceCompany);
    if (inv.authorizationNumber) addField("N° Autorización", inv.authorizationNumber);
    if (inv.contractNumber) addField("N° Contrato", inv.contractNumber);
    if (inv.paymentModality) addField("Modalidad Pago", inv.paymentModality);
    if (inv.benefitPlan) addField("Plan de Beneficios", inv.benefitPlan);

    y += 2;
    if (inv.diagnosisCode || inv.diagnosis) {
      doc.line(14, y, 196, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("DIAGNÓSTICO", 14, y);
      doc.setTextColor(0, 0, 0);
      y += 5;
      if (inv.diagnosisCode) addField("CIE-10", inv.diagnosisCode);
      addField("Descripción", inv.diagnosis || "-");
    }

    y += 3;
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("DETALLE DE SERVICIOS", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 5;

    if (invLines.length > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("#", 14, y);
      doc.text("CUPS", 22, y);
      doc.text("Descripción", 50, y);
      doc.text("CIE-10", 110, y);
      doc.text("Cant", 135, y);
      doc.text("Vr. Unit", 148, y);
      doc.text("IVA", 168, y);
      doc.text("Total", 182, y);
      y += 4;
      doc.setDrawColor(150, 150, 150);
      doc.line(14, y, 196, y);
      y += 3;

      doc.setFont("helvetica", "normal");
      invLines.forEach((line: Record<string, unknown>) => {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.text(String(line.lineNumber || "-"), 14, y);
        doc.text((line.cupsCode as string) || "-", 22, y);
        const desc = doc.splitTextToSize((line.cupsDescription as string) || "-", 58);
        doc.text(desc[0] || "-", 50, y);
        doc.text((line.cie10Code as string) || "-", 110, y);
        doc.text(String(line.quantity || "1"), 135, y);
        doc.text(`$${parseFloat((line.unitPrice as string) || "0").toLocaleString("es-CO")}`, 148, y);
        doc.text(`${line.taxRate || "0"}%`, 168, y);
        doc.text(`$${parseFloat((line.totalLine as string) || "0").toLocaleString("es-CO")}`, 182, y);
        y += 5;
      });
    } else {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Sin detalle de líneas registrado", 14, y);
      y += 5;
    }

    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(120, y, 196, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const addTotal = (label: string, value: string) => {
      doc.text(`${label}:`, 140, y);
      doc.setFont("helvetica", "bold");
      doc.text(value, 196, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 5;
    };

    addTotal("Subtotal", `$${parseFloat(inv.subtotal).toLocaleString("es-CO")}`);
    if (inv.discount && parseFloat(inv.discount) > 0) {
      addTotal("Descuento", `$${parseFloat(inv.discount).toLocaleString("es-CO")}`);
    }
    addTotal("IVA", `$${parseFloat(inv.tax).toLocaleString("es-CO")}`);
    y += 2;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL A PAGAR:", 120, y);
    doc.text(`$${parseFloat(inv.total).toLocaleString("es-CO")} ${inv.currency || "COP"}`, 196, y, { align: "right" });
    y += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const statusLabel = inv.status === "pagada" ? "PAGADA" : inv.status === "anulada" ? "ANULADA" : "PENDIENTE";
    doc.text(`Estado: ${statusLabel}`, 14, y);
    if (inv.paymentMethod) doc.text(`Método de pago: ${inv.paymentMethod}`, 14, y + 4);
    if (inv.cuv) doc.text(`CUV RIPS: ${inv.cuv}`, 14, y + 8);

    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturación</h1>
          <p className="text-gray-500 text-sm">Gestión de facturas y cobros</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nueva Factura
        </button>
      </div>

      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Factura</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  value={form.patientId}
                  onChange={(e) => {
                    const pat = patients.find(p => p.id === parseInt(e.target.value));
                    setForm({ ...form, patientId: parseInt(e.target.value), insuranceCompany: pat?.insurance || "" });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  required
                >
                  <option value={0}>Seleccione un paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.documentId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código CUPS</label>
                <input type="text" value={form.cupsCode} onChange={(e) => setForm({ ...form, cupsCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción CUPS</label>
                <input type="text" value={form.cupsDescription} onChange={(e) => setForm({ ...form, cupsDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <input type="text" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal ($)</label>
                <input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} onBlur={calculateTotal} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                <input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} onBlur={calculateTotal} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total ($)</label>
                <input type="number" value={form.total} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPS / Aseguradora</label>
                <input type="text" value={form.insuranceCompany} onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Autorización</label>
                <input type="text" value={form.authorizationNumber} onChange={(e) => setForm({ ...form, authorizationNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Factura</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Factura</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Documento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Diagnóstico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800 font-mono">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{inv.patientFirstName} {inv.patientLastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.patientDocumentId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.diagnosisCode || inv.diagnosis || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">${parseFloat(inv.total).toLocaleString("es-CO")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    inv.status === "pagada" ? "bg-green-50 text-green-700" :
                    inv.status === "anulada" ? "bg-red-50 text-red-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>
                    {inv.status === "pagada" ? "Pagada" : inv.status === "anulada" ? "Anulada" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => exportInvoicePDF(inv)} className="text-red-600 hover:text-red-800 text-xs cursor-pointer">PDF</button>
                  <button onClick={() => addToCartera(inv.id)} className="text-blue-600 hover:text-blue-800 text-xs cursor-pointer">→ Cartera</button>
                  {inv.status === "pendiente" && (
                    <>
                      <button onClick={() => handleStatusChange(inv.id, "pagada")} className="text-green-600 hover:text-green-800 text-xs cursor-pointer">Pagar</button>
                      <button onClick={() => handleStatusChange(inv.id, "anulada")} className="text-gray-600 hover:text-gray-800 text-xs cursor-pointer">Anular</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-8 text-gray-400">No hay facturas registradas</div>
        )}
      </div>
    </div>
  );
}
