export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
    "usuarios",
    "admision",
    "traslados",
    "historia-clinica",
    "exportar",
    "empresa",
  ],
  admision: ["admision", "exportar"],
  medico: ["historia-clinica", "admision", "traslados"],
  auxiliar_enfermeria: ["historia-clinica", "admision", "traslados"],
  enfermera_jefe: ["historia-clinica", "admision", "traslados", "exportar"],
};

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
