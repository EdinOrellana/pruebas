export interface Retencion {
  idRetencion: number;
  idFacturaProveedor: number;
  tipoRetencion: "IVA" | "ISR";
  baseImponible: number;
  porcentaje: number;
  monto: number;
  numeroConstancia?: string;
}

export interface RetencionForm {
  idFacturaProveedor: number | string;
  tipoRetencion: "IVA" | "ISR" | "";
  baseImponible: number | string;
  porcentaje: number | string;
  monto: number | string;
  numeroConstancia?: string;
}