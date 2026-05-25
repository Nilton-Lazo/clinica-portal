import { toast } from "react-toastify";

const DURATION_DEFAULT = 4000;
const DURATION_ERROR   = 6000;
const DUPLICATE_WINDOW_MS = 800;

let lastToastKey = "";
let lastToastAt = 0;

export const NOTIFICATION_REFRESH_EVENT = "clinica:action:success";

export type NotificationRefreshDetail = {
  occurredAt: number;
  source: "toast";
};

export function dispatchNotificationRefresh(): void {
  if (typeof window !== "undefined") {
    const detail: NotificationRefreshDetail = {
      occurredAt: Date.now(),
      source: "toast",
    };
    window.dispatchEvent(new CustomEvent<NotificationRefreshDetail>(NOTIFICATION_REFRESH_EVENT, { detail }));
  }
}

function shouldShowToast(type: string, message: string): boolean {
  const now = Date.now();
  const key = `${type}:${message}`;
  if (key === lastToastKey && now - lastToastAt < DUPLICATE_WINDOW_MS) {
    return false;
  }
  lastToastKey = key;
  lastToastAt = now;
  return true;
}

export const toastService = {
  showSuccess(message: string, duration = DURATION_DEFAULT): void {
    if (!shouldShowToast("success", message)) return;
    toast.success(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showError(message: string, duration = DURATION_ERROR): void {
    if (!shouldShowToast("error", message)) return;
    toast.error(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showInfo(message: string, duration = DURATION_DEFAULT): void {
    if (!shouldShowToast("info", message)) return;
    toast.info(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showWarning(message: string, duration = DURATION_DEFAULT): void {
    if (!shouldShowToast("warning", message)) return;
    toast.warning(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },
} as const;

export type ToastService = typeof toastService;
