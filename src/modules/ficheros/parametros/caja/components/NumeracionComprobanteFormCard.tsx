import { StatusBadge } from "../../../components/StatusBadge";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { inputBase, makeEnterKeySaveHandler } from "../../../utils/crudShared";
import type { RecordStatus } from "../../emergencia/types/paramOption.types";
import type { NumeracionComprobanteCajaItem, TipoDocumentoCajaOption } from "../services/numeracionComprobanteCaja.service";

type Mode = "new" | "edit";

export default function NumeracionComprobanteFormCard(props: {
  mode: Mode;
  selected: NumeracionComprobanteCajaItem | null;
  tiposDocumento: TipoDocumentoCajaOption[];
  tipoDocumentoId: string;
  onTipoDocumentoIdChange: (v: string) => void;
  serie: string;
  onSerieChange: (v: string) => void;
  numeroText: string;
  onNumeroTextChange: (v: string) => void;
  onSerieBlur: () => void;
  onNumeroBlur: () => void;
  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;
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
    tiposDocumento,
    tipoDocumentoId,
    onTipoDocumentoIdChange,
    serie,
    onSerieChange,
    numeroText,
    onNumeroTextChange,
    onSerieBlur,
    onNumeroBlur,
    estado,
    onEstadoChange,
    saving,
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
  const tipoOptions: SelectOption[] = [
    { value: "", label: "Selecciona tipo de documento", disabled: true },
    ...tiposDocumento.map((t) => ({
      value: String(t.id),
      label: `${t.codigo} · ${t.descripcion}`,
    })),
  ];

  return (
    <div
      className="flex min-h-full w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4"
      onKeyDown={makeEnterKeySaveHandler(saveEnabled, onSave)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.serie ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea una numeración de comprobante." : "Modifica campos y guarda cambios."}
          </div>
        </div>
        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-(--color-text-primary)">Tipo de documento</label>
            <div className="mt-1">
              <SelectMenu
                value={tipoDocumentoId}
                onChange={onTipoDocumentoIdChange}
                options={tipoOptions}
                ariaLabel="Tipo de documento"
                buttonClassName={`w-full h-10 ${inputBase}`}
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Serie</label>
            <input
              value={serie}
              onChange={(e) => onSerieChange(e.target.value)}
              onBlur={onSerieBlur}
              className={`mt-1 h-10 w-full tabular-nums ${inputBase}`}
              inputMode="numeric"
              maxLength={3}
              placeholder="000"
              aria-label="Serie"
            />
          </div>
          <div>
            <label className="text-sm text-(--color-text-primary)">Número</label>
            <input
              value={numeroText}
              onChange={(e) => onNumeroTextChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
              onBlur={onNumeroBlur}
              className={`mt-1 h-10 w-full tabular-nums ${inputBase}`}
              inputMode="numeric"
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
                buttonClassName={`w-full h-10 ${inputBase}`}
                menuClassName="min-w-full"
              />
            </div>
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
