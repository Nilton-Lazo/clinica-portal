import type { Cliente, ClienteTipo, ClientesQuery, PaginatedResponse, RecordStatus } from "../types/clientes.types";
import { api } from "../../../shared/api";

export type ClienteCreatePayload = {
  tipo: ClienteTipo;
  nombre: string;
  dni_o_ruc: string;
  telefono: string | null;
  direccion: string | null;
  estado?: RecordStatus;
};

export type ClienteUpdatePayload = {
  tipo: ClienteTipo;
  nombre: string;
  dni_o_ruc: string;
  telefono: string | null;
  direccion: string | null;
  estado: RecordStatus;
};

type ClienteApi = {
  id: number;
  codigo?: unknown;
  tipo?: unknown;
  nombre?: unknown;
  dni_o_ruc?: unknown;
  telefono?: unknown;
  direccion?: unknown;
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

function normalizeEstado(v: unknown): RecordStatus {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "INACTIVO") return "INACTIVO";
  if (s === "SUSPENDIDO") return "SUSPENDIDO";
  return "ACTIVO";
}

function normalizeTipo(v: unknown): ClienteTipo {
  const s = toStrOrEmpty(v).toUpperCase();
  return s === "ADMINISTRATIVO" ? "ADMINISTRATIVO" : "ASISTENCIAL";
}

function normalizeCliente(x: ClienteApi): Cliente {
  return {
    id: x.id,
    codigo: toStrOrEmpty(x.codigo),
    tipo: normalizeTipo(x.tipo),
    nombre: toStrOrEmpty(x.nombre),
    dni_o_ruc: toStrOrEmpty(x.dni_o_ruc),
    telefono: toStrOrNull(x.telefono),
    direccion: toStrOrNull(x.direccion),
    estado: normalizeEstado(x.estado),
    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

function buildQuery(query: ClientesQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.status) params.set("status", query.status);

  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getNextClienteCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/ficheros/clientes/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export async function listClientes(query: ClientesQuery): Promise<PaginatedResponse<Cliente>> {
  const res = await api.get<PaginatedResponse<ClienteApi>>(`/ficheros/clientes${buildQuery(query)}`);
  return { ...res, data: res.data.map(normalizeCliente) };
}

export async function createCliente(payload: ClienteCreatePayload): Promise<{ data: Cliente }> {
  const res = await api.post<{ data: ClienteApi }>(`/ficheros/clientes`, payload);
  return { data: normalizeCliente(res.data) };
}

export async function updateCliente(id: number, payload: ClienteUpdatePayload): Promise<{ data: Cliente }> {
  const res = await api.put<{ data: ClienteApi }>(`/ficheros/clientes/${id}`, payload);
  return { data: normalizeCliente(res.data) };
}

export async function deactivateCliente(id: number): Promise<{ data: Cliente }> {
  const res = await api.patch<{ data: ClienteApi }>(`/ficheros/clientes/${id}/desactivar`);
  return { data: normalizeCliente(res.data) };
}
