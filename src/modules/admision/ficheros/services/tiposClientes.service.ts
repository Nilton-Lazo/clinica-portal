import type {
    ContratanteLookup,
    IafaLookup,
    PaginatedResponse,
    RecordStatus,
    TarifaLookup,
    TipoCliente,
    TiposClientesQuery,
  } from "../types/tiposClientes.types";
  import { api } from "../../../../shared/api";
  
  export type TipoClienteCreatePayload = {
    tarifa_id: number;
    contratante_id: number;
    estado?: RecordStatus;
  };
  
  export type TipoClienteUpdatePayload = {
    tarifa_id: number;
    contratante_id: number;
    estado: RecordStatus;
  };
  
  type TarifaApi = {
    id: number;
    codigo?: unknown;
    descripcion_tarifa?: unknown;
    iafa_id?: unknown;
    estado?: unknown;
  };
  
  type ContratanteApi = {
    id: number;
    codigo?: unknown;
    razon_social?: unknown;
    estado?: unknown;
  };
  
  type IafaApi = {
    id: number;
    codigo?: unknown;
    razon_social?: unknown;
    estado?: unknown;
  };
  
  type TipoClienteApi = {
    id: number;
  
    codigo?: unknown;
  
    tarifa_id?: unknown;
    iafa_id?: unknown;
    contratante_id?: unknown;
  
    descripcion_tipo_cliente?: unknown;
  
    estado?: unknown;
  
    created_at?: unknown;
    updated_at?: unknown;
  };
  
  function toStrOrNull(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") {
      const s = v.trim();
      return s === "" ? null : s;
    }
    if (typeof v === "number") return String(v);
    return null;
  }
  
  function toStrOrEmpty(v: unknown): string {
    return toStrOrNull(v) ?? "";
  }
  
  function toIntNonNeg(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.trunc(v));
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return fallback;
      const n = Number(s);
      if (!Number.isFinite(n)) return fallback;
      return Math.max(0, Math.trunc(n));
    }
    return fallback;
  }
  
  function normalizeEstado(v: unknown): RecordStatus {
    const s = toStrOrEmpty(v).toUpperCase();
    if (s === "INACTIVO") return "INACTIVO";
    if (s === "SUSPENDIDO") return "SUSPENDIDO";
    return "ACTIVO";
  }
  
  export async function getNextTipoClienteCodigo(): Promise<{ codigo: string }> {
    const res = await api.get<{ data: { codigo: unknown } }>("/admision/ficheros/tipos-clientes/next-codigo");
    return { codigo: toStrOrEmpty(res.data?.codigo) };
  }
  
  function buildQuery(query: TiposClientesQuery): string {
    const params = new URLSearchParams();
  
    params.set("page", String(query.page ?? 1));
    params.set("per_page", String(query.per_page ?? 50));
  
    const q = (query.q ?? "").trim();
    if (q) params.set("q", q);
  
    if (query.status) params.set("status", query.status);
  
    const s = params.toString();
    return s ? `?${s}` : "";
  }
  
  function normalizeTipoCliente(x: TipoClienteApi): TipoCliente {
    return {
      id: x.id,
  
      codigo: toStrOrEmpty(x.codigo),
  
      tarifa_id: toIntNonNeg(x.tarifa_id, 0),
      iafa_id: toIntNonNeg(x.iafa_id, 0),
      contratante_id: toIntNonNeg(x.contratante_id, 0),
  
      descripcion_tipo_cliente: toStrOrEmpty(x.descripcion_tipo_cliente),
  
      estado: normalizeEstado(x.estado),
  
      created_at: toStrOrNull(x.created_at) ?? undefined,
      updated_at: toStrOrNull(x.updated_at) ?? undefined,
    };
  }
  
  export async function listTiposClientes(query: TiposClientesQuery): Promise<PaginatedResponse<TipoCliente>> {
    const res = await api.get<PaginatedResponse<TipoClienteApi>>(`/admision/ficheros/tipos-clientes${buildQuery(query)}`);
    return {
      ...res,
      data: (res.data ?? []).map(normalizeTipoCliente),
    };
  }
  
  export async function createTipoCliente(payload: TipoClienteCreatePayload): Promise<{ data: TipoCliente }> {
    const res = await api.post<{ data: TipoClienteApi }>(`/admision/ficheros/tipos-clientes`, payload);
    return { data: normalizeTipoCliente(res.data) };
  }
  
  export async function updateTipoCliente(id: number, payload: TipoClienteUpdatePayload): Promise<{ data: TipoCliente }> {
    const res = await api.put<{ data: TipoClienteApi }>(`/admision/ficheros/tipos-clientes/${id}`, payload);
    return { data: normalizeTipoCliente(res.data) };
  }
  
  export async function deactivateTipoCliente(id: number): Promise<{ data: TipoCliente }> {
    const res = await api.patch<{ data: TipoClienteApi }>(`/admision/ficheros/tipos-clientes/${id}/desactivar`);
    return { data: normalizeTipoCliente(res.data) };
  }
  
  function normalizeTarifaLookup(x: TarifaApi): TarifaLookup | null {
    const id = x.id;
    if (!id) return null;
  
    const codigo = toStrOrEmpty(x.codigo);
    const desc = toStrOrEmpty(x.descripcion_tarifa);
    const iafaId = toIntNonNeg(x.iafa_id, 0);
  
    if (!codigo.trim() || !desc.trim()) return null;
    if (!iafaId) return null;
  
    return { id, codigo, descripcion_tarifa: desc, iafa_id: iafaId };
  }
  
  export async function listTarifasLookupForTipoCliente(): Promise<TarifaLookup[]> {
    const res = await api.get<{
      data: TarifaApi[];
      meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`/admision/ficheros/tarifas?page=1&per_page=100&status=ACTIVO`);
  
    return (res.data ?? [])
      .map(normalizeTarifaLookup)
      .filter((x): x is TarifaLookup => Boolean(x));
  }
  
  function normalizeContratanteLookup(x: ContratanteApi): ContratanteLookup | null {
    const id = x.id;
    if (!id) return null;
  
    const codigo = toStrOrEmpty(x.codigo);
    const rs = toStrOrEmpty(x.razon_social);
  
    if (!codigo.trim() || !rs.trim()) return null;
  
    return { id, codigo, razon_social: rs };
  }
  
  export async function listContratantesLookupActive(): Promise<ContratanteLookup[]> {
    const res = await api.get<{
      data: ContratanteApi[];
      meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`/admision/ficheros/contratantes?page=1&per_page=100&status=ACTIVO`);
  
    return (res.data ?? [])
      .map(normalizeContratanteLookup)
      .filter((x): x is ContratanteLookup => Boolean(x));
  }
  
  function normalizeIafaLookup(x: IafaApi): IafaLookup | null {
    const id = x.id;
    if (!id) return null;
  
    const codigo = toStrOrEmpty(x.codigo);
    const rs = toStrOrEmpty(x.razon_social);
  
    if (!codigo.trim() || !rs.trim()) return null;
  
    return { id, codigo, razon_social: rs };
  }
  
  export async function listIafasLookupActive(): Promise<IafaLookup[]> {
    const res = await api.get<{
      data: IafaApi[];
      meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`/admision/ficheros/iafas?page=1&per_page=100&status=ACTIVO`);
  
    return (res.data ?? [])
      .map(normalizeIafaLookup)
      .filter((x): x is IafaLookup => Boolean(x));
  }
  