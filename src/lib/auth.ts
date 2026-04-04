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
  admision: [
    "agenda",
    "flota",
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
  auditor: ["exportar"],
  medico: ["historia-clinica", "consentimientos", "incidentes"],
  enfermera: ["historia-clinica"],
  auxiliar_enfermeria: ["historia-clinica"],
  enfermera_jefe: ["historia-clinica", "consentimientos", "incidentes", "traslados"],
  chofer: ["traslados"],
};

export function hasPermission(role: string, module: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}
