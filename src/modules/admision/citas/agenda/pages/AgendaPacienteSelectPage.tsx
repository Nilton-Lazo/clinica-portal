import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PacientePicker from "../components/PacientePicker";
import type { PacienteListItem } from "../../../historia-clinica/types/historiaClinica.types";

export default function AgendaPacienteSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handlePicked = React.useCallback(
    (selected: PacienteListItem) => {
      const params = new URLSearchParams();
      const fecha = searchParams.get("fecha");
      const esp = searchParams.get("especialidad_id");
      const med = searchParams.get("medico_id");
      const hora = searchParams.get("hora");

      let draftFecha = "";
      let draftEsp = "";
      let draftMed = "";
      let draftHora = "";
      if (typeof window !== "undefined") {
        const raw = window.sessionStorage.getItem("admision:agendaMedicaDraft");
        if (raw) {
          try {
            const d = JSON.parse(raw) as {
              selectedDateStr?: string;
              especialidadId?: number | null;
              medicoId?: number | null;
              hora?: string;
            };
            draftFecha = d.selectedDateStr ?? "";
            draftEsp = d.especialidadId != null ? String(d.especialidadId) : "";
            draftMed = d.medicoId != null ? String(d.medicoId) : "";
            draftHora = d.hora ?? "";
          } catch {
            void 0;
          }
        }
      }

      const finalFecha = fecha || draftFecha;
      const finalEsp = esp || draftEsp;
      const finalMed = med || draftMed;
      const finalHora = hora || draftHora;

      if (finalFecha) params.set("fecha", finalFecha);
      if (finalEsp) params.set("especialidad_id", finalEsp);
      if (finalMed) params.set("medico_id", finalMed);
      if (finalHora) params.set("hora", finalHora);
      params.set("paciente_id", String(selected.id));

      navigate(`/admision/citas/agenda/nueva?${params.toString()}`);
    },
    [searchParams, navigate],
  );

  return (
    <PacientePicker
      open
      variant="fullscreen"
      onClose={() => navigate("/admision/citas/agenda")}
      onPicked={handlePicked}
      title="Seleccionar paciente"
      showRegisterButton
      onRegister={() => navigate("/admision/historia-clinica/nuevo/datos-generales")}
      onOpenHistoriaClinica={() => navigate("/admision/historia-clinica")}
    />
  );
}
