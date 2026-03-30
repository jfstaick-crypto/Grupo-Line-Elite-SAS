"use client";

import { useState, useEffect } from "react";
import { CIE10 } from "@/data/cie10";

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
  doctorId: number | null;
  nurseId: number | null;
  driverId: number | null;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string | null;
  vitalSigns: string | null;
  dischargeConditions: string | null;
  evolutions: string | null;
  createdAt: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  patientBirthDate: string | null;
  patientGender: string | null;
  doctorName: string | null;
  doctorSignature: string | null;
  nurseName: string | null;
  nurseSignature: string | null;
  driverName: string | null;
  driverSignature: string | null;
  department: string | null;
}

interface StaffMember {
  id: number;
  fullName: string;
  role: string;
  active: boolean;
}

interface DischargeConditions {
  glasgow: string;
  consciousness: string;
  fc: string;
  pa: string;
  pr: string;
  temperatura: string;
  satO2: string;
  fcf: string;
  alergias: string;
  semanasGestacion: string;
  manillaRiesgo: string;
  accesoVenoso: string;
  oxigeno: string;
  sondaVesical: string;
  otro: string;
  otroCual: string;
}

interface Evolution {
  id: string;
  fecha: string;
  hora: string;
  observacion: string;
}

const emptyConditions: DischargeConditions = {
  glasgow: "", consciousness: "Alerta", fc: "", pa: "", pr: "",
  temperatura: "", satO2: "", fcf: "", alergias: "", semanasGestacion: "",
  manillaRiesgo: "No", accesoVenoso: "No", oxigeno: "No", sondaVesical: "No",
  otro: "No", otroCual: "",
};

export default function HistoriaClinicaPage() {
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [nurses, setNurses] = useState<StaffMember[]>([]);
  const [drivers, setDrivers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ClinicalHistory | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [cie10Search, setCie10Search] = useState("");

  const [form, setForm] = useState({
    patientId: 0,
    admissionId: 0,
    doctorId: 0,
    nurseId: 0,
    driverId: 0,
    diagnosis: "",
    symptoms: "",
    treatment: "",
    notes: "",
    vitalSigns: "",
    dischargeConditions: JSON.stringify(emptyConditions),
    evolutions: "[]",
  });

  const [conditions, setConditions] = useState<DischargeConditions>({ ...emptyConditions });
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [newEvolution, setNewEvolution] = useState({ fecha: "", hora: "", observacion: "" });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [histRes, admRes, usersRes] = await Promise.all([
        fetch("/api/historias"),
        fetch("/api/admisiones"),
        fetch("/api/usuarios"),
      ]);
      if (!cancelled) {
        if (histRes.ok) setHistories(await histRes.json());
        if (admRes.ok) {
          const all = await admRes.json();
          setAdmissions(all.filter((a: Admission) => a.status === "activa"));
        }
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setDoctors(allUsers.filter((u: StaffMember) => u.role === "medico" && u.active));
          setNurses(allUsers.filter((u: StaffMember) => (u.role === "auxiliar_enfermeria" || u.role === "enfermera_jefe") && u.active));
          setDrivers(allUsers.filter((u: StaffMember) => u.role === "chofer" && u.active));
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

  const addEvolution = () => {
    if (!newEvolution.observacion.trim()) return;
    const evo: Evolution = {
      id: Date.now().toString(),
      fecha: newEvolution.fecha || new Date().toISOString().split("T")[0],
      hora: newEvolution.hora || new Date().toTimeString().slice(0, 5),
      observacion: newEvolution.observacion,
    };
    setEvolutions([...evolutions, evo]);
    setNewEvolution({ fecha: "", hora: "", observacion: "" });
  };

  const removeEvolution = (id: string) => {
    setEvolutions(evolutions.filter((e) => e.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const dataToSend = {
      ...form,
      dischargeConditions: JSON.stringify(conditions),
      evolutions: JSON.stringify(evolutions),
    };

    const res = await fetch("/api/historias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Historia clínica registrada exitosamente");
    setForm({
      patientId: 0, admissionId: 0, doctorId: 0, nurseId: 0, driverId: 0,
      diagnosis: "", symptoms: "", treatment: "",
      notes: "", vitalSigns: "", dischargeConditions: JSON.stringify(emptyConditions), evolutions: "[]",
    });
    setConditions({ ...emptyConditions });
    setEvolutions([]);
    setCie10Search("");
    setShowForm(false);
    const hRes = await fetch("/api/historias");
    if (hRes.ok) setHistories(await hRes.json());
  };

  const parseConditions = (json: string | null): DischargeConditions => {
    try { return json ? JSON.parse(json) : emptyConditions; }
    catch { return emptyConditions; }
  };

  const parseEvolutions = (json: string | null): Evolution[] => {
    try { return json ? JSON.parse(json) : []; }
    catch { return []; }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historia Clínica</h1>
          <p className="text-gray-500 text-sm">Registro clínico y condiciones del paciente</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nueva Historia
        </button>
      </div>

      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Historia Clínica</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                >
                  <option value={0}>Seleccionar médico</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enfermera</label>
                <select
                  value={form.nurseId}
                  onChange={(e) => setForm({ ...form, nurseId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                >
                  <option value={0}>Seleccionar enfermera</option>
                  {nurses.map((n) => <option key={n.id} value={n.id}>{n.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chófer</label>
                <select
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                >
                  <option value={0}>Seleccionar chófer</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
              </div>

              <div className="col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico (CIE-10)</label>
                <input
                  type="text"
                  value={cie10Search || form.diagnosis}
                  onChange={(e) => setCie10Search(e.target.value)}
                  onFocus={() => { if (!cie10Search && form.diagnosis) setCie10Search(""); }}
                  placeholder="Buscar por código o nombre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  required
                />
                {cie10Search && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {CIE10
                      .filter((c) => c.code.toLowerCase().includes(cie10Search.toLowerCase()) || c.description.toLowerCase().includes(cie10Search.toLowerCase()))
                      .slice(0, 15)
                      .map((c) => (
                        <div key={c.code} onClick={() => { setForm({ ...form, diagnosis: `${c.code} - ${c.description}` }); setCie10Search(""); }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between gap-2">
                          <span className="text-gray-700">{c.description}</span>
                          <span className="text-gray-400 text-xs whitespace-nowrap">{c.code}</span>
                        </div>
                      ))}
                    {CIE10.filter((c) => c.code.toLowerCase().includes(cie10Search.toLowerCase()) || c.description.toLowerCase().includes(cie10Search.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400">No se encontraron códigos</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas</label>
              <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label>
              <textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} required />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Condiciones a la Salida</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Glasgow</label>
                  <input type="number" min="3" max="15" value={conditions.glasgow} onChange={(e) => setConditions({ ...conditions, glasgow: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="3-15" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado Consciencia</label>
                  <select value={conditions.consciousness} onChange={(e) => setConditions({ ...conditions, consciousness: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="Alerta">Alerta</option>
                    <option value="Estupor">Estupor</option>
                    <option value="Coma">Coma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">FC (lpm)</label>
                  <input type="text" value={conditions.fc} onChange={(e) => setConditions({ ...conditions, fc: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PA (mmHg)</label>
                  <input type="text" value={conditions.pa} onChange={(e) => setConditions({ ...conditions, pa: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="120/80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PR (rpm)</label>
                  <input type="text" value={conditions.pr} onChange={(e) => setConditions({ ...conditions, pr: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C)</label>
                  <input type="text" value={conditions.temperatura} onChange={(e) => setConditions({ ...conditions, temperatura: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SatO2 (%)</label>
                  <input type="text" value={conditions.satO2} onChange={(e) => setConditions({ ...conditions, satO2: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">FCF (lpm fetal)</label>
                  <input type="text" value={conditions.fcf} onChange={(e) => setConditions({ ...conditions, fcf: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alergias</label>
                  <input type="text" value={conditions.alergias} onChange={(e) => setConditions({ ...conditions, alergias: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="Ninguna / Describir" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Semanas Gestación</label>
                  <input type="text" value={conditions.semanasGestacion} onChange={(e) => setConditions({ ...conditions, semanasGestacion: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Manilla Riesgo</label>
                  <select value={conditions.manillaRiesgo} onChange={(e) => setConditions({ ...conditions, manillaRiesgo: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Acceso Venoso</label>
                  <select value={conditions.accesoVenoso} onChange={(e) => setConditions({ ...conditions, accesoVenoso: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Oxígeno</label>
                  <select value={conditions.oxigeno} onChange={(e) => setConditions({ ...conditions, oxigeno: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sonda Vesical</label>
                  <select value={conditions.sondaVesical} onChange={(e) => setConditions({ ...conditions, sondaVesical: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Otro</label>
                  <select value={conditions.otro} onChange={(e) => setConditions({ ...conditions, otro: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                {conditions.otro === "Sí" && (
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">¿Cuál?</label>
                    <input type="text" value={conditions.otroCual} onChange={(e) => setConditions({ ...conditions, otroCual: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Evoluciones durante el Traslado</h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input type="date" value={newEvolution.fecha} onChange={(e) => setNewEvolution({ ...newEvolution, fecha: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
                  <input type="time" value={newEvolution.hora} onChange={(e) => setNewEvolution({ ...newEvolution, hora: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observación</label>
                  <div className="flex gap-2">
                    <input type="text" value={newEvolution.observacion} onChange={(e) => setNewEvolution({ ...newEvolution, observacion: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="Describa la evolución..." />
                    <button type="button" onClick={addEvolution} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer">+</button>
                  </div>
                </div>
              </div>
              {evolutions.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {evolutions.map((evo) => (
                    <div key={evo.id} className="px-3 py-2 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-500">{evo.fecha} {evo.hora}</span>
                        <span className="text-gray-700 ml-2">{evo.observacion}</span>
                      </div>
                      <button type="button" onClick={() => removeEvolution(evo.id)} className="text-red-500 hover:text-red-700 text-xs cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" rows={2} />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Guardar Historia</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {selectedHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHistory(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de Historia Clínica</h2>
              <button onClick={() => setSelectedHistory(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-medium text-gray-700">Paciente:</span> <span className="text-gray-600">{selectedHistory.patientFirstName} {selectedHistory.patientLastName}</span></div>
                <div><span className="font-medium text-gray-700">Documento:</span> <span className="text-gray-600">{selectedHistory.patientDocumentId}</span></div>
                <div><span className="font-medium text-gray-700">Departamento:</span> <span className="text-gray-600">{selectedHistory.department}</span></div>
                <div><span className="font-medium text-gray-700">Médico:</span> <span className="text-gray-600">{selectedHistory.doctorName}</span></div>
              </div>
              <div className="border-t pt-3"><span className="font-medium text-gray-700">Diagnóstico:</span> <span className="text-gray-600">{selectedHistory.diagnosis}</span></div>
              <div><span className="font-medium text-gray-700">Síntomas:</span> <span className="text-gray-600">{selectedHistory.symptoms}</span></div>
              <div><span className="font-medium text-gray-700">Tratamiento:</span> <span className="text-gray-600">{selectedHistory.treatment}</span></div>

              {selectedHistory.dischargeConditions && (() => {
                const dc = parseConditions(selectedHistory.dischargeConditions);
                return (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-700 mb-2">Condiciones a la Salida</h4>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><span className="font-medium">Glasgow:</span> {dc.glasgow || "-"}</div>
                      <div><span className="font-medium">Consciencia:</span> {dc.consciousness}</div>
                      <div><span className="font-medium">FC:</span> {dc.fc || "-"} lpm</div>
                      <div><span className="font-medium">PA:</span> {dc.pa || "-"} mmHg</div>
                      <div><span className="font-medium">PR:</span> {dc.pr || "-"} rpm</div>
                      <div><span className="font-medium">Temp:</span> {dc.temperatura || "-"} °C</div>
                      <div><span className="font-medium">SatO2:</span> {dc.satO2 || "-"}%</div>
                      <div><span className="font-medium">FCF:</span> {dc.fcf || "-"}</div>
                      <div><span className="font-medium">Alergias:</span> {dc.alergias || "Ninguna"}</div>
                      <div><span className="font-medium">Semanas Gest.:</span> {dc.semanasGestacion || "-"}</div>
                      <div><span className="font-medium">Manilla Riesgo:</span> {dc.manillaRiesgo}</div>
                      <div><span className="font-medium">Acceso Venoso:</span> {dc.accesoVenoso}</div>
                      <div><span className="font-medium">Oxígeno:</span> {dc.oxigeno}</div>
                      <div><span className="font-medium">Sonda Vesical:</span> {dc.sondaVesical}</div>
                      {dc.otro === "Sí" && <div className="col-span-2"><span className="font-medium">Otro:</span> {dc.otroCual}</div>}
                    </div>
                  </div>
                );
              })()}

              {selectedHistory.evolutions && parseEvolutions(selectedHistory.evolutions).length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Evoluciones</h4>
                  <div className="space-y-1">
                    {parseEvolutions(selectedHistory.evolutions).map((evo) => (
                      <div key={evo.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                        <span className="text-gray-500">{evo.fecha} {evo.hora}</span> - <span className="text-gray-700">{evo.observacion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHistory.notes && (
                <div className="border-t pt-3"><span className="font-medium text-gray-700">Notas:</span> <span className="text-gray-600">{selectedHistory.notes}</span></div>
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
