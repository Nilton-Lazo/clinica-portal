import { useCallback, useState } from "react";
import type { SortDirection } from "./types";

export type GridSortDefaults = {
  column: string;
  direction: SortDirection;
};

export type GridSortState = {
  sort: string | null;
  sortDir: SortDirection;
};

export function nextGridSort(
  current: GridSortState,
  columnId: string,
  defaults: GridSortDefaults
): GridSortState {
  if (current.sort !== columnId) {
    return { sort: columnId, sortDir: "asc" };
  }
  if (current.sortDir === "asc") {
    return { sort: columnId, sortDir: "desc" };
  }
  return { sort: null, sortDir: defaults.direction };
}

export function useGridSortState(defaults: GridSortDefaults) {
  const [state, setState] = useState<GridSortState>({
    sort: null,
    sortDir: defaults.direction,
  });

  const toggleSort = useCallback(
    (columnId: string) => {
      setState((prev) => nextGridSort(prev, columnId, defaults));
    },
    [defaults.column, defaults.direction]
  );

  const applySort = useCallback((next: GridSortState) => {
    setState(next);
  }, []);

  return {
    sort: state.sort,
    sortDir: state.sortDir,
    toggleSort,
    applySort,
    setSort: (sort: string | null) => setState((s) => ({ ...s, sort })),
    setSortDir: (sortDir: SortDirection) => setState((s) => ({ ...s, sortDir })),
  };
}

export function createGridSortToggle(
  getState: () => GridSortState,
  apply: (next: GridSortState) => void,
  defaults: GridSortDefaults
) {
  return (columnId: string) => {
    apply(nextGridSort(getState(), columnId, defaults));
  };
}
