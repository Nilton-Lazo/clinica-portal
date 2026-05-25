import * as React from "react";
import { computeAge, fullNameFromDraft } from "./types";
import { usePacienteWizard } from "../wizard/usePacienteWizard";

const DESKTOP_TOOLBAR_HEIGHT = "sm:h-10";

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
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 opacity-90">{label}</span>
      <span className="min-w-0 font-semibold wrap-break-words">{value}</span>
    </span>
  );
}

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] leading-tight opacity-90">{label}</div>
      <div className="text-sm leading-snug font-semibold wrap-break-words">{value}</div>
    </div>
  );
}

function SummaryDivider() {
  return (
    <span className="shrink-0 opacity-50" aria-hidden>
      |
    </span>
  );
}

type PacienteSummaryBarProps = {
  compact?: boolean;
  className?: string;
};

export function PacienteSummaryBar({ compact = false, className = "" }: PacienteSummaryBarProps) {
  const { state } = usePacienteWizard();
  const d = state.draft;

  const hc = d.numero_documento.trim() ? d.numero_documento.trim() : d.nr.trim() ? d.nr.trim() : "—";
  const nombre = fullNameFromDraft(d) || "—";
  const nr = d.nr.trim() || "—";
  const edad = computeAge(d.fecha_nacimiento);
  const sexo = labelSexo(d.sexo);
  const estado = labelEstado(d.estado);

  const summaryMobileGrid = (
    <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2 py-2.5 sm:hidden">
      <SummaryField label="Historia clínica" value={hc} />
      <SummaryField label="N° registro" value={nr} />
      <SummaryField label="Edad" value={edad !== null ? `${edad} años` : "—"} />
      <SummaryField label="Sexo" value={sexo} />
      <SummaryField label="Estado" value={estado} />
      <div className="col-span-2 min-w-0 border-t border-white/15 pt-2">
        <div className="text-[11px] leading-tight opacity-90">Paciente</div>
        <div className="text-sm leading-snug font-semibold wrap-break-words">{nombre}</div>
      </div>
    </div>
  );

  const summaryDesktopInline = (
    <div className="hidden min-w-0 flex-1 items-center gap-x-3 overflow-x-auto text-sm whitespace-nowrap sm:flex [scrollbar-width:thin]">
      <SummaryItem label="HC:" value={hc} />
      <SummaryDivider />
      <span className="max-w-60 shrink-0 truncate font-semibold">{nombre}</span>
      <SummaryDivider />
      <SummaryItem label="NR:" value={nr} />
      <SummaryDivider />
      <SummaryItem label="Edad:" value={edad !== null ? `${edad} años` : "—"} />
      <SummaryDivider />
      <SummaryItem label="Sexo:" value={sexo} />
      <SummaryDivider />
      <SummaryItem label="Estado:" value={estado} />
    </div>
  );

  const summaryBody = compact ? (
    <>
      {summaryMobileGrid}
      {summaryDesktopInline}
    </>
  ) : (
    <>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm sm:hidden">
        <SummaryItem label="HC:" value={hc} />
        <SummaryItem label="NR:" value={nr} />
        <SummaryItem label="Edad:" value={edad !== null ? `${edad} años` : "—"} />
        <SummaryItem label="Sexo:" value={sexo} />
        <SummaryItem label="Estado:" value={estado} />
        <span className="col-span-2 font-semibold wrap-break-words">{nombre}</span>
      </div>

      <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:flex">
        <SummaryItem label="HC:" value={hc} />
        <SummaryDivider />
        <span className="min-w-0 max-w-[min(100%,24rem)] truncate font-semibold">{nombre}</span>
        <SummaryDivider />
        <SummaryItem label="NR:" value={nr} />
        <SummaryDivider />
        <SummaryItem label="Edad:" value={edad !== null ? `${edad} años` : "—"} />
        <SummaryDivider />
        <SummaryItem label="Sexo:" value={sexo} />
        <SummaryDivider />
        <SummaryItem label="Estado:" value={estado} />
      </div>
    </>
  );

  const shell = compact
    ? `w-full min-w-0 rounded-lg bg-(--color-primary) px-3 text-(--color-text-inverse) sm:flex sm:items-center sm:overflow-hidden sm:px-4 ${DESKTOP_TOOLBAR_HEIGHT}`
    : "flex w-full items-center rounded-lg bg-(--color-primary) px-4 py-3 text-(--color-text-inverse)";

  return <div className={[shell, className].filter(Boolean).join(" ")}>{summaryBody}</div>;
}
