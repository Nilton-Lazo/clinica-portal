export class ReportDownloadCancelledError extends Error {
  constructor() {
    super("Descarga cancelada.");
    this.name = "ReportDownloadCancelledError";
  }
}

export function isReportDownloadCancelledError(error: unknown): boolean {
  return error instanceof ReportDownloadCancelledError;
}
