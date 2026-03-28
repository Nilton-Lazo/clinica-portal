import { api } from "../../../shared/api";
import type {
  PaqueteLookup,
  PaqueteServicioItem,
  TarifaLookup,
  TarifaServiciosTree,
} from "../types/paqueteServicios.types";

type Obj = Record<string, unknown>;

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toInt(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTarifa(x: unknown): TarifaLookup {
  const o = (x ?? {}) as Obj;
  return {
    id: toInt(o.id),
    codigo: toStr(o.codigo),
    descripcion_tarifa: toStr(o.descripcion_tarifa),
  };
}

function normalizePaquete(x: unknown): PaqueteLookup {
  const o = (x ?? {}) as Obj;
  return {
    id: toInt(o.id),
    codigo: toStr(o.codigo),
    descripcion: toStr(o.descripcion),
    tarifa_id: toInt(o.tarifa_id),
    estado: (toStr(o.estado).toUpperCase() || "ACTIVO") as PaqueteLookup["estado"],
  };
}

function normalizeServicio(x: unknown): PaqueteServicioItem {
  const o = (x ?? {}) as Obj;
  return {
    id: toInt(o.id),
    codigo: toStr(o.codigo),
    descripcion: toStr(o.descripcion),
    precio_sin_igv: toStr(o.precio_sin_igv),
    unidad: toStr(o.unidad),
    categoria_codigo: toStr(o.categoria_codigo),
    categoria_nombre: toStr(o.categoria_nombre),
    subcategoria_codigo: toStr(o.subcategoria_codigo),
    subcategoria_nombre: toStr(o.subcategoria_nombre),
  };
}

export async function listTarifasOperativas(): Promise<TarifaLookup[]> {
  const res = await api.get<{ data: unknown[] }>("/ficheros/tarifas/operativas");
  return (res.data ?? []).map(normalizeTarifa).filter((x) => x.id > 0);
}

export async function listPaquetesByTarifa(tarifaId: number): Promise<PaqueteLookup[]> {
  const res = await api.get<{ data: unknown[] }>(`/ficheros/tarifas/${tarifaId}/paquetes`);
  return (res.data ?? []).map(normalizePaquete).filter((x) => x.id > 0);
}

export async function getTarifaServiciosTree(tarifaId: number): Promise<TarifaServiciosTree> {
  const res = await api.get<{ data: { tarifa: unknown; tree: unknown[] } }>(`/ficheros/tarifas/${tarifaId}/arbol-servicios`);
  const data = res.data ?? { tarifa: {}, tree: [] };
  return {
    tarifa: normalizeTarifa(data.tarifa),
    tree: (data.tree ?? []).map((cat) => {
      const c = cat as Obj;
      return {
        id: toInt(c.id),
        codigo: toStr(c.codigo),
        nombre: toStr(c.nombre),
        subcategorias: ((c.subcategorias ?? []) as unknown[]).map((sub) => {
          const s = sub as Obj;
          return {
            id: toInt(s.id),
            codigo: toStr(s.codigo),
            nombre: toStr(s.nombre),
            servicios: ((s.servicios ?? []) as unknown[]).map((sv) => {
              const v = sv as Obj;
              return {
                id: toInt(v.id),
                codigo: toStr(v.codigo),
                descripcion: toStr(v.descripcion),
                precio_sin_igv: toStr(v.precio_sin_igv),
                unidad: toStr(v.unidad),
              };
            }),
          };
        }),
      };
    }),
  };
}

export async function getPaqueteServicios(paqueteId: number): Promise<PaqueteServicioItem[]> {
  const res = await api.get<{ data: { servicios: unknown[] } }>(`/ficheros/paquetes/${paqueteId}/servicios`);
  return (res.data?.servicios ?? []).map(normalizeServicio).filter((x) => x.id > 0);
}

export async function syncPaqueteServicios(paqueteId: number, servicioIds: number[]): Promise<PaqueteServicioItem[]> {
  const res = await api.put<{ data: { servicios: unknown[] } }>(`/ficheros/paquetes/${paqueteId}/servicios/sync`, {
    servicio_ids: servicioIds,
  });
  return (res.data?.servicios ?? []).map(normalizeServicio).filter((x) => x.id > 0);
}
