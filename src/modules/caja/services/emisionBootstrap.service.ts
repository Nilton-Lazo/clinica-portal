import { api } from "../../../shared/api";
import type { EmisionBootstrapBundle } from "../types/emisionBootstrap.types";

export function fetchEmisionBootstrap(): Promise<EmisionBootstrapBundle> {
  return api.get<EmisionBootstrapBundle>("/caja/emision-comprobantes/bootstrap");
}
