import { downloadReportFileSafe, openReportPreviewSafe } from "../../../../shared/reporting";

export async function downloadHojaFiliacionPaciente(
  pacienteId: number,
  onError: (message: string) => void
): Promise<boolean> {
  return downloadReportFileSafe(
    {
      path: `/admision/pacientes/${pacienteId}/reporte-filiacion`,
      format: "pdf",
      filenameFallback: `admision_hoja_filiacion_paciente_${pacienteId}.pdf`,
    },
    onError
  );
}

export async function previewHojaFiliacionPaciente(
  pacienteId: number,
  onError: (message: string) => void
): Promise<boolean> {
  return openReportPreviewSafe(
    {
      path: `/admision/pacientes/${pacienteId}/reporte-filiacion`,
    },
    onError
  );
}
