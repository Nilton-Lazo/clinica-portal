function num(value: unknown, fallback: number) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
  
  export const SESSION_IDLE_MINUTES = num(
    import.meta.env.VITE_SESSION_IDLE_MINUTES,
    15
  );
  
  export const SESSION_WARN_MINUTES = num(
    import.meta.env.VITE_SESSION_WARN_MINUTES,
    2
  );
  