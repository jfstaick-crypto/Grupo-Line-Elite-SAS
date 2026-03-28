"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SessionUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  admision: "Admisión",
  medico: "Médico",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
    "usuarios",
    "admision",
    "traslados",
    "historia-clinica",
    "exportar",
  ],
  admision: ["admision", "exportar"],
  medico: ["historia-clinica", "admision", "traslados"],
};

const NAV_ITEMS = [
  {
    id: "usuarios",
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: "👥",
  },
  {
    id: "admision",
    label: "Admisión",
    href: "/dashboard/admision",
    icon: "📋",
  },
  {
    id: "traslados",
    label: "Traslados",
    href: "/dashboard/traslados",
    icon: "🚑",
  },
  {
    id: "historia-clinica",
    label: "Historia Clínica",
    href: "/dashboard/historia-clinica",
    icon: "📝",
  },
  {
    id: "exportar",
    label: "Exportar",
    href: "/dashboard/exportar",
    icon: "📊",
  },
  {
    id: "empresa",
    label: "Empresa",
    href: "/dashboard/empresa",
    icon: "🏢",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const allowedModules = ROLE_PERMISSIONS[user.role] || [];
  const filteredNav = NAV_ITEMS.filter((item) =>
    allowedModules.includes(item.id)
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              H
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 text-sm">
                  Sistema de Gestión
                </h1>
                <p className="text-xs text-gray-500">Traslados e Historia</p>
                <p className="text-xs text-blue-500 font-mono">v5.0 - {new Date().toLocaleDateString("es-ES")}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div
            className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
              {user.fullName.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="text-sm text-gray-500">
            {ROLE_LABELS[user.role]} - {user.fullName}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
