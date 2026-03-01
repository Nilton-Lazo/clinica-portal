import * as React from "react";
import { toast as rtToast } from "react-toastify";
import type { ToastApi } from "./types";

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

export function useToast(): ToastApi {
  return React.useMemo<ToastApi>(
    () => ({
      success: (message, options) => {
        rtToast.success(message, { autoClose: options?.duration ?? DEFAULT_DURATION });
      },
      error: (message, options) => {
        rtToast.error(message, { autoClose: options?.duration ?? ERROR_DURATION });
      },
      info: (message, options) => {
        rtToast.info(message, { autoClose: options?.duration ?? DEFAULT_DURATION });
      },
      warning: (message, options) => {
        rtToast.warning(message, { autoClose: options?.duration ?? DEFAULT_DURATION });
      },
    }),
    []
  );
}
