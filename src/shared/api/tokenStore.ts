const KEY = "erp:auth:token";

let memoryToken: string | null = null;
let storageNormalized = false;

function normalizeStorage() {
  if (storageNormalized) return;
  storageNormalized = true;
  try {
    const fromLocal = localStorage.getItem(KEY);
    if (fromLocal && !sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, fromLocal);
    }
    localStorage.removeItem(KEY);
  } catch {}
}

function safeGet(): string | null {
  normalizeStorage();
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string) {
  try {
    sessionStorage.setItem(KEY, value);
    localStorage.removeItem(KEY);
  } catch {}
}

function safeRemove() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {}
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
