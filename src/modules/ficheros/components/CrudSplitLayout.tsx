import * as React from "react";

/**
 * Modo de la columna derecha:
 * - "scroll": la columna hace scroll (formularios largos, ej. ficheros).
 * - "fill": la columna ocupa todo el alto y el contenido interno hace scroll (paneles de detalle).
 */
export type RightColumnMode = "scroll" | "fill";

export interface CrudSplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightRef?: React.RefObject<HTMLDivElement | null>;
  formWidth?: string;
  /** Por defecto "scroll" (comportamiento clásico para formularios). Usar "fill" para paneles de detalle que scrollan por dentro. */
  rightColumnMode?: RightColumnMode;
}

const DEFAULT_FORM_WIDTH = "380px";
export function CrudSplitLayout({
  left,
  right,
  rightRef,
  formWidth = DEFAULT_FORM_WIDTH,
  rightColumnMode = "scroll",
}: CrudSplitLayoutProps) {
  const isFill = rightColumnMode === "fill";

  return (
    <div
      className="flex flex-col gap-4 lg:grid lg:min-h-0 lg:flex-1 lg:items-stretch lg:gap-2 lg:overflow-hidden"
      style={
        {
          ["--form-width" as string]: formWidth,
          gridTemplateColumns: "minmax(0, 1fr) var(--form-width)",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">
        {left}
      </div>
      <div
        ref={rightRef}
        className={
          isFill
            ? "flex w-full shrink-0 flex-col lg:min-h-0 lg:w-(--form-width) lg:min-w-(--form-width) lg:flex-none lg:overflow-hidden"
            : "flex min-h-0 w-full shrink-0 flex-col lg:h-full lg:max-h-full lg:w-(--form-width) lg:min-w-(--form-width) lg:flex-none lg:overflow-hidden"
        }
      >
        {isFill ? (
          <div className="flex w-full flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            {right}
          </div>
        ) : (
          <div className="min-h-0 w-full flex-1 lg:min-h-0 lg:overflow-y-auto app-scrollbar-thin app-scrollbar-no-gutter">
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
