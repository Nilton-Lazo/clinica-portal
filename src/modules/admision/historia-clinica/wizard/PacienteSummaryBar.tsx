import * as React from "react";
import { computeAge, fullNameFromDraft } from "./types";
import { usePacienteWizard } from "../wizard/usePacienteWizard";

function labelSexo(v: string) {
  const x = (v ?? "").trim().toUpperCase();
  if (x === "MASCULINO") return "Masculino";
  if (x === "FEMENINO") return "Femenino";
  return (v ?? "").trim() || "—";
}

function labelEstado(v: string) {
  const x = (v ?? "").trim().toUpperCase();
  if (!x) return "—";
  return x.charAt(0) + x.slice(1).toLowerCase();
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="opacity-90">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export function PacienteSummaryBar() {
  const { state } = usePacienteWizard();
  const d = state.draft;

  const hc = d.numero_documento.trim() ? d.numero_documento.trim() : d.nr.trim() ? d.nr.trim() : "—";
  const nombre = fullNameFromDraft(d) || "—";
  const nr = d.nr.trim() || "—";
  const edad = computeAge(d.fecha_nacimiento);
  const sexo = labelSexo(d.sexo);
  const estado = labelEstado(d.estado);

  return (
    <div className="w-full rounded-lg bg-(--color-primary) text-(--color-text-inverse) px-4 py-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:hidden text-sm">
        <SummaryItem label="HC:" value={hc} />
        <SummaryItem label="NR:" value={nr} />
        <SummaryItem label="Edad:" value={edad !== null ? `${edad} años` : "—"} />
        <SummaryItem label="Sexo:" value={sexo} />
        <SummaryItem label="Estado:" value={estado} />
        <span className="col-span-2 font-semibold truncate">{nombre}</span>
      </div>

      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 text-sm">
        <SummaryItem label="HC:" value={hc} />
        <span className="opacity-50">|</span>
        <span className="font-semibold truncate max-w-105">{nombre}</span>
        <span className="opacity-50">|</span>
        <SummaryItem label="NR:" value={nr} />
        <span className="opacity-50">|</span>
        <SummaryItem label="Edad:" value={edad !== null ? `${edad} años` : "—"} />
        <span className="opacity-50">|</span>
        <SummaryItem label="Sexo:" value={sexo} />
        <span className="opacity-50">|</span>
        <SummaryItem label="Estado:" value={estado} />
      </div>
    </div>
  );
}
