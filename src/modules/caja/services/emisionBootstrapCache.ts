import type { EmisionBootstrapBundle } from "../types/emisionBootstrap.types";
import { fetchEmisionBootstrap } from "./emisionBootstrap.service";

const TTL_MS = 3 * 60 * 1000;

let cached: EmisionBootstrapBundle | null = null;
let fetchedAt = 0;
let inflight: Promise<EmisionBootstrapBundle> | null = null;

export function getEmisionBootstrapSync(): EmisionBootstrapBundle | null {
  if (!cached) return null;
  if (Date.now() - fetchedAt > TTL_MS) return null;
  return cached;
}

export function invalidateEmisionBootstrapClientCache(): void {
  cached = null;
  fetchedAt = 0;
  inflight = null;
}

export function getEmisionBootstrap(force = false): Promise<EmisionBootstrapBundle> {
  if (!force && cached !== null && Date.now() - fetchedAt <= TTL_MS) {
    return Promise.resolve(cached);
  }
  if (!force && inflight !== null) {
    return inflight;
  }
  const p = fetchEmisionBootstrap()
    .then((data) => {
      cached = data;
      fetchedAt = Date.now();
      inflight = null;
      return data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  inflight = p;
  return p;
}
