import * as React from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, X } from "lucide-react";
import { getApiErrorMessage } from "../api/apiError";
import type { DownloadReportFileParams } from "./downloadReportFile";
import { createPdfObjectUrl } from "./createPdfObjectUrl";
import { downloadPdfBlob } from "./downloadPdfBlob";
import { downloadTouchReportPdf } from "./downloadTouchReportPdf";
import { isReportDownloadCancelledError } from "./reportDownloadCancelledError";
import { fetchReportPdfBlob } from "./fetchReportPdfBlob";
import { ReportPdfJsViewer } from "./ReportPdfJsViewer";
import { shouldUseNativePdfIframe } from "./shouldUseNativePdfIframe";
import { useReportPreviewBreakpoints } from "./useReportPreviewBreakpoints";

export type ReportPrintPreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  compactSubtitle?: string;
  detailLine?: string;
  download: DownloadReportFileParams;
  onDownloadSuccess?: () => void;
};

function useNativePdfIframePreference(): boolean {
  const [native, setNative] = React.useState(shouldUseNativePdfIframe);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setNative(shouldUseNativePdfIframe());
    media.addEventListener("change", update);
    window.addEventListener("orientationchange", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return native;
}

type ToolbarIconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  labelText?: string;
  children: React.ReactNode;
};

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  showLabel,
  labelText,
  children,
}: ToolbarIconButtonProps) {
  const withText = Boolean(showLabel && labelText);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        withText
          ? "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-(--border-color-default) bg-(--color-panel-context) px-3 text-(--color-text-secondary) transition hover:text-(--color-primary) disabled:opacity-50"
          : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-panel-context) text-(--color-text-secondary) transition hover:text-(--color-primary) disabled:opacity-50"
      }
    >
      {children}
      {withText ? <span className="text-sm font-medium">{labelText}</span> : null}
    </button>
  );
}

export function ReportPrintPreviewDialog({
  open,
  onClose,
  title,
  subtitle,
  compactSubtitle,
  detailLine,
  download,
  onDownloadSuccess,
}: ReportPrintPreviewDialogProps) {
  const useNativeIframe = useNativePdfIframePreference();
  const { isPhone, isTablet } = useReportPreviewBreakpoints();
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [filename, setFilename] = React.useState(download.filenameFallback ?? "reporte.pdf");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  const showTouchToolbar = !useNativeIframe;
  const showButtonLabels = isTablet && !isPhone;
  const useCompactHeader = showTouchToolbar;

  const downloadRequestKey = React.useMemo(
    () => JSON.stringify({ path: download.path, format: download.format, query: download.query ?? null }),
    [download.path, download.format, download.query]
  );

  const resolvePdfBlob = React.useCallback(async (): Promise<{ blob: Blob; filename: string }> => {
    if (pdfBlob) {
      return { blob: pdfBlob, filename };
    }
    const result = await fetchReportPdfBlob({
      path: download.path,
      format: download.format,
      query: download.query,
      filenameFallback: download.filenameFallback,
      timeoutMs: download.timeoutMs,
    });
    setPdfBlob(result.blob);
    setFilename(result.filename);
    return { blob: result.blob, filename: result.filename };
  }, [pdfBlob, filename, download]);

  React.useEffect(() => {
    if (!open) {
      setPdfUrl(null);
      setPdfBlob(null);
      setError(null);
      setLoading(false);
      setDownloading(false);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setPdfUrl(null);
    setPdfBlob(null);
    setFilename(download.filenameFallback ?? "reporte.pdf");

    if (useNativeIframe) {
      void fetchReportPdfBlob({
        path: download.path,
        format: download.format,
        query: download.query,
        filenameFallback: download.filenameFallback,
        signal: controller.signal,
        timeoutMs: download.timeoutMs,
      })
        .then((result) => {
          if (controller.signal.aborted) return;
          objectUrl = createPdfObjectUrl(result.blob, result.filename);
          setPdfBlob(result.blob);
          setFilename(result.filename);
          setPdfUrl(objectUrl);
        })
        .catch((e) => {
          if (controller.signal.aborted) return;
          setError(getApiErrorMessage(e, "No se pudo generar el documento."));
          setLoading(false);
        });

      return () => {
        controller.abort();
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }

    void fetchReportPdfBlob({
      path: download.path,
      format: download.format,
      query: download.query,
      filenameFallback: download.filenameFallback,
      signal: controller.signal,
      timeoutMs: download.timeoutMs,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setPdfBlob(result.blob);
        setFilename(result.filename);
        setLoading(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(getApiErrorMessage(e, "No se pudo generar el documento."));
        setLoading(false);
      });

    return () => controller.abort();
  }, [open, download, downloadRequestKey, useNativeIframe]);

  const handleViewerLoad = React.useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleDownload = React.useCallback(() => {
    setDownloading(true);
    setError(null);

    const run = showTouchToolbar
      ? downloadTouchReportPdf(download, {
          blob: pdfBlob ?? undefined,
          filename,
        })
      : resolvePdfBlob().then(({ blob, filename: name }) => downloadPdfBlob(blob, name));

    void run
      .then(() => {
        onDownloadSuccess?.();
      })
      .catch((e) => {
        if (isReportDownloadCancelledError(e)) {
          return;
        }
        setError(getApiErrorMessage(e, "No se pudo guardar el documento."));
      })
      .finally(() => {
        setDownloading(false);
      });
  }, [showTouchToolbar, download, pdfBlob, filename, resolvePdfBlob, onDownloadSuccess]);

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

  if (!open) return null;

  const busy = loading || downloading;
  const actionsReady = useNativeIframe ? Boolean(pdfUrl) : Boolean(pdfBlob);

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/45 p-0 lg:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-print-preview-title"
    >
      <div
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-(--color-surface) shadow-xl lg:max-h-[calc(100vh-2rem)] lg:rounded-lg lg:border lg:border-(--border-color-default)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-(--border-color-default) px-3 py-2.5 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1 pr-1">
            <h2 id="report-print-preview-title" className="text-base font-semibold text-(--color-text-primary)">
              {title}
            </h2>
            {useCompactHeader ? (
              <div className="mt-0.5 space-y-0.5">
                {compactSubtitle ? (
                  <p className="text-sm font-medium text-(--color-text-secondary)">{compactSubtitle}</p>
                ) : null}
                {detailLine ? (
                  <p className="text-xs text-(--color-text-secondary)">{detailLine}</p>
                ) : null}
              </div>
            ) : subtitle ? (
              <p className="mt-0.5 truncate text-sm text-(--color-text-secondary)">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showTouchToolbar ? (
              <ToolbarIconButton
                label="Guardar documento PDF"
                labelText="Guardar"
                showLabel={showButtonLabels}
                onClick={handleDownload}
                disabled={busy || !actionsReady}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Download className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </ToolbarIconButton>
            ) : null}
            <ToolbarIconButton label="Cerrar vista previa" onClick={onClose} disabled={busy}>
              <X className="h-4 w-4 shrink-0" aria-hidden />
            </ToolbarIconButton>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#525659] lg:min-h-[min(100%,calc(100vh-13rem))]">
          {loading && useNativeIframe ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#525659] text-sm text-white/90">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Preparando documento…
            </div>
          ) : null}

          {error ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <div className="max-w-md rounded-md border border-(--color-danger) bg-(--color-surface) p-4 text-sm text-(--color-danger)">
                {error}
              </div>
            </div>
          ) : null}

          {!error && useNativeIframe && pdfUrl ? (
            <iframe
              title={compactSubtitle ?? subtitle ?? title}
              src={pdfUrl}
              onLoad={handleViewerLoad}
              className="absolute inset-0 block h-full w-full max-w-full border-0 bg-[#525659]"
            />
          ) : null}

          {!error && !useNativeIframe && pdfBlob ? (
            <ReportPdfJsViewer blob={pdfBlob} />
          ) : null}

          {!error && !useNativeIframe && !pdfBlob && loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#525659] text-sm text-white/90">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Preparando documento…
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
