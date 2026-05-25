import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getApiErrorMessage, isAbortedRequest } from "../api/apiError";
import type { PaginatedResponse, PaginationMeta } from "../types/pagination";
import type { DataGridColumnDef, DataGridFetchParams, SortDirection } from "../datagrid/types";
import { nextGridSort, type GridSortDefaults, type GridSortState } from "../datagrid/gridSortCycle";
import { resolveGridSortField } from "../datagrid/gridSortField";
import { normalizeListPerPage } from "../datagrid/buildListQuery";
import { toastService } from "../notifications";

export type CrudStatusFilter = "ALL" | string;

const defaultMeta: PaginationMeta = {
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
};

export function clampCrudPerPage(n: number) {
  return normalizeListPerPage(n);
}

type Options<T> = {
  listFn: (params: DataGridFetchParams) => Promise<PaginatedResponse<T>>;
  columns?: ReadonlyArray<Pick<DataGridColumnDef<T>, "id" | "sortKey">>;
  errorMessage: string;
  initialPerPage?: number;
  defaultSort?: string;
  defaultSortDir?: SortDirection;
  initialSort?: string | null;
  initialSortDir?: SortDirection;
  debounceMs?: number;
};

export function useCrudListQuery<T>(options: Options<T>) {
  const {
    listFn,
    columns,
    errorMessage,
    initialPerPage = 10,
    defaultSort: defaultSortOpt,
    defaultSortDir = "asc",
    initialSort,
    initialSortDir = "asc",
    debounceMs = 300,
  } = options;

  const sortDefaults: GridSortDefaults = useMemo(
    () => ({
      column: defaultSortOpt ?? initialSort ?? "codigo",
      direction: defaultSortDir ?? initialSortDir,
    }),
    [defaultSortOpt, defaultSortDir, initialSort, initialSortDir]
  );

  const [data, setData] = useState<PaginatedResponse<T>>({ data: [], meta: defaultMeta });
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(() => clampCrudPerPage(initialPerPage));
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, debounceMs);
  const [statusFilter, setStatusFilter] = useState<CrudStatusFilter>("ALL");
  const [sortState, setSortState] = useState<GridSortState>({
    sort: null,
    sortDir: sortDefaults.direction,
  });

  const { sort, sortDir } = sortState;

  const requestIdRef = useRef(0);

  const refresh = useCallback(
    async (next?: { page?: number; perPage?: number }) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setListError(null);

      const targetPage = next?.page ?? page;
      const targetPerPage = next?.perPage ?? perPage;

      try {
        const res = await listFn({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          sort: resolveGridSortField(sort, columns),
          sort_dir: sortDir,
        });
        if (requestId !== requestIdRef.current) return;
        setData(res);
      } catch (e) {
        if (requestId !== requestIdRef.current || isAbortedRequest(e)) return;
        const msg = getApiErrorMessage(e, errorMessage);
        setListError(msg);
        toastService.showError(msg);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [errorMessage, listFn, columns, page, perPage, qDebounced, sort, sortDir, statusFilter]
  );

  const prevFiltersRef = useRef<{
    q: string;
    status: CrudStatusFilter;
    perPage: number;
    sort: string | null;
    sortDir: SortDirection;
  } | null>(null);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = { q: qDebounced, status: statusFilter, perPage, sort, sortDir };
    const filtersChanged =
      !prev ||
      prev.q !== next.q ||
      prev.status !== next.status ||
      prev.perPage !== next.perPage ||
      prev.sort !== next.sort ||
      prev.sortDir !== next.sortDir;

    prevFiltersRef.current = next;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void refresh();
  }, [page, perPage, qDebounced, statusFilter, sort, sortDir, refresh]);

  const toggleSort = useCallback(
    (columnId: string) => {
      setSortState((prev) => nextGridSort(prev, columnId, sortDefaults));
    },
    [sortDefaults]
  );

  return {
    data,
    loading,
    listError,
    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPageState(clampCrudPerPage(n)),
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    sort,
    sortDir,
    toggleSort,
    refresh,
    sortDefaults,
  };
}
