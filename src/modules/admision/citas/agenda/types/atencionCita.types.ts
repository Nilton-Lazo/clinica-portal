/** Respuesta de GET /admision/citas/agenda-medica/:id/atencion */
export type AtencionCitaData = {
  cita: {
    id: number;
    codigo: string;
    fecha: string | null;
    hora: string | null;
    orden: number;
    motivo: string | null;
    autorizacion_siteds: string | null;
    cuenta: string | null;
    estado_atencion: string;
  };
  programacion: {
    id: number;
    especialidad: { id: number; codigo: string; descripcion: string } | null;
    medico: { id: number; nombres: string; apellido_paterno: string; apellido_materno: string } | null;
    consultorio: { id: number; abreviatura: string; descripcion: string } | null;
  } | null;
  paciente: {
    id: number;
    numero_documento: string | null;
    nr: string | null;
    edad: number | null;
    sexo: string | null;
    apellidos_nombres: string;
    parentesco_seguro: string | null;
    titular_nombre: string | null;
    celular: string | null;
    telefono: string | null;
    email: string | null;
  };
  planes: Array<{
    id: number;
    tipo_cliente_id: number;
    descripcion: string;
    tarifa_id: number | null;
    tarifa_codigo: string | null;
    tarifa_descripcion: string | null;
  }>;
  atencion: {
    id: number;
    nro_cuenta: string | null;
    hora_asistencia: string | null;
    paciente_plan_id: number | null;
    tarifa_id: number | null;
    parentesco_seguro: string | null;
    titular_nombre: string | null;
    control_pre_post_natal: boolean;
    control_nino_sano: boolean;
    chequeo: boolean;
    carencia: boolean;
    latencia: boolean;
  } | null;
};

/** Payload para POST guardar atención */
export type AtencionCitaStorePayload = {
  solo_actualizar_datos?: boolean;
  acudio_a_su_cita?: boolean;
  hora_asistencia?: string | null;
  paciente_plan_id?: number | null;
  parentesco_seguro?: string | null;
  titular_nombre?: string | null;
  control_pre_post_natal?: boolean;
  control_nino_sano?: boolean;
  chequeo?: boolean;
  carencia?: boolean;
  latencia?: boolean;
};
