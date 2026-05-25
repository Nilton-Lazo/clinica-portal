import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getApiErrorMessage, isAbortedRequest } from "../api/apiError";
import type { PaginatedResponse, PaginationMeta } from "../types/pagination";
import type { DataGridColumnDef, DataGridFetchParams, DataGridSortState, SortDirection } from "./types";
import { nextGridSort, type GridSortDefaults, type GridSortState } from "./gridSortCycle";
import { resolveGridSortField } from "./gridSortField";
import { normalizeListPerPage } from "./buildListQuery";

const defaultMeta: PaginationMeta = {
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
};

type Options<T> = {
  fetcher: (params: DataGridFetchParams) => Promise<PaginatedResponse<T>>;
  columns?: ReadonlyArray<Pick<DataGridColumnDef<T>, "id" | "sortKey">>;
  initialPerPage?: number;
  debounceMs?: number;
  extraParams?: Record<string, string | undefined>;
  enabled?: boolean;
  errorFallback?: string;
  defaultSort?: string;
  defaultSortDir?: SortDirection;
};

export function useDataGridQuery<T>(options: Options<T>) {
  const {
    fetcher,
    columns,
    initialPerPage = 10,
    debounceMs = 300,
    extraParams,
    enabled = true,
    errorFallback = "No se pudo cargar los datos.",
    defaultSort = "codigo",
    defaultSortDir = "asc",
  } = options;

  const sortDefaults: GridSortDefaults = useMemo(
    () => ({ column: defaultSort, direction: defaultSortDir }),
    [defaultSort, defaultSortDir]
  );

  const [data, setData] = useState<PaginatedResponse<T>>({ data: [], meta: defaultMeta });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(() => normalizeListPerPage(initialPerPage));
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, debounceMs);
  const [sortState, setSortState] = useState<GridSortState>({
    sort: null,
    sortDir: sortDefaults.direction,
  });

  const { sort, sortDir } = sortState;
  const extraKey = JSON.stringify(extraParams ?? {});

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (overrides?: Partial<DataGridFetchParams>) => {
      if (!enabled) return;

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      const targetPage = overrides?.page ?? page;
      const targetPerPage = overrides?.per_page ?? perPage;
      const activeSortColumnId = overrides?.sort !== undefined ? overrides.sort : sort;
      const activeSortDir = overrides?.sort_dir ?? sortDir;
      const activeSort = resolveGridSortField(activeSortColumnId, columns);

      try {
        const res = await fetcher({
          page: targetPage,
          per_page: targetPerPage,
          q: qDebounced.trim() || undefined,
          sort: activeSort,
          sort_dir: activeSortDir,
          ...(extraParams ?? {}),
          ...overrides,
        });
        if (requestId !== requestIdRef.current) return;
        setData(res);
      } catch (e) {
        if (requestId !== requestIdRef.current || isAbortedRequest(e)) return;
        setError(getApiErrorMessage(e, errorFallback));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [enabled, extraKey, extraParams, fetcher, columns, page, perPage, qDebounced, sort, sortDir, errorFallback]
  );

  const prevFiltersRef = useRef<string | null>(null);

  useEffect(() => {
    const signature = JSON.stringify({ q: qDebounced, perPage, sort, sortDir, extraKey });
    const filtersChanged = prevFiltersRef.current !== null && prevFiltersRef.current !== signature;
    prevFiltersRef.current = signature;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    void load();
  }, [page, perPage, qDebounced, sort, sortDir, extraKey, load]);

  const onSortChange = useCallback((next: DataGridSortState) => {
    setSortState(next);
  }, []);

  const toggleSort = useCallback(
    (columnId: string) => {
      setSortState((prev) => nextGridSort(prev, columnId, sortDefaults));
    },
    [sortDefaults]
  );

  return {
    data,
    loading,
    error,
    page,
    setPage,
    perPage,
    setPerPage: (n: number) => setPerPageState(normalizeListPerPage(n)),
    q,
    setQ,
    sort,
    sortDir,
    onSortChange,
    toggleSort,
    refresh: load,
    clearError: () => setError(null),
    sortDefaults,
  };
}
