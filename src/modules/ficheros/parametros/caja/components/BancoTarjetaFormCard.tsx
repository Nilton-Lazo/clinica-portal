import * as React from "react";
import type { FormaPagoCajaOption } from "../services/medioPagoCaja.service";
import type { MedioDisponibleBancoTarjeta } from "../services/bancoTarjetaCaja.service";
import { StatusBadge } from "../../../components/StatusBadge";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { inputBase, makeEnterKeySaveHandler } from "../../../utils/crudShared";
import type { RecordStatus } from "../../emergencia/types/paramOption.types";

type Mode = "new" | "edit";

export default function BancoTarjetaFormCard(props: {
  mode: Mode;
  selected: { codigo: string; estado: RecordStatus } | null;
  codigo: string;
  descripcion: string;
  onDescripcionChange: (v: string) => void;
  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;
  formasPago: FormaPagoCajaOption[];
  formaPagoIds: number[];
  onFormaPagoIdsChange: (ids: number[]) => void;
  mediosDisponibles: MedioDisponibleBancoTarjeta[];
  medioPagoIds: number[];
  onMedioPagoIdsChange: (ids: number[]) => void;
  loadingMedios: boolean;
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
    codigo,
    descripcion,
    onDescripcionChange,
    estado,
    onEstadoChange,
    formasPago,
    formaPagoIds,
    onFormaPagoIdsChange,
    mediosDisponibles,
    medioPagoIds,
    onMedioPagoIdsChange,
    loadingMedios,
    saving,
    isValid,
    isDirty,
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

  const formaPagoId = formaPagoIds[0] != null ? String(formaPagoIds[0]) : "";
  const medioPagoId = medioPagoIds[0] != null ? String(medioPagoIds[0]) : "";

  const formaPagoOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "", label: "Selecciona forma de pago", disabled: true },
      ...formasPago.map((fp) => ({
        value: String(fp.id),
        label: `${fp.codigo} · ${fp.descripcion}`,
      })),
    ],
    [formasPago]
  );

  const medioPagoOptions: SelectOption[] = React.useMemo(() => {
    const base: SelectOption[] = [{ value: "", label: "Selecciona medio de pago", disabled: true }];
    if (formaPagoIds.length === 0) {
      return base;
    }
    if (loadingMedios) {
      return [{ value: "", label: "Cargando…", disabled: true }];
    }
    if (mediosDisponibles.length === 0) {
      return [{ value: "", label: "Sin medios disponibles", disabled: true }];
    }
    return [
      ...base,
      ...mediosDisponibles.map((m) => ({
        value: String(m.id),
        label: `${m.codigo} · ${m.descripcion}`,
      })),
    ];
  }, [formaPagoIds.length, loadingMedios, mediosDisponibles]);

  const onFormaPagoIdChange = React.useCallback(
    (v: string) => {
      const id = parseInt(v, 10);
      onMedioPagoIdsChange([]);
      onFormaPagoIdsChange(v !== "" && !Number.isNaN(id) && id > 0 ? [id] : []);
    },
    [onFormaPagoIdsChange, onMedioPagoIdsChange]
  );

  const onMedioPagoIdChange = React.useCallback(
    (v: string) => {
      const id = parseInt(v, 10);
      onMedioPagoIdsChange(v !== "" && !Number.isNaN(id) && id > 0 ? [id] : []);
    },
    [onMedioPagoIdsChange]
  );

  const formaSelectDisabled = formasPago.length === 0;
  const medioSelectDisabled =
    formaPagoIds.length === 0 || loadingMedios || mediosDisponibles.length === 0;

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
            {mode === "new" ? "Crea un banco o tarjeta." : "Modifica campos y guarda cambios."}
          </div>
        </div>
        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
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

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Forma de pago</label>
            <div className="mt-1">
              <SelectMenu
                value={formaPagoId}
                onChange={onFormaPagoIdChange}
                options={formaPagoOptions}
                ariaLabel="Forma de pago"
                buttonClassName={`w-full h-10 ${inputBase}`}
                menuClassName="min-w-full"
                disabled={formaSelectDisabled}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-(--color-text-primary)">Medio de pago</label>
            <div className="mt-1">
              <SelectMenu
                value={loadingMedios ? "" : medioPagoId}
                onChange={onMedioPagoIdChange}
                options={medioPagoOptions}
                ariaLabel="Medio de pago"
                buttonClassName={`w-full h-10 ${inputBase}`}
                menuClassName="min-w-full"
                disabled={medioSelectDisabled}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-(--color-text-primary)">Descripción</label>
          <input
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
            className={`mt-1 h-10 w-full ${inputBase}`}
            placeholder="Nombre del banco o tarjeta"
          />
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
          <PrimaryButton className="w-full min-w-0" disabled={saving} onClick={onSave}>
            {mode === "new" ? (saving ? "Creando..." : "Crear") : saving ? "Guardando..." : "Guardar"}
          </PrimaryButton>
          <SecondaryButton className="w-full min-w-0" disabled={saving} onClick={onCancel}>
            Cancelar
          </SecondaryButton>
          <DangerButton className="w-full min-w-0" disabled={saving} onClick={onDeactivate}>
            Desactivar
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
