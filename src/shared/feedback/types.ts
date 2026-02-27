/**
 * Tipos para el sistema de notificaciones (toast).
 * Cuando se implemente React-Toastify, el provider usará la misma API.
 */
export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  /** Duración en ms; si no se pasa, usa el default del provider */
  duration?: number;
};

export type ToastApi = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
};
