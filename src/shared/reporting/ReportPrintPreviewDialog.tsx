import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2, Printer, X } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../ui/buttons";
import { getApiErrorMessage } from "../api/apiError";
import { downloadReportFile, type DownloadReportFileParams } from "./downloadReportFile";
import { fetchReportPreviewHtml, type FetchReportPreviewHtmlParams } from "./fetchReportPreviewHtml";

export type ReportPrintPreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  preview: FetchReportPreviewHtmlParams;
  download: DownloadReportFileParams;
  onDownloadSuccess?: () => void;
};

export function ReportPrintPreviewDialog({
  open,
  onClose,
  title,
  subtitle,
  preview,
  download,
  onDownloadSuccess,
}: ReportPrintPreviewDialogProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [printing, setPrinting] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const previewRequestKey = React.useMemo(
    () => JSON.stringify({ path: preview.path, query: preview.query ?? null }),
    [preview.path, preview.query]
  );

  React.useEffect(() => {
    if (!open) {
      setHtml(null);
      setError(null);
      setLoading(false);
      setPrinting(false);
      setDownloading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setHtml(null);

    void fetchReportPreviewHtml({ ...preview, signal: controller.signal })
      .then((markup) => {
        if (controller.signal.aborted) return;
        setHtml(markup);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(getApiErrorMessage(e, "No se pudo cargar la vista previa del reporte."));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, preview, previewRequestKey]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handlePrint = React.useCallback(() => {
    const frame = iframeRef.current;
    const win = frame?.contentWindow;
    if (!win || !html) {
      setError("La vista previa aún no está lista para imprimir.");
      return;
    }
    setPrinting(true);
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(() => setPrinting(false), 400);
    }
  }, [html]);

  const handleDownload = React.useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadReportFile(download);
      onDownloadSuccess?.();
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo descargar el PDF."));
    } finally {
      setDownloading(false);
    }
  }, [download, onDownloadSuccess]);

  if (!open) return null;

  const busy = loading || printing || downloading;

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/45 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-print-preview-title"
    >
      <div
        className="flex h-full w-full max-w-5xl flex-col bg-(--color-surface) shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:border sm:border-(--border-color-default)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-(--border-color-default) px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 pr-2">
            <h2 id="report-print-preview-title" className="truncate text-base font-semibold text-(--color-text-primary)">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-(--color-text-secondary)">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PrimaryButton
              onClick={handlePrint}
              disabled={busy || !html}
              className="min-w-0 flex-1 sm:flex-none"
              title="Abrir el diálogo de impresión del navegador"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {printing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : <Printer className="h-4 w-4 shrink-0" aria-hidden />}
                Imprimir
              </span>
            </PrimaryButton>
            <SecondaryButton onClick={() => void handleDownload()} disabled={busy || !html} className="min-w-0 flex-1 sm:flex-none">
              {downloading ? "Descargando…" : "Descargar PDF"}
            </SecondaryButton>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-panel-context) text-(--color-text-secondary) transition hover:text-(--color-primary) disabled:opacity-50"
              aria-label="Cerrar vista previa"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-(--color-background)">
          {loading ? (
            <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-sm text-(--color-text-secondary)">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Generando vista previa…
            </div>
          ) : null}

          {error && !loading ? (
            <div className="p-4">
              <div className="rounded-md border border-(--color-danger) bg-(--color-surface) p-4 text-sm text-(--color-danger)">
                {error}
              </div>
            </div>
          ) : null}

          {html && !loading ? (
            <iframe
              ref={iframeRef}
              title={title}
              srcDoc={html}
              className="h-full min-h-[min(100%,calc(100vh-11rem))] w-full border-0 bg-white sm:min-h-[min(100%,calc(100vh-13rem))]"
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
