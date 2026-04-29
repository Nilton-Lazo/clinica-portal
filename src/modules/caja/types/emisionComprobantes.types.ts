export type EmisionEnumOption = {

  value: string;

  label: string;

};



export type EmisionTipoDocumentoOption = EmisionEnumOption & {

  codigo?: string;

};



export type EmisionComprobantesCatalog = {

  origenes: EmisionEnumOption[];

  tipos_documento: EmisionTipoDocumentoOption[];

  estados_emision: EmisionEnumOption[];

};



export type EmisionComprobantesFormState = {

  origen: string;

  tipoDocumentoId: string;

  estadoEmision: string;

  cuenta: string;

  numeracionId: string;

  correlativo: string;

  paciente: string;

  titular: string;

  copiaPaciente: boolean;

  iafasMedico: string;

  editaIafasMedico: boolean;

  telefono: string;

  documento: string;

  padDocumento8: boolean;

  direccion: string;

  contratante: string;

  editaContratante: boolean;

  formaPagoId: string;

  medioPagoId: string;

  bancoTarjetaId: string;

  numeroOperacion: string;

  fechaVencimiento: string;

};

