import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RegistroEmergencia,
  PaginatedResponse,
  RegistroEmergenciaQuery,
} from "../../types/registroEmergencia.types";
import {
  listRegistroEmergencia,
  invalidateRegistroEmergenciaCache,
} from "../../services/registroEmergencia.service";
import { nextGridSort } from "../../../../shared/datagrid/gridSortCycle";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";
import { useToast } from "../../../../shared/feedback";
import { getApiErrorMessage } from "../../../../shared/api/apiError";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

export type PeriodPreset = "" | "hoy" | "ayer" | "ultima_semana" | "este_mes";

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRangeForPreset(preset: PeriodPreset): { desde: string; hasta: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (preset === "hoy") {
    const s = toYYYYMMDD(today);
    return { desde: s, hasta: s };
  }
  if (preset === "ayer") {
    const ayer = new Date(today);
    ayer.setDate(ayer.getDate() - 1);
    const s = toYYYYMMDD(ayer);
    return { desde: s, hasta: s };
  }
  if (preset === "ultima_semana") {
    const desde = new Date(today);
    desde.setDate(desde.getDate() - 6);
    return { desde: toYYYYMMDD(desde), hasta: toYYYYMMDD(today) };
  }
  if (preset === "este_mes") {
    const desde = new Date(today.getFullYear(), today.getMonth(), 1);
    return { desde: toYYYYMMDD(desde), hasta: toYYYYMMDD(today) };
  }
  return { desde: "", hasta: "" };
}

function clampPerPage(n: number): number {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

export function useRegistroEmergencia() {
  const toast = useToast();
  const [data, setData] = useState<PaginatedResponse<RegistroEmergencia>>({
    data: [],
    meta: {
      current_page: 1,
      per_page: DEFAULT_PER_PAGE,
      total: 0,
      last_page: 1,
    },
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 300);
  const [fechaDesde, setFechaDesde] = useState(() => toYYYYMMDD(new Date()));
  const [fechaHasta, setFechaHasta] = useState(() => toYYYYMMDD(new Date()));
  const [periodPreset, setPeriodPresetState] = useState<PeriodPreset>("hoy");
  const [sortState, setSortState] = useState<{ sort: string | null; sortDir: "asc" | "desc" }>({
    sort: null,
    sortDir: "asc",
  });
  const { sort, sortDir } = sortState;
  const [selected, setSelected] = useState<RegistroEmergencia | null>(null);
  const prevFiltersRef = useRef<{
    q: string;
    fechaDesde: string;
    fechaHasta: string;
    perPage: number;
  } | null>(null);
  const lastToastedErrorRef = useRef<string | null>(null);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;
      const query: RegistroEmergenciaQuery = {
        page: targetPage,
        per_page: targetPerPage,
        q: qDebounced.trim() || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        sort: sort ?? undefined,
        sort_dir: sortDir,
      };
      try {
        const res = await listRegistroEmergencia(query);
        lastToastedErrorRef.current = null;
        setData(res);
      } catch (e) {
        const msg = getApiErrorMessage(e, "No se pudo cargar el listado de registros de emergencia.");
        if (lastToastedErrorRef.current !== msg) {
          lastToastedErrorRef.current = msg;
          toast.error(msg);
        }
        setData({
          data: [],
          meta: {
            current_page: targetPage,
            per_page: targetPerPage,
            total: 0,
            last_page: 1,
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, qDebounced, fechaDesde, fechaHasta, sort, sortDir, toast]
  );

  const toggleSort = useCallback((columnId: string) => {
    setSortState((prev) => nextGridSort(prev, columnId, { column: "orden", direction: "asc" }));
  }, []);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = {
      q: qDebounced,
      fechaDesde,
      fechaHasta,
      perPage,
    };
    const filtersChanged =
      !prev ||
      prev.q !== next.q ||
      prev.fechaDesde !== next.fechaDesde ||
      prev.fechaHasta !== next.fechaHasta ||
      prev.perPage !== next.perPage;
    prevFiltersRef.current = next;
    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }
    void refresh();
  }, [page, perPage, qDebounced, fechaDesde, fechaHasta, sort, sortDir, refresh]);

  const invalidateCache = useCallback(() => {
    invalidateRegistroEmergenciaCache();
    void refresh();
  }, [refresh]);

  const selectRow = useCallback((row: RegistroEmergencia | null) => {
    setSelected(row);
  }, []);

  const setPeriodPreset = useCallback((preset: PeriodPreset) => {
    setPeriodPresetState(preset);
    const { desde, hasta } = getRangeForPreset(preset);
    setFechaDesde(desde);
    setFechaHasta(hasta);
  }, []);

  const setFechaDesdeAndClearPreset = useCallback((v: string) => {
    setPeriodPresetState("");
    setFechaDesde(v);
  }, []);

  const setFechaHastaAndClearPreset = useCallback((v: string) => {
    setPeriodPresetState("");
    setFechaHasta(v);
  }, []);

  return {
    data,
    loading,
    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPage(clampPerPage(n)),
    q,
    setQ,
    fechaDesde,
    setFechaDesde: setFechaDesdeAndClearPreset,
    fechaHasta,
    setFechaHasta: setFechaHastaAndClearPreset,
    periodPreset,
    setPeriodPreset,
    selected,
    selectRow,
    sort,
    sortDir,
    toggleSort,
    refresh: invalidateCache,
  };
}
