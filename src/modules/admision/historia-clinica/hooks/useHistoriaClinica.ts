import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiError } from "../../../../shared/api/apiError";
import { useDebouncedValue } from "../../../../shared/hooks/useDebouncedValue";

import type { PacienteListItem, PaginatedResponse, RecordStatus } from "../types/historiaClinica.types";
import { listPacientes } from "../services/historiaClinica.service";

export type Notice = { type: "success" | "error"; text: string } | null;
export type StatusFilter = "ALL" | RecordStatus;

function clampPerPage(n: number) {
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  return 100;
}

function isApiError(e: unknown): e is ApiError {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === "string" && typeof x.message === "string";
}

function toIsoDateOrNull(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function useHistoriaClinica() {
  const [data, setData] = useState<PaginatedResponse<PacienteListItem>>({
    data: [],
    meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 },
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(50);

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [filiacionFrom, setFiliacionFrom] = useState<string>("");
  const [filiacionTo, setFiliacionTo] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selected, setSelected] = useState<PacienteListItem | null>(null);
  const selectedId = selected?.id ?? null;

  const canCreate = true;
  const canEdit = useMemo(() => selected !== null, [selected]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setNotice(null);
  }, []);

  const onSelect = useCallback((x: PacienteListItem) => {
    setSelected(x);
    setNotice(null);
  }, []);

  const setFrom = useCallback(
    (v: string) => {
      const nextFrom = v;
      setFiliacionFrom(nextFrom);

      const a = toIsoDateOrNull(nextFrom);
      const b = toIsoDateOrNull(filiacionTo);

      if (a && b && a > b) {
        setFiliacionTo(nextFrom);
      }
    },
    [filiacionTo]
  );

  const setTo = useCallback(
    (v: string) => {
      const nextTo = v;
      setFiliacionTo(nextTo);

      const a = toIsoDateOrNull(filiacionFrom);
      const b = toIsoDateOrNull(nextTo);

      if (a && b && b < a) {
        setFiliacionFrom(nextTo);
      }
    },
    [filiacionFrom]
  );

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      setLoading(true);
      setNotice(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      const fromIso = toIsoDateOrNull(filiacionFrom);
      const toIso = toIsoDateOrNull(filiacionTo);

      try {
        const res = await listPacientes({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() ? qDebounced.trim() : undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          filiacion_from: fromIso ?? undefined,
          filiacion_to: toIso ?? undefined,
        });

        const sorted = [...res.data].sort((a, b) => {
          const ax = a.created_at ?? "";
          const bx = b.created_at ?? "";
          return bx.localeCompare(ax);
        });

        setData({ ...res, data: sorted });
      } catch (e) {
        const msg = isApiError(e) ? e.message : "No se pudo cargar la lista.";
        setNotice({ type: "error", text: msg });
      } finally {
        setLoading(false);
      }
    },
    [filiacionFrom, filiacionTo, page, perPage, qDebounced, statusFilter]
  );

  const prevFiltersRef = useRef<{
    q: string;
    status: StatusFilter;
    perPage: number;
    from: string;
    to: string;
  } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage, from: filiacionFrom, to: filiacionTo };

    const filtersChanged =
      !prev ||
      prev.q !== next.q ||
      prev.status !== next.status ||
      prev.perPage !== next.perPage ||
      prev.from !== next.from ||
      prev.to !== next.to;

    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void refresh();
  }, [page, perPage, qDebounced, statusFilter, filiacionFrom, filiacionTo, refresh]);

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

    filiacionFrom,
    filiacionTo,
    setFrom,
    setTo,

    statusFilter,
    setStatusFilter,

    selected,
    selectedId,
    onSelect,
    clearSelection,

    canCreate,
    canEdit,

    refresh,
  };
}
