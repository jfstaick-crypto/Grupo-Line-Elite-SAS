"use client";

import { useState, useEffect } from "react";

interface Admission {
  id: number;
  patientId: number;
  status: string;
  department: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
}

interface ClinicalHistory {
  id: number;
  patientId: number;
  admissionId: number;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string | null;
  vitalSigns: string | null;
  createdAt: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  doctorName: string | null;
  department: string | null;
}

export default function HistoriaClinicaPage() {
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ClinicalHistory | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patientId: 0,
    admissionId: 0,
    diagnosis: "",
    symptoms: "",
    treatment: "",
    notes: "",
    vitalSigns: "",
  });

  const fetchData = async () => {
    const [histRes, admRes] = await Promise.all([
      fetch("/api/historias"),
      fetch("/api/admisiones"),
    ]);
    if (histRes.ok) setHistories(await histRes.json());
    if (admRes.ok) {
      const all = await admRes.json();
      setAdmissions(all.filter((a: Admission) => a.status === "activa"));
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [histRes, admRes] = await Promise.all([
        fetch("/api/historias"),
        fetch("/api/admisiones"),
      ]);
      if (!cancelled) {
        if (histRes.ok) setHistories(await histRes.json());
        if (admRes.ok) {
          const all = await admRes.json();
          setAdmissions(all.filter((a: Admission) => a.status === "activa"));
        }
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAdmissionSelect = (id: number) => {
    const adm = admissions.find((a) => a.id === id);
    if (adm) {
      setForm({ ...form, admissionId: id, patientId: adm.patientId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/historias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Historia clínica registrada exitosamente");
    setForm({ patientId: 0, admissionId: 0, diagnosis: "", symptoms: "", treatment: "", notes: "", vitalSigns: "" });
    setShowForm(false);
    fetchData();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historia Clínica</h1>
          <p className="text-gray-500 text-sm">Registre y consulte las historias clínicas de los pacientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nueva Historia
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Historia Clínica</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente (Admisión Activa)</label>
                <select
                  value={form.admissionId}
                  onChange={(e) => handleAdmissionSelect(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  required
                >
                  <option value={0}>Seleccione un paciente</option>
                  {admissions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.patientFirstName} {a.patientLastName} - {a.patientDocumentId} ({a.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signos Vitales</label>
                <input type="text" value={form.vitalSigns} onChange={(e) => setForm({ ...form, vitalSigns: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="Ej: PA: 120/80, FC: 72, Temp: 36.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <input type="text" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas</label>
              <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label>
              <textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Guardar Historia</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {selectedHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHistory(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de Historia Clínica</h2>
              <button onClick={() => setSelectedHistory(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-medium text-gray-700">Paciente:</span> <span className="text-gray-600">{selectedHistory.patientFirstName} {selectedHistory.patientLastName}</span></div>
                <div><span className="font-medium text-gray-700">Documento:</span> <span className="text-gray-600">{selectedHistory.patientDocumentId}</span></div>
                <div><span className="font-medium text-gray-700">Departamento:</span> <span className="text-gray-600">{selectedHistory.department}</span></div>
                <div><span className="font-medium text-gray-700">Médico:</span> <span className="text-gray-600">{selectedHistory.doctorName}</span></div>
              </div>
              {selectedHistory.vitalSigns && (
                <div><span className="font-medium text-gray-700">Signos Vitales:</span> <span className="text-gray-600">{selectedHistory.vitalSigns}</span></div>
              )}
              <div><span className="font-medium text-gray-700">Diagnóstico:</span> <span className="text-gray-600">{selectedHistory.diagnosis}</span></div>
              <div><span className="font-medium text-gray-700">Síntomas:</span> <span className="text-gray-600">{selectedHistory.symptoms}</span></div>
              <div><span className="font-medium text-gray-700">Tratamiento:</span> <span className="text-gray-600">{selectedHistory.treatment}</span></div>
              {selectedHistory.notes && (
                <div><span className="font-medium text-gray-700">Notas:</span> <span className="text-gray-600">{selectedHistory.notes}</span></div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Diagnóstico</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Departamento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Médico</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {histories.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{h.patientFirstName} {h.patientLastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{h.diagnosis}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{h.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{h.doctorName}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedHistory(h)} className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">Ver Detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {histories.length === 0 && (
          <div className="text-center py-8 text-gray-400">No hay historias clínicas registradas</div>
        )}
      </div>
    </div>
  );
}
