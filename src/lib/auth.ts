export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
    "usuarios",
    "admision",
    "traslados",
    "historia-clinica",
    "exportar",
    "facturacion",
    "empresa",
  ],
  admision: ["admision", "traslados"],
  medico: ["historia-clinica"],
  auxiliar_enfermeria: ["historia-clinica"],
  enfermera_jefe: ["historia-clinica"],
  chofer: [],
};

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
