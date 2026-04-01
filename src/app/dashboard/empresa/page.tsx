"use client";

import { useState, useEffect } from "react";

export default function EmpresaPage() {
  const [form, setForm] = useState({
    name: "",
    nit: "",
    nitDigitVerifier: "",
    habilitacionCode: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    city: "",
    daneCodeCity: "",
    daneCodeDept: "",
    department: "",
    taxRegime: "",
    fiscalResponsibility: "",
    ciiuCode: "",
    ciiuDescription: "",
    matriculaMercantil: "",
    slogan: "",
    logo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name !== undefined) {
          setForm({
            name: data.name || "",
            nit: data.nit || "",
            nitDigitVerifier: data.nitDigitVerifier || "",
            habilitacionCode: data.habilitacionCode || "",
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            city: data.city || "",
            daneCodeCity: data.daneCodeCity || "",
            daneCodeDept: data.daneCodeDept || "",
            department: data.department || "",
            taxRegime: data.taxRegime || "",
            fiscalResponsibility: data.fiscalResponsibility || "",
            ciiuCode: data.ciiuCode || "",
            ciiuDescription: data.ciiuDescription || "",
            matriculaMercantil: data.matriculaMercantil || "",
            slogan: data.slogan || "",
            logo: data.logo || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm({ ...form, logo: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      } else {
        setSuccess("Datos de la empresa actualizados correctamente");
      }
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Datos de la Empresa</h1>
        <p className="text-gray-500 text-sm">Configure los datos que aparecerán en los encabezados de los reportes exportados</p>
      </div>

      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                <input type="text" value={form.nit} onChange={(e) => set("nit", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="900123456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dígito Ver.</label>
                <input type="text" value={form.nitDigitVerifier} onChange={(e) => set("nitDigitVerifier", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="7" maxLength={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Régimen</label>
                <select value={form.taxRegime} onChange={(e) => set("taxRegime", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800">
                  <option value="">Seleccionar</option>
                  <option value="Régimen Simple">Régimen Simple</option>
                  <option value="Régimen Ordinario">Régimen Ordinario</option>
                  <option value="Gran Contribuyente">Gran Contribuyente</option>
                  <option value="No Responsable de IVA">No Responsable de IVA</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Habilitación</label>
              <input type="text" value={form.habilitacionCode} onChange={(e) => set("habilitacionCode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula Mercantil</label>
              <input type="text" value={form.matriculaMercantil} onChange={(e) => set("matriculaMercantil", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsabilidad Fiscal</label>
              <input type="text" value={form.fiscalResponsibility} onChange={(e) => set("fiscalResponsibility", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="R-99-PN" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código CIIU</label>
                <input type="text" value={form.ciiuCode} onChange={(e) => set("ciiuCode", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="8610" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción CIIU</label>
                <input type="text" value={form.ciiuDescription} onChange={(e) => set("ciiuDescription", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="Actividades de hospitales" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input type="text" value={form.department} onChange={(e) => set("department", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código DANE Dept.</label>
                <input type="text" value={form.daneCodeDept} onChange={(e) => set("daneCodeDept", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="68" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código DANE Ciudad</label>
                <input type="text" value={form.daneCodeCity} onChange={(e) => set("daneCodeCity", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="68001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Página Web</label>
              <input type="text" value={form.website} onChange={(e) => set("website", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="www.empresa.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Eslogan / Lema</label>
              <input type="text" value={form.slogan} onChange={(e) => set("slogan", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" placeholder="Ej: Su salud es nuestra prioridad" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800" />
            {form.logo && (
              <div className="mt-3">
                <img src={form.logo} alt="Logo" className="h-20 border border-gray-200 rounded" />
                <button type="button" onClick={() => set("logo", "")} className="mt-1 text-xs text-red-600 hover:text-red-800 cursor-pointer">Eliminar logo</button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
