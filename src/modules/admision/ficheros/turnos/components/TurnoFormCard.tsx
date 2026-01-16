import * as React from "react";
import type { JornadaTurno, RecordStatus, TipoTurno, Turno } from "../../types/turnos.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useTurnos";
import { ChevronDown, Clock } from "lucide-react";

type Opt = { value: string; label: string; disabled?: boolean };

function SelectMenu(props: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  ariaLabel: string;
}) {
  const { value, onChange, options, ariaLabel } = props;
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    const i = options.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  React.useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!open) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const move = (dir: 1 | -1) => {
    let i = activeIndex;
    for (let k = 0; k < options.length; k++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          const i = options.findIndex((o) => o.value === value);
          setActiveIndex(i >= 0 ? i : 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            move(-1);
          }
        }}
        className={[
          "mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface)",
          "px-3 text-sm text-(--color-text-primary)",
          "outline-none focus:ring-2 focus:ring-(--color-primary)",
          "flex items-center justify-between gap-2",
          "transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]",
        ].join(" ")}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-(--color-text-secondary)" />
      </button>

      <div
        className={[
          "absolute left-0 right-0 mt-2 z-50",
          "rounded-xl border border-(--border-color-default) bg-(--color-surface) shadow-lg",
          "origin-top transition-all duration-150",
          open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 -translate-y-1 scale-[0.98]",
        ].join(" ")}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = options[activeIndex];
            if (opt && !opt.disabled) pick(opt.value);
          } else if (e.key === "Tab") {
            setOpen(false);
          }
        }}
      >
        <div className="max-h-60 overflow-auto p-1 app-scrollbar app-scrollbar-no-gutter">
          {options.map((o, idx) => {
            const isSelected = o.value === value;
            const isActive = idx === activeIndex;

            return (
              <button
                key={o.value}
                type="button"
                disabled={o.disabled}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => !o.disabled && pick(o.value)}
                className={[
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  "transition-colors whitespace-normal wrap-break-words leading-5",
                  o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  isSelected ? "bg-(--color-primary) text-(--color-text-inverse)" : "text-(--color-text-primary)",
                  !isSelected && isActive ? "bg-(--color-surface-hover)" : "",
                ].join(" ")}
                role="option"
                aria-selected={isSelected}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
          onChange(`${h}${raw0.includes(":") ? ":" : ""}${m}`);
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
      className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
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

  const duracionReadonly =
    mode === "new" ? duracionPreview : selected?.duracion_hhmm ?? duracionPreview ?? "";

  const descripcionValue =
    descripcion.trim() !== ""
      ? descripcion
      : mode === "edit"
        ? (selected?.descripcion ?? descripcionPreview ?? "")
        : (descripcionPreview ?? "");

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
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

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Código</label>
            <input
              value={codigo}
              readOnly
              placeholder={mode === "new" ? "Generando" : ""}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <SelectMenu
              value={estado}
              onChange={(v) => onEstadoChange(v as RecordStatus)}
              options={estadoOptions}
              ariaLabel="Estado"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Tipo de turno</label>
            <SelectMenu
              value={tipoTurno}
              onChange={(v) => onTipoTurnoChange(v as TipoTurno)}
              options={tipoOptions}
              ariaLabel="Tipo de turno"
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
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
            </div>    
            <div>
                <label className="text-sm text-(--color-text-primary)">Jornada</label>
                <SelectMenu
                value={jornada}
                onChange={(v) => onJornadaChange(v as JornadaTurno)}
                options={jornadaOptions}
                ariaLabel="Jornada"
                />
            </div>
        </div>
       
          <div>
            <label className="text-sm text-(--color-text-primary)">Descripción</label>
            <input
              value={descripcionValue}
              onChange={(e) => onDescripcionChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={[
            "h-10 rounded-xl px-4 text-sm font-medium text-(--color-text-inverse)",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
            saveEnabled
              ? "bg-(--color-primary)"
              : "bg-(--color-panel-context) text-(--color-text-secondary) cursor-not-allowed hover:scale-100",
          ].join(" ")}
          disabled={!saveEnabled}
          onClick={onSave}
        >
          {saving ? "Guardando..." : mode === "new" ? "Crear" : "Guardar cambios"}
        </button>

        <button
          type="button"
          className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={[
            "h-10 rounded-xl px-4 text-sm font-medium text-(--color-text-inverse)",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
            canDeactivate
              ? "bg-(--color-danger)"
              : "bg-(--color-panel-context) text-(--color-text-secondary) cursor-not-allowed hover:scale-100",
          ].join(" ")}
          disabled={!canDeactivate}
          onClick={onDeactivate}
        >
          Desactivar
        </button>
      </div>
    </div>
  );
}
