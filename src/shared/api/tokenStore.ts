const KEY = "erp:auth:token";

let memoryToken: string | null = null;

function safeGet(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string) {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // si el storage falla (modo privado extremo), queda en memoria
  }
}

function safeRemove() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export const tokenStore = {
  get(): string | null {
    if (memoryToken) return memoryToken;
    const t = safeGet();
    memoryToken = t;
    return t;
  },

  set(token: string) {
    memoryToken = token;
    safeSet(token);
  },

  clear() {
    memoryToken = null;
    safeRemove();
  },
};
