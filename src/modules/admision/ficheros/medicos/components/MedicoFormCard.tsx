import * as React from "react";
import type {
  EspecialidadLookup,
  Medico,
  RecordStatus,
  TipoProfesionalClinica,
} from "../../types/medicos.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useMedicos";
import { Calendar } from "lucide-react";

import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

function toEspecialidadLabel(x: EspecialidadLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
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

  const isTouchUi = useIsTouchUi();
  const saveEnabled = isValid && isDirty && !saving;

  const estadoOptions: SelectOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const tipoOptions: SelectOption[] = [
    { value: "STAFF", label: "Staff" },
    { value: "EXTERNO", label: "Externo" },
  ];

  const espOptions: SelectOption[] = [
    {
      value: "0",
      label: especialidadesLoading ? "Cargando especialidades…" : "Selecciona especialidad",
      disabled: true,
    },
    ...especialidades.map((x) => ({ value: String(x.id), label: toEspecialidadLabel(x) })),
  ];

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${selected?.codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea un médico." : "Modifica campos y guarda cambios."}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">CMP</label>
            <input
              value={cmp}
              inputMode="numeric"
              onChange={(e) => onCmpChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">RNE</label>
            <input
              value={rne}
              onChange={(e) => onRneChange(e.target.value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase())}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">DNI</label>
            <input
              value={dni}
              inputMode="numeric"
              onChange={(e) => onDniChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">RUC</label>
            <input
              value={ruc}
              inputMode="numeric"
              onChange={(e) => onRucChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Apellido Paterno</label>
            <input
              value={apellidoPaterno}
              onChange={(e) => onApellidoPaternoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Apellido Materno</label>
            <input
              value={apellidoMaterno}
              onChange={(e) => onApellidoMaternoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Nombres</label>
            <input
              value={nombres}
              onChange={(e) => onNombresChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Especialidad</label>
            <div className="mt-1">
              <SelectMenu
                value={String(especialidadId)}
                onChange={(v) => onEspecialidadIdChange(Number(v))}
                options={espOptions}
                ariaLabel="Especialidad"
                buttonClassName="w-full"
                menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Teléfono 1</label>
            <input
              value={telefono}
              inputMode="numeric"
              onChange={(e) => onTelefonoChange(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Teléfono 2</label>
            <input
              value={telefono2}
              inputMode="numeric"
              onChange={(e) => onTelefono2Change(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Dirección</label>
            <input
              value={direccion}
              onChange={(e) => onDireccionChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Centro de trabajo</label>
            <input
              value={centroTrabajo}
              onChange={(e) => onCentroTrabajoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Fecha de nacimiento</label>

            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={fechaNacimiento ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {fechaNacimiento ? formatDateForDisplay(fechaNacimiento) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => onFechaNacimientoChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Fecha de nacimiento"
                />
              </div>
            ) : (
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => onFechaNacimientoChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Tipo profesional</label>
            <div className="mt-1">
              <SelectMenu
                value={tipoProfesional}
                onChange={(v) => onTipoProfesionalChange(v as TipoProfesionalClinica)}
                options={tipoOptions}
                ariaLabel="Tipo profesional"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Tiempo promedio (minutos)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={tiempoPromedio}
              onChange={(e) => onTiempoPromedioChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Adicionales</label>
            <input
              type="number"
              min={0}
              step={1}
              value={adicionales}
              onChange={(e) => onAdicionalesChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Extras</label>
            <input
              type="number"
              min={0}
              step={1}
              value={extras}
              onChange={(e) => onExtrasChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
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
