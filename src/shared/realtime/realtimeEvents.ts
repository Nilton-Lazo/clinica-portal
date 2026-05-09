export type RealtimeAction =
  | "created"
  | "updated"
  | "disabled"
  | "deleted"
  | "closed"
  | "issued"
  | "changed";

export type RealtimeEntityChangedEvent = {
  module: "ficheros" | "admision" | "emergencia" | "caja" | "facturacion" | string;
  entity: string;
  action: RealtimeAction | string;
  id: number | string | null;
  scope: string | null;
  actor_id: number | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
};

export const REALTIME_ENTITY_CHANGED_EVENT = "clinica:realtime:entity-changed";

export function dispatchRealtimeEntityChanged(detail: RealtimeEntityChangedEvent): void {
  window.dispatchEvent(new CustomEvent<RealtimeEntityChangedEvent>(REALTIME_ENTITY_CHANGED_EVENT, { detail }));
}

export function onRealtimeEntityChanged(
  listener: (event: RealtimeEntityChangedEvent) => void
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<RealtimeEntityChangedEvent>).detail);
  };

  window.addEventListener(REALTIME_ENTITY_CHANGED_EVENT, handler);
  return () => window.removeEventListener(REALTIME_ENTITY_CHANGED_EVENT, handler);
}
