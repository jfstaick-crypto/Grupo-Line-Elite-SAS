"use client";

import { useState, useEffect } from "react";

interface Consent {
  id: number;
  patientId: number;
  transferId: number | null;
  consentType: string;
  documentType: string;
  documentId: string;
  patientFullName: string;
  representativeName: string | null;
  relationship: string | null;
  procedure: string;
  authorization: boolean;
  signedAt: string | null;
  professionalName: string | null;
  observations: string | null;
  createdAt: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
}

const CONSENT_TYPES = [
  { value: "traslado", label: "Consentimiento para Traslado" },
  { value: "procedimiento", label: "Consentimiento para Procedimiento" },
  { value: "hospitalizacion", label: "Consentimiento para Hospitalización" },
  { value: "cirugia", label: "Consentimiento Quirúrgico" },
  { value: "anestesia", label: "Consentimiento para Anestesia" },
  { value: "transfusion", label: "Consentimiento para Transfusión" },
  { value: "alta", label: "Consentimiento de Alta" },
  { value: "otro", label: "Otro" },
];

export default function ConsentimientosPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    patientId: 0,
    consentType: "",
    documentType: "CC",
    patientFullName: "",
    representativeName: "",
    representativeDocument: "",
    relationship: "",
    procedure: "",
    risks: "",
    benefits: "",
    alternatives: "",
    authorization: false,
    professionalName: "",
    professionalDocument: "",
    professionalLicense: "",
    observations: "",
  });

  useEffect(() => {
    fetchConsents();
    fetchPatients();
  }, []);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/consentimientos");
      if (!res.ok) throw new Error("Error al cargar consentimientos");
      const data = await res.json();
      setConsents(data.consents || []);
    } catch (e) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/pacientes");
      if (res.ok) setPatients(await res.json());
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.consentType || !form.patientFullName || !form.procedure) {
      setError("Paciente, tipo de consentimiento, nombre y procedimiento son requeridos");
      return;
    }

    const res = await fetch("/api/consentimientos", {
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
      patientId: 0, consentType: "", documentType: "CC", patientFullName: "",
      representativeName: "", representativeDocument: "", relationship: "",
      procedure: "", risks: "", benefits: "", alternatives: "",
      authorization: false, professionalName: "", professionalDocument: "",
      professionalLicense: "", observations: "",
    });
    fetchConsents();
  };

  const handlePatientChange = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setForm({
        ...form,
        patientId,
        patientFullName: `${patient.firstName} ${patient.lastName}`,
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consentimientos Informados</h1>
          <p className="text-gray-500 text-sm">Gestión de autorizaciones según Res. 1406/2006</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Nuevo Consentimiento
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nuevo Consentimiento Informado</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <select value={form.patientId} onChange={(e) => handlePatientChange(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value={0}>Seleccionar...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.documentId}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Consentimiento *</label>
                <select value={form.consentType} onChange={(e) => setForm({ ...form, consentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Seleccionar...</option>
                  {CONSENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento *</label>
                <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="TI">TI</option>
                  <option value="RC">RC</option>
                  <option value="PA">PA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento *</label>
                <input type="text" value={form.patientFullName ? patients.find(p => p.id === form.patientId)?.documentId || "" : ""} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Representante</label>
                <input type="text" value={form.representativeName} onChange={(e) => setForm({ ...form, representativeName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento Rep.</label>
                <input type="text" value={form.representativeDocument} onChange={(e) => setForm({ ...form, representativeDocument: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                <input type="text" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento/Intervención *</label>
              <textarea value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Riesgos</label>
                <textarea value={form.risks} onChange={(e) => setForm({ ...form, risks: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Liste los posibles riesgos..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios</label>
                <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Liste los beneficios..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternativas</label>
                <textarea value={form.alternatives} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Otras alternativas..." />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Profesional</label>
                <input type="text" value={form.professionalName} onChange={(e) => setForm({ ...form, professionalName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento Profesional</label>
                <input type="text" value={form.professionalDocument} onChange={(e) => setForm({ ...form, professionalDocument: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta Profesional</label>
                <input type="text" value={form.professionalLicense} onChange={(e) => setForm({ ...form, professionalLicense: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" id="authorization" checked={form.authorization} onChange={(e) => setForm({ ...form, authorization: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <label htmlFor="authorization" className="ml-2 text-sm font-medium text-gray-700">Autorización del paciente</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Consentimiento</button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedimiento</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Autorizado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : consents.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay consentimientos registrados</td></tr>
              ) : (
                consents.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">{CONSENT_TYPES.find(t => t.value === c.consentType)?.label || c.consentType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{c.patientFullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.documentType} {c.documentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{c.procedure}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${c.authorization ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {c.authorization ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.professionalName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString("es-ES")}</td>
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