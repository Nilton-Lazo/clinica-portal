import * as React from "react";
import { createPortal } from "react-dom";
import { ToastContainer, toast as rtToast } from "react-toastify";
import type { ToastApi, ToastOptions } from "./types";

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

function useToastApi(): ToastApi {
  return React.useMemo<ToastApi>(
    () => ({
      success: (message: string, options?: ToastOptions) => {
        rtToast.success(message, {
          autoClose: options?.duration ?? DEFAULT_DURATION,
        });
      },
      error: (message: string, options?: ToastOptions) => {
        rtToast.error(message, {
          autoClose: options?.duration ?? ERROR_DURATION,
        });
      },
      info: (message: string, options?: ToastOptions) => {
        rtToast.info(message, {
          autoClose: options?.duration ?? DEFAULT_DURATION,
        });
      },
      warning: (message: string, options?: ToastOptions) => {
        rtToast.warning(message, {
          autoClose: options?.duration ?? DEFAULT_DURATION,
        });
      },
    }),
    []
  );
}

const ToastContext = React.createContext<ToastApi | null>(null);

/**
 * Provider de notificaciones con React-Toastify.
 * Configuración enterprise: top-right, límite, progreso, tema alineado al diseño.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useToastApi();

  const toastContainer = (
    <ToastContainer
      position="top-right"
      autoClose={DEFAULT_DURATION}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable
      theme="colored"
      limit={4}
      closeButton
      className="toast-container-enterprise"
      toastClassName="toast-enterprise"
      progressClassName="toast-progress-enterprise"
    />
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== "undefined" ? createPortal(toastContainer, document.body) : toastContainer}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}
