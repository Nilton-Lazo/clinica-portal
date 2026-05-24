import { downloadReportFileSafe } from "../../../../shared/reporting";

export function hojaFiliacionReportPath(pacienteId: number): string {
  return `/admision/pacientes/${pacienteId}/reporte-filiacion`;
}

export function hojaFiliacionFilenameFallback(pacienteId: number): string {
  return `admision_hoja_filiacion_paciente_${pacienteId}.pdf`;
}

export async function downloadHojaFiliacionPaciente(
  pacienteId: number,
  onError: (message: string) => void
): Promise<boolean> {
  return downloadReportFileSafe(
    {
      path: hojaFiliacionReportPath(pacienteId),
      format: "pdf",
      filenameFallback: hojaFiliacionFilenameFallback(pacienteId),
    },
    onError
  );
}
