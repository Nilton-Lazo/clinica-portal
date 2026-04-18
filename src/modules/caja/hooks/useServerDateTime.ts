import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../shared/api";

export type ServerDateTimePayload = {
  timezone: string;
  iso: string;
};

export function useServerDateTime(pollMs = 30000) {
  const [data, setData] = useState<ServerDateTimePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDt = useCallback(async () => {
    try {
      const res = await api.get<{ data: ServerDateTimePayload }>("/system/datetime");
      if (res.data?.timezone && res.data?.iso) {
        setData(res.data);
        setError(null);
      }
    } catch {
      setError("No se pudo obtener la hora del servidor.");
    }
  }, []);

  useEffect(() => {
    void fetchDt();
  }, [fetchDt]);

  useEffect(() => {
    const id = window.setInterval(() => void fetchDt(), pollMs);
    return () => window.clearInterval(id);
  }, [fetchDt, pollMs]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchDt();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchDt]);

  const formatted = useMemo(() => {
    if (!data) return { fecha: "—", hora: "—" };
    const d = new Date(data.iso);
    if (Number.isNaN(d.getTime())) return { fecha: "—", hora: "—" };
    const tz = data.timezone;
    const fecha = new Intl.DateTimeFormat("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
    }).format(d);
    const hora = new Intl.DateTimeFormat("es-PE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    }).format(d);
    return { fecha, hora };
  }, [data]);

  return { data, error, formatted, refresh: fetchDt };
}
