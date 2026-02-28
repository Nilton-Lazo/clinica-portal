import * as React from "react";
import { useToast } from "../../../shared/feedback";

/** Bordes unificados para inputs/select: rounded + border, foco sin anillo grueso. */
export const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

export type Notice = { type: "success" | "error"; text: string } | null;

/**
 * Muestra notificaciones toast cuando cambia notice (éxito o error).
 * Usar en páginas CRUD para retroalimentación al usuario (crear, guardar, desactivar, cancelar).
 */
export function useNoticeToToast(notice: Notice) {
  const toast = useToast();
  const lastShownRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!notice?.text) {
      lastShownRef.current = null;
      return;
    }
    const key = `${notice.type}:${notice.text}`;
    if (lastShownRef.current === key) return;
    lastShownRef.current = key;
    if (notice.type === "success") toast.success(notice.text);
    else toast.error(notice.text);
  }, [notice, toast]);
}
