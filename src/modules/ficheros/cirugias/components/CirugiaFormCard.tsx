import type { Cirugia, RecordStatus } from "../../types/cirugias.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useCirugias";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { inputBase, makeEnterKeySaveHandler } from "../../utils/crudShared";

export default function CirugiaFormCard(props: {
  mode: Mode;
  selected: Cirugia | null;

  codigo: string;
  saving: boolean;

  descripcion: string;
  onDescripcionChange: (v: string) => void;

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
    descripcion,
    onDescripcionChange,
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

  return (
    <div
      className="flex min-h-full w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4"
      onKeyDown={makeEnterKeySaveHandler(saveEnabled, onSave)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea una cirugía." : "Modifica campos y guarda cambios."}
          </div>
        </div>
        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col min-h-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div>
            <label className="text-sm text-(--color-text-primary)">Descripción</label>
            <input
              value={descripcion}
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
