"use client";

import { useState, useEffect } from "react";

interface Incident {
  id: number;
  incidentType: string;
  severity: string;
  incidentDate: string;
  location: string | null;
  patientName: string | null;
  ambulancePlate: string | null;
  description: string;
  causes: string | null;
  consequences: string | null;
  immediateActions: string | null;
  recommendations: string | null;
  reportedBy: number;
  status: string;
  investigationReport: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "accidente", label: "Accidente de tránsito" },
  { value: "caida", label: "Caída de paciente" },
  { value: "equipo", label: "Falla de equipo" },
  { value: "medicamento", label: "Evento adverso por medicamento" },
  { value: "personal", label: "Incidente con personal" },
  { value: "vehiculo", label: "Incidente vehicular" },
  { value: "otro", label: "Otro" },
];

const SEVERITY_OPTIONS = [
  { value: "critico", label: "Crítico", color: "bg-red-200 text-red-900" },
  { value: "grave", label: "Grave", color: "bg-orange-200 text-orange-900" },
  { value: "leve", label: "Leve", color: "bg-yellow-200 text-yellow-900" },
];

const STATUS_OPTIONS = [
  { value: "en_investigacion", label: "En Investigación", color: "bg-blue-100" },
  { value: "pendiente_accion", label: "Pendiente Acción", color: "bg-yellow-100" },
  { value: "cerrado", label: "Cerrado", color: "bg-green-100" },
];

export default function IncidentesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<{ total: number; en_investigacion: number; pendiente_accion: number; cerrado: number; criticos: number; graves: number; leves: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [investigationReport, setInvestigationReport] = useState("");

  const [form, setForm] = useState({
    incidentType: "",
    severity: "",
    incidentDate: new Date().toISOString().split("T")[0],
    location: "",
    patientName: "",
    ambulancePlate: "",
    description: "",
    causes: "",
    consequences: "",
    immediateActions: "",
    recommendations: "",
  });

  useEffect(() => {
    fetchIncidents();
  }, [filterStatus]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/incidentes${params}`);
      if (!res.ok) throw new Error("Error al cargar incidentes");
      const data = await res.json();
      setIncidents(data.incidents || []);
      setSummary(data.summary);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.incidentType || !form.severity || !form.description) {
      setError("Tipo, severidad y descripción son requeridos");
      return;
    }

    const res = await fetch("/api/incidentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear");
      return;
    }

    setShowForm(false);
    setForm({
      incidentType: "", severity: "", incidentDate: new Date().toISOString().split("T")[0],
      location: "", patientName: "", ambulancePlate: "", description: "",
      causes: "", consequences: "", immediateActions: "", recommendations: "",
    });
    fetchIncidents();
  };

  const handleClose = async (id: number) => {
    await fetch("/api/incidentes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cerrado", investigationReport }),
    });
    setSelectedIncident(null);
    setInvestigationReport("");
    fetchIncidents();
  };

  const getSeverityColor = (severity: string) => SEVERITY_OPTIONS.find(s => s.value === severity)?.color || "bg-gray-100";
  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-100";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Incidentes</h1>
          <p className="text-gray-500 text-sm">Registro de eventos adversos e incidentes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Reportar Incidente
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">En Investigación</p>
            <p className="text-2xl font-bold text-blue-600">{summary.en_investigacion}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Pendiente</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendiente_accion}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Cerrados</p>
            <p className="text-2xl font-bold text-green-600">{summary.cerrado}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Críticos</p>
            <p className="text-2xl font-bold text-red-700">{summary.criticos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Graves</p>
            <p className="text-2xl font-bold text-orange-700">{summary.graves}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Leves</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.leves}</p>
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
          <button onClick={fetchIncidents} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition cursor-pointer">Actualizar</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reportar Incidente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severidad *</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {SEVERITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa Ambulancia</label>
                <input type="text" value={form.ambulancePlate} onChange={(e) => setForm({ ...form, ambulancePlate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Paciente</label>
                <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Incidente *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Causas</label>
                <textarea value={form.causes} onChange={(e) => setForm({ ...form, causes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consecuencias</label>
                <textarea value={form.consequences} onChange={(e) => setForm({ ...form, consequences: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acciones Inmediatas</label>
                <textarea value={form.immediateActions} onChange={(e) => setForm({ ...form, immediateActions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones</label>
              <textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Reportar Incidente</button>
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Severidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : incidents.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay incidentes registrados</td></tr>
              ) : (
                incidents.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{TYPE_OPTIONS.find(t => t.value === i.incidentType)?.label || i.incidentType}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(i.severity)}`}>{SEVERITY_OPTIONS.find(s => s.value === i.severity)?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{i.location || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{i.patientName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{i.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(i.status)}`}>{STATUS_OPTIONS.find(s => s.value === i.status)?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(i.incidentDate).toLocaleDateString("es-ES")}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedIncident(i)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs cursor-pointer">Ver</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">Detalle del Incidente</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Tipo</p><p className="text-sm font-medium">{TYPE_OPTIONS.find(t => t.value === selectedIncident.incidentType)?.label}</p></div>
                <div><p className="text-xs text-gray-500">Severidad</p><span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedIncident.severity)}`}>{SEVERITY_OPTIONS.find(s => s.value === selectedIncident.severity)?.label}</span></div>
                <div><p className="text-xs text-gray-500">Fecha</p><p className="text-sm font-medium">{new Date(selectedIncident.incidentDate).toLocaleString("es-ES")}</p></div>
                <div><p className="text-xs text-gray-500">Estado</p><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedIncident.status)}`}>{STATUS_OPTIONS.find(s => s.value === selectedIncident.status)?.label}</span></div>
                <div><p className="text-xs text-gray-500">Ubicación</p><p className="text-sm">{selectedIncident.location || "-"}</p></div>
                <div><p className="text-xs text-gray-500">Ambulancia</p><p className="text-sm">{selectedIncident.ambulancePlate || "-"}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Descripción</p><p className="text-sm bg-gray-50 p-3 rounded">{selectedIncident.description}</p></div>
              {selectedIncident.causes && <div><p className="text-xs text-gray-500">Causas</p><p className="text-sm">{selectedIncident.causes}</p></div>}
              {selectedIncident.consequences && <div><p className="text-xs text-gray-500">Consecuencias</p><p className="text-sm">{selectedIncident.consequences}</p></div>}
              {selectedIncident.immediateActions && <div><p className="text-xs text-gray-500">Acciones Inmediatas</p><p className="text-sm">{selectedIncident.immediateActions}</p></div>}
              {selectedIncident.recommendations && <div><p className="text-xs text-gray-500">Recomendaciones</p><p className="text-sm">{selectedIncident.recommendations}</p></div>}
              {selectedIncident.status !== "cerrado" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Informe de Investigación</label>
                  <textarea value={investigationReport} onChange={(e) => setInvestigationReport(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Informe final..." />
                  <button onClick={() => handleClose(selectedIncident.id)} disabled={!investigationReport} className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">Cerrar Incidente</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}