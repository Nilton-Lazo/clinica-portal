import { createPdfObjectUrl } from "./createPdfObjectUrl";
import { ReportDownloadCancelledError } from "./reportDownloadCancelledError";

export async function downloadPdfBlob(blob: Blob, filename: string): Promise<void> {
  const name = filename.trim() || "reporte.pdf";
  const file = new File([blob], name, { type: "application/pdf" });
  const shareData: ShareData = { files: [file], title: name };

  if (typeof navigator.share === "function") {
    const canShareFiles =
      typeof navigator.canShare !== "function" || navigator.canShare(shareData);

    if (canShareFiles) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          throw new ReportDownloadCancelledError();
        }
      }
    }
  }

  const url = createPdfObjectUrl(blob, name);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
