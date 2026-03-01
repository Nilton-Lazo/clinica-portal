import * as React from "react";
import type { JornadaTurno, RecordStatus, TipoTurno, Turno } from "../../types/turnos.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useTurnos";
import { Clock } from "lucide-react";
import { SelectMenu as SharedSelectMenu } from "../../../../shared/ui/SelectMenu";
import { inputBase } from "../../utils/crudShared";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";

type Opt = { value: string; label: string; disabled?: boolean };

function SelectMenu(props: { value: string; onChange: (v: string) => void; options: Opt[]; ariaLabel: string; buttonClassName?: string }) {
  const { value, onChange, options, ariaLabel, buttonClassName } = props;
  return (
    <SharedSelectMenu
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
      buttonClassName={buttonClassName ?? `mt-1 w-full h-10 ${inputBase}`}
      menuClassName="min-w-full w-full"
    />
  );
}

function useIsTouchUi(): boolean {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = () => setIsTouch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clampHourDigits(h: string): string {
  const d = (h ?? "").replace(/\D/g, "").slice(0, 2);
  if (!d) return "";
  if (d.length === 1) {
    const a = d.charCodeAt(0) - 48;
    if (a < 0) return "";
    return String(Math.min(2, Math.max(0, a)));
  }
  const a = d.charCodeAt(0) - 48;
  const b = d.charCodeAt(1) - 48;
  if (a < 0 || b < 0) return "";
  if (a > 2) return "23";
  if (a === 2 && b > 3) return "23";
  return `${a}${b}`;
}

function clampMinuteDigits(m: string): string {
  const d = (m ?? "").replace(/\D/g, "").slice(0, 2);
  if (!d) return "";
  if (d.length === 1) {
    const a = d.charCodeAt(0) - 48;
    if (a < 0) return "";
    return String(Math.min(5, Math.max(0, a)));
  }
  const a = d.charCodeAt(0) - 48;
  const b = d.charCodeAt(1) - 48;
  if (a < 0 || b < 0) return "";
  if (a > 5) return "59";
  return `${a}${b}`;
}

function normalizeTimeOnBlur(input: string): string {
  const t = (input ?? "").trim();
  if (!t) return "";

  const hasColon = t.includes(":");
  let hRaw = "";
  let mRaw = "";

  if (hasColon) {
    const [a, b] = t.split(":");
    hRaw = (a ?? "").replace(/\D/g, "");
    mRaw = (b ?? "").replace(/\D/g, "");
  } else {
    const d = t.replace(/\D/g, "").slice(0, 4);
    if (!d) return "";
    if (d.length === 1) {
      hRaw = d;
      mRaw = "";
    } else if (d.length === 2) {
      hRaw = d;
      mRaw = "";
    } else if (d.length === 3) {
      hRaw = d.slice(0, 2);
      mRaw = `${d.slice(2, 3)}0`;
    } else {
      hRaw = d.slice(0, 2);
      mRaw = d.slice(2, 4);
    }
  }

  if (!hRaw) return "";

  const hh0 = Number(hRaw);
  const mm0 = mRaw ? Number(mRaw.padEnd(2, "0").slice(0, 2)) : 0;

  const hh = Number.isFinite(hh0) ? Math.min(23, Math.max(0, Math.trunc(hh0))) : 0;
  const mm = Number.isFinite(mm0) ? Math.min(59, Math.max(0, Math.trunc(mm0))) : 0;

  return `${pad2(hh)}:${pad2(mm)}`;
}

function TimeMaskedInput(props: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) {
  const { value, onChange, ariaLabel, placeholder } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const selectMinutesNextRef = React.useRef(false);
  const lastKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selectMinutesNextRef.current) return;
    selectMinutesNextRef.current = false;
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(3, 5);
      } catch {
        void 0;
      }
    });
  }, [value]);

  return (
    <input
      ref={inputRef}
      aria-label={ariaLabel}
      value={value}
      inputMode="numeric"
      placeholder={placeholder ?? "HH:MM"}
      onKeyDown={(e) => {
        lastKeyRef.current = e.key;
      }}
      onChange={(e) => {
        const lastKey = lastKeyRef.current;
        lastKeyRef.current = null;

        const raw0 = (e.target.value ?? "").replace(/[^\d:]/g, "");

        if (raw0.includes(":")) {
          const [h0, m0] = raw0.split(":");
          const h = clampHourDigits(h0 ?? "");
          const m = clampMinuteDigits(m0 ?? "");
          if (!h && !m) {
            onChange("");
            return;
          }
          onChange(`${h}:${m}`);
          return;
        }

        const d0 = raw0.replace(/\D/g, "").slice(0, 4);
        if (!d0) {
          onChange("");
          return;
        }

        if (d0.length === 1) {
          const h1 = clampHourDigits(d0);
          onChange(h1);
          return;
        }

        if (d0.length === 2) {
          const h2 = clampHourDigits(d0);

          if (lastKey === "Backspace" || lastKey === "Delete") {
            onChange(h2);
            return;
          }

          onChange(`${h2}:00`);
          selectMinutesNextRef.current = true;
          return;
        }

        if (d0.length === 3) {
          const h2 = clampHourDigits(d0.slice(0, 2));
          const m1 = clampMinuteDigits(d0.slice(2, 3));
          onChange(`${h2}:${m1}`);
          return;
        }

        const h2 = clampHourDigits(d0.slice(0, 2));
        const m2 = clampMinuteDigits(d0.slice(2, 4));
        onChange(`${h2}:${m2}`);
      }}
      onBlur={() => onChange(normalizeTimeOnBlur(value))}
      className={`mt-1 h-10 w-full ${inputBase}`}
    />
  );
}

export default function TurnoFormCard(props: {
  mode: Mode;
  selected: Turno | null;

  codigo: string;

  saving: boolean;

  horaInicio: string;
  onHoraInicioChange: (v: string) => void;

  horaFin: string;
  onHoraFinChange: (v: string) => void;

  duracionPreview: string;
  descripcionPreview: string;

  descripcion: string;
  onDescripcionChange: (v: string) => void;

  tipoTurno: TipoTurno;
  onTipoTurnoChange: (v: TipoTurno) => void;

  jornada: JornadaTurno;
  onJornadaChange: (v: JornadaTurno) => void;

  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;

  isValid: boolean;
  isDirty: boolean;
  canDeactivate: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDeactivate: () => void;
}) {
  const {
    mode,
    selected,
    codigo,
    saving,
    horaInicio,
    onHoraInicioChange,
    horaFin,
    onHoraFinChange,
    duracionPreview,
    descripcionPreview,
    descripcion,
    onDescripcionChange,
    tipoTurno,
    onTipoTurnoChange,
    jornada,
    onJornadaChange,
    estado,
    onEstadoChange,
    isValid,
    isDirty,
    canDeactivate,
    onSave,
    onCancel,
    onDeactivate,
  } = props;

  const isTouchUi = useIsTouchUi();
  const saveEnabled = isValid && isDirty && !saving;

  const estadoOptions: Opt[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const tipoOptions: Opt[] = [
    { value: "NORMAL", label: "Normal" },
    { value: "ADICIONAL", label: "Adicional" },
    { value: "EXCLUSIVO", label: "Exclusivo" },
  ];

  const jornadaOptions: Opt[] = [
    { value: "MANANA", label: "Mañana" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOCHE", label: "Noche" },
  ];

  // FIX: en edit debe reflejar el cambio live (duracionPreview) antes que lo guardado.
  const duracionReadonly =
    (duracionPreview ?? "").trim() !== ""
      ? duracionPreview
      : (selected?.duracion_hhmm ?? "").trim() !== ""
        ? (selected?.duracion_hhmm ?? "")
        : "";

  const descripcionValue =
    descripcion.trim() !== ""
      ? descripcion
      : mode === "edit"
        ? (selected?.descripcion ?? descripcionPreview ?? "")
        : (descripcionPreview ?? "");

  return (
    <div className="flex min-h-full w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea un turno." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col min-h-0">
        <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Código</label>
            <input
              value={codigo}
              readOnly
              placeholder={mode === "new" ? "Generando" : ""}
              className={`mt-1 h-10 w-full ${inputBase}`}
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Tipo de turno</label>
            <SelectMenu
              value={tipoTurno}
              onChange={(v) => onTipoTurnoChange(v as TipoTurno)}
              options={tipoOptions}
              ariaLabel="Tipo de turno"
              buttonClassName={`mt-1 w-full h-10 ${inputBase}`}
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <SelectMenu
              value={estado}
              onChange={(v) => onEstadoChange(v as RecordStatus)}
              options={estadoOptions}
              ariaLabel="Estado"
              buttonClassName={`mt-1 w-full h-10 ${inputBase}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Hora de inicio</label>

            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={horaInicio ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {horaInicio ? normalizeTimeOnBlur(horaInicio) : "HH:MM"}
                  </span>
                </div>

                <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="time"
                  step={60}
                  value={horaInicio ? normalizeTimeOnBlur(horaInicio) : ""}
                  onChange={(e) => onHoraInicioChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Hora de inicio"
                />
              </div>
            ) : (
              <TimeMaskedInput value={horaInicio} onChange={onHoraInicioChange} ariaLabel="Hora de inicio" />
            )}
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Hora de término</label>

            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={horaFin ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {horaFin ? normalizeTimeOnBlur(horaFin) : "HH:MM"}
                  </span>
                </div>

                <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="time"
                  step={60}
                  value={horaFin ? normalizeTimeOnBlur(horaFin) : ""}
                  onChange={(e) => onHoraFinChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Hora de término"
                />
              </div>
            ) : (
              <TimeMaskedInput value={horaFin} onChange={onHoraFinChange} ariaLabel="Hora de término" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Duración (HH:MM)</label>
            <input
              value={duracionReadonly}
              readOnly
              placeholder="—"
              className={`mt-1 h-10 w-full ${inputBase}`}
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Jornada</label>
            <SelectMenu value={jornada} onChange={(v) => onJornadaChange(v as JornadaTurno)} options={jornadaOptions} ariaLabel="Jornada" buttonClassName={`mt-1 w-full h-10 ${inputBase}`} />
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Descripción</label>
          <input
            value={descripcionValue}
            onChange={(e) => onDescripcionChange(e.target.value)}
            className={`mt-1 h-10 w-full ${inputBase}`}
          />
        </div>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
        <PrimaryButton className="w-full min-w-0" disabled={!saveEnabled} onClick={onSave}>
          {mode === "new" ? (saving ? "Creando..." : "Crear") : saving ? "Guardando..." : "Guardar"}
        </PrimaryButton>
        <SecondaryButton className="w-full min-w-0" disabled={saving} onClick={onCancel}>
          Cancelar
        </SecondaryButton>
        <DangerButton className="w-full min-w-0" disabled={!canDeactivate || saving} onClick={onDeactivate}>
          Desactivar
        </DangerButton>
        </div>
      </div>
    </div>
  );
}
