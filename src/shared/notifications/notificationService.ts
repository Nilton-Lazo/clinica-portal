import { api } from "../api";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type NotificationType = "success" | "error" | "warning" | "info";

export type UserNotification = {
  id: number;
  type: NotificationType;
  entity_type: string | null;
  action_type: string | null;
  entity_id: number | null;
  entity_name: string | null;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsResponse = {
  data: UserNotification[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    unread_count: number;
  };
};

// ─── Servicio API ──────────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Lista notificaciones del usuario autenticado.
   * @param unreadOnly - si true, solo devuelve las no leídas
   * @param perPage - número de notificaciones por página (máx. 50)
   */
  async list(unreadOnly = false, perPage = 20): Promise<NotificationsResponse> {
    const params = new URLSearchParams({
      per_page: String(perPage),
      ...(unreadOnly ? { unread: "1" } : {}),
    });
    return api.get<NotificationsResponse>(`/notifications?${params}`);
  },

  /** Marca una notificación específica como leída. */
  async markAsRead(id: number): Promise<UserNotification> {
    const res = await api.patch<{ data: UserNotification }>(
      `/notifications/${id}/read`
    );
    return res.data;
  },

  /** Marca todas las notificaciones del usuario como leídas. */
  async markAllAsRead(): Promise<void> {
    await api.post("/notifications/read-all");
  },
};
