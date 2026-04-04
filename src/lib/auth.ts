export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
    "empresa",
    "usuarios",
    "flota",
    "agenda",
    "admision",
    "traslados",
    "historia-clinica",
    "consentimientos",
    "incidentes",
    "facturacion",
    "cartera",
    "pqrs",
    "exportar",
  ],
  admision: ["admision", "traslados", "historia-clinica", "consentimientos"],
  medico: ["historia-clinica", "consentimientos", "incidentes"],
  auxiliar_enfermeria: ["historia-clinica", "consentimientos", "incidentes"],
  enfermera_jefe: ["historia-clinica", "consentimientos", "incidentes", "traslados"],
  chofer: ["traslados"],
};

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
