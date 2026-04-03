"use client";

import { useState, useEffect } from "react";

interface Receivable {
  id: number;
  invoiceId: number;
  patientId: number;
  documentId: string;
  patientName: string;
  insuranceCompany: string | null;
  contractNumber: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  agingDays: number;
  agingBucket: string;
  agingBucketLabel: string;
  status: string;
  statusLabel: string;
  dueDate: string | null;
  firstBillingDate: string | null;
  lastPaymentDate: string | null;
  paymentCount: number;
  observations: string | null;
  createdAt: string;
}

interface Payment {
  id: number;
  accountReceivableId: number;
  amount: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  bankName: string | null;
  paymentDate: string;
  collectorName: string;
  observations: string | null;
}

interface Summary {
  total: number;
  totalAmount: number;
  totalPending: number;
  totalPaid: number;
  byBucket: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  byInsurance: Record<string, { count: number; amount: number }>;
}

export default function CarteraPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBucket, setFilterBucket] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    bankName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    observations: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchReceivables();
  }, [filterBucket, filterStatus]);

  const fetchReceivables = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterBucket) params.set("bucket", filterBucket);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/cartera?${params}`);
      if (!res.ok) throw new Error("Error al cargar cartera");
      const data = await res.json();
      setReceivables(data.receivables || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (receivableId: number) => {
    try {
      const res = await fetch(`/api/cartera/pagos?receivableId=${receivableId}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch {
      setPayments([]);
    }
  };

  const openPaymentModal = (rec: Receivable) => {
    setSelectedReceivable(rec);
    setPaymentForm({
      amount: rec.pendingAmount,
      paymentMethod: "",
      referenceNumber: "",
      bankName: "",
      paymentDate: new Date().toISOString().split("T")[0],
      observations: "",
    });
    setShowPaymentModal(true);
  };

  const openPaymentsHistory = async (rec: Receivable) => {
    setSelectedReceivable(rec);
    await fetchPayments(rec.id);
    setShowPaymentsModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    setSavingPayment(true);
    try {
      const res = await fetch("/api/cartera/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountReceivableId: selectedReceivable.id,
          amount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod || null,
          paymentMethodCode: paymentForm.paymentMethod === "Efectivo" ? "10" :
                             paymentForm.paymentMethod === "Transferencia" ? "30" :
                             paymentForm.paymentMethod === "Consignación" ? "42" : "ZZZ",
          referenceNumber: paymentForm.referenceNumber || null,
          bankName: paymentForm.bankName || null,
          paymentDate: paymentForm.paymentDate,
          observations: paymentForm.observations || null,
        }),
      });
      if (!res.ok) throw new Error("Error al registrar pago");
      setShowPaymentModal(false);
      fetchReceivables();
    } catch {
      setError("Error al registrar pago");
    } finally {
      setSavingPayment(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch("/api/cartera", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchReceivables();
    } catch {
      setError("Error al actualizar estado");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendiente: "bg-yellow-100 text-yellow-800",
      parcial: "bg-blue-100 text-blue-800",
      pagada: "bg-green-100 text-green-800",
      cobro_judicial: "bg-red-100 text-red-800",
      castigada: "bg-gray-100 text-gray-800",
      negociada: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getBucketColor = (bucket: string) => {
    const colors: Record<string, string> = {
      corriente: "bg-green-100 text-green-800",
      "1_30": "bg-lime-100 text-lime-800",
      "31_60": "bg-yellow-100 text-yellow-800",
      "61_90": "bg-orange-100 text-orange-800",
      "91_180": "bg-red-100 text-red-800",
      "181_360": "bg-red-200 text-red-900",
      mas_360: "bg-red-300 text-red-950",
    };
    return colors[bucket] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cartera</h1>
        <p className="text-gray-500 text-sm">Gestión de cuentas por cobrar - aging por días de mora</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total Cartera</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-gray-500">{summary.total} facturas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Pendiente</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPending)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Pagado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Recuperación</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.totalAmount > 0 ? ((summary.totalPaid / summary.totalAmount) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summary?.byBucket && Object.entries(summary.byBucket).map(([bucket, data]) => (
          <div key={bucket} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getBucketColor(bucket.toLowerCase().replace(" ", "_"))}`}>{bucket}</span>
              <span className="text-sm text-gray-500">{data.count} facturas</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(data.amount)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Antigüedad</label>
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todas</option>
              <option value="corriente">Corriente</option>
              <option value="1_30">1-30 días</option>
              <option value="31_60">31-60 días</option>
              <option value="61_90">61-90 días</option>
              <option value="91_180">91-180 días</option>
              <option value="181_360">181-360 días</option>
              <option value="mas_360">&gt;360 días</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagada">Pagada</option>
              <option value="cobro_judicial">Cobro Judicial</option>
              <option value="castigada">Castigada</option>
              <option value="negociada">Negociada</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button onClick={fetchReceivables} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition cursor-pointer">
            Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EPS/Contrato</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
                <th className="px-4 py-3 right text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Días Mora</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Antigüedad</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : receivables.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No hay cuentas por cobrar</td></tr>
              ) : (
                receivables.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{rec.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{rec.documentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{rec.insuranceCompany || "Particular"}</div>
                      <div className="text-xs text-gray-400">{rec.contractNumber || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">{formatCurrency(rec.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">{formatCurrency(rec.paidAmount)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-bold">{formatCurrency(rec.pendingAmount)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rec.agingDays > 90 ? "bg-red-100 text-red-800" : rec.agingDays > 30 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                        {rec.agingDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBucketColor(rec.agingBucket)}`}>
                        {rec.agingBucketLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(rec.status)}`}>
                        {rec.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {rec.status !== "pagada" && (
                          <button onClick={() => openPaymentModal(rec)} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium transition cursor-pointer">
                            Cobrar
                          </button>
                        )}
                        {rec.paymentCount > 0 && (
                          <button onClick={() => openPaymentsHistory(rec)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition cursor-pointer">
                            Ver Pagos
                          </button>
                        )}
                        <select
                          value={rec.status}
                          onChange={(e) => updateStatus(rec.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="parcial">Parcial</option>
                          <option value="pagada">Pagada</option>
                          <option value="cobro_judicial">Cobro Judicial</option>
                          <option value="castigada">Castigada</option>
                          <option value="negociada">Negociada</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedReceivable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Pago</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Paciente: <span className="font-medium text-gray-800">{selectedReceivable.patientName}</span></p>
              <p className="text-sm text-gray-600">Pendiente: <span className="font-medium text-red-600">{formatCurrency(selectedReceivable.pendingAmount)}</span></p>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Consignación">Consignación</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                <input
                  type="text"
                  value={paymentForm.bankName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Referencia</label>
                <input
                  type="text"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={paymentForm.observations}
                  onChange={(e) => setPaymentForm({ ...paymentForm, observations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={savingPayment} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 cursor-pointer">
                  {savingPayment ? "Guardando..." : "Guardar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentsModal && selectedReceivable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Historial de Pagos</h3>
              <button onClick={() => setShowPaymentsModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Paciente: <span className="font-medium text-gray-800">{selectedReceivable.patientName}</span></p>
              <p className="text-sm text-gray-600">Documento: <span className="font-medium text-gray-800">{selectedReceivable.documentId}</span></p>
              <p className="text-sm text-gray-600">Total Factura: <span className="font-medium text-gray-800">{formatCurrency(selectedReceivable.totalAmount)}</span></p>
              <p className="text-sm text-gray-600">Total Pagado: <span className="font-medium text-green-600">{formatCurrency(selectedReceivable.paidAmount)}</span></p>
              <p className="text-sm text-gray-600">Pendiente: <span className="font-medium text-red-600">{formatCurrency(selectedReceivable.pendingAmount)}</span></p>
            </div>
            {payments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay pagos registrados</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-500">{new Date(p.paymentDate).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs text-gray-500">Cobrado por: {p.collectorName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{p.paymentMethod || "Sin método"}</span>
                        {p.referenceNumber && <p className="text-xs text-gray-500 mt-1">Ref: {p.referenceNumber}</p>}
                      </div>
                    </div>
                    {p.observations && <p className="text-xs text-gray-500 mt-2">Obs: {p.observations}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}