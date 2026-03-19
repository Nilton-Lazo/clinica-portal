import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { RegistroEmergencia } from "../../types/registroEmergencia.types";
import { User, X } from "lucide-react";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import { primeRegistroEmergenciaCache } from "../../services/registroEmergencia.service";

function stripCodigoPrefix(value: string): string {
  if (!value || typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  const match = trimmed.match(/^\d+\s*·\s*(.+)$/);
  return match ? match[1].trim() : trimmed;
}

function formatFecha(value: string): string {
  if (!value) return "—";
  try {
    const v = String(value ?? "").trim();
    const datePart = v.split("T")[0];
    const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const local = new Date(y, mo - 1, d);
      return local.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    const d = new Date(v);
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

  const tipoEmergencia = selected
    ? selected.tipo_emergencia ?? (selected as unknown as { tipoEmergencia?: RegistroEmergencia["tipoEmergencia"] }).tipoEmergencia ?? null
    : null;
  const diagnosticoIngreso =
    selected?.diagnostico_ingreso ?? (selected as unknown as { diagnosticoIngreso?: string | null }).diagnosticoIngreso ?? null;

  const handleAtender = React.useCallback(() => {
    if (selected?.id) navigate(`/emergencia/atencion/${selected.id}`, { state: { registro: selected } });
  }, [navigate, selected]);

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
        <div className="p-4 pb-0 shrink-0">
          <div className="flex items-center gap-3 rounded border border-(--border-color-default) bg-(--color-panel-context/20) p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-(--color-text-inverse)">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-(--color-text-primary) flex flex-wrap items-center gap-1">
                <span>{selected.apellidos_nombres}</span>
                <span className="text-(--color-text-secondary) font-normal">
                  {(() => {
                    const edad = selected.edad_paciente;
                    const sexo = selected.sexo ? selected.sexo.charAt(0).toUpperCase() : null;
                    if (edad != null && sexo) return `(${edad} años - ${sexo})`;
                    if (edad != null) return `(${edad} años)`;
                    if (sexo) return `(${sexo})`;
                    return "";
                  })()}
                </span>
              </div>
              <div className="text-xs text-(--color-text-secondary)">
                N° Historia: {selected.numero_hc}
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden app-scrollbar-thin lg:overscroll-contain lg:touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="rounded border border-(--border-color-default) p-3">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-(--color-text-secondary) mb-2">
                <span>Datos del registro</span>
                <button
                  type="button"
                  className="text-(--color-primary) hover:underline capitalize font-semibold tracking-normal"
                  onClick={() => {
                    primeRegistroEmergenciaCache(selected);
                    navigate(`/emergencia/registro/${selected.id}/editar`, { state: { registro: selected } });
                  }}
                >
                  Editar
                </button>
              </div>
              <dl className="space-y-2.5">
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Tipo de Emergencia</dt>
                  <dd className="text-sm font-medium text-(--color-text-primary)">
                    {tipoEmergencia?.descripcion ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Diagnóstico de Ingreso</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {(diagnosticoIngreso ?? "").trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Tipo Cliente</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {tipoClienteSolo || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Fecha y Hora</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {formatFecha(selected.fecha ?? "")} {selected.hora ? ` a las ${selected.hora.slice(0, 5)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Médico Emergencia</dt>
                  <dd className="text-sm text-(--color-text-primary)">
                    {stripCodigoPrefix(selected.medico_emergencia ?? "") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-text-secondary)">Número de cuenta</dt>
                  <dd className="text-sm tabular-nums text-(--color-text-primary)">
                    {selected.numero_cuenta ?? "—"}
                  </dd>
                </div>
                
                {selected.soat_poliza?.trim() && (
                  <div>
                    <dt className="text-xs text-(--color-text-secondary)">Póliza SOAT</dt>
                    <dd className="text-sm text-(--color-text-primary)">
                      {selected.soat_poliza.trim()}
                    </dd>
                  </div>
                )}
                
                {selected.soat_placa?.trim() && (
                  <div>
                    <dt className="text-xs text-(--color-text-secondary)">Placa Vehículo</dt>
                    <dd className="text-sm text-(--color-text-primary)">
                      {selected.soat_placa.trim()}
                    </dd>
                  </div>
                )}
              </dl>
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
