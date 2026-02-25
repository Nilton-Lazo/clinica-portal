import * as React from "react";
import { Clock } from "lucide-react";
import { SelectMenu } from "../../../../shared/ui/SelectMenu";
import { StatusBadge } from "../../components/StatusBadge";
import type { RecargoNocheRegla } from "../../services/recargoNoche.service";
import type { CategoriaLookupItem } from "../../services/recargoNoche.service";

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
    if (d.length <= 2) {
      hRaw = d;
      mRaw = "";
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
          onChange(clampHourDigits(d0));
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

type Opt = { value: string; label: string };

const estadoOptions: Opt[] = [
  { value: "", label: "Seleccionar estado" },
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
  { value: "SUSPENDIDO", label: "Pendiente" },
];

export default function RecargoNocheFormCard(props: {
  mode: "new" | "edit";
  selected: RecargoNocheRegla | null;
  categoriasDisponibles: CategoriaLookupItem[];
  formCategoriaId: number | null;
  onFormCategoriaIdChange: (v: number | null) => void;
  formPorcentaje: string;
  onFormPorcentajeChange: (v: string) => void;
  formHoraDesde: string;
  onFormHoraDesdeChange: (v: string) => void;
  formHoraHasta: string;
  onFormHoraHastaChange: (v: string) => void;
  formEstado: string;
  onFormEstadoChange: (v: string) => void;
  saving: boolean;
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
    categoriasDisponibles,
    formCategoriaId,
    onFormCategoriaIdChange,
    formPorcentaje,
    onFormPorcentajeChange,
    formHoraDesde,
    onFormHoraDesdeChange,
    formHoraHasta,
    onFormHoraHastaChange,
    formEstado,
    onFormEstadoChange,
    saving,
    isValid,
    isDirty,
    canDeactivate,
    onSave,
    onCancel,
    onDeactivate,
  } = props;

  const isTouchUi = useIsTouchUi();
  const saveEnabled = isValid && isDirty && !saving;

  const categoriaOptions: Opt[] = React.useMemo(
    () =>
      categoriasDisponibles.map((c) => ({
        value: String(c.id),
        label: `${c.codigo} · ${c.nombre}`.trim() || String(c.id),
      })),
    [categoriasDisponibles]
  );

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nueva regla" : "Editando regla"}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new"
              ? "Agregue categoría, porcentaje y rango de horas (desde / hasta)."
              : "Modifique campos y guarde cambios."}
          </div>
        </div>
        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {mode === "new" ? (
          <div>
            <label className="text-sm text-(--color-text-primary)">Categoría</label>
            <SelectMenu
              value={formCategoriaId != null ? String(formCategoriaId) : ""}
              onChange={(v) => onFormCategoriaIdChange(v ? Number(v) : null)}
              options={[{ value: "", label: "Seleccionar categoría" }, ...categoriaOptions]}
              ariaLabel="Categoría"
              buttonClassName="mt-1 w-full"
              menuClassName="w-full min-w-0"
            />
          </div>
        ) : (
          <div>
            <label className="text-sm text-(--color-text-primary)">Categoría</label>
            <input
              readOnly
              value={
                selected
                  ? (selected.categoria_codigo && selected.categoria_nombre
                      ? `${selected.categoria_codigo} · ${selected.categoria_nombre}`
                      : selected.categoria_nombre) ?? `Categoría ${selected.tarifa_categoria_id}`
                  : ""
              }
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Porcentaje (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={formPorcentaje}
              onChange={(e) => onFormPorcentajeChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Hora desde</label>
            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={formHoraDesde ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {formHoraDesde ? normalizeTimeOnBlur(formHoraDesde) : "HH:mm"}
                  </span>
                </div>
                <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />
                <input
                  type="time"
                  step={60}
                  value={formHoraDesde ? normalizeTimeOnBlur(formHoraDesde) : ""}
                  onChange={(e) => onFormHoraDesdeChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Hora desde"
                />
              </div>
            ) : (
              <TimeMaskedInput
                value={formHoraDesde}
                onChange={onFormHoraDesdeChange}
                ariaLabel="Hora desde"
                placeholder="HH:MM"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Hora hasta</label>
            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={formHoraHasta ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {formHoraHasta ? normalizeTimeOnBlur(formHoraHasta) : "HH:mm"}
                  </span>
                </div>
                <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />
                <input
                  type="time"
                  step={60}
                  value={formHoraHasta ? normalizeTimeOnBlur(formHoraHasta) : ""}
                  onChange={(e) => onFormHoraHastaChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Hora hasta"
                />
              </div>
            ) : (
              <TimeMaskedInput
                value={formHoraHasta}
                onChange={onFormHoraHastaChange}
                ariaLabel="Hora hasta"
                placeholder="HH:MM"
              />
            )}
          </div>
          
          <div>
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <SelectMenu
              value={formEstado}
              onChange={onFormEstadoChange}
              options={estadoOptions}
              ariaLabel="Estado"
              buttonClassName="mt-1 w-full"
              menuClassName="w-full min-w-0"
            />
          </div>
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
          {saving ? "Guardando…" : mode === "new" ? "Crear" : "Guardar cambios"}
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
