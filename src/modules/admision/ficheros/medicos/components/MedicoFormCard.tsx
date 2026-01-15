import * as React from "react";
import type { EspecialidadLookup, Medico, RecordStatus, TipoProfesionalClinica } from "../../types/medicos.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useMedicos";
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

function toEspecialidadLabel(x: EspecialidadLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

export default function MedicoFormCard(props: {
  mode: Mode;
  selected: Medico | null;

  codigo: string;

  saving: boolean;

  cmp: string;
  onCmpChange: (v: string) => void;

  rne: string;
  onRneChange: (v: string) => void;

  dni: string;
  onDniChange: (v: string) => void;

  tipoProfesional: TipoProfesionalClinica;
  onTipoProfesionalChange: (v: TipoProfesionalClinica) => void;

  nombres: string;
  onNombresChange: (v: string) => void;

  apellidoPaterno: string;
  onApellidoPaternoChange: (v: string) => void;

  apellidoMaterno: string;
  onApellidoMaternoChange: (v: string) => void;

  especialidadId: number;
  onEspecialidadIdChange: (v: number) => void;
  especialidades: EspecialidadLookup[];
  especialidadesLoading: boolean;

  telefono: string;
  onTelefonoChange: (v: string) => void;

  telefono2: string;
  onTelefono2Change: (v: string) => void;

  email: string;
  onEmailChange: (v: string) => void;

  direccion: string;
  onDireccionChange: (v: string) => void;

  centroTrabajo: string;
  onCentroTrabajoChange: (v: string) => void;

  fechaNacimiento: string;
  onFechaNacimientoChange: (v: string) => void;

  ruc: string;
  onRucChange: (v: string) => void;

  adicionales: string;
  onAdicionalesChange: (v: string) => void;

  extras: string;
  onExtrasChange: (v: string) => void;

  tiempoPromedio: string;
  onTiempoPromedioChange: (v: string) => void;

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

        cmp,
        onCmpChange,
        rne,
        onRneChange,
        dni,
        onDniChange,

        tipoProfesional,
        onTipoProfesionalChange,

        nombres,
        onNombresChange,
        apellidoPaterno,
        onApellidoPaternoChange,
        apellidoMaterno,
        onApellidoMaternoChange,

        especialidadId,
        onEspecialidadIdChange,
        especialidades,
        especialidadesLoading,

        telefono,
        onTelefonoChange,
        telefono2,
        onTelefono2Change,
        email,
        onEmailChange,

        direccion,
        onDireccionChange,
        centroTrabajo,
        onCentroTrabajoChange,
        fechaNacimiento,
        onFechaNacimientoChange,

        ruc,
        onRucChange,

        adicionales,
        onAdicionalesChange,
        extras,
        onExtrasChange,
        tiempoPromedio,
        onTiempoPromedioChange,

        estado,
        onEstadoChange,

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

  const tipoOptions: Opt[] = [
    { value: "STAFF", label: "Staff" },
    { value: "EXTERNO", label: "Externo" },
  ];

  const espOptions: Opt[] = [
    { value: "0", label: especialidadesLoading ? "Cargando especialidades…" : "Selecciona especialidad", disabled: true },
    ...especialidades.map((x) => ({ value: String(x.id), label: toEspecialidadLabel(x) })),
  ];

  return (
    <div className="h-full rounded-2xl border border-[var(--border-color-default)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.codigo ?? ""}`}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {mode === "new" ? "Crea un médico." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Código</label>
            <input
              value={codigo}
              readOnly
              placeholder={mode === "new" ? "Se genera automáticamente" : ""}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">CMP</label>
            <input
              value={cmp}
              inputMode="numeric"
              onChange={(e) => onCmpChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">RNE</label>
            <input
              value={rne}
              onChange={(e) => onRneChange(e.target.value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase())}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">DNI</label>
            <input
              value={dni}
              inputMode="numeric"
              onChange={(e) => onDniChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Tipo profesional</label>
            <SelectMenu
              value={tipoProfesional}
              onChange={(v) => onTipoProfesionalChange(v as TipoProfesionalClinica)}
              options={tipoOptions}
              ariaLabel="Tipo profesional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm text-[var(--color-text-primary)]">Apellido Paterno</label>
            <input
              value={apellidoPaterno}
              onChange={(e) => onApellidoPaternoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm text-[var(--color-text-primary)]">Apellido Materno</label>
            <input
              value={apellidoMaterno}
              onChange={(e) => onApellidoMaternoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-sm text-[var(--color-text-primary)]">Nombres</label>
            <input
              value={nombres}
              onChange={(e) => onNombresChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--color-text-primary)]">Especialidad</label>
          <SelectMenu
            value={String(especialidadId)}
            onChange={(v) => onEspecialidadIdChange(Number(v))}
            options={espOptions}
            ariaLabel="Especialidad"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Teléfono 1</label>
            <input
              value={telefono}
              inputMode="numeric"
              onChange={(e) => onTelefonoChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Teléfono 2</label>
            <input
              value={telefono2}
              inputMode="numeric"
              onChange={(e) => onTelefono2Change(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--color-text-primary)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Dirección</label>
            <input
              value={direccion}
              onChange={(e) => onDireccionChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Centro de trabajo</label>
            <input
              value={centroTrabajo}
              onChange={(e) => onCentroTrabajoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Fecha de nacimiento</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => onFechaNacimientoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">RUC</label>
            <input
              value={ruc}
              inputMode="numeric"
              onChange={(e) => onRucChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Tiempo promedio (min)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={tiempoPromedio}
              onChange={(e) => onTiempoPromedioChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Adicionales</label>
            <input
              type="number"
              min={0}
              step={1}
              value={adicionales}
              onChange={(e) => onAdicionalesChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-primary)]">Extras</label>
            <input
              type="number"
              min={0}
              step={1}
              value={extras}
              onChange={(e) => onExtrasChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-color-default)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
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
          {mode === "new" ? "Crear" : "Guardar cambios"}
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
