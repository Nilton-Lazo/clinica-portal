import { api } from "../../../../../shared/api";
import type { PresupuestoPacienteDetalle, PresupuestoPacientePlan } from "../types/presupuesto.types";

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function unwrapData<T>(res: unknown): T {
  if (isObject(res) && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

type IafaRaw = { id?: number; codigo?: string; descripcion_corta?: string; razon_social?: string };

type TarifaRaw = {
  id?: number;
  codigo?: string;
  descripcion_tarifa?: string;
  es_precio_directo?: boolean | number;
};

type TipoClienteRaw = {
  id?: number;
  codigo?: string;
  descripcion_tipo_cliente?: string;
  iafa?: IafaRaw | null;
  tarifa?: TarifaRaw | null;
};

type PlanRaw = {
  id?: number;
  estado?: string;
  tipo_cliente?: TipoClienteRaw | null;
  tipoCliente?: TipoClienteRaw | null;
};

function formatIafaLabel(i: IafaRaw): string {
  const codigo = i.codigo ? String(i.codigo) : "";
  const nombre = String(i.descripcion_corta ?? i.razon_social ?? i.codigo ?? "");
  if (codigo && nombre && !nombre.startsWith(codigo)) {
    return `${codigo} · ${nombre}`;
  }
  return nombre || (i.id != null ? `IAFA ${i.id}` : "");
}

function tipoClienteFromPlan(p: PlanRaw): TipoClienteRaw | null {
  return p.tipo_cliente ?? p.tipoCliente ?? null;
}

function normalizePlanRow(p: PlanRaw): PresupuestoPacientePlan | null {
  const id = typeof p.id === "number" ? p.id : Number(p.id);
  if (!Number.isFinite(id)) return null;
  const estado = String(p.estado ?? "").toUpperCase();
  if (estado && estado !== "ACTIVO") return null;
  const tc = tipoClienteFromPlan(p);
  if (!tc || typeof tc.id !== "number") return null;
  const tipoClienteId = tc.id;
  const desc = String(tc.descripcion_tipo_cliente ?? "").trim();
  const cod = String(tc.codigo ?? "").trim();
  const label = desc || (cod ? `${cod}` : `Plan ${id}`);
  const iafa = tc.iafa && typeof tc.iafa.id === "number" ? tc.iafa : null;
  const tf = tc.tarifa && typeof tc.tarifa.id === "number" ? tc.tarifa : null;
  const esDirecto = Boolean(tf?.es_precio_directo);
  const tarifaDesc = tf
    ? String(tf.descripcion_tarifa ?? tf.codigo ?? "").trim() || null
    : null;
  return {
    pacientePlanId: id,
    tipoClienteId,
    label,
    iafaId: iafa ? iafa.id : null,
    iafaLabel: iafa ? formatIafaLabel(iafa) : "",
    tarifaId: tf ? tf.id : null,
    tarifaCodigo: tf?.codigo != null ? String(tf.codigo) : null,
    tarifaDescripcion: tarifaDesc,
    tarifaEsPrecioDirecto: esDirecto,
  };
}

export async function fetchPacientePresupuesto(pacienteId: number): Promise<PresupuestoPacienteDetalle> {
  const res = await api.get<unknown>(`/admision/pacientes/${pacienteId}`);
  const x = unwrapData<Record<string, unknown>>(res) ?? {};
  const planesRaw = Array.isArray(x.planes) ? (x.planes as PlanRaw[]) : [];
  const planes: PresupuestoPacientePlan[] = [];
  for (const pr of planesRaw) {
    const n = normalizePlanRow(pr);
    if (n) planes.push(n);
  }
  return {
    id: typeof x.id === "number" ? x.id : pacienteId,
    hc: String(x.hc ?? ""),
    nr: x.nr != null && x.nr !== "" ? String(x.nr) : null,
    nombre_completo: String(x.nombre_completo ?? "").trim(),
    planes,
  };
}
