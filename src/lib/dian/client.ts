export interface DianConfig {
  nit: string;
  nitDigitVerifier: string;
  softwareId: string;
  softwarePin: string;
  testSetId: string;
  certificatePath: string;
  certificatePassword: string;
  productionMode: boolean;
}

export interface DianResponse {
  success: boolean;
  cufe?: string;
  xml?: string;
  errorMessage?: string;
  dianStatus?: string;
  isValid?: boolean;
}

let config: DianConfig | null = null;

export function setDianConfig(cfg: DianConfig) {
  config = cfg;
}

export function getDianConfig(): DianConfig | null {
  return config;
}

export async function sendInvoiceToDian(
  _xmlContent: string
): Promise<DianResponse> {
  if (!config) {
    return {
      success: false,
      errorMessage: "DIAN no configurado. Configure en Empresa > Facturación Electrónica",
    };
  }

  return {
    success: false,
    errorMessage: "Integración DIAN pendiente de configuración con proveedor tecnológico",
  };
}

export async function checkDianStatus(_cufe: string): Promise<DianResponse> {
  if (!config) {
    return { success: false, errorMessage: "DIAN no configurado" };
  }

  return {
    success: false,
    errorMessage: "Consulta de estado DIAN no implementada aún",
  };
}
