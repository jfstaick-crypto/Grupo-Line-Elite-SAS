"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  patientId: number;
  cupsCode: string | null;
  cupsDescription: string | null;
  diagnosis: string | null;
  subtotal: string;
  tax: string;
  total: string;
  status: string;
  paymentMethod: string | null;
  insuranceCompany: string | null;
  authorizationNumber: string | null;
  notes: string | null;
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

  const exportInvoicePDF = async (inv: Invoice) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const companyRes = await fetch("/api/empresa");
    const company = companyRes.ok ? await companyRes.json() : null;

    let y = 15;
    if (company?.logo) {
      try { doc.addImage(company.logo, "JPEG", 14, y - 5, 20, 20); } catch {}
    }
    const x = company?.logo ? 38 : 14;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name || "EMPRESA DE SALUD", x, y);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${company?.nit || "N/A"} | Habilitación: ${company?.habilitacionCode || "N/A"}`, x, y + 5);
    doc.text(`${company?.address || ""} - ${company?.city || ""}`, x, y + 9);
    doc.text(`Tel: ${company?.phone || ""} | Email: ${company?.email || ""}`, x, y + 13);

    y += 22;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURA DE SERVICIOS", 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(12);
    doc.text(`N° ${inv.invoiceNumber}`, 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const addField = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", 70, y);
      y += 6;
    };

    addField("Fecha", new Date(inv.createdAt).toLocaleDateString("es-ES"));
    addField("Paciente", `${inv.patientFirstName} ${inv.patientLastName}`);
    addField("Documento", inv.patientDocumentId || "-");
    if (inv.diagnosis) addField("Diagnóstico", inv.diagnosis);
    if (inv.cupsCode) addField("CUPS", `${inv.cupsCode} - ${inv.cupsDescription || ""}`);
    if (inv.authorizationNumber) addField("N° Autorización", inv.authorizationNumber);
    if (inv.insuranceCompany) addField("EPS", inv.insuranceCompany);

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 130, y);
    doc.text(`$${parseFloat(inv.subtotal).toLocaleString("es-CO")}`, 196, y, { align: "right" });
    y += 6;
    doc.text("IVA:", 130, y);
    doc.text(`${inv.tax}%`, 196, y, { align: "right" });
    y += 6;
    doc.setFontSize(12);
    doc.text("TOTAL:", 130, y);
    doc.text(`$${parseFloat(inv.total).toLocaleString("es-CO")}`, 196, y, { align: "right" });
    y += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Estado: ${inv.status === "pagada" ? "PAGADA" : "PENDIENTE"}`, 14, y);
    if (inv.paymentMethod) doc.text(`Método de pago: ${inv.paymentMethod}`, 14, y + 5);

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
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CUPS</th>
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
                <td className="px-4 py-3 text-sm text-gray-600">{inv.cupsCode || "-"}</td>
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
