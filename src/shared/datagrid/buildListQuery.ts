import type { DataGridFetchParams } from "./types";

export const LIST_PAGE_SIZES = [10, 20, 50] as const;

export type ListPageSize = (typeof LIST_PAGE_SIZES)[number];

export function normalizeListPerPage(value: number | undefined): ListPageSize {
  const n = Number(value ?? 10);
  if (!Number.isFinite(n)) return 10;
  if (n === 20) return 20;
  if (n === 50) return 50;
  return 10;
}

export function buildListQuery(params: DataGridFetchParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("per_page", String(normalizeListPerPage(params.per_page)));

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }

  if (params.sort) {
    search.set("sort", params.sort);
    search.set("sort_dir", params.sort_dir ?? "asc");
  }

  if (params.status) {
    search.set("status", params.status);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (
      key === "page" ||
      key === "per_page" ||
      key === "q" ||
      key === "sort" ||
      key === "sort_dir" ||
      key === "status"
    ) {
      return;
    }
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(`filter_${key}`, String(value));
  });

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
