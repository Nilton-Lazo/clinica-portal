import { programacionMedicaService } from "../services/programacionMedica.service";
import type { ConsultorioLookup, EspecialidadLookup, MedicoLookup, TurnoLookup } from "../types/programacionMedica.types";

export type ProgramacionCatalog = {
  medicos: MedicoLookup[];
  especialidades: EspecialidadLookup[];
  consultorios: ConsultorioLookup[];
  turnos: TurnoLookup[];
};

let cached: ProgramacionCatalog | null = null;
let loadingPromise: Promise<ProgramacionCatalog> | null = null;

/**
 * Obtiene el catálogo de programación (médicos, especialidades, consultorios, turnos).
 * Usa caché en memoria: la primera vez hace las 4 peticiones; las siguientes devuelven al instante.
 */
export function getProgramacionCatalog(forceRefresh = false): Promise<ProgramacionCatalog> {
  if (cached !== null && !forceRefresh) {
    return Promise.resolve(cached);
  }

  if (loadingPromise !== null && !forceRefresh) {
    return loadingPromise;
  }

  const svc = programacionMedicaService();
  loadingPromise = Promise.all([
    svc.listMedicosActivos(),
    svc.listEspecialidadesActivas(),
    svc.listConsultoriosActivos(),
    svc.listTurnosActivos(),
  ]).then(([medicos, especialidades, consultorios, turnos]) => {
    const result: ProgramacionCatalog = { medicos, especialidades, consultorios, turnos };
    cached = result;
    return result;
  });

  return loadingPromise;
}

/** Devuelve el catálogo en caché si existe (para mostrar datos al instante al reabrir). */
export function getProgramacionCatalogSync(): ProgramacionCatalog | null {
  return cached;
}

/** Invalida el caché para forzar recarga en la próxima petición. */
export function invalidateProgramacionCatalog(): void {
  cached = null;
  loadingPromise = null;
}
