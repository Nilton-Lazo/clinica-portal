import { downloadReportFileSafe } from "../../../../../shared/reporting";

export function atencionCitaReportPath(citaId: number): string {
  return `/admision/citas/agenda-medica/${citaId}/atencion/reporte`;
}

export function atencionCitaFilenameFallback(citaId: number, pacienteIdentifier?: string | null): string {
  const identifier = String(pacienteIdentifier ?? "").trim();
  return identifier
    ? `admision_atencion_cita_paciente_${identifier}.pdf`
    : `admision_atencion_cita_${citaId}.pdf`;
}

export async function downloadAtencionCitaReport(
  citaId: number,
  pacienteIdentifier: string | null | undefined,
  onError: (message: string) => void
): Promise<boolean> {
  return downloadReportFileSafe(
    {
      path: atencionCitaReportPath(citaId),
      format: "pdf",
      filenameFallback: atencionCitaFilenameFallback(citaId, pacienteIdentifier),
    },
    onError
  );
}
