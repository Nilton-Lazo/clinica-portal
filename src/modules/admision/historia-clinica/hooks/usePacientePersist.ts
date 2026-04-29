import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { createPaciente, updatePaciente, type PacienteUpsertPayload } from "../services/pacientes.service";
import { toUserFriendlyMessage } from "../utils/userFriendlyError";

export type Notice = { type: "success" | "error"; text: string } | null;

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
        setNotice({ type: "error", text: toUserFriendlyMessage(e, "No se pudo guardar la historia clínica del paciente.") });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [pacienteId]
  );

  return { pacienteId, saving, notice, setNotice, save };
}
