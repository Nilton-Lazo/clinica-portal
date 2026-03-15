export type NuevoRegistroFormState = {
  numeroReferencia: string;
  numeroHistoria: string;
  hora: string;
  orden: string;
  apellidosNombres: string;
  fechaNacimiento: string;
  edad: string;
  estadoCivil: string;
  direccion: string;
  sexo: string;
  telefono: string;
  lugarNacimiento: string;
  condicion: string;
  titular: string;
  pacienteId: number | null;
  tipoEmergenciaId: string;
  topicoId: string;
  medicoEmergenciaId: number | null;
  medicoEmergenciaCmp: string;
  medicoEmergenciaNombre: string;
  planId: string;
  dxIngreso: string;
  tipoDocumentoId: string;
  soatNumeroDocumento: string;
  soatTitularReferencia: string;
  soatPoliza: string;
  soatPlaca: string;
  soatSiniestro: string;
  soatTipoAccidente: string;
  soatLugarAccidente: string;
  soatDniConductor: string;
  soatApellidoPaternoConductor: string;
  soatApellidoMaternoConductor: string;
  soatContactoConductor: string;
  soatFechaSiniestro: string;
  soatHoraSiniestro: string;
  soatDatosIntervencionAutoridad: string;
  soatDocumentoAtencionId1: string;
  soatNumeroDocumentoAtencion1: string;
  soatDocumentoAtencionId2: string;
  soatNumeroDocumentoAtencion2: string;
};

export const CONDICION_OPTIONS = [
  { value: "", label: "Seleccione condición" },
  { value: "TITULAR", label: "Titular" },
  { value: "CONYUGE", label: "Cónyuge" },
  { value: "PADRE", label: "Padre" },
  { value: "MADRE", label: "Madre" },
  { value: "HIJO", label: "Hijo" },
  { value: "HIJA", label: "Hija" },
  { value: "HERMANO", label: "Hermano" },
  { value: "HERMANA", label: "Hermana" },
  { value: "HIJO_INCAPACITADO", label: "Hijo incapacitado" },
  { value: "NO_DEFINIDO", label: "No definido" },
] as const;
