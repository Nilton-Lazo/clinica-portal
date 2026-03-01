import { toast } from "react-toastify";

const DURATION_DEFAULT = 4000;
const DURATION_ERROR   = 6000;

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

export const toastService = {
  showSuccess(message: string, duration = DURATION_DEFAULT): void {
    toast.success(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showError(message: string, duration = DURATION_ERROR): void {
    toast.error(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showInfo(message: string, duration = DURATION_DEFAULT): void {
    toast.info(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },

  showWarning(message: string, duration = DURATION_DEFAULT): void {
    toast.warning(message, { autoClose: duration });
    dispatchNotificationRefresh();
  },
} as const;

export type ToastService = typeof toastService;
