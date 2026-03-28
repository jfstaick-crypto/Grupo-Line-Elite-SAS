export const ROLE_PERMISSIONS: Record<string, string[]> = {
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

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
