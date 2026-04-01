interface RipsUser {
  tipoDocumentoIdentificacion: string;
  numeroDocumentoIdentificacion: string;
  tipoUsuario: string;
  fechaNacimiento: string;
  sexo: string;
  codigoMunicipioResidencia: string;
  codigoDepartamentoResidencia: string;
}

interface RipsService {
  tipoDocumentoIdentificacion: string;
  numeroDocumentoIdentificacion: string;
  fechaAtencion: string;
  codigoPrestador: string;
  nombrePrestador: string;
  codigoConsulta: string;
  diagnosticoPrincipal: string;
  diagnosticoRelacionado1?: string;
  causaExterna?: string;
  tipoConsulta: string;
}

interface RipsData {
  codigoPrestador: string;
  nombrePrestador: string;
  habilitacion: string;
  usuarios: RipsUser[];
  servicios: {
    consultas?: RipsService[];
    procedimientos?: Record<string, unknown>[];
    urgencias?: Record<string, unknown>[];
    hospitalizacion?: Record<string, unknown>[];
    medicamentos?: Record<string, unknown>[];
    otrosServicios?: Record<string, unknown>[];
  };
}

export function generateRipsJson(data: RipsData): string {
  return JSON.stringify(
    {
      noFatura: "PENDIENTE",
      codigoPrestador: data.codigoPrestador,
      nombrePrestador: data.nombrePrestador,
      habilitacion: data.habilitacion,
      usuarios: data.usuarios,
      servicios: data.servicios,
      // COMPLETAR CON PROVEEDOR TECNOLÓGICO Y MUV
    },
    null,
    2
  );
}

export async function sendRipsToMuv(
  _ripsJson: string
): Promise<{ success: boolean; cuv?: string; errorMessage?: string }> {
  return {
    success: false,
    errorMessage:
      "Integración MUV pendiente de configuración con proveedor tecnológico",
  };
}
