import { api } from "../api";
import {
  applyCodigoCorrelativoConfig,
  type CodigoCorrelativoConfig,
} from "../constants/codigoCorrelativo";

let loadPromise: Promise<CodigoCorrelativoConfig> | null = null;

export function loadCodigoCorrelativoConfig(): Promise<CodigoCorrelativoConfig> {
  if (!loadPromise) {
    loadPromise = api
      .get<{ data: CodigoCorrelativoConfig }>("/system/codigos")
      .then((res) => {
        const cfg = res.data;
        applyCodigoCorrelativoConfig(cfg);
        return cfg;
      })
      .catch(() => ({
        correlativo_min_digits: 3,
        correlativo_max_digits: 10,
      }));
  }

  return loadPromise;
}
