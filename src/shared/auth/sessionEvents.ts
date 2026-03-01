export type UnauthorizedPayload = {
    status: 401;
    code?: string;
    message?: string;
  };
  
  const LAST_KEY = "erp:auth:last_unauthorized";
  
  let notified = false;
  let lastPayload: UnauthorizedPayload | null = null;
  const listeners = new Set<(payload: UnauthorizedPayload) => void>();

  function isSessionExpiryCode(code?: string): boolean {
    return code === "SESSION_EXPIRED_IDLE" || code === "SESSION_EXPIRED_ABSOLUTE";
  }
  
  function safeParse(raw: string | null): UnauthorizedPayload | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UnauthorizedPayload;
    } catch {
      return null;
    }
  }
  
  export const sessionEvents = {
    onUnauthorized(listener: (payload: UnauthorizedPayload) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  
    notifyUnauthorized(payload: UnauthorizedPayload) {
      if (notified) {
        // Si llega un código más específico de expiración, se preserva para el Login.
        if (isSessionExpiryCode(payload.code) && !isSessionExpiryCode(lastPayload?.code)) {
          lastPayload = payload;
          sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));
        }
        return;
      }
      notified = true;
      lastPayload = payload;
  
      sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));
  
      for (const l of listeners) {
        l(payload);
      }
    },
  
    reset() {
      notified = false;
      lastPayload = null;
      sessionStorage.removeItem(LAST_KEY);
    },
  
    consumeLastUnauthorized(): UnauthorizedPayload | null {
      const payload = safeParse(sessionStorage.getItem(LAST_KEY));
      sessionStorage.removeItem(LAST_KEY);
      return payload;
    },
  };
  