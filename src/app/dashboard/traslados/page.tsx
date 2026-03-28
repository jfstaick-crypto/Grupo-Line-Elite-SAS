"use client";

import { useState, useEffect } from "react";

interface Admission {
  id: number;
  patientId: number;
  status: string;
  department: string;
  patientFirstName: string | null;
  patientMiddleName: string | null;
  patientLastName: string | null;
  patientSecondLastName: string | null;
  patientDocumentId: string | null;
  patientGender: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  patientCity: string | null;
  patientInsurance: string | null;
  patientRegime: string | null;
}

interface Transfer {
  id: number;
  admissionId: number;
  patientId: number;
  authorizationNumber: string | null;
  diagnosis: string | null;
  originCity: string | null;
  originInstitution: string | null;
  destinationCity: string | null;
  destinationInstitution: string | null;
  ambulancePlate: string | null;
  requestDate: string | null;
  responsibleEntity: string | null;
  driverName: string | null;
  auxiliaryName: string | null;
  doctorName: string | null;
  value: string | null;
  status: string;
  transferDate: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDocumentId: string | null;
  transferredByName: string | null;
}

const emptyForm = {
  admissionId: 0,
  patientId: 0,
  authorizationNumber: "",
  diagnosis: "",
  originCity: "",
  originInstitution: "",
  originPhone: "",
  destinationCity: "",
  destinationInstitution: "",
  destinationPhone: "",
  ambulancePlate: "",
  tam: "",
  tab: "",
  requestDate: "",
  responsibleEntity: "",
  callTime: "",
  promiseTime: "",
  originDepartureCity: "",
  pickupLocation: "",
  arrivalIpsOriginTime: "",
  pickupDate: "",
  pickupTime: "",
  destinationCityArrival: "",
  destinationLocation: "",
  arrivalIpsDestinationTime: "",
  deliveryDate: "",
  deliveryTime: "",
  returnDate: "",
  returnTime: "",
  driverName: "",
  auxiliaryName: "",
  auxiliaryDocument: "",
  doctorName: "",
  doctorDocument: "",
  cupsCode: "",
  cupsDescription: "",
  value: "",
  status: "pendiente",
};

const AMBULANCE_TYPES = [
  { type: "TAM", label: "TAM - Transporte de Atención Médica" },
  { type: "TAB", label: "TAB - Transporte de Atención Básica" },
];

export default function TrasladosPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [currentUser, setCurrentUser] = useState<{ userId: number; fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [transfersRes, admissionsRes, sessionRes] = await Promise.all([
        fetch("/api/traslados"),
        fetch("/api/admisiones"),
        fetch("/api/auth/session"),
      ]);
      if (!cancelled) {
        if (transfersRes.ok) setTransfers(await transfersRes.json());
        if (admissionsRes.ok) {
          const all = await admissionsRes.json();
          setAdmissions(all.filter((a: Admission) => a.status === "activa"));
        }
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.user) {
            setCurrentUser(sessionData.user);
          }
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
      const autoFields: Record<string, string> = {};
      if (currentUser?.role === "medico") {
        autoFields.doctorName = currentUser.fullName;
      }
      if (currentUser?.role === "auxiliar_enfermeria") {
        autoFields.auxiliaryName = currentUser.fullName;
      }
      setForm({
        ...form,
        admissionId: id,
        patientId: adm.patientId,
        originCity: adm.patientCity || form.originCity,
        originInstitution: form.originInstitution || adm.department,
        ...autoFields,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.admissionId || !form.patientId) {
      setError("Seleccione un paciente con admisión activa");
      return;
    }

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
    setForm(emptyForm);
    setShowForm(false);
    const tr = await fetch("/api/traslados");
    if (tr.ok) setTransfers(await tr.json());
  };

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Traslados de Pacientes</h1>
          <p className="text-gray-500 text-sm">Registro completo de traslados interinstitucionales</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(emptyForm); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nuevo Traslado
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Traslado</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paciente (Admisión Activa)</label>
              <select
                value={form.admissionId}
                onChange={(e) => handleAdmissionSelect(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                required
              >
                <option value={0}>Seleccione un paciente</option>
                {admissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.patientFirstName} {a.patientMiddleName || ""} {a.patientLastName} {a.patientSecondLastName || ""} - {a.patientDocumentId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">Origen</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad de Origen</label>
                  <input type="text" value={form.originCity} onChange={(e) => set("originCity", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Institución donde se remite</label>
                  <input type="text" value={form.originInstitution} onChange={(e) => set("originInstitution", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input type="text" value={form.originPhone} onChange={(e) => set("originPhone", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">Destino</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad de Destino</label>
                  <input type="text" value={form.destinationCity} onChange={(e) => set("destinationCity", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Institución donde se remite</label>
                  <input type="text" value={form.destinationInstitution} onChange={(e) => set("destinationInstitution", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input type="text" value={form.destinationPhone} onChange={(e) => set("destinationPhone", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">Datos Generales</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">N° Autorización</label>
                  <input type="text" value={form.authorizationNumber} onChange={(e) => set("authorizationNumber", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Diagnóstico</label>
                  <input type="text" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Placa Ambulancia</label>
                  <input type="text" value={form.ambulancePlate} onChange={(e) => set("ambulancePlate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Ambulancia</label>
                  <select
                    value={form.tam ? "TAM" : form.tab ? "TAB" : ""}
                    onChange={(e) => {
                      if (e.target.value === "TAM") set("tam", "X");
                      else if (e.target.value === "TAB") set("tab", "X");
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800"
                  >
                    <option value="">Seleccionar</option>
                    {AMBULANCE_TYPES.map((a) => (
                      <option key={a.type} value={a.type}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código CUPS</label>
                  <input type="text" value={form.cupsCode} onChange={(e) => set("cupsCode", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="Ej: 890201" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción CUPS</label>
                  <input type="text" value={form.cupsDescription} onChange={(e) => set("cupsDescription", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" placeholder="Ej: Consulta de urgencias" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">Timeline del Servicio</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Solicitud</label>
                  <input type="date" value={form.requestDate} onChange={(e) => set("requestDate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entidad Responsable Pago</label>
                  <input type="text" value={form.responsibleEntity} onChange={(e) => set("responsibleEntity", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Llamado</label>
                  <input type="time" value={form.callTime} onChange={(e) => set("callTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Promesa</label>
                  <input type="time" value={form.promiseTime} onChange={(e) => set("promiseTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad Origen Salida</label>
                  <input type="text" value={form.originDepartureCity} onChange={(e) => set("originDepartureCity", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lugar Recogida (IPS)</label>
                  <input type="text" value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Llegada IPS Origen</label>
                  <input type="time" value={form.arrivalIpsOriginTime} onChange={(e) => set("arrivalIpsOriginTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Recogida</label>
                  <input type="date" value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Recogida</label>
                  <input type="time" value={form.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad Destino</label>
                  <input type="text" value={form.destinationCityArrival} onChange={(e) => set("destinationCityArrival", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lugar Destino (IPS)</label>
                  <input type="text" value={form.destinationLocation} onChange={(e) => set("destinationLocation", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Llegada IPS Destino</label>
                  <input type="time" value={form.arrivalIpsDestinationTime} onChange={(e) => set("arrivalIpsDestinationTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Entrega</label>
                  <input type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Entrega Paciente</label>
                  <input type="time" value={form.deliveryTime} onChange={(e) => set("deliveryTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Retorno</label>
                  <input type="date" value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora Retorno</label>
                  <input type="time" value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">Personal y Valor</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Conductor Nombre</label>
                  <input type="text" value={form.driverName} onChange={(e) => set("driverName", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Auxiliar/APH Nombre</label>
                  <input type="text" value={form.auxiliaryName} onChange={(e) => set("auxiliaryName", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Doc. Auxiliar/APH</label>
                  <input type="text" value={form.auxiliaryDocument} onChange={(e) => set("auxiliaryDocument", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Médico</label>
                  <input type="text" value={form.doctorName} onChange={(e) => set("doctorName", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Doc. Médico</label>
                  <input type="text" value={form.doctorDocument} onChange={(e) => set("doctorDocument", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                  <input type="text" value={form.value} onChange={(e) => set("value", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Registrar Traslado</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">Cancelar</button>
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Origen</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Destino</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Diagnóstico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Personal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{t.patientFirstName} {t.patientLastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.patientDocumentId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.originCity} - {t.originInstitution}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.destinationCity} - {t.destinationInstitution}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{t.diagnosis || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    t.status === "completado" ? "bg-green-50 text-green-700" :
                    t.status === "en_proceso" ? "bg-blue-50 text-blue-700" :
                    t.status === "cancelado" ? "bg-red-50 text-red-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>
                    {t.status === "pendiente" ? "Pendiente" :
                     t.status === "en_proceso" ? "En Proceso" :
                     t.status === "completado" ? "Completado" : "Cancelado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.driverName || t.doctorName || "-"}</td>
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
