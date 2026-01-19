import * as React from "react";
import type { IafaLookup, RecordStatus } from "../../types/tarifas.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useTarifas";
import { Calendar, ChevronDown } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

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

function toIafaLabel(x: IafaLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion_corta ?? "").trim();
  const rs = (x.razon_social ?? "").trim();
  const main = d || rs;
  return c && main ? `${c} · ${main}` : c || main || `#${x.id}`;
}

function FactorInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const { label, value, onChange, onBlur } = props;

  return (
    <div>
      <label className="text-sm text-(--color-text-primary)">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
      />
    </div>
  );
}

function Section(props: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const { title, defaultOpen, children } = props;
  const [open, setOpen] = React.useState(Boolean(defaultOpen));

  return (
    <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-3">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">{title}</div>
          <div className="text-xs text-(--color-text-secondary)">{open ? "Ocultar campos" : "Mostrar campos"}</div>
        </div>

        <ChevronDown
          className={[
            "h-4 w-4 text-(--color-icon-primary) transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function TarifaFormCard(props: {
  mode: Mode;
  selected: { codigo: string; estado: RecordStatus; tarifa_base: boolean } | null;

  codigo: string;
  saving: boolean;

  descripcionTarifa: string;
  onDescripcionTarifaChange: (v: string) => void;

  iafaId: number;
  onIafaIdChange: (v: number) => void;
  iafas: IafaLookup[];
  iafasLoading: boolean;

  fechaCreacion: string;

  requiereAcreditacion: boolean;
  onRequiereAcreditacionChange: (v: boolean) => void;
  iafaIsParticular: boolean;

  tarifaBase: boolean;
  onTarifaBaseChange: (nextChecked: boolean) => void;

  factorClinica: string;
  onFactorClinicaChange: (v: string) => void;
  factorLaboratorio: string;
  onFactorLaboratorioChange: (v: string) => void;
  factorEcografia: string;
  onFactorEcografiaChange: (v: string) => void;
  factorProcedimientos: string;
  onFactorProcedimientosChange: (v: string) => void;
  factorRayosX: string;
  onFactorRayosXChange: (v: string) => void;
  factorTomografia: string;
  onFactorTomografiaChange: (v: string) => void;
  factorPatologia: string;
  onFactorPatologiaChange: (v: string) => void;
  factorMedicinaFisica: string;
  onFactorMedicinaFisicaChange: (v: string) => void;
  factorResonancia: string;
  onFactorResonanciaChange: (v: string) => void;
  factorHonorariosMedicos: string;
  onFactorHonorariosMedicosChange: (v: string) => void;
  factorMedicinas: string;
  onFactorMedicinasChange: (v: string) => void;
  factorEquiposOxigeno: string;
  onFactorEquiposOxigenoChange: (v: string) => void;
  factorBancoSangre: string;
  onFactorBancoSangreChange: (v: string) => void;
  factorMamografia: string;
  onFactorMamografiaChange: (v: string) => void;
  factorDensitometria: string;
  onFactorDensitometriaChange: (v: string) => void;
  factorPsicoprofilaxis: string;
  onFactorPsicoprofilaxisChange: (v: string) => void;
  factorOtrosServicios: string;
  onFactorOtrosServiciosChange: (v: string) => void;

  factorMedicamentosComerciales: string;
  onFactorMedicamentosComercialesChange: (v: string) => void;
  factorMedicamentosGenericos: string;
  onFactorMedicamentosGenericosChange: (v: string) => void;
  factorMaterialMedico: string;
  onFactorMaterialMedicoChange: (v: string) => void;

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

    descripcionTarifa,
    onDescripcionTarifaChange,

    iafaId,
    onIafaIdChange,
    iafas,
    iafasLoading,

    fechaCreacion,

    requiereAcreditacion,
    onRequiereAcreditacionChange,
    iafaIsParticular,

    tarifaBase,
    onTarifaBaseChange,

    factorClinica,
    onFactorClinicaChange,
    factorLaboratorio,
    onFactorLaboratorioChange,
    factorEcografia,
    onFactorEcografiaChange,
    factorProcedimientos,
    onFactorProcedimientosChange,
    factorRayosX,
    onFactorRayosXChange,
    factorTomografia,
    onFactorTomografiaChange,
    factorPatologia,
    onFactorPatologiaChange,
    factorMedicinaFisica,
    onFactorMedicinaFisicaChange,
    factorResonancia,
    onFactorResonanciaChange,
    factorHonorariosMedicos,
    onFactorHonorariosMedicosChange,
    factorMedicinas,
    onFactorMedicinasChange,
    factorEquiposOxigeno,
    onFactorEquiposOxigenoChange,
    factorBancoSangre,
    onFactorBancoSangreChange,
    factorMamografia,
    onFactorMamografiaChange,
    factorDensitometria,
    onFactorDensitometriaChange,
    factorPsicoprofilaxis,
    onFactorPsicoprofilaxisChange,
    factorOtrosServicios,
    onFactorOtrosServiciosChange,

    factorMedicamentosComerciales,
    onFactorMedicamentosComercialesChange,
    factorMedicamentosGenericos,
    onFactorMedicamentosGenericosChange,
    factorMaterialMedico,
    onFactorMaterialMedicoChange,

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

  const iafaOptions: SelectOption[] = [
    {
      value: "0",
      label: iafasLoading ? "Cargando IAFAS…" : "Selecciona una IAFAS",
      disabled: true,
    },
    ...iafas.map((x) => ({ value: String(x.id), label: toIafaLabel(x) })),
  ];

  const tarifaBaseDisabled = mode === "edit" && Boolean(selected?.tarifa_base);

  const estadoDisabled = Boolean(selected?.tarifa_base) || tarifaBase;

  const normalizeBlur = React.useCallback((v: string, set: (x: string) => void) => {
    const t = v.trim();
    const n = Number(t);
    if (!Number.isFinite(n)) {
      set("1.00");
      return;
    }
    set(Math.max(1, n).toFixed(2));
  }, []);

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea un tarifario." : "Modifica campos y guarda cambios."}
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
                onChange={(v) => {
                  if (estadoDisabled) return;
                  onEstadoChange(v as RecordStatus);
                }}
                options={estadoOptions}
                ariaLabel="Estado"
                buttonClassName={["w-full", estadoDisabled ? "pointer-events-none opacity-60" : ""].join(" ")}
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Descripción del tarifario</label>
          <input
            value={descripcionTarifa}
            onChange={(e) => onDescripcionTarifaChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">IAFAS</label>
          <div className="mt-1">
            <SelectMenu
              value={String(iafaId)}
              onChange={(v) => onIafaIdChange(Number(v))}
              options={iafaOptions}
              ariaLabel="IAFAS"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            />
          </div>
          <div className="mt-1 text-xs text-(--color-text-secondary)">
            Obligatorio salvo si la descripción es <span className="font-semibold">Tarifario base</span>.
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Fecha de creación</label>

          {isTouchUi ? (
            <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
              <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center opacity-90">
                <span className={fechaCreacion ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                  {fechaCreacion ? formatDateForDisplay(fechaCreacion) : "dd/mm/aaaa"}
                </span>
              </div>

              <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

              <input type="date" value={fechaCreacion} className="absolute inset-0 h-10 w-full opacity-0" aria-label="Fecha de creación" />
            </div>
          ) : (
            <input
              type="date"
              value={fechaCreacion}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none"
            />
          )}
        </div>

        <Section title="Factores de servicios">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FactorInput label="Factor clínica" value={factorClinica} onChange={onFactorClinicaChange} onBlur={() => normalizeBlur(factorClinica, onFactorClinicaChange)} />
            <FactorInput label="Factor laboratorio" value={factorLaboratorio} onChange={onFactorLaboratorioChange} onBlur={() => normalizeBlur(factorLaboratorio, onFactorLaboratorioChange)} />
            <FactorInput label="Factor ecografía" value={factorEcografia} onChange={onFactorEcografiaChange} onBlur={() => normalizeBlur(factorEcografia, onFactorEcografiaChange)} />
            <FactorInput label="Factor procedimientos" value={factorProcedimientos} onChange={onFactorProcedimientosChange} onBlur={() => normalizeBlur(factorProcedimientos, onFactorProcedimientosChange)} />
            <FactorInput label="Factor rayos X" value={factorRayosX} onChange={onFactorRayosXChange} onBlur={() => normalizeBlur(factorRayosX, onFactorRayosXChange)} />
            <FactorInput label="Factor tomografía" value={factorTomografia} onChange={onFactorTomografiaChange} onBlur={() => normalizeBlur(factorTomografia, onFactorTomografiaChange)} />
            <FactorInput label="Factor patología" value={factorPatologia} onChange={onFactorPatologiaChange} onBlur={() => normalizeBlur(factorPatologia, onFactorPatologiaChange)} />
            <FactorInput label="Factor medicina física" value={factorMedicinaFisica} onChange={onFactorMedicinaFisicaChange} onBlur={() => normalizeBlur(factorMedicinaFisica, onFactorMedicinaFisicaChange)} />
            <FactorInput label="Factor resonancia" value={factorResonancia} onChange={onFactorResonanciaChange} onBlur={() => normalizeBlur(factorResonancia, onFactorResonanciaChange)} />
            <FactorInput label="Factor honorarios médicos" value={factorHonorariosMedicos} onChange={onFactorHonorariosMedicosChange} onBlur={() => normalizeBlur(factorHonorariosMedicos, onFactorHonorariosMedicosChange)} />
            <FactorInput label="Factor medicinas" value={factorMedicinas} onChange={onFactorMedicinasChange} onBlur={() => normalizeBlur(factorMedicinas, onFactorMedicinasChange)} />
            <FactorInput label="Factor equipos oxígeno" value={factorEquiposOxigeno} onChange={onFactorEquiposOxigenoChange} onBlur={() => normalizeBlur(factorEquiposOxigeno, onFactorEquiposOxigenoChange)} />
            <FactorInput label="Factor banco sangre" value={factorBancoSangre} onChange={onFactorBancoSangreChange} onBlur={() => normalizeBlur(factorBancoSangre, onFactorBancoSangreChange)} />
            <FactorInput label="Factor mamografía" value={factorMamografia} onChange={onFactorMamografiaChange} onBlur={() => normalizeBlur(factorMamografia, onFactorMamografiaChange)} />
            <FactorInput label="Factor densitometría" value={factorDensitometria} onChange={onFactorDensitometriaChange} onBlur={() => normalizeBlur(factorDensitometria, onFactorDensitometriaChange)} />
            <FactorInput label="Factor psicoprofilaxis" value={factorPsicoprofilaxis} onChange={onFactorPsicoprofilaxisChange} onBlur={() => normalizeBlur(factorPsicoprofilaxis, onFactorPsicoprofilaxisChange)} />
            <FactorInput label="Factor otros servicios" value={factorOtrosServicios} onChange={onFactorOtrosServiciosChange} onBlur={() => normalizeBlur(factorOtrosServicios, onFactorOtrosServiciosChange)} />
          </div>
        </Section>

        <Section title="Factores de farmacia">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FactorInput
              label="Factor medicamentos comerciales"
              value={factorMedicamentosComerciales}
              onChange={onFactorMedicamentosComercialesChange}
              onBlur={() => normalizeBlur(factorMedicamentosComerciales, onFactorMedicamentosComercialesChange)}
            />
            <FactorInput
              label="Factor medicamentos genéricos"
              value={factorMedicamentosGenericos}
              onChange={onFactorMedicamentosGenericosChange}
              onBlur={() => normalizeBlur(factorMedicamentosGenericos, onFactorMedicamentosGenericosChange)}
            />
            <FactorInput
              label="Factor material médico"
              value={factorMaterialMedico}
              onChange={onFactorMaterialMedicoChange}
              onBlur={() => normalizeBlur(factorMaterialMedico, onFactorMaterialMedicoChange)}
            />
          </div>
        </Section>

        {!iafaIsParticular ? (
          <label className="flex items-center gap-2 text-sm text-(--color-text-primary) select-none">
            <input
              type="checkbox"
              checked={requiereAcreditacion}
              onChange={(e) => onRequiereAcreditacionChange(e.target.checked)}
              className="h-4 w-4 rounded border border-(--border-color-default) accent-(--color-primary)"
            />
            Requiere acreditación
          </label>
        ) : (
          <div className="text-xs text-(--color-text-secondary)">
            IAFAS tipo <span className="font-semibold">Particular</span>: “Requiere acreditación” no aplica.
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-(--color-text-primary) select-none">
          <input
            type="checkbox"
            checked={tarifaBase}
            disabled={tarifaBaseDisabled}
            onChange={(e) => onTarifaBaseChange(e.target.checked)}
            className="h-4 w-4 rounded border border-(--border-color-default) accent-(--color-primary)"
          />
          Tarifario base
        </label>
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
