import { api } from "./index";
import { buildListQuery } from "../datagrid/buildListQuery";
import type { DataGridFetchParams } from "../datagrid/types";
import type { PaginatedResponse } from "../types/pagination";

export async function listResource<TApi, T>(
  path: string,
  params: DataGridFetchParams,
  normalize: (row: TApi) => T
): Promise<PaginatedResponse<T>> {
  const res = await api.get<PaginatedResponse<TApi>>(`${path}${buildListQuery(params)}`);
  return { ...res, data: (res.data ?? []).map(normalize) };
}
