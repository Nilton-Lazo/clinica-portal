import { createPdfObjectUrl } from "./createPdfObjectUrl";
import { buildAuthenticatedReportDownloadUrl } from "./buildAuthenticatedReportDownloadUrl";
import type { DownloadReportFileParams } from "./downloadReportFile";
import { fetchReportPdfBlob } from "./fetchReportPdfBlob";
import { ReportDownloadCancelledError } from "./reportDownloadCancelledError";
import { isIosDevice } from "./shouldUseNativePdfIframe";

export type DownloadTouchReportPdfOptions = {
  blob?: Blob;
  filename?: string;
};

function triggerAttachmentDownload(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function sharePdfFile(blob: Blob, filename: string): Promise<void> {
  const name = filename.trim() || "reporte.pdf";
  const file = new File([blob], name, { type: "application/pdf" });
  const shareData: ShareData = { files: [file], title: name };

  if (typeof navigator.share !== "function") {
    openPdfInNewTab(blob, name);
    return;
  }

  if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
    openPdfInNewTab(blob, name);
    return;
  }

  try {
    await navigator.share(shareData);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ReportDownloadCancelledError();
    }
    throw e;
  }
}

function openPdfInNewTab(blob: Blob, filename: string): void {
  const url = createPdfObjectUrl(blob, filename);
  const opened = window.open(url, "_blank");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error(
      "No se pudo abrir el PDF. Permite ventanas emergentes o vuelve a pulsar Guardar y elige «Guardar en Archivos»."
    );
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadTouchReportPdf(
  params: DownloadReportFileParams,
  options?: DownloadTouchReportPdfOptions
): Promise<void> {
  const downloadUrl = buildAuthenticatedReportDownloadUrl(params.path, params.format, params.query);
  if (!downloadUrl) {
    throw new Error("Inicia sesión en el portal para guardar el documento.");
  }

  if (isIosDevice()) {
    const opened = window.open(downloadUrl, "_blank");
    if (opened) {
      return;
    }
  } else {
    triggerAttachmentDownload(downloadUrl);
    return;
  }

  let blob = options?.blob;
  let resolvedFilename = options?.filename?.trim() || params.filenameFallback?.trim() || "reporte.pdf";

  if (!blob) {
    const result = await fetchReportPdfBlob({
      path: params.path,
      format: params.format,
      query: params.query,
      filenameFallback: params.filenameFallback,
      timeoutMs: params.timeoutMs,
    });
    blob = result.blob;
    resolvedFilename = result.filename;
  }

  await sharePdfFile(blob, resolvedFilename);
}
