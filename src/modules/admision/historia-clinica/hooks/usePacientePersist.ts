import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ApiError } from "../../../../shared/api/apiError";
import { createPaciente, updatePaciente, type PacienteUpsertPayload } from "../services/pacientes.service";

export type Notice = { type: "success" | "error"; text: string } | null;

function toErrorText(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return "No se pudo guardar. Revisa Network y Laravel logs.";
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}

export function usePacientePersist() {
  const params = useParams();
  const pacienteId = useMemo(() => {
    const raw = (params as Record<string, string | undefined>)["pacienteId"];
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [params]);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const save = useCallback(
    async (payload: PacienteUpsertPayload) => {
      setSaving(true);
      setNotice(null);
      try {
        if (pacienteId) {
          await updatePaciente(pacienteId, payload);
        } else {
          await createPaciente(payload);
        }
        setNotice({ type: "success", text: "Guardado correctamente." });
      } catch (e) {
        const text = isApiError(e) ? e.message : toErrorText(e);
        setNotice({ type: "error", text });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [pacienteId]
  );

  return { pacienteId, saving, notice, setNotice, save };
}
