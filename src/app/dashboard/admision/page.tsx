"use client";

import { useState, useEffect } from "react";
import { MUNICIPIOS } from "@/data/municipios";

interface Doctor {
  id: number;
  fullName: string;
}

interface Patient {
  id: number;
  documentType: string;
  documentId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  birthDate: string;
  gender: string;
  maritalStatus: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  locality: string | null;
  daneCode: string | null;
  municipality: string | null;
  municipalityDaneCode: string | null;
  neighborhood: string | null;
  insurance: string | null;
  regime: string | null;
  occupation: string | null;
}

interface Admission {
  id: number;
  patientId: number;
  reason: string;
  department: string;
  bed: string | null;
  status: string;
  admissionDate: string;
  patientFirstName: string | null;
  patientMiddleName: string | null;
  patientLastName: string | null;
  patientSecondLastName: string | null;
  patientDocumentId: string | null;
  patientDocumentType: string | null;
  assignedDoctorName: string | null;
  assignedDoctorId: number | null;
  companionName: string | null;
  companionRelationship: string | null;
  companionPhone: string | null;
}

const DOC_TYPES = ["CC", "TI", "RC", "CE", "AS", "MS", "PS", "PT"];
const MARITAL_OPTIONS = ["Soltero", "Casado", "Viudo", "Union Libre"];
const REGIME_OPTIONS = ["Subsidiado", "Contributivo", "Especial", "Extranjero", "Particular", "Otros"];
const EPS_OPTIONS = ["Saviasalud", "Coosalud", "Nueva EPS", "EPSFamiliar", "Sura"];
const DEPARTAMENTOS_DANE: Record<string, string> = {
  "Amazonas": "91", "Antioquia": "05", "Arauca": "81",
  "Atlántico": "08", "Bolívar": "13", "Boyacá": "15",
  "Caldas": "17", "Caquetá": "18", "Casanare": "85",
  "Cauca": "19", "Cesar": "20", "Chocó": "27",
  "Córdoba": "23", "Cundinamarca": "25", "Guainía": "94",
  "Guaviare": "95", "Huila": "41", "La Guajira": "44",
  "Magdalena": "47", "Meta": "50", "Nariño": "52",
  "Norte de Santander": "54", "Putumayo": "86", "Quindío": "63",
  "Risaralda": "66", "San Andrés y Providencia": "88",
  "Santander": "68", "Sucre": "70", "Tolima": "73",
  "Valle del Cauca": "76", "Vaupés": "97", "Vichada": "99",
  "Bogotá D.C.": "11",
};
const HOSPITAL_DEPARTMENTS = [
  "Urgencias", "Hospitalización", "UCI", "Pediatría", "Cirugía",
  "Cardiología", "Neurología", "Traumatología", "Oncología", "Ginecología",
];
const RELATIONSHIPS = [
  "Esposo/a", "Hijo/a", "Padre", "Madre", "Hermano/a",
  "Tío/a", "Primo/a", "Abuelo/a", "Otro",
];

export default function AdmisionPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [patientForm, setPatientForm] = useState({
    documentType: "CC",
    documentId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    secondLastName: "",
    birthDate: "",
    gender: "M",
    maritalStatus: "Soltero",
    address: "",
    city: "",
    locality: "",
    daneCode: "",
    neighborhood: "",
    phone: "",
    insurance: "",
    regime: "",
    occupation: "",
    municipality: "",
    municipalityDaneCode: "",
  });

  const [municipalitySearch, setMunicipalitySearch] = useState("");

  const [admissionForm, setAdmissionForm] = useState({
    patientId: 0,
    reason: "",
    department: "Urgencias",
    bed: "",
    assignedDoctorId: 0,
    companionName: "",
    companionRelationship: "",
    companionPhone: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [admRes, docRes] = await Promise.all([
        fetch("/api/admisiones"),
        fetch("/api/medicos"),
      ]);
      if (!cancelled) {
        if (admRes.ok) setAdmissions(await admRes.json());
        if (docRes.ok) setDoctors(await docRes.json());
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const searchPatient = async () => {
    if (!searchDoc.trim()) return;
    setError("");
    const res = await fetch(`/api/pacientes?documentId=${searchDoc}`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setFoundPatient(data);
        setAdmissionForm({ ...admissionForm, patientId: data.id });
        setPatientForm({
          documentType: data.documentType || "CC",
          documentId: data.documentId,
          firstName: data.firstName,
          middleName: data.middleName || "",
          lastName: data.lastName,
          secondLastName: data.secondLastName || "",
          birthDate: data.birthDate,
          gender: data.gender,
          maritalStatus: data.maritalStatus || "Soltero",
          address: data.address || "",
          city: data.city || "",
          locality: data.locality || "",
          daneCode: data.daneCode || (data.locality ? DEPARTAMENTOS_DANE[data.locality] || "" : ""),
          neighborhood: data.neighborhood || "",
          phone: data.phone || "",
          insurance: data.insurance || "",
          regime: data.regime || "",
          occupation: data.occupation || "",
          municipality: data.municipality || "",
          municipalityDaneCode: data.municipalityDaneCode || "",
        });
        setShowPatientForm(true);
      } else {
        setFoundPatient(null);
        setPatientForm({ ...patientForm, documentId: searchDoc });
        setShowPatientForm(true);
      }
    }
  };

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

    setSuccess(data.message || "Paciente guardado");
    if (data.patient) {
      setFoundPatient(data.patient);
      setAdmissionForm({ ...admissionForm, patientId: data.patient.id });
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!admissionForm.patientId) {
      setError("Primero busque y registre un paciente");
      return;
    }

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
    setShowAdmissionForm(false);
    setShowPatientForm(false);
    setFoundPatient(null);
    setSearchDoc("");
    setAdmissionForm({
      patientId: 0, reason: "", department: "Urgencias", bed: "",
      assignedDoctorId: 0, companionName: "", companionRelationship: "", companionPhone: "",
    });
    const admRes = await fetch("/api/admisiones");
    if (admRes.ok) setAdmissions(await admRes.json());
  };

  const handleDischarge = async (id: number) => {
    await fetch("/api/admisiones", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cerrada" }),
    });
    const admRes = await fetch("/api/admisiones");
    if (admRes.ok) setAdmissions(await admRes.json());
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
        <button
          onClick={() => {
            setShowAdmissionForm(!showAdmissionForm);
            setShowPatientForm(false);
            setFoundPatient(null);
            setSearchDoc("");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nueva Admisión
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {showAdmissionForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Admisión</h2>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar paciente por número de documento</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                placeholder="Ingrese número de documento"
              />
              <button
                type="button"
                onClick={searchPatient}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Buscar
              </button>
            </div>
            {foundPatient && (
              <p className="mt-2 text-sm text-green-700">
                Paciente encontrado: {foundPatient.firstName} {foundPatient.middleName || ""} {foundPatient.lastName} {foundPatient.secondLastName || ""}
              </p>
            )}
          </div>

          {showPatientForm && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">
                {foundPatient ? "Datos del Paciente" : "Registrar Nuevo Paciente"}
              </h3>
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Doc.</label>
                    <select value={patientForm.documentType} onChange={(e) => setPatientForm({ ...patientForm, documentType: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                      {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">No. Identificación</label>
                    <input type="text" value={patientForm.documentId} onChange={(e) => setPatientForm({ ...patientForm, documentId: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primer Nombre</label>
                    <input type="text" value={patientForm.firstName} onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Segundo Nombre</label>
                    <input type="text" value={patientForm.middleName} onChange={(e) => setPatientForm({ ...patientForm, middleName: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primer Apellido</label>
                    <input type="text" value={patientForm.lastName} onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Segundo Apellido</label>
                    <input type="text" value={patientForm.secondLastName} onChange={(e) => setPatientForm({ ...patientForm, secondLastName: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Nacimiento</label>
                    <input type="date" value={patientForm.birthDate} onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                    <select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Indefinido">Indefinido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado Civil</label>
                    <select value={patientForm.maritalStatus} onChange={(e) => setPatientForm({ ...patientForm, maritalStatus: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                      {MARITAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                    <input type="text" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aseguradora (EPS)</label>
                    <select value={patientForm.insurance} onChange={(e) => setPatientForm({ ...patientForm, insurance: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                      <option value="">Seleccionar</option>
                      {EPS_OPTIONS.map((eps) => <option key={eps} value={eps}>{eps}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Régimen</label>
                    <select value={patientForm.regime} onChange={(e) => setPatientForm({ ...patientForm, regime: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                      <option value="">Seleccionar</option>
                      {REGIME_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ocupación</label>
                    <input type="text" value={patientForm.occupation} onChange={(e) => setPatientForm({ ...patientForm, occupation: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                    <select
                      value={patientForm.locality}
                      onChange={(e) => {
                        const dept = e.target.value;
                        const code = DEPARTAMENTOS_DANE[dept] || "";
                        setPatientForm({ ...patientForm, locality: dept, daneCode: code, municipality: "", municipalityDaneCode: "" });
                        setMunicipalitySearch("");
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800"
                    >
                      <option value="">Seleccionar</option>
                      {Object.keys(DEPARTAMENTOS_DANE).sort().map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código DANE Dept.</label>
                    <input type="text" value={patientForm.daneCode} readOnly className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Municipio</label>
                    <input
                      type="text"
                      value={municipalitySearch || patientForm.municipality}
                      onChange={(e) => setMunicipalitySearch(e.target.value)}
                      onFocus={() => { if (!municipalitySearch && patientForm.municipality) setMunicipalitySearch(""); }}
                      placeholder={patientForm.locality ? "Buscar municipio..." : "Seleccione departamento primero"}
                      disabled={!patientForm.locality}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 disabled:bg-gray-100"
                    />
                    {municipalitySearch && patientForm.locality && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {(MUNICIPIOS[patientForm.locality] || [])
                          .filter((m) => m.name.toLowerCase().includes(municipalitySearch.toLowerCase()))
                          .slice(0, 20)
                          .map((m) => (
                            <div
                              key={m.daneCode}
                              onClick={() => {
                                setPatientForm({ ...patientForm, municipality: m.name, municipalityDaneCode: m.daneCode });
                                setMunicipalitySearch("");
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between"
                            >
                              <span>{m.name}</span>
                              <span className="text-gray-400 text-xs">{m.daneCode}</span>
                            </div>
                          ))}
                        {(MUNICIPIOS[patientForm.locality] || [])
                          .filter((m) => m.name.toLowerCase().includes(municipalitySearch.toLowerCase()))
                          .length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">No se encontraron municipios</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código DANE Mpio.</label>
                    <input type="text" value={patientForm.municipalityDaneCode} readOnly className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dirección de Domicilio</label>
                    <input type="text" value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="Barrio, dirección" />
                  </div>
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
                  {foundPatient ? "Actualizar Paciente" : "Registrar Paciente"}
                </button>
              </form>
            </div>
          )}

          <form onSubmit={handleAdmissionSubmit} className="space-y-4 border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Datos de Admisión</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Médico Asignado (Turno)</label>
                <select
                  value={admissionForm.assignedDoctorId}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, assignedDoctorId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                >
                  <option value={0}>Seleccione médico</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select value={admissionForm.department} onChange={(e) => setAdmissionForm({ ...admissionForm, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                  {HOSPITAL_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cama</label>
                <input type="text" value={admissionForm.bed} onChange={(e) => setAdmissionForm({ ...admissionForm, bed: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón de Admisión</label>
                <textarea value={admissionForm.reason} onChange={(e) => setAdmissionForm({ ...admissionForm, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} required />
              </div>
            </div>

            <h3 className="text-md font-semibold text-gray-700 mb-3 mt-4">Acompañante</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" value={admissionForm.companionName} onChange={(e) => setAdmissionForm({ ...admissionForm, companionName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                <select value={admissionForm.companionRelationship} onChange={(e) => setAdmissionForm({ ...admissionForm, companionRelationship: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                  <option value="">Seleccione</option>
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={admissionForm.companionPhone} onChange={(e) => setAdmissionForm({ ...admissionForm, companionPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Crear Admisión</button>
              <button type="button" onClick={() => { setShowAdmissionForm(false); setShowPatientForm(false); setFoundPatient(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Documento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Depto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Médico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admissions.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                  {a.patientFirstName} {a.patientMiddleName || ""} {a.patientLastName} {a.patientSecondLastName || ""}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.patientDocumentType} {a.patientDocumentId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.assignedDoctorName || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${a.status === "activa" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {a.status === "activa" ? "Activa" : "Cerrada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
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
