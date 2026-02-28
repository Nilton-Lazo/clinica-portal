import * as React from "react";

export interface CrudSplitLayoutProps {
  /** Contenido del panel izquierdo (tabla) */
  left: React.ReactNode;
  /** Contenido del panel derecho (formulario) */
  right: React.ReactNode;
  /** Ref opcional del panel derecho para scroll into view en móvil */
  rightRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Ancho del panel del formulario en desktop (ej. "380px", "480px").
   * Cada página define el suyo en código; así el tamaño es independiente por pantalla.
   */
  formWidth?: string;
}

const DEFAULT_FORM_WIDTH = "380px";

/**
 * Layout CRUD unificado: tabla (izquierda) + formulario (derecha).
 * Ocupa todo el ancho del contenedor. El ancho del formulario se define por página en código (formWidth).
 * En viewport < lg se muestra en columna (tabla arriba, formulario abajo).
 */
export function CrudSplitLayout({
  left,
  right,
  rightRef,
  formWidth = DEFAULT_FORM_WIDTH,
}: CrudSplitLayoutProps) {
  return (
    <div
      className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden lg:grid lg:items-stretch lg:gap-2"
      style={
        {
          ["--form-width" as string]: formWidth,
          gridTemplateColumns: "minmax(0, 1fr) var(--form-width)",
        } as React.CSSProperties
      }
    >
      {/* Panel izquierdo: tabla */}
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-w-0">
        {left}
      </div>

      {/* Panel derecho: mismo alto que la tabla, ancho fijo; scroll solo cuando el contenido es largo */}
      <div
        ref={rightRef}
        className="min-w-0 shrink-0 lg:h-full lg:max-h-full lg:overflow-y-auto app-scrollbar-thin lg:w-(--form-width) lg:min-w-(--form-width)"
      >
        <div className="w-full min-h-full lg:h-full">
          {right}
        </div>
      </div>
    </div>
  );
}
