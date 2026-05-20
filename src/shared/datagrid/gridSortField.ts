import type { DataGridColumnDef } from "./types";

export type GridSortColumnRef = Pick<DataGridColumnDef<unknown>, "id" | "sortKey">;

export function resolveGridSortField(
  columnId: string | null | undefined,
  columns?: ReadonlyArray<GridSortColumnRef>
): string | undefined {
  if (!columnId) return undefined;
  if (!columns?.length) return columnId;
  const col = columns.find((c) => c.id === columnId);
  return col?.sortKey ?? columnId;
}

export function withResolvedGridSort<T extends { sort?: string; sort_dir?: string }>(
  params: T,
  columnId: string | null | undefined,
  columns?: ReadonlyArray<GridSortColumnRef>
): T {
  const sort = resolveGridSortField(columnId, columns);
  if (!sort) {
    const { sort: _s, sort_dir: _d, ...rest } = params as T & { sort?: string; sort_dir?: string };
    return rest as T;
  }
  return { ...params, sort };
}
