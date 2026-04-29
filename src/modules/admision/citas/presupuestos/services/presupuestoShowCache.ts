import type { PresupuestoShowData } from "./presupuestoShow.service";

const TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 40;

type Entry = { data: PresupuestoShowData; t: number };

const cache = new Map<number, Entry>();

function prune() {
  while (cache.size > MAX_ENTRIES) {
    let oldestId: number | null = null;
    let oldestT = Infinity;
    for (const [id, e] of cache) {
      if (e.t < oldestT) {
        oldestT = e.t;
        oldestId = id;
      }
    }
    if (oldestId != null) cache.delete(oldestId);
    else break;
  }
}

export function getCachedPresupuestoShow(id: number): PresupuestoShowData | null {
  const e = cache.get(id);
  if (!e) return null;
  if (Date.now() - e.t > TTL_MS) {
    cache.delete(id);
    return null;
  }
  return e.data;
}

export function setCachedPresupuestoShow(id: number, data: PresupuestoShowData) {
  cache.set(id, { data, t: Date.now() });
  prune();
}

export function prefetchPresupuestoShow(id: number): void {
  if (!Number.isFinite(id) || id <= 0) return;
  if (getCachedPresupuestoShow(id)) return;
  void import("./presupuestoShow.service").then(({ fetchPresupuestoShow }) =>
    fetchPresupuestoShow(id)
      .then((d) => setCachedPresupuestoShow(id, d))
      .catch(() => undefined)
  );
}

export function invalidatePresupuestoShowCache(id?: number) {
  if (id != null) cache.delete(id);
  else cache.clear();
}
