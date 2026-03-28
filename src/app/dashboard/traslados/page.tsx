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

interface Transfer {
  id: number;
  fromDepartment: string;
  toDepartment: string;
  reason: string;
  transferDate: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  transferredByName: string | null;
}

const DEPARTMENTS = [
  "Urgencias", "Hospitalización", "UCI", "Pediatría", "Cirugía",
  "Cardiología", "Neurología", "Traumatología", "Oncología", "Ginecología",
];

export default function TrasladosPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    admissionId: 0,
    patientId: 0,
    fromDepartment: "",
    toDepartment: "",
    reason: "",
  });

  const fetchData = async () => {
    const [transfersRes, admissionsRes] = await Promise.all([
      fetch("/api/traslados"),
      fetch("/api/admisiones"),
    ]);
    if (transfersRes.ok) setTransfers(await transfersRes.json());
    if (admissionsRes.ok) {
      const all = await admissionsRes.json();
      setAdmissions(all.filter((a: Admission) => a.status === "activa"));
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [transfersRes, admissionsRes] = await Promise.all([
        fetch("/api/traslados"),
        fetch("/api/admisiones"),
      ]);
      if (!cancelled) {
        if (transfersRes.ok) setTransfers(await transfersRes.json());
        if (admissionsRes.ok) {
          const all = await admissionsRes.json();
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
      setForm({
        ...form,
        admissionId: id,
        patientId: adm.patientId,
        fromDepartment: adm.department,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/traslados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Traslado registrado exitosamente");
    setForm({ admissionId: 0, patientId: 0, fromDepartment: "", toDepartment: "", reason: "" });
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
          <h1 className="text-2xl font-bold text-gray-800">Traslados de Pacientes</h1>
          <p className="text-gray-500 text-sm">Gestione los traslados entre departamentos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nuevo Traslado
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Traslado</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento Origen</label>
              <input type="text" value={form.fromDepartment} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento Destino</label>
              <select
                value={form.toDepartment}
                onChange={(e) => setForm({ ...form, toDepartment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                required
              >
                <option value="">Seleccione destino</option>
                {DEPARTMENTS.filter((d) => d !== form.fromDepartment).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón del Traslado</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                rows={3}
                required
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Registrar Traslado</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Documento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Origen</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Destino</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Razón</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Realizado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{t.patientFirstName} {t.patientLastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.patientDocumentId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.fromDepartment}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.toDepartment}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.reason}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.transferredByName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfers.length === 0 && (
          <div className="text-center py-8 text-gray-400">No hay traslados registrados</div>
        )}
      </div>
    </div>
  );
}
