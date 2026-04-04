"use client";

import { useState, useEffect } from "react";

interface Pqrs {
  id: number;
  type: string;
  category: string;
  priority: string;
  patientDocumentId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  patientEmail: string | null;
  subject: string;
  description: string;
  relatedModule: string | null;
  status: string;
  response: string | null;
  responseDate: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "peticion", label: "Petición" },
  { value: "queja", label: "Queja" },
  { value: "reclamo", label: "Reclamo" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "denuncia", label: "Denuncia" },
];

const CATEGORY_OPTIONS = [
  { value: "atencion", label: "Atención al usuario" },
  { value: "servicio", label: "Calidad del servicio" },
  { value: "facturacion", label: "Facturación" },
  { value: "transporte", label: "Transporte" },
  { value: "personal", label: "Personal" },
  { value: "instalaciones", label: "Instalaciones" },
  { value: "otro", label: "Otro" },
];

const PRIORITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_OPTIONS = [
  { value: "recibido", label: "Recibido", color: "bg-gray-100" },
  { value: "en_proceso", label: "En Proceso", color: "bg-blue-100" },
  { value: "respondido", label: "Respondido", color: "bg-yellow-100" },
  { value: "cerrado", label: "Cerrado", color: "bg-green-100" },
];

export default function PqrsPage() {
  const [pqrsList, setPqrsList] = useState<Pqrs[]>([]);
  const [summary, setSummary] = useState<{ total: number; recibidos: number; en_proceso: number; respondidos: number; cerrados: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedPqrs, setSelectedPqrs] = useState<Pqrs | null>(null);
  const [responseText, setResponseText] = useState("");

  const [form, setForm] = useState({
    type: "",
    category: "",
    priority: "normal",
    patientDocumentId: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    fetchPqrs();
  }, [filterStatus]);

  const fetchPqrs = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/pqrs${params}`);
      if (!res.ok) throw new Error("Error al cargar PQRS");
      const data = await res.json();
      setPqrsList(data.pqrs || []);
      setSummary(data.summary);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.category || !form.subject || !form.description) {
      setError("Todos los campos obligatorios deben completarse");
      return;
    }

    const res = await fetch("/api/pqrs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear");
      return;
    }

    setSuccess("PQRS creado exitosamente");
    setShowForm(false);
    setForm({ type: "", category: "", priority: "normal", patientDocumentId: "", patientName: "", patientPhone: "", patientEmail: "", subject: "", description: "" });
    fetchPqrs();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleRespond = async () => {
    if (!selectedPqrs || !responseText) return;

    const res = await fetch("/api/pqrs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedPqrs.id, status: "respondido", response: responseText }),
    });

    if (res.ok) {
      setSelectedPqrs(null);
      setResponseText("");
      fetchPqrs();
      setSuccess("Respuesta enviada exitosamente");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleClose = async (id: number) => {
    await fetch("/api/pqrs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cerrado" }),
    });
    fetchPqrs();
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      baja: "bg-green-100 text-green-800",
      normal: "bg-blue-100 text-blue-800",
      alta: "bg-yellow-100 text-yellow-800",
      urgente: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100";
  };

  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-100";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PQRS</h1>
          <p className="text-gray-500 text-sm">Peticiones, Quejas, Reclamos, Sugerencias y Denuncias</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Nuevo PQRS
        </button>
      </div>

      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Recibidos</p>
            <p className="text-2xl font-bold text-gray-600">{summary.recibidos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600">{summary.en_proceso}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Respondidos</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.respondidos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Cerrados</p>
            <p className="text-2xl font-bold text-green-600">{summary.cerrados}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Filtrar por Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Todos</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={fetchPqrs} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition cursor-pointer">Actualizar</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nuevo PQRS</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento Paciente</label>
                <input type="text" value={form.patientDocumentId} onChange={(e) => setForm({ ...form, patientDocumentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Paciente</label>
                <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={4} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear PQRS</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asunto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : pqrsList.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay PQRS registrados</td></tr>
              ) : (
                pqrsList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">{TYPE_OPTIONS.find(t => t.value === p.type)?.label || p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{CATEGORY_OPTIONS.find(c => c.value === p.category)?.label || p.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{p.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.patientName || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(p.priority)}`}>{PRIORITY_OPTIONS.find(pr => pr.value === p.priority)?.label || p.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(p.status)}`}>{STATUS_OPTIONS.find(s => s.value === p.status)?.label || p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString("es-ES")}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setSelectedPqrs(p)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs cursor-pointer">Ver</button>
                        {p.status !== "cerrado" && <button onClick={() => handleClose(p.id)} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs cursor-pointer">Cerrar</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPqrs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">Detalle PQRS</h3>
              <button onClick={() => setSelectedPqrs(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Tipo</p><p className="text-sm font-medium">{TYPE_OPTIONS.find(t => t.value === selectedPqrs.type)?.label}</p></div>
                <div><p className="text-xs text-gray-500">Categoría</p><p className="text-sm font-medium">{CATEGORY_OPTIONS.find(c => c.value === selectedPqrs.category)?.label}</p></div>
                <div><p className="text-xs text-gray-500">Prioridad</p><p className="text-sm font-medium">{PRIORITY_OPTIONS.find(p => p.value === selectedPqrs.priority)?.label}</p></div>
                <div><p className="text-xs text-gray-500">Estado</p><p className="text-sm font-medium">{STATUS_OPTIONS.find(s => s.value === selectedPqrs.status)?.label}</p></div>
                <div><p className="text-xs text-gray-500">Fecha</p><p className="text-sm font-medium">{new Date(selectedPqrs.createdAt).toLocaleString("es-ES")}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Asunto</p><p className="text-sm font-medium">{selectedPqrs.subject}</p></div>
              <div><p className="text-xs text-gray-500">Descripción</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedPqrs.description}</p></div>
              {selectedPqrs.patientName && (
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Paciente</p><p className="text-sm">{selectedPqrs.patientName}</p></div>
                  <div><p className="text-xs text-gray-500">Documento</p><p className="text-sm">{selectedPqrs.patientDocumentId || "-"}</p></div>
                  <div><p className="text-xs text-gray-500">Teléfono</p><p className="text-sm">{selectedPqrs.patientPhone || "-"}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="text-sm">{selectedPqrs.patientEmail || "-"}</p></div>
                </div>
              )}
              {selectedPqrs.response && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Respuesta</p>
                  <div className="bg-green-50 p-3 rounded text-sm">{selectedPqrs.response}</div>
                  {selectedPqrs.responseDate && <p className="text-xs text-gray-400 mt-1">Respondido: {new Date(selectedPqrs.responseDate).toLocaleString("es-ES")}</p>}
                </div>
              )}
              {selectedPqrs.status !== "cerrado" && selectedPqrs.status !== "respondido" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responder</label>
                  <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Escriba la respuesta..." />
                  <button onClick={handleRespond} disabled={!responseText} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">Enviar Respuesta</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}