import * as React from "react";
import type { AcreditacionPlan, RecordStatus, TipoClienteLookup } from "../acreditacionPlanes.types";
import { StatusBadge } from "../../../../ficheros/components/StatusBadge";
import type { Mode } from "../useAcreditacionPlanes";
import { Calendar } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { TextField } from "./formFields";

function toTipoClienteLabel(x: TipoClienteLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion_tipo_cliente ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

function planHeaderLabel(selected: AcreditacionPlan | null): string {
  if (!selected) return "";
  if (selected.tipo_cliente) return toTipoClienteLabel(selected.tipo_cliente);
  return `#${selected.tipo_cliente_id}`;
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

function formatDateForDisplay(iso: string): string {
  const t = (iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

export default function AcreditacionPlanFormCard(props: {
  mode: Mode;
  selected: AcreditacionPlan | null;
  saving: boolean;

  tiposClientes: TipoClienteLookup[];
  tiposClientesLoading: boolean;

  tipoClienteId: number;
  onTipoClienteIdChange: (v: number) => void;

  condicionLabel: string;
  iafaLabel: string;
  contratanteLabel: string;

  fechaAfiliacion: string;
  onFechaAfiliacionChange: (v: string) => void;

  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;

  isValid: boolean;
  isDirty: boolean;
  canDeactivate: boolean;

  onSave: () => void;
  onCancel: () => void;
  onDeactivate: () => void;

  disabled?: boolean;
}) {
  const {
    mode,
    selected,
    saving,

    tiposClientes,
    tiposClientesLoading,

    tipoClienteId,
    onTipoClienteIdChange,

    condicionLabel,
    iafaLabel,
    contratanteLabel,

    fechaAfiliacion,
    onFechaAfiliacionChange,

    estado,
    onEstadoChange,

    isValid,
    isDirty,
    canDeactivate,

    onSave,
    onCancel,
    onDeactivate,

    disabled,
  } = props;

  const isTouchUi = useIsTouchUi();
  const saveEnabled = isValid && isDirty && !saving && !disabled;

  const estadoOptions: SelectOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const tipoOptions: SelectOption[] = [
    {
      value: "0",
      label: tiposClientesLoading ? "Cargando tipos…" : "Selecciona tipo de cliente",
      disabled: true,
    },
    ...tiposClientes.map((x) => ({ value: String(x.id), label: toTipoClienteLabel(x) })),
  ];

  return (
    <div className="h-full rounded-lg border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo plan afiliado" : `Editando: ${planHeaderLabel(selected)}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Afiliar un nuevo plan." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm text-(--color-text-primary)">Tipo de cliente</label>
          <div className="mt-1">
            <SelectMenu
              value={String(tipoClienteId)}
              onChange={(v) => onTipoClienteIdChange(Number(v))}
              options={tipoOptions}
              ariaLabel="Tipo de cliente"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
              disabled={Boolean(disabled)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="IAFAS" value={iafaLabel} onChange={(v) => void v} readOnly disabled={Boolean(disabled)} />
          <TextField label="Contratante" value={contratanteLabel} onChange={(v) => void v} readOnly disabled={Boolean(disabled)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Condición" value={condicionLabel} onChange={(v) => void v} readOnly disabled={Boolean(disabled)} />
          <div>
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <div className="mt-1">
              <SelectMenu
                value={estado}
                onChange={(v) => onEstadoChange(v as RecordStatus)}
                options={estadoOptions}
                ariaLabel="Estado"
                buttonClassName="w-full"
                menuClassName="min-w-full"
                disabled={Boolean(disabled)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Fecha de afiliación</label>

            {isTouchUi ? (
              <div className="group relative mt-1 rounded-md">
                <div className="h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center group-focus-within:border-(--color-primary)">
                  <span className={fechaAfiliacion ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {fechaAfiliacion ? formatDateForDisplay(fechaAfiliacion) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={fechaAfiliacion}
                  onChange={(e) => onFechaAfiliacionChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Fecha de afiliación"
                  disabled={Boolean(disabled)}
                />
              </div>
            ) : (
              <input
                type="date"
                value={fechaAfiliacion}
                onChange={(e) => onFechaAfiliacionChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)"
                disabled={Boolean(disabled)}
              />
            )}
          </div>
        </div>
        
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton disabled={!saveEnabled} onClick={onSave}>
          {saving ? "Guardando..." : mode === "new" ? "Afiliar" : "Guardar cambios"}
        </PrimaryButton>

        <SecondaryButton disabled={saving || Boolean(disabled)} onClick={onCancel}>
          Cancelar
        </SecondaryButton>

        <DangerButton disabled={!canDeactivate || saving || Boolean(disabled)} onClick={onDeactivate}>
          Desactivar
        </DangerButton>
      </div>
    </div>
  );
}
