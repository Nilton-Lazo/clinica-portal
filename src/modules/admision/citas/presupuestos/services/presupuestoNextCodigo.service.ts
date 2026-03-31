import { api } from "../../../../../shared/api";

export const PRESUPUESTO_NEXT_CODIGO_STORAGE_KEY = "admision:presupuesto:next_codigo_preview";

let inFlightNextCodigo: Promise<string> | null = null;

export function readCachedPresupuestoNextCodigo(): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(PRESUPUESTO_NEXT_CODIGO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeCachedPresupuestoNextCodigo(codigo: string): void {
  try {
    sessionStorage.setItem(PRESUPUESTO_NEXT_CODIGO_STORAGE_KEY, codigo);
  } catch {
    void 0;
  }
}

export function clearCachedPresupuestoNextCodigo(): void {
  try {
    sessionStorage.removeItem(PRESUPUESTO_NEXT_CODIGO_STORAGE_KEY);
  } catch {
    void 0;
  }
}

export function fetchPresupuestoNextCodigo(): Promise<string> {
  if (!inFlightNextCodigo) {
    inFlightNextCodigo = api
      .get<{ data: { codigo: string } }>("/admision/citas/presupuestos/next-codigo")
      .then((res) => res.data.codigo)
      .finally(() => {
        inFlightNextCodigo = null;
      });
  }
  return inFlightNextCodigo;
}
