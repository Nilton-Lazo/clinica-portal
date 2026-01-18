import type { RecordStatus } from "../../../../../shared/types/recordStatus";
import type { Mode } from "../hooks/useProgramacionMedica";
import type { TipoProgramacionMedica } from "../types/programacionMedica.types";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

type Opt = { id: number; label: string };

export default function ProgramacionMedicaFormCard(props: {
  mode: Mode;

  codigo: string;
  fechaDisplay: string;

  medicoId: number;
  onMedicoChange: (id: number) => void;
  medicoOptions: Opt[];

  especialidadId: number;
  onEspecialidadChange: (id: number) => void;
  especialidadOptions: Opt[];

  consultorioId: number;
  onConsultorioChange: (id: number) => void;
  consultorioOptions: Opt[];

  turnoId: number;
  onTurnoChange: (id: number) => void;
  turnoOptions: Opt[];

  cupos: number;

  tipo: TipoProgramacionMedica;
  onTipoChange: (v: TipoProgramacionMedica) => void;

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
    codigo,
    fechaDisplay,
    medicoId,
    onMedicoChange,
    medicoOptions,
    especialidadId,
    onEspecialidadChange,
    especialidadOptions,
    consultorioId,
    onConsultorioChange,
    consultorioOptions,
    turnoId,
    onTurnoChange,
    turnoOptions,
    cupos,
    tipo,
    onTipoChange,
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

  const tipoOptions: SelectOption[] = [
    { value: "NORMAL", label: "Normal" },
    { value: "EXTRAORDINARIA", label: "Extraordinaria" },
  ];

  const estadoOptions: SelectOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const toSelectOptions = (xs: Opt[], placeholder: string): SelectOption[] => {
    const out: SelectOption[] = [{ value: "0", label: placeholder, disabled: true }];
    xs.forEach((x) => out.push({ value: String(x.id), label: x.label }));
    return out;
  };

  const fieldCls =
    "mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)";

  const codigoValue = String(codigo ?? "").trim() !== "" ? codigo : "Generando...";

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nueva programación" : `Editando: ${codigoValue}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new"
              ? "Crea programación según modalidad y fechas."
              : "Modifica campos y guarda cambios."}
          </div>
        </div>
        {mode === "edit" ? <StatusBadge status={estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Código</label>
            <input value={codigoValue} readOnly className={fieldCls} aria-label="Código" />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Fecha</label>
            <input value={fechaDisplay} readOnly className={fieldCls} aria-label="Fecha" />
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Médico</label>
            <div className="mt-1">
              <SelectMenu
                value={String(medicoId || 0)}
                onChange={(v) => onMedicoChange(Number(v))}
                options={toSelectOptions(medicoOptions, "Seleccione médico")}
                ariaLabel="Médico"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Especialidad</label>
            <div className="mt-1">
              <SelectMenu
                value={String(especialidadId || 0)}
                onChange={(v) => onEspecialidadChange(Number(v))}
                options={toSelectOptions(especialidadOptions, "Seleccione especialidad")}
                ariaLabel="Especialidad"
                buttonClassName="w-full"
                menuClassName="min-w-full"
                disabled={medicoId <= 0 || especialidadOptions.length === 0}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-sm text-(--color-text-primary)">Turno</label>
            <div className="mt-1">
              <SelectMenu
                value={String(turnoId || 0)}
                onChange={(v) => onTurnoChange(Number(v))}
                options={toSelectOptions(turnoOptions, "Seleccione turno")}
                ariaLabel="Turno"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm text-(--color-text-primary)">Consultorio</label>
            <div className="mt-1">
              <SelectMenu
                value={String(consultorioId || 0)}
                onChange={(v) => onConsultorioChange(Number(v))}
                options={toSelectOptions(consultorioOptions, "Seleccione consultorio")}
                ariaLabel="Consultorio"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Cupos</label>
            <input
              value={cupos ? String(cupos) : ""}
              readOnly
              className={fieldCls}
              aria-label="Cupos"
              placeholder="Auto"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Tipo</label>
            <div className="mt-1">
              <SelectMenu
                value={tipo}
                onChange={(v) => onTipoChange(v as TipoProgramacionMedica)}
                options={tipoOptions}
                ariaLabel="Tipo"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="my-auto py-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton disabled={!saveEnabled} onClick={onSave} className="w-full sm:w-auto">
          {mode === "new" ? (saving ? "Creando..." : "Crear") : saving ? "Guardando..." : "Guardar cambios"}
        </PrimaryButton>

        <SecondaryButton disabled={saving} onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </SecondaryButton>

        <DangerButton disabled={!canDeactivate || saving} onClick={onDeactivate} className="w-full sm:w-auto">
          Desactivar
        </DangerButton>
      </div>
    </div>
  );
}
