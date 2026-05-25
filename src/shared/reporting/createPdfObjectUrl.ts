export function createPdfObjectUrl(blob: Blob, filename: string): string {
  const safeName = filename.trim() || "reporte.pdf";
  const file = new File([blob], safeName, { type: "application/pdf" });
  return URL.createObjectURL(file);
}
