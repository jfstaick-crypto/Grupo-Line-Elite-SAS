"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  signature: string | null;
  active: boolean;
}

const ROLE_OPTIONS = [
  { value: "administrador", label: "Administrador" },
  { value: "admision", label: "Admisión" },
  { value: "medico", label: "Médico" },
  { value: "auxiliar_enfermeria", label: "Auxiliar de Enfermería" },
  { value: "enfermera_jefe", label: "Enfermera Jefe" },
  { value: "chofer", label: "Chófer" },
];

const SIGNATURE_ROLES = ["medico", "auxiliar_enfermeria", "enfermera_jefe", "chofer"];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "admision",
    address: "",
    phone: "",
    email: "",
    signature: "",
  });
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/usuarios");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/usuarios");
      if (res.ok && !cancelled) {
        const data = await res.json();
        setUsers(data);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const resetForm = () => {
    setFormData({ username: "", password: "", fullName: "", role: "admision", address: "", phone: "", email: "", signature: "" });
    setSignaturePreview(null);
    setEditingUser(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const url = "/api/usuarios";
      const method = editingUser ? "PUT" : "POST";
      const body = editingUser
        ? { ...formData, id: editingUser.id, password: formData.password || undefined }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(editingUser ? "Usuario actualizado" : "Usuario creado");
      resetForm();
      fetchUsers();
    } catch {
      setError("Error al guardar");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName,
      role: user.role,
      address: user.address || "",
      phone: user.phone || "",
      email: user.email || "",
      signature: user.signature || "",
    });
    setSignaturePreview(user.signature || null);
    setShowForm(true);
  };

  const handleToggleActive = async (user: User) => {
    await fetch("/api/usuarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return;
    await fetch(`/api/usuarios?id=${id}`, { method: "DELETE" });
    fetchUsers();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm">
            Administre los usuarios y sus perfiles de acceso
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
        >
          + Nuevo Usuario
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingUser ? "Editar Usuario" : "Crear Usuario"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {error && (
              <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingUser
                  ? "Nueva Contraseña (vacío = sin cambio)"
                  : "Contraseña"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                required={!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfil
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
            </div>
            {SIGNATURE_ROLES.includes(formData.role) && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma Digital (imagen)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setFormData({ ...formData, signature: base64 });
                        setSignaturePreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800"
                />
                {signaturePreview && (
                  <div className="mt-2">
                    <img src={signaturePreview} alt="Firma" className="h-16 border border-gray-200 rounded" />
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, signature: "" }); setSignaturePreview(null); }}
                      className="mt-1 text-xs text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Eliminar firma
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                {editingUser ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Usuario
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Nombre
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Perfil
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                  {u.username}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.fullName}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      u.active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(u)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm cursor-pointer"
                  >
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
