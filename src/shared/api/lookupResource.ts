import { api } from "./index";
import { buildListQuery, normalizeListPerPage } from "../datagrid/buildListQuery";
import type { DataGridFetchParams } from "../datagrid/types";
import type { PaginatedResponse } from "../types/pagination";

export type LookupFetchParams = Partial<DataGridFetchParams> & {
  page?: number;
  per_page?: number;
};

export async function lookupResource<TApi, T>(
  path: string,
  params: LookupFetchParams,
  normalize: (row: TApi) => T
): Promise<PaginatedResponse<T>> {
  const res = await api.get<PaginatedResponse<TApi>>(
    `${path}${buildListQuery({
      page: params.page ?? 1,
      per_page: normalizeListPerPage(params.per_page ?? 20),
      q: params.q,
      sort: params.sort,
      sort_dir: params.sort_dir,
      status: params.status,
      ...params,
    })}`
  );

  return { ...res, data: (res.data ?? []).map(normalize) };
}
