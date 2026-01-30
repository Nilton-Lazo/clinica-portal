export type RecordStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type PacienteContactoEmergenciaDraft = {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  parentesco_emergencia: string;
  celular: string;
  telefono: string;
  observaciones: string;
};

export type PacienteDraft = {
  id?: number;

  tipo_documento: string;
  numero_documento: string;
  nr: string;

  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;

  estado_civil: string;
  sexo: string;
  fecha_nacimiento: string;

  nacionalidad_iso2: string;
  ubigeo_nacimiento: string;
  direccion: string;
  ubigeo_domicilio: string;

  parentesco_seguro: string;
  titular_nombre: string;

  celular: string;
  telefono: string;

  medico_tratante_id: string;

  tipo_sangre: string;
  tipo_paciente: string;

  ocupacion: string;
  email: string;

  medio_informacion: string;
  medio_informacion_detalle: string;

  ubicacion_archivo_hc: string;

  estado: RecordStatus;

  contacto_emergencia: PacienteContactoEmergenciaDraft;
};

export type PacientePlan = {
  id: number;
  paciente_id: number;
  tipo_cliente_id: number;
  parentesco_seguro: string | null;
  fecha_afiliacion: string;
  estado: RecordStatus;
  tipoCliente?: {
    id: number;
    codigo: string;
    nombre: string;
    estado: RecordStatus;
  };
};

export type PacienteFull = {
  id: number;

  tipo_documento: string;
  numero_documento: string | null;
  nr: string | null;

  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;

  estado_civil: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;

  nacionalidad_iso2: string | null;
  ubigeo_nacimiento: string | null;
  direccion: string | null;
  ubigeo_domicilio: string | null;

  parentesco_seguro: string | null;
  titular_nombre: string | null;

  celular: string | null;
  telefono: string | null;

  medico_tratante_id: number | null;

  tipo_sangre: string | null;
  tipo_paciente: string | null;

  ocupacion: string | null;
  email: string | null;

  medio_informacion: string | null;
  medio_informacion_detalle: string | null;

  ubicacion_archivo_hc: string | null;

  estado: RecordStatus;

  hc: string;
  nombre_completo: string;
  edad: number | null;

  contactoEmergencia?: {
    id: number;
    paciente_id: number;
    nombres: string | null;
    apellido_paterno: string | null;
    apellido_materno: string | null;
    parentesco_emergencia: string | null;
    celular: string | null;
    telefono: string | null;
    observaciones: string | null;
    estado: RecordStatus;
  } | null;

  planes: PacientePlan[];
};

export type ItemResponse<T> = { data: T };

export type PaisItem = {
  iso2: string;
  nombre: string;
};

export type UbigeoItem = {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
};

export type MedicoLookupItem = {
  id: number;
  nombre_completo?: string | null;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  estado?: RecordStatus | string | null;
};

export type PacienteFormCatalogos = {
  tipo_documento: string[];
  estado_civil: string[];
  sexo: string[];
  parentesco_seguro: string[];
  parentesco_emergencia: string[];
  tipo_paciente: string[];
  ocupacion: string[];
  medio_informacion: string[];
  tipo_sangre: string[];

  paises?: PaisItem[];
  ubigeos?: UbigeoItem[];
  medicos?: MedicoLookupItem[];
};

export const emptyDraft = (): PacienteDraft => ({
  tipo_documento: "",
  numero_documento: "",
  nr: "",

  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",

  estado_civil: "",
  sexo: "",
  fecha_nacimiento: "",

  nacionalidad_iso2: "",
  ubigeo_nacimiento: "",
  direccion: "",
  ubigeo_domicilio: "",

  parentesco_seguro: "",
  titular_nombre: "",

  celular: "",
  telefono: "",

  medico_tratante_id: "",

  tipo_sangre: "",
  tipo_paciente: "",

  ocupacion: "",
  email: "",

  medio_informacion: "",
  medio_informacion_detalle: "",

  ubicacion_archivo_hc: "",

  estado: "ACTIVO",

  contacto_emergencia: {
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    parentesco_emergencia: "",
    celular: "",
    telefono: "",
    observaciones: "",
  },
});

export const fullNameFromDraft = (d: Pick<PacienteDraft, "nombres" | "apellido_paterno" | "apellido_materno">) => {
  const a = d.apellido_paterno.trim();
  const b = d.apellido_materno.trim();
  const n = d.nombres.trim();
  return [a, b, n].filter(Boolean).join(" ").trim();
};

export const computeAge = (fecha: string) => {
  const s = fecha.trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!y || !mm || !dd) return null;
  const dob = new Date(Date.UTC(y, mm - 1, dd));
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const nMonth = now.getUTCMonth() + 1;
  const nDay = now.getUTCDate();
  if (nMonth < mm || (nMonth === mm && nDay < dd)) age -= 1;
  return age >= 0 ? age : null;
};

export const mapPacienteToDraft = (p: PacienteFull): PacienteDraft => ({
  id: p.id,

  tipo_documento: p.tipo_documento ?? "",
  numero_documento: p.numero_documento ?? "",
  nr: p.nr ?? "",

  nombres: p.nombres ?? "",
  apellido_paterno: p.apellido_paterno ?? "",
  apellido_materno: p.apellido_materno ?? "",

  estado_civil: p.estado_civil ?? "",
  sexo: p.sexo ?? "",
  fecha_nacimiento: p.fecha_nacimiento ?? "",

  nacionalidad_iso2: p.nacionalidad_iso2 ?? "",
  ubigeo_nacimiento: p.ubigeo_nacimiento ?? "",
  direccion: p.direccion ?? "",
  ubigeo_domicilio: p.ubigeo_domicilio ?? "",

  parentesco_seguro: p.parentesco_seguro ?? "",
  titular_nombre: p.titular_nombre ?? "",

  celular: p.celular ?? "",
  telefono: p.telefono ?? "",

  medico_tratante_id: p.medico_tratante_id !== null && p.medico_tratante_id !== undefined ? String(p.medico_tratante_id) : "",

  tipo_sangre: p.tipo_sangre ?? "",
  tipo_paciente: p.tipo_paciente ?? "",

  ocupacion: p.ocupacion ?? "",
  email: p.email ?? "",

  medio_informacion: p.medio_informacion ?? "",
  medio_informacion_detalle: p.medio_informacion_detalle ?? "",

  ubicacion_archivo_hc: p.ubicacion_archivo_hc ?? "",

  estado: p.estado,

  contacto_emergencia: {
    nombres: p.contactoEmergencia?.nombres ?? "",
    apellido_paterno: p.contactoEmergencia?.apellido_paterno ?? "",
    apellido_materno: p.contactoEmergencia?.apellido_materno ?? "",
    parentesco_emergencia: p.contactoEmergencia?.parentesco_emergencia ?? "",
    celular: p.contactoEmergencia?.celular ?? "",
    telefono: p.contactoEmergencia?.telefono ?? "",
    observaciones: p.contactoEmergencia?.observaciones ?? "",
  },
});

export const buildPacientePayload = (d: PacienteDraft) => {
  const toNull = (v: string) => {
    const x = v.trim();
    return x ? x : null;
  };

  const contacto = d.contacto_emergencia;
  const contactoHasAny =
    Boolean(contacto.nombres.trim()) ||
    Boolean(contacto.apellido_paterno.trim()) ||
    Boolean(contacto.apellido_materno.trim()) ||
    Boolean(contacto.parentesco_emergencia.trim()) ||
    Boolean(contacto.celular.trim()) ||
    Boolean(contacto.telefono.trim()) ||
    Boolean(contacto.observaciones.trim());

  return {
    tipo_documento: d.tipo_documento,
    numero_documento: toNull(d.numero_documento),
    nombres: toNull(d.nombres),
    apellido_paterno: toNull(d.apellido_paterno),
    apellido_materno: toNull(d.apellido_materno),
    estado_civil: toNull(d.estado_civil),
    sexo: toNull(d.sexo),
    fecha_nacimiento: toNull(d.fecha_nacimiento),
    nacionalidad_iso2: toNull(d.nacionalidad_iso2),
    ubigeo_nacimiento: toNull(d.ubigeo_nacimiento),
    direccion: toNull(d.direccion),
    ubigeo_domicilio: toNull(d.ubigeo_domicilio),
    parentesco_seguro: toNull(d.parentesco_seguro),
    titular_nombre: toNull(d.titular_nombre),
    celular: toNull(d.celular),
    telefono: toNull(d.telefono),
    email: toNull(d.email),
    medico_tratante_id: d.medico_tratante_id.trim() ? Number(d.medico_tratante_id) : null,
    tipo_sangre: toNull(d.tipo_sangre),
    tipo_paciente: toNull(d.tipo_paciente),
    ocupacion: toNull(d.ocupacion),
    medio_informacion: toNull(d.medio_informacion),
    medio_informacion_detalle: toNull(d.medio_informacion_detalle),
    ubicacion_archivo_hc: toNull(d.ubicacion_archivo_hc),
    estado: d.estado,
    contacto_emergencia: contactoHasAny
      ? {
          nombres: toNull(contacto.nombres),
          apellido_paterno: toNull(contacto.apellido_paterno),
          apellido_materno: toNull(contacto.apellido_materno),
          parentesco_emergencia: toNull(contacto.parentesco_emergencia),
          celular: toNull(contacto.celular),
          telefono: toNull(contacto.telefono),
          observaciones: toNull(contacto.observaciones),
        }
      : null,
  };
};
