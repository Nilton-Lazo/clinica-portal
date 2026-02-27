import { catalogoPacienteService } from "./catalogoPaciente.service";
import type { PacienteFormCatalogos } from "./types";

let cached: PacienteFormCatalogos | null = null;
let loadingPromise: Promise<PacienteFormCatalogos> | null = null;

/**
 * Obtiene el catálogo del wizard: usa cache en memoria para la sesión.
 * La primera vez hace las 4 peticiones; las siguientes devuelven al instante.
 * Opcionalmente se puede invalidar para forzar recarga.
 */
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

/** Invalida el cache para que la próxima apertura del wizard vuelva a pedir catálogo. */
export function invalidateWizardCatalog(): void {
  cached = null;
  loadingPromise = null;
}

/** Devuelve el catálogo en cache si existe (para mostrar UI de inmediato). */
export function getWizardCatalogSync(): PacienteFormCatalogos | null {
  return cached;
}
