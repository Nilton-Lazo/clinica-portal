import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../../../../shared/hooks/useDebouncedValue";
import { toUserFriendlyMessage } from "../../utils/userFriendlyError";
import { listPresupuestos } from "../services/presupuestoLista.service";
import type {
  PresupuestoDocumentoEstado,
  PresupuestoListaResponse,
} from "../types/presupuestoLista.types";

export type PresupuestoListaNotice = { type: "success" | "error"; text: string } | null;
export type EstadoPresupuestoFiltro = "ALL" | PresupuestoDocumentoEstado;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function toIsoDateOrNull(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function usePresupuestosLista() {
  const [data, setData] = useState<PresupuestoListaResponse>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<PresupuestoListaNotice>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [vigenciaDesde, setVigenciaDesde] = useState("");
  const [vigenciaHasta, setVigenciaHasta] = useState("");

  const [estadoFilter, setEstadoFilter] = useState<EstadoPresupuestoFiltro>("ALL");

  const setDesde = useCallback(
    (v: string) => {
      setVigenciaDesde(v);
      const a = toIsoDateOrNull(v);
      const b = toIsoDateOrNull(vigenciaHasta);
      if (a && b && a > b) setVigenciaHasta(v);
    },
    [vigenciaHasta]
  );

  const setHasta = useCallback(
    (v: string) => {
      setVigenciaHasta(v);
      const a = toIsoDateOrNull(vigenciaDesde);
      const b = toIsoDateOrNull(v);
      if (a && b && b < a) setVigenciaDesde(v);
    },
    [vigenciaDesde]
  );

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);
      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;
      const desdeIso = toIsoDateOrNull(vigenciaDesde);
      const hastaIso = toIsoDateOrNull(vigenciaHasta);

      try {
        const res = await listPresupuestos({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() ? qDebounced.trim() : undefined,
          vigencia_desde: desdeIso ?? undefined,
          vigencia_hasta: hastaIso ?? undefined,
          estado: estadoFilter === "ALL" ? undefined : estadoFilter,
        });
        setData(res);
      } catch (e) {
        setNotice({
          type: "error",
          text: toUserFriendlyMessage(e, "No se pudo cargar la lista de presupuestos."),
        });
      } finally {
        setLoading(false);
      }
    },
    [estadoFilter, page, perPage, qDebounced, vigenciaDesde, vigenciaHasta]
  );

  const prevFiltersRef = useRef<{
    q: string;
    estado: EstadoPresupuestoFiltro;
    perPage: number;
    desde: string;
    hasta: string;
  } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, estado: estadoFilter, perPage, desde: vigenciaDesde, hasta: vigenciaHasta };
    const filtersChanged =
      !prev ||
      prev.q !== next.q ||
      prev.estado !== next.estado ||
      prev.perPage !== next.perPage ||
      prev.desde !== next.desde ||
      prev.hasta !== next.hasta;
    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qDebounced, estadoFilter, vigenciaDesde, vigenciaHasta, refresh]);

  const noopSelect = useCallback(() => {}, []);

  return {
    data,
    loading,
    notice,
    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPageState(clampPerPage(n)),
    q,
    setQ,
    vigenciaDesde,
    vigenciaHasta,
    setVigenciaDesde: setDesde,
    setVigenciaHasta: setHasta,
    estadoFilter,
    setEstadoFilter,
    refresh,
    noopSelect,
  };
}
