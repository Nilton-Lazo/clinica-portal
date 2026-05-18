import type { DataGridFetchParams } from "./types";

export function buildListQuery(params: DataGridFetchParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("per_page", String(params.per_page ?? 25));

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
