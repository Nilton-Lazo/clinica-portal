import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCrudListQuery } from "../../../../shared/crud/useCrudListQuery";
import type { DataGridFetchParams } from "../../../../shared/datagrid";
import type { PacienteListItem, RecordStatus } from "../types/historiaClinica.types";
import { listPacientes } from "../services/historiaClinica.service";

export type Notice = { type: "success" | "error"; text: string } | null;
export type StatusFilter = "ALL" | RecordStatus;

function toIsoDateOrNull(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function useHistoriaClinica() {
  const [filiacionFrom, setFiliacionFrom] = useState<string>("");
  const [filiacionTo, setFiliacionTo] = useState<string>("");
  const filiacionFromRef = useRef(filiacionFrom);
  const filiacionToRef = useRef(filiacionTo);
  filiacionFromRef.current = filiacionFrom;
  filiacionToRef.current = filiacionTo;

  const list = useCrudListQuery<PacienteListItem>({
    listFn: useCallback((params: DataGridFetchParams) => {
      const fromIso = toIsoDateOrNull(filiacionFromRef.current);
      const toIso = toIsoDateOrNull(filiacionToRef.current);
      return listPacientes({
        page: params.page,
        per_page: params.per_page,
        q: params.q,
        status: params.status as RecordStatus | undefined,
        sort: params.sort,
        sort_dir: params.sort_dir,
        filiacion_from: fromIso ?? undefined,
        filiacion_to: toIso ?? undefined,
      });
    }, []),
    errorMessage: "No se pudo cargar la lista de historias clínicas.",
    initialSort: "created_at",
    initialSortDir: "desc",
  });

  const {
    data,
    loading,
    listError,
    page,
    setPage,
    perPage,
    setPerPage,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,
    refresh,
  } = list;

  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (listError) {
      setNotice({ type: "error", text: listError });
    }
  }, [listError]);

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

  const prevFiliacionRef = useRef<{ from: string; to: string } | null>(null);
  useEffect(() => {
    const prev = prevFiliacionRef.current;
    const next = { from: filiacionFrom, to: filiacionTo };
    if (prev && (prev.from !== next.from || prev.to !== next.to)) {
      if (page !== 1) {
        setPage(1);
      } else {
        void refresh();
      }
    }
    prevFiliacionRef.current = next;
  }, [filiacionFrom, filiacionTo, page, refresh, setPage]);

  return {
    data,
    loading,
    notice,

    page,
    setPage,
    perPage,
    setPerPage,

    q,
    setQ,

    filiacionFrom,
    filiacionTo,
    setFrom,
    setTo,

    statusFilter: statusFilter as StatusFilter,
    setStatusFilter: setStatusFilter as (v: StatusFilter) => void,

    sort,
    sortDir,
    toggleSort,
    refresh,

    selected,
    selectedId,
    onSelect,
    clearSelection,

    canCreate,
    canEdit,
  };
}
