import * as React from "react";
import type { Consultorio, RecordStatus } from "../../types/consultorios.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useConsultorios";
import { ChevronDown } from "lucide-react";

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
          "mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)]",
          "px-3 text-sm text-[var(--color-text-primary)]",
          "outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
          "flex items-center justify-between gap-2",
          "transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]",
        ].join(" ")}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
      </button>

      <div
        className={[
          "absolute left-0 right-0 mt-2 z-50",
          "rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] shadow-lg",
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
                  "transition-colors whitespace-normal break-words leading-5",
                  o.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  isSelected
                    ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                    : "text-[var(--color-text-primary)]",
                  !isSelected && isActive ? "bg-[var(--color-surface-hover)]" : "",
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

export default function ConsultorioFormCard(props: {
  mode: Mode;
  selected: Consultorio | null;
  abreviatura: string;
  saving: boolean;
  onAbreviaturaChange: (v: string) => void;
  descripcion: string;
  onDescripcionChange: (v: string) => void;
  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;
  esTercero: boolean;
  onEsTerceroChange: (v: boolean) => void;
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
    abreviatura,
    saving,
    onAbreviaturaChange,
    descripcion,
    onDescripcionChange,
    estado,
    onEstadoChange,
    esTercero,
    onEsTerceroChange,
    isValid,
    isDirty,
    canDeactivate,
    onSave,
    onCancel,
    onDeactivate,
  } = props;

  const saveEnabled = isValid && isDirty && !saving;

  const estadoOptions: Opt[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  return (
    <div className="h-full rounded-2xl border border-[var(--border-color-default)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.abreviatura ?? ""}`}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {mode === "new" ? "Crea un consultorio." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Abreviatura</label>
            <input
              value={abreviatura}
              onChange={(e) => onAbreviaturaChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Estado</label>
            <SelectMenu
              value={estado}
              onChange={(v) => onEstadoChange(v as RecordStatus)}
              options={estadoOptions}
              ariaLabel="Estado"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--color-text-primary)]">Descripción del Consultorio</label>
          <input
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] select-none">
          <input
            type="checkbox"
            checked={esTercero}
            onChange={(e) => onEsTerceroChange(e.target.checked)}
            className="h-4 w-4 rounded border border-[var(--border-color-default)] accent-[var(--color-primary)]"
          />
          Consultorio de terceros
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={[
            "h-10 rounded-xl px-4 text-sm font-medium text-[var(--color-text-inverse)]",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
            saveEnabled
              ? "bg-[var(--color-primary)]"
              : "bg-[var(--color-panel-context)] text-[var(--color-text-secondary)] cursor-not-allowed hover:scale-100",
          ].join(" ")}
          disabled={!saveEnabled}
          onClick={onSave}
        >
          {saving ? "Guardando..." : mode === "new" ? "Crear" : "Guardar cambios"}
        </button>

        <button
          type="button"
          className="h-10 rounded-xl px-4 text-sm font-medium bg-[var(--color-panel-context)] text-[var(--color-base-primary)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={[
            "h-10 rounded-xl px-4 text-sm font-medium text-[var(--color-text-inverse)]",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
            canDeactivate
              ? "bg-[var(--color-danger)]"
              : "bg-[var(--color-panel-context)] text-[var(--color-text-secondary)] cursor-not-allowed hover:scale-100",
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
