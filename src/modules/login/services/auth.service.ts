import { api } from "../../../shared/api";
import { tokenStore } from "../../../shared/api/tokenStore";
import { sessionEvents } from "../../../shared/auth/sessionEvents";
import type { LoginPayload, LoginResponse, AuthUser } from "../types/auth.types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const response = await api.post<LoginResponse>("/login", payload);

    if (!response?.token || !response?.user) {
      throw {
        kind: "server",
        status: 500,
        message: "Respuesta inválida del backend.",
      };
    }

    tokenStore.set(response.token);
    sessionEvents.reset();

    return response.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } catch (err) {
      void err;
    } finally {
      tokenStore.clear();
      sessionEvents.reset();
    }
  },

  async me(): Promise<AuthUser> {
    return api.get<AuthUser>("/me");
  },

  async keepAlive(): Promise<void> {
    await api.get("/keep-alive");
  },

  hasSession(): boolean {
    return Boolean(tokenStore.get());
  },
};
