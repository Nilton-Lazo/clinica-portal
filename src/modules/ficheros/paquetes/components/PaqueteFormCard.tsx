import type { RecordStatus, TarifaLookupPaquete } from "../../types/paquetes.types";
import type { Mode } from "../hooks/usePaquetes";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { inputBase, makeEnterKeySaveHandler } from "../../utils/crudShared";
import DateInput from "../../../../shared/ui/DateInput";
import { PRECISION_DECIMAL } from "../../../../shared/constants/decimalPrecision";

function filterPrecioDecimal(raw: string): string {
  const t = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (t === "") return "";
  if (t === ".") return "0.";
  const firstDot = t.indexOf(".");
  if (firstDot === -1) return t;
  let intPart = t.slice(0, firstDot);
  const frac = t.slice(firstDot + 1).replace(/\./g, "").slice(0, PRECISION_DECIMAL);
  if (intPart === "") intPart = "0";
  return frac.length > 0 ? `${intPart}.${frac}` : `${intPart}.`;
}

function toTarifaLabel(x: TarifaLookupPaquete): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion_tarifa ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

export default function PaqueteFormCard(props: {
  mode: Mode;
  selected: { codigo: string; estado: RecordStatus } | null;

  codigo: string;
  saving: boolean;

  descripcion: string;
  onDescripcionChange: (v: string) => void;

  tarifaId: number;
  onTarifaIdChange: (v: number) => void;
  tarifas: TarifaLookupPaquete[];
  lookupsLoading: boolean;

  precioSinIgv: string;
  onPrecioSinIgvChange: (v: string) => void;

  vigenciaActual: string;
  onVigenciaActualChange: (v: string) => void;

  diasHospitalizacion: string;
  onDiasHospitalizacionChange: (v: string) => void;

  cuentaContabilidad: string;
  onCuentaContabilidadChange: (v: string) => void;

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
    tarifaId,
    onTarifaIdChange,
    tarifas,
    lookupsLoading,
    precioSinIgv,
    onPrecioSinIgvChange,
    vigenciaActual,
    onVigenciaActualChange,
    diasHospitalizacion,
    onDiasHospitalizacionChange,
    cuentaContabilidad,
    onCuentaContabilidadChange,
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

  return (
    <div
      className="flex min-h-full w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4"
      onKeyDown={makeEnterKeySaveHandler(saveEnabled, onSave)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea un paquete." : "Modifica campos y guarda cambios."}
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

          <div>
            <label className="text-sm text-(--color-text-primary)">Tarifa</label>
            <div className="mt-1">
              <SelectMenu
                value={String(tarifaId)}
                onChange={(v) => onTarifaIdChange(Number(v))}
                options={tarifaOptions}
                ariaLabel="Tarifa"
                buttonClassName={`w-full h-10 ${inputBase}`}
                menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-(--color-text-primary)">Precio sin IGV</label>
              <input
                type="text"
                value={precioSinIgv}
                inputMode="decimal"
                autoComplete="off"
                onChange={(e) => onPrecioSinIgvChange(filterPrecioDecimal(e.target.value))}
                className={`mt-1 h-10 w-full tabular-nums ${inputBase}`}
              />
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Vigencia actual</label>
              <DateInput
                value={vigenciaActual}
                onChange={onVigenciaActualChange}
                aria-label="Vigencia actual"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-(--color-text-primary)">Días hospitalización</label>
              <input
                type="number"
                min={0}
                step={1}
                value={diasHospitalizacion === "" ? "" : diasHospitalizacion}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    onDiasHospitalizacionChange("");
                    return;
                  }
                  const n = Number(v);
                  if (!Number.isFinite(n)) return;
                  onDiasHospitalizacionChange(String(Math.max(0, Math.round(n))));
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className={`mt-1 h-10 w-full tabular-nums ${inputBase}`}
              />
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Cuenta contabilidad</label>
              <input
                value={cuentaContabilidad}
                onChange={(e) => onCuentaContabilidadChange(e.target.value)}
                className={`mt-1 h-10 w-full ${inputBase}`}
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
