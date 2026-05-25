import * as React from "react";
import { getDocument } from "pdfjs-dist";
import { Loader2 } from "lucide-react";
import "./pdfjsSetup";

type ReportPdfJsViewerProps = {
  blob: Blob;
};

export function ReportPdfJsViewer({ blob }: ReportPdfJsViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const render = async () => {
      setLoading(true);
      setError(null);
      container.replaceChildren();

      try {
        objectUrl = URL.createObjectURL(blob);
        const pdf = await getDocument({ url: objectUrl }).promise;
        if (controller.signal.aborted) {
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const containerWidth = Math.max(container.clientWidth - 16, 280);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (controller.signal.aborted) {
            return;
          }

          const page = await pdf.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 12px";
          canvas.style.background = "#ffffff";
          canvas.style.boxShadow = "0 1px 4px rgba(15, 23, 42, 0.2)";

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("No se pudo preparar la vista del documento.");
          }

          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          await page.render({ canvasContext: context, viewport, canvas }).promise;

          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.justifyContent = "center";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
        }
      } catch (e) {
        if (controller.signal.aborted) {
          return;
        }
        setError("No se pudo mostrar la vista previa del documento.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    };

    void render();

    return () => {
      controller.abort();
      container.replaceChildren();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [blob]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-auto bg-[#525659]">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-white/90">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Preparando documento…
        </div>
      ) : null}
      {error ? (
        <div className="flex h-full min-h-[200px] items-center justify-center p-4">
          <p className="text-center text-sm text-white/90">{error}</p>
        </div>
      ) : null}
      <div ref={containerRef} className="px-2 py-3" />
    </div>
  );
}
