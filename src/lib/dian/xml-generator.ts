interface InvoiceForXml {
  invoiceNumber: string;
  invoicePrefix: string;
  invoiceType: string;
  createdAt: Date;
  dueDate?: Date | null;
  currency: string;
  company: {
    name: string;
    nit: string;
    nitDigitVerifier: string;
    address: string;
    phone: string;
    email: string;
    city: string;
    daneCodeCity: string;
    daneCodeDept: string;
    department: string;
    taxRegime: string;
    fiscalResponsibility: string;
    ciiuCode: string;
    habilitacionCode: string;
  };
  patient: {
    documentType: string;
    documentId: string;
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    email: string;
    municipality: string;
    municipalityDaneCode: string;
    insurance: string;
    regime: string;
  };
  lines: {
    lineNumber: number;
    cupsCode: string;
    cupsDescription: string;
    cie10Code: string;
    quantity: string;
    unitPrice: string;
    discountPercent: string;
    discountValue: string;
    taxRate: string;
    taxValue: string;
    totalLine: string;
  }[];
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paymentMethodCode: string;
  authorizationNumber: string;
}

export function generateInvoiceXml(_invoice: InvoiceForXml): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  FACTURA ELECTRÓNICA - STUB
  Este archivo debe ser generado por un Proveedor Tecnológico autorizado por la DIAN.
  Formato: UBL 2.1 (DIAN 2.1)
  Resolución DIAN vigente
-->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>DIAN 2.1</cbc:CustomizationID>
  <cbc:ID>PENDIENTE</cbc:ID>
  <cbc:IssueDate>PENDIENTE</cbc:IssueDate>
  <!-- COMPLETAR CON PROVEEDOR TECNOLÓGICO -->
</Invoice>`;
}

export function generateCufe(
  _invoiceNumber: string,
  _issueDate: string,
  _total: string,
  _nit: string,
  _customerDoc: string
): string {
  return "PENDIENTE_GENERACION_CUFE";
}
