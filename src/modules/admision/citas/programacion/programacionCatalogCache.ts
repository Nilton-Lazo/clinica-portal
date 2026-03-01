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

export function getProgramacionCatalogSync(): ProgramacionCatalog | null {
  return cached;
}

export function invalidateProgramacionCatalog(): void {
  cached = null;
  loadingPromise = null;
}
