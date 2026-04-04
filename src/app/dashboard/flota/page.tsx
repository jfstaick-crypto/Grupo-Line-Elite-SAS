"use client";

import { useState, useEffect } from "react";

interface Ambulance {
  id: number;
  plate: string;
  brand: string;
  model: string;
  type: string;
  year: number | null;
  soatNumber: string | null;
  soatExpiration: string | null;
  rtmcNumber: string | null;
  rtmcExpiration: string | null;
  habilitacionNumber: string | null;
  habilitacionExpiration: string | null;
  licensePlate: string | null;
  licenseExpiration: string | null;
  status: string;
  currentKm: number | null;
  insuranceCompany: string | null;
  policyNumber: string | null;
  equipmentKit: string | null;
  observations: string | null;
  createdAt: string;
}

const AMBULANCE_TYPES = [
  { value: "TAM", label: "TAM - Transporte de Atención Médica" },
  { value: "TAB", label: "TAB - Transporte de Atención Básica" },
];

const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "bg-green-100 text-green-800" },
  { value: "en_servicio", label: "En Servicio", color: "bg-blue-100 text-blue-800" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-yellow-100 text-yellow-800" },
  { value: "fuera_servicio", label: "Fuera de Servicio", color: "bg-red-100 text-red-800" },
];

export default function FlotaPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [summary, setSummary] = useState<{ total: number; disponibles: number; en_servicio: number; mantenimiento: number; fuera_servicio: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    plate: "",
    brand: "",
    model: "",
    type: "TAM",
    year: "",
    soatNumber: "",
    soatExpiration: "",
    rtmcNumber: "",
    rtmcExpiration: "",
    habilitacionNumber: "",
    habilitacionExpiration: "",
    licensePlate: "",
    licenseExpiration: "",
    insuranceCompany: "",
    policyNumber: "",
    insuranceExpiration: "",
    equipmentKit: "",
    observations: "",
  });

  useEffect(() => {
    fetchAmbulances();
  }, [filterStatus]);

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/flota/ambulancias${params}`);
      if (!res.ok) throw new Error("Error al cargar ambulancias");
      const data = await res.json();
      setAmbulances(data.ambulances || []);
      setSummary(data.summary);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate || !form.brand || !form.model || !form.type) {
      setError("Placa, marca, modelo y tipo son requeridos");
      return;
    }

    const res = await fetch("/api/flota/ambulancias", {
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
      plate: "", brand: "", model: "", type: "TAM", year: "",
      soatNumber: "", soatExpiration: "", rtmcNumber: "", rtmcExpiration: "",
      habilitacionNumber: "", habilitacionExpiration: "", licensePlate: "", licenseExpiration: "",
      insuranceCompany: "", policyNumber: "", insuranceExpiration: "",
      equipmentKit: "", observations: "",
    });
    fetchAmbulances();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/flota/ambulancias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchAmbulances();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES");
  };

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-100";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Flota de Ambulancias</h1>
          <p className="text-gray-500 text-sm">Gestión de vehículos, licencias y mantenimiento</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Nueva Ambulancia
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total Flota</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{summary.disponibles}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">En Servicio</p>
            <p className="text-2xl font-bold text-blue-600">{summary.en_servicio}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Mantenimiento</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.mantenimiento}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Fuera de Servicio</p>
            <p className="text-2xl font-bold text-red-600">{summary.fuera_servicio}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Filtrar por Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Todas</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={fetchAmbulances} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition cursor-pointer">Actualizar</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Ambulancia</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
                <input type="text" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {AMBULANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° SOAT</label>
                <input type="text" value={form.soatNumber} onChange={(e) => setForm({ ...form, soatNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venc. SOAT</label>
                <input type="date" value={form.soatExpiration} onChange={(e) => setForm({ ...form, soatExpiration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° RTMC</label>
                <input type="text" value={form.rtmcNumber} onChange={(e) => setForm({ ...form, rtmcNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venc. RTMC</label>
                <input type="date" value={form.rtmcExpiration} onChange={(e) => setForm({ ...form, rtmcExpiration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Habilitación</label>
                <input type="text" value={form.habilitacionNumber} onChange={(e) => setForm({ ...form, habilitacionNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venc. Habilitación</label>
                <input type="date" value={form.habilitacionExpiration} onChange={(e) => setForm({ ...form, habilitacionExpiration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Licencia</label>
                <input type="text" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venc. Licencia</label>
                <input type="date" value={form.licenseExpiration} onChange={(e) => setForm({ ...form, licenseExpiration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora</label>
                <input type="text" value={form.insuranceCompany} onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Póliza</label>
                <input type="text" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venc. Seguro</label>
                <input type="date" value={form.insuranceExpiration} onChange={(e) => setForm({ ...form, insuranceExpiration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo/Kit</label>
              <textarea value={form.equipmentKit} onChange={(e) => setForm({ ...form, equipmentKit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Ambulancia</button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOAT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RTMC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Habilitación</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : ambulances.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay ambulancias registradas</td></tr>
              ) : (
                ambulances.map((amb) => (
                  <tr key={amb.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{amb.plate}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{amb.brand} {amb.model}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${amb.type === "TAM" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                        {amb.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-800">{amb.soatNumber || "-"}</div>
                      <div className={`text-xs ${isExpiringSoon(amb.soatExpiration) ? "text-red-600 font-medium" : "text-gray-400"}`}>
                        Vence: {formatDate(amb.soatExpiration)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-800">{amb.rtmcNumber || "-"}</div>
                      <div className={`text-xs ${isExpiringSoon(amb.rtmcExpiration) ? "text-red-600 font-medium" : "text-gray-400"}`}>
                        Vence: {formatDate(amb.rtmcExpiration)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-800">{amb.habilitacionNumber || "-"}</div>
                      <div className={`text-xs ${isExpiringSoon(amb.habilitacionExpiration) ? "text-red-600 font-medium" : "text-gray-400"}`}>
                        Vence: {formatDate(amb.habilitacionExpiration)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(amb.status)}`}>
                        {STATUS_OPTIONS.find(s => s.value === amb.status)?.label || amb.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={amb.status} onChange={(e) => updateStatus(amb.id, e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs cursor-pointer">
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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