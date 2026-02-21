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
    iafa_id: number | null;
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
    iafa_id: number | null;
    descripcion: string;
    tarifa_id: number | null;
    tarifa_codigo: string | null;
    tarifa_descripcion: string | null;
    tarifa_es_precio_directo: boolean;
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
    monto_a_pagar: number;
    soat_activo: boolean;
    soat_numero_poliza: string | null;
    soat_numero_placa: string | null;
  } | null;
  servicios: AtencionServicioItem[];
};

export type EstadoFacturacionServicio = "PENDIENTE" | "FACTURADO";

export type AtencionServicioItem = {
  id: number;
  tarifa_servicio_id: number;
  servicio_codigo?: string | null;
  servicio_descripcion: string | null;
  categoria_codigo?: string | null;
  desea_liberar_precio?: boolean;
  medico_id: number;
  medico_codigo: string | null;
  medico_nombre: string | null;
  user_id: number | null;
  user_username?: string | null;
  user_nombre: string | null;
  cop_var: number;
  cop_fijo: number;
  descuento_pct: number;
  aumento_pct: number;
  cantidad: number;
  precio_sin_igv: number;
  precio_con_igv: number;
  estado_facturacion?: EstadoFacturacionServicio | string | null;
};

export type AtencionServicioLinea = {
  tarifa_servicio_id: number;
  medico_id: number;
  cop_var?: number;
  cop_fijo?: number;
  descuento_pct?: number;
  aumento_pct?: number;
  cantidad?: number;
  precio_sin_igv: number;
  precio_con_igv: number;
  estado_facturacion?: EstadoFacturacionServicio;
};

export type AtencionServicioLineaDisplay = AtencionServicioLinea & {
  id?: number;
  servicio_codigo?: string | null;
  servicio_descripcion?: string | null;
  /** Código de la categoría del servicio (ej. "50" = Consultas Médicas, habilita copago fijo). */
  categoria_codigo?: string | null;
  desea_liberar_precio?: boolean;
  /** Precio unitario del tarifario (sin IGV); no se modifica al liberar precio. Para reporte. */
  precio_unitario_tarifario_sin_igv?: number | null;
  medico_codigo?: string | null;
  user_username?: string | null;
  user_nombre?: string | null;
  estado_facturacion?: EstadoFacturacionServicio;
  recargo_noche_activo?: boolean;
};

export type PrecargaServicioItem = {
  tarifa_servicio_id: number;
  servicio_codigo: string;
  servicio_descripcion: string;
  cop_var: number;
  cop_fijo: number;
  descuento_pct: number;
  aumento_pct: number;
  cantidad: number;
  precio_sin_igv: number;
  precio_con_igv: number;
  medico_id: number;
  medico_codigo: string;
  medico_nombre: string;
  recargo_noche_activo?: boolean;
};

export type AtencionDraft = {
  acudio: boolean;
  horaAsistenciaDisplay: string;
  pacientePlanId: number | null;
  parentescoSeguro: string;
  titularNombre: string;
  controlPrePostNatal: boolean;
  controlNinoSano: boolean;
  chequeo: boolean;
  carencia: boolean;
  latencia: boolean;
  soatActivo: boolean;
  soatNumeroPoliza: string;
  soatNumeroPlaca: string;
  lineas: AtencionServicioLineaDisplay[];
};

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
  monto_a_pagar?: number;
  soat_activo?: boolean;
  soat_numero_poliza?: string | null;
  soat_numero_placa?: string | null;
  servicios?: AtencionServicioLinea[];
};
