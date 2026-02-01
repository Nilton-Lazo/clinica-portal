import * as React from "react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

export default function AgendaMedicaFormDialog(props: {
  open: boolean;
  onClose: () => void;
  onBuscarPaciente: () => void;
  onAgendar: () => void;
  fecha: string;
  hora: string;
  orden: number | null;
  onHoraChange: (v: string) => void;
  availableHoras: string[];
  canAddAdicional: boolean;
  canAddExtra: boolean;
  onAddAdicional: () => void;
  onAddExtra: () => void;
  medicoLabel: string;
  servicioLabel: string;
  consultorioLabel: string;
  pacienteLabel: string;
  hc: string;
  nr: string;
  sexo: string;
  edad: string;
  titular: string;
  iafaOptions: SelectOption[];
  iafaId: string;
  onIafaChange: (v: string) => void;
  motivo: string;
  onMotivoChange: (v: string) => void;
  observacion: string;
  onObservacionChange: (v: string) => void;
  cuenta: string;
  onCuentaChange: (v: string) => void;
  autorizacion: string;
  onAutorizacionChange: (v: string) => void;
  disableAgendar: boolean;
}) {
  const {
    open,
    onClose,
    onBuscarPaciente,
    onAgendar,
    fecha,
    hora,
    orden,
    onHoraChange,
    availableHoras,
    canAddAdicional,
    canAddExtra,
    onAddAdicional,
    onAddExtra,
    medicoLabel,
    servicioLabel,
    consultorioLabel,
    pacienteLabel,
    hc,
    nr,
    sexo,
    edad,
    titular,
    iafaOptions,
    iafaId,
    onIafaChange,
    motivo,
    onMotivoChange,
    observacion,
    onObservacionChange,
    cuenta,
    onCuentaChange,
    autorizacion,
    onAutorizacionChange,
    disableAgendar,
  } = props;

  const motivoOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "Reevaluacion", label: "Reevaluación" },
      { value: "Consulta externa", label: "Consulta externa" },
      { value: "Interconsulta", label: "Interconsulta" },
      { value: "Urgencia", label: "Urgencia" },
      { value: "Otros", label: "Otros" },
    ],
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-overlay) px-4 py-6">
      <div className="w-full max-w-5xl rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-(--color-text-primary)">Generar cita</div>
            <div className="text-xs text-(--color-text-secondary)">
              Completa los datos para agendar la cita.
            </div>
          </div>
          <button
            type="button"
            className="h-8 w-8 rounded-full border border-(--border-color-default) bg-(--color-surface) text-(--color-text-primary)"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-(--color-text-primary)">Fecha</label>
                <input
                  value={fecha}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">Hora</label>
                <div className="mt-1 flex gap-2">
                  <SelectMenu
                    value={hora}
                    onChange={(v) => onHoraChange(v ?? "")}
                    options={availableHoras.map((h) => ({ value: h, label: h }))}
                    ariaLabel="Hora"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                  <button
                    type="button"
                    className="h-10 px-3 rounded-xl text-sm font-medium bg-(--color-surface) border border-(--border-color-default) disabled:opacity-50"
                    disabled={!canAddAdicional}
                    onClick={onAddAdicional}
                  >
                    Adicional
                  </button>
                  <button
                    type="button"
                    className="h-10 px-3 rounded-xl text-sm font-medium bg-(--color-surface) border border-(--border-color-default) disabled:opacity-50"
                    disabled={!canAddExtra}
                    onClick={onAddExtra}
                  >
                    Extra
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-(--color-text-primary)">N° de orden</label>
                <input
                  value={orden ? String(orden) : ""}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">Consultorio</label>
                <input
                  value={consultorioLabel}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Médico</label>
              <input
                value={medicoLabel}
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Servicio</label>
              <input
                value={servicioLabel}
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-(--color-text-primary)">Cuenta</label>
                <input
                  value={cuenta}
                  onChange={(e) => onCuentaChange(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">IAFA</label>
                <div className="mt-1">
                  <SelectMenu
                    value={iafaId}
                    onChange={(v) => onIafaChange(v ?? "")}
                    options={iafaOptions}
                    ariaLabel="IAFA"
                    buttonClassName="w-full"
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Motivo de atención</label>
              <div className="mt-1">
                <SelectMenu
                  value={motivo}
                  onChange={(v) => onMotivoChange(v ?? "")}
                  options={motivoOptions}
                  ariaLabel="Motivo"
                  buttonClassName="w-full"
                  menuClassName="min-w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-(--color-text-primary)">Paciente</div>
              <button
                type="button"
                className="h-9 px-3 rounded-xl text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
                onClick={onBuscarPaciente}
              >
                Buscar historia clínica
              </button>
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Apellidos y nombres</label>
              <input
                value={pacienteLabel}
                readOnly
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm text-(--color-text-primary)">N° Historia</label>
                <input
                  value={hc}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">N° Referencia</label>
                <input
                  value={nr}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm text-(--color-text-primary)">Sexo</label>
                <input
                  value={sexo}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">Edad</label>
                <input
                  value={edad}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-(--color-text-primary)">Titular</label>
                <input
                  value={titular}
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">Observación</label>
              <textarea
                value={observacion}
                onChange={(e) => onObservacionChange(e.target.value)}
                className="mt-1 min-h-[96px] w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-(--color-text-primary)">N° Autorización SITEDS</label>
              <input
                value={autorizacion}
                onChange={(e) => onAutorizacionChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={onAgendar} disabled={disableAgendar}>
            Agendar cita
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
