import type { ContratanteLookup, RecordStatus, TarifaLookup } from "../../types/tiposClientes.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useTiposClientes";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

function toTarifaLabel(x: TarifaLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion_tarifa ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

function toContratanteLabel(x: ContratanteLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.razon_social ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

export default function TipoClienteFormCard(props: {
  mode: Mode;
  selected: { codigo: string; estado: RecordStatus } | null;

  codigo: string;
  saving: boolean;

  tarifaId: number;
  onTarifaIdChange: (v: number) => void;
  tarifas: TarifaLookup[];

  contratanteId: number;
  onContratanteIdChange: (v: number) => void;
  contratantes: ContratanteLookup[];

  iafaRazonSocial: string;
  descripcionPreview: string;

  lookupsLoading: boolean;

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

    tarifaId,
    onTarifaIdChange,
    tarifas,

    contratanteId,
    onContratanteIdChange,
    contratantes,

    iafaRazonSocial,
    descripcionPreview,

    lookupsLoading,

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

  const estadoOptions: SelectOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const tarifaOptions: SelectOption[] = [
    {
      value: "0",
      label: lookupsLoading ? "Cargando tarifas…" : "Selecciona una tarifa",
      disabled: true,
    },
    ...tarifas.map((x) => ({ value: String(x.id), label: toTarifaLabel(x) })),
  ];

  const contratanteOptions: SelectOption[] = [
    {
      value: "0",
      label: lookupsLoading ? "Cargando contratantes…" : "Selecciona un contratante",
      disabled: true,
    },
    ...contratantes.map((x) => ({ value: String(x.id), label: toContratanteLabel(x) })),
  ];

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea un tipo de cliente." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="mt-1">
              <SelectMenu
                value={estado}
                onChange={(v) => onEstadoChange(v as RecordStatus)}
                options={estadoOptions}
                ariaLabel="Estado"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Tarifa</label>
          <div className="mt-1">
            <SelectMenu
              value={String(tarifaId)}
              onChange={(v) => onTarifaIdChange(Number(v))}
              options={tarifaOptions}
              ariaLabel="Tarifa"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            />
          </div>
        </div>
            
            <div>
                <label className="text-sm text-(--color-text-primary)">IAFAS</label>
                <input
                value={iafaRazonSocial}
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
                />
            </div>

            <div>
                <label className="text-sm text-(--color-text-primary)">Contratante</label>
                <div className="mt-1">
                    <SelectMenu
                    value={String(contratanteId)}
                    onChange={(v) => onContratanteIdChange(Number(v))}
                    options={contratanteOptions}
                    ariaLabel="Contratante"
                    buttonClassName="w-full"
                    menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm text-(--color-text-primary)">Descripción de tipo de cliente</label>
                <input
                value={descripcionPreview}
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
                />
            </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton disabled={!saveEnabled} onClick={onSave}>
          {saving ? "Guardando..." : mode === "new" ? "Crear" : "Guardar cambios"}
        </PrimaryButton>

        <SecondaryButton disabled={saving} onClick={onCancel}>
          Cancelar
        </SecondaryButton>

        <DangerButton disabled={!canDeactivate || saving} onClick={onDeactivate}>
          Desactivar
        </DangerButton>
      </div>
    </div>
  );
}
