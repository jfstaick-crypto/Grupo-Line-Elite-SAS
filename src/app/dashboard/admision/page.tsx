"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string | null;
  address: string | null;
}

interface Admission {
  id: number;
  patientId: number;
  reason: string;
  department: string;
  bed: string | null;
  status: string;
  admissionDate: string;
  dischargeDate: string | null;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  admittedByName: string | null;
}

const DEPARTMENTS = [
  "Urgencias",
  "Hospitalización",
  "UCI",
  "Pediatría",
  "Cirugía",
  "Cardiología",
  "Neurología",
  "Traumatología",
  "Oncología",
  "Ginecología",
];

export default function AdmisionPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [patientForm, setPatientForm] = useState({
    documentId: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "M",
    phone: "",
    address: "",
  });

  const [admissionForm, setAdmissionForm] = useState({
    patientId: 0,
    reason: "",
    department: "Urgencias",
    bed: "",
  });

  const fetchData = async () => {
    const [patientsRes, admissionsRes] = await Promise.all([
      fetch("/api/pacientes"),
      fetch("/api/admisiones"),
    ]);
    if (patientsRes.ok) setPatients(await patientsRes.json());
    if (admissionsRes.ok) setAdmissions(await admissionsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [patientsRes, admissionsRes] = await Promise.all([
        fetch("/api/pacientes"),
        fetch("/api/admisiones"),
      ]);
      if (!cancelled) {
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (admissionsRes.ok) setAdmissions(await admissionsRes.json());
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientForm),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Paciente registrado exitosamente");
    setPatientForm({
      documentId: "",
      firstName: "",
      lastName: "",
      birthDate: "",
      gender: "M",
      phone: "",
      address: "",
    });
    setShowPatientForm(false);
    fetchData();
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/admisiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(admissionForm),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Admisión creada exitosamente");
    setAdmissionForm({ patientId: 0, reason: "", department: "Urgencias", bed: "" });
    setShowAdmissionForm(false);
    fetchData();
  };

  const handleDischarge = async (id: number) => {
    await fetch("/api/admisiones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cerrada" }),
    });
    fetchData();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admisión de Pacientes</h1>
          <p className="text-gray-500 text-sm">Registre pacientes y gestione admisiones</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPatientForm(!showPatientForm);
              setShowAdmissionForm(false);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            + Nuevo Paciente
          </button>
          <button
            onClick={() => {
              setShowAdmissionForm(!showAdmissionForm);
              setShowPatientForm(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            + Nueva Admisión
          </button>
        </div>
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

      {showPatientForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Paciente</h2>
          <form onSubmit={handlePatientSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad</label>
              <input type="text" value={patientForm.documentId} onChange={(e) => setPatientForm({ ...patientForm, documentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={patientForm.firstName} onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input type="text" value={patientForm.lastName} onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input type="date" value={patientForm.birthDate} onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
              <select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Registrar</button>
              <button type="button" onClick={() => setShowPatientForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showAdmissionForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Admisión</h2>
          <form onSubmit={handleAdmissionSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <select value={admissionForm.patientId} onChange={(e) => setAdmissionForm({ ...admissionForm, patientId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required>
                <option value={0}>Seleccione un paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.documentId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón de Admisión</label>
              <input type="text" value={admissionForm.reason} onChange={(e) => setAdmissionForm({ ...admissionForm, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select value={admissionForm.department} onChange={(e) => setAdmissionForm({ ...admissionForm, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cama</label>
              <input type="text" value={admissionForm.bed} onChange={(e) => setAdmissionForm({ ...admissionForm, bed: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Admisión</button>
              <button type="button" onClick={() => setShowAdmissionForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Razón</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Departamento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cama</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admissions.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{a.patientFirstName} {a.patientLastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.patientDocumentId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.reason}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{a.bed || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${a.status === "activa" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {a.status === "activa" ? "Activa" : "Cerrada"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {a.status === "activa" && (
                    <button onClick={() => handleDischarge(a.id)} className="text-red-600 hover:text-red-800 text-sm cursor-pointer">Dar de Alta</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admissions.length === 0 && (
          <div className="text-center py-8 text-gray-400">No hay admisiones registradas</div>
        )}
      </div>
    </div>
  );
}
