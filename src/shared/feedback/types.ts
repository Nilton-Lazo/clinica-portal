
export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  duration?: number;
};

export type ToastApi = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
};
