import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";
import { listPacientes } from "../../../historia-clinica/services/historiaClinica.service";
import type { PacienteListItem, PaginatedResponse, PacientesQuery } from "../../../historia-clinica/types/historiaClinica.types";
import HistoriaClinicaTable from "../../../historia-clinica/components/HistoriaClinicaTable";
import HistoriaClinicaMobileList from "../../../historia-clinica/components/HistoriaClinicaMobileList";

const statusOptions: SelectOption[] = [
  { value: "", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
  { value: "SUSPENDIDO", label: "Suspendidos" },
];

export default function AgendaPacienteSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(25);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<PacienteListItem | null>(null);
  const [data, setData] = React.useState<PaginatedResponse<PacienteListItem>>({
    data: [],
    meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
  });

  React.useEffect(() => {
    setLoading(true);
    const query: PacientesQuery = { q, page, per_page: perPage };
    if (status && ["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(status)) {
      query.status = status as PacientesQuery["status"];
    }
    listPacientes(query)
      .then((res) => {
        setData(res);
      })
      .finally(() => setLoading(false));
  }, [q, status, page, perPage]);

  const onSelect = React.useCallback((x: PacienteListItem) => {
    setSelected(x);
  }, []);

  const onConfirm = React.useCallback(() => {
    if (!selected) return;
    const params = new URLSearchParams();
    const fecha = searchParams.get("fecha");
    const esp = searchParams.get("especialidad_id");
    const med = searchParams.get("medico_id");
    const hora = searchParams.get("hora");

    let draftFecha = "";
    let draftEsp = "";
    let draftMed = "";
    let draftHora = "";
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem("admision:agendaMedicaDraft");
      if (raw) {
        try {
          const d = JSON.parse(raw) as {
            selectedDateStr?: string;
            especialidadId?: number | null;
            medicoId?: number | null;
            hora?: string;
          };
          draftFecha = d.selectedDateStr ?? "";
          draftEsp = d.especialidadId != null ? String(d.especialidadId) : "";
          draftMed = d.medicoId != null ? String(d.medicoId) : "";
          draftHora = d.hora ?? "";
        } catch {
          // ignore
        }
      }
    }

    const finalFecha = fecha || draftFecha;
    const finalEsp = esp || draftEsp;
    const finalMed = med || draftMed;
    const finalHora = hora || draftHora;

    if (finalFecha) params.set("fecha", finalFecha);
    if (finalEsp) params.set("especialidad_id", finalEsp);
    if (finalMed) params.set("medico_id", finalMed);
    if (finalHora) params.set("hora", finalHora);
    params.set("paciente_id", String(selected.id));

    navigate(`/admision/citas/agenda/nueva?${params.toString()}`);
  }, [selected, searchParams, navigate]);

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4">
      <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-(--color-text-primary)">Seleccionar paciente</div>
            <div className="text-xs text-(--color-text-secondary)">
              Busca y selecciona el paciente para la cita.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => navigate("/admision/historia-clinica/nuevo/datos-generales")}>
              Registrar paciente
            </SecondaryButton>
            <PrimaryButton onClick={onConfirm} disabled={!selected}>
              Seleccionar paciente
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="text-sm text-(--color-text-primary)">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="N° documento, N° historia o nombre"
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <div className="mt-1">
              <SelectMenu
                value={status}
                onChange={(v) => setStatus(v ?? "")}
                options={statusOptions}
                ariaLabel="Estado"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <HistoriaClinicaTable
          data={data}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
          page={page}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
        />
        <HistoriaClinicaMobileList
          data={data}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
          page={page}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
        />
      </div>
    </div>
  );
}
