/**
 * toastService — Servicio centralizado de notificaciones toast.
 *
 * Usa react-toastify directamente como módulo singleton, sin necesitar
 * React context ni hooks. Puede importarse desde servicios, hooks,
 * utilidades y componentes por igual.
 *
 * Requiere que <ToastProvider> esté montado en la aplicación (ya lo está en main.tsx).
 *
 * Cuando showSuccess() se llama también dispara el evento "clinica:action:success"
 * para que el NotificationBell recargue su conteo de forma instantánea.
 *
 * Uso:
 *   import { toastService } from "@/shared/notifications";
 *   toastService.showSuccess("Especialidad creada.");
 *   toastService.showError("No se pudo guardar.");
 */

import { toast } from "react-toastify";

const DURATION_DEFAULT = 4000;
const DURATION_ERROR   = 6000;

/** Evento interno que dispara el bell para recargar notificaciones inmediatamente. */
export const NOTIFICATION_REFRESH_EVENT = "clinica:action:success";

export type NotificationRefreshDetail = {
  occurredAt: number;
  source: "toast-success";
};

function emitRefresh(): void {
  if (typeof window !== "undefined") {
    const detail: NotificationRefreshDetail = {
      occurredAt: Date.now(),
      source: "toast-success",
    };
    window.dispatchEvent(new CustomEvent<NotificationRefreshDetail>(NOTIFICATION_REFRESH_EVENT, { detail }));
  }
}

export const toastService = {
  /**
   * Acción exitosa (crear, guardar, desactivar, etc.).
   * Muestra toast verde Y activa recarga inmediata de la campana.
   */
  showSuccess(message: string, duration = DURATION_DEFAULT): void {
    toast.success(message, { autoClose: duration });
    emitRefresh();
  },

  showError(message: string, duration = DURATION_ERROR): void {
    toast.error(message, { autoClose: duration });
  },

  showInfo(message: string, duration = DURATION_DEFAULT): void {
    toast.info(message, { autoClose: duration });
  },

  showWarning(message: string, duration = DURATION_DEFAULT): void {
    toast.warning(message, { autoClose: duration });
  },
} as const;

export type ToastService = typeof toastService;
