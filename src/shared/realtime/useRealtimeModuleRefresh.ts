import * as React from "react";
import { useAuth } from "../auth/useAuth";
import {
  onRealtimeEntityChanged,
  type RealtimeEntityChangedEvent,
} from "./realtimeEvents";

type RealtimeRefreshOptions = {
  module: string;
  entities?: string[];
  actions?: string[];
  debounceMs?: number;
  includeOwnEvents?: boolean;
  onEvent: (event: RealtimeEntityChangedEvent) => void | Promise<void>;
};

export function useRealtimeModuleRefresh(options: RealtimeRefreshOptions): void {
  const { user } = useAuth();
  const onEventRef = React.useRef(options.onEvent);

  React.useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);

  React.useEffect(() => {
    let timer: ReturnType<typeof window.setTimeout> | null = null;
    let latestEvent: RealtimeEntityChangedEvent | null = null;

    const off = onRealtimeEntityChanged((event) => {
      if (event.module !== options.module) return;
      if (options.entities?.length && !options.entities.includes(event.entity)) return;
      if (options.actions?.length && !options.actions.includes(event.action)) return;
      if (options.includeOwnEvents === false && event.actor_id != null && user?.id === event.actor_id) return;

      latestEvent = event;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!latestEvent) return;
        void onEventRef.current(latestEvent);
        latestEvent = null;
      }, options.debounceMs ?? 400);
    });

    return () => {
      off();
      if (timer) window.clearTimeout(timer);
    };
  }, [
    options.module,
    options.entities,
    options.actions,
    options.debounceMs,
    options.includeOwnEvents,
    user?.id,
  ]);
}
