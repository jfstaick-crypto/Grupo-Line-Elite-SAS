"use client";

import { useState, useEffect } from "react";

interface Schedule {
  id: number;
  scheduleType: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  ambulanceId: number | null;
  assignedUserId: number | null;
  status: string;
  observations: string | null;
  createdAt: string;
}

interface Ambulance {
  id: number;
  plate: string;
}

const TYPE_OPTIONS = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "servicio", label: "Servicio de Traslado" },
  { value: "capacitacion", label: "Capacitación" },
  { value: "auditoria", label: "Auditoría" },
  { value: "otro", label: "Otro" },
];

const STATUS_OPTIONS = [
  { value: "programado", label: "Programado", color: "bg-blue-100" },
  { value: "en_curso", label: "En Curso", color: "bg-yellow-100" },
  { value: "completado", label: "Completado", color: "bg-green-100" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100" },
];

export default function AgendaPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [summary, setSummary] = useState<{ total: number; programados: number; en_curso: number; completados: number; cancelados: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    scheduleType: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    ambulanceId: 0,
    observations: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchAmbulances();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agenda");
      if (!res.ok) throw new Error("Error al cargar agenda");
      const data = await res.json();
      setSchedules(data.schedules || []);
      setSummary(data.summary);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchAmbulances = async () => {
    try {
      const res = await fetch("/api/flota/ambulancias");
      if (res.ok) {
        const data = await res.json();
        setAmbulances(data.ambulances || []);
      }
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduleType || !form.title || !form.startDate) {
      setError("Tipo, título y fecha de inicio son requeridos");
      return;
    }

    const res = await fetch("/api/agenda", {
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
      scheduleType: "", title: "", description: "",
      startDate: "", endDate: "", ambulanceId: 0, observations: "",
    });
    fetchSchedules();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/agenda", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchSchedules();
  };

  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-100";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda y Programación</h1>
          <p className="text-gray-500 text-sm">Programación de servicios, mantenimientos y actividades</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Nueva Actividad
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Programados</p>
            <p className="text-2xl font-bold text-blue-600">{summary.programados}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">En Curso</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.en_curso}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Completados</p>
            <p className="text-2xl font-bold text-green-600">{summary.completados}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">{summary.cancelados}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Actividad</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambulancia</label>
                <select value={form.ambulanceId} onChange={(e) => setForm({ ...form, ambulanceId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value={0}>Seleccionar...</option>
                  {ambulances.map(a => <option key={a.id} value={a.id}>{a.plate}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Actividad</button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ambulancia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay actividades programadas</td></tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">{TYPE_OPTIONS.find(t => t.value === s.scheduleType)?.label || s.scheduleType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.ambulanceId ? ambulances.find(a => a.id === s.ambulanceId)?.plate || "N/A" : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.startDate ? new Date(s.startDate).toLocaleString("es-ES") : "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.endDate ? new Date(s.endDate).toLocaleString("es-ES") : "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(s.status)}`}>{STATUS_OPTIONS.find(st => st.value === s.status)?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs cursor-pointer">
                        {STATUS_OPTIONS.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}