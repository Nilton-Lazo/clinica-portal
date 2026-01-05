import { api } from "../../../shared/api";
import { tokenStore } from "../../../shared/api/tokenStore";
import type { LoginPayload, LoginResponse, AuthUser } from "../types/auth.types";

function extractToken(response: unknown): string | null {
  if (
    typeof response === "object" &&
    response !== null &&
    "token" in response &&
    typeof (response as { token: unknown }).token === "string"
  ) {
    return (response as { token: string }).token;
  }

  return null;
}

export const authService = {
  async login(payload: LoginPayload): Promise<void> {
    const response = await api.post<LoginResponse>("/login", payload);
    const token = extractToken(response);

    if (!token) {
      throw {
        kind: "server",
        status: 500,
        message: "El backend no devolvió un token válido.",
      };
    }

    tokenStore.set(token);
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } finally {
      tokenStore.clear();
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
