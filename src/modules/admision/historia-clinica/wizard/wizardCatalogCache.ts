import { catalogoPacienteService } from "./catalogoPaciente.service";
import type { PacienteFormCatalogos } from "./types";

let cached: PacienteFormCatalogos | null = null;
let loadingPromise: Promise<PacienteFormCatalogos> | null = null;

export function getWizardCatalog(forceRefresh = false): Promise<PacienteFormCatalogos> {
  if (cached !== null && !forceRefresh) {
    return Promise.resolve(cached);
  }

  if (loadingPromise !== null && !forceRefresh) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const [formRes, paisesRes, ubigeosRes, medicosRes] = await Promise.all([
      catalogoPacienteService.pacienteForm(),
      catalogoPacienteService.paisesList(),
      catalogoPacienteService.ubigeosFirstPage(),
      catalogoPacienteService.medicosActivos(),
    ]);

    const merged: PacienteFormCatalogos = {
      ...formRes.data,
      paises: paisesRes,
      ubigeos: ubigeosRes,
      medicos: medicosRes.data,
    };

    cached = merged;
    return merged;
  })();

  return loadingPromise;
}

export function invalidateWizardCatalog(): void {
  cached = null;
  loadingPromise = null;
}

export function getWizardCatalogSync(): PacienteFormCatalogos | null {
  return cached;
}
