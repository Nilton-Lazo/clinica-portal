import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { RegistroEmergencia } from "../../types/registroEmergencia.types";
import { ClipboardList, ShieldCheck, User, X } from "lucide-react";
import { PrimaryButton } from "../../../../shared/ui/buttons";

function stripCodigoPrefix(value: string): string {
  if (!value || typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  const match = trimmed.match(/^\d+\s*·\s*(.+)$/);
  return match ? match[1].trim() : trimmed;
}

function formatFecha(value: string): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return value;
  }
}

export default function RegistroEmergenciaDetailCard(props: {
  selected: RegistroEmergencia | null;
  onClose: () => void;
}) {
  const { selected, onClose } = props;
  const navigate = useNavigate();

  const handleAtender = React.useCallback(() => {
    if (selected?.id) navigate(`/emergencia/atencion/${selected.id}`, { state: { registro: selected } });
  }, [navigate, selected?.id]);

  if (!selected) {
    return (
      <div className="flex min-h-full w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            Detalles del Paciente
          </div>
        </div>
        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-sm text-(--color-text-secondary)">
          Seleccione un registro de la tabla para ver el detalle.
        </div>
      </div>
    );
  }

  const tipoClienteSolo = stripCodigoPrefix(selected.tipo_cliente ?? "");

  return (
    <div className="flex w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex h-12 shrink-0 items-center border-b border-(--border-color-default) bg-(--color-panel-context/30) px-4">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            Detalles del Paciente
          </div>
          <button
            type="button"
            className="shrink-0 rounded p-1.5 text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text-primary)"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div
          className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden app-scrollbar-thin lg:overscroll-contain lg:touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="flex items-center gap-3 rounded border border-(--border-color-default) bg-(--color-panel-context/20) p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-(--color-text-inverse)">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-(--color-text-primary)">
                {selected.apellidos_nombres}
              </div>
              <div className="text-xs text-(--color-text-secondary)">
                N° Historia: {selected.numero_hc}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="rounded border border-(--border-color-default) p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-(--color-text-secondary) mb-2">
                Datos del registro
              </div>
              <dl className="space-y-2.5">
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Tipo Cliente</dt>
                  <dd className="text-sm font-medium text-(--color-text-primary)">
                    {tipoClienteSolo || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Fecha</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {formatFecha(selected.fecha ?? "")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Médico Emergencia</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {stripCodigoPrefix(selected.medico_emergencia ?? "") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Médico Especialista</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {selected.medico_especialista?.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Número de cuenta</dt>
                  <dd className="text-sm tabular-nums text-(--color-text-primary)">
                    {selected.numero_cuenta ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Estado</dt>
                  <dd>
                    {selected.estado?.trim().toUpperCase() === "ATENDIDO" ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-(--color-success) px-3 py-1 text-xs font-semibold text-(--color-success)">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Atendido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-(--color-primary) px-3 py-1 text-xs font-semibold text-(--color-primary)">
                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                        Registrado
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-(--border-color-default) bg-(--color-panel-context/30) p-4">
          <PrimaryButton onClick={handleAtender} className="w-full rounded">
            Atender paciente
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
