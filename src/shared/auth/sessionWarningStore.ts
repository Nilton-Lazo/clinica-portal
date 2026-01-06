type Snapshot = {
    open: boolean;
    remainingSeconds: number;
  };
  
  let snapshot: Snapshot = {
    open: false,
    remainingSeconds: 0,
  };
  
  const listeners = new Set<() => void>();
  
  function emit() {
    for (const l of listeners) l();
  }
  
  export const sessionWarningStore = {
    getSnapshot(): Snapshot {
      return snapshot;
    },
  
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  
    set(next: Partial<Snapshot>) {
      snapshot = { ...snapshot, ...next };
      emit();
    },
  
    reset() {
      snapshot = { open: false, remainingSeconds: 0 };
      emit();
    },
  };
  