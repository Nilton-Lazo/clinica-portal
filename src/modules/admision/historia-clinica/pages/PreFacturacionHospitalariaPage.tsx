import * as React from "react";
import { useNavigate } from "react-router-dom";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import PacientePicker from "../../citas/agenda/components/PacientePicker";
import type { PacienteListItem } from "../types/historiaClinica.types";
import { fetchPacientePresupuesto } from "../../citas/presupuestos/services/presupuestoPaciente.service";
import type { PresupuestoPacienteDetalle } from "../../citas/presupuestos/types/presupuesto.types";
import { toastService } from "../../../../shared/notifications";
import { listCirugias } from "../../../ficheros/services/cirugias.service";

function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLgUp;
}

export default function PreFacturacionHospitalariaPage() {
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [loadingPaciente, setLoadingPaciente] = React.useState(false);
  const [loadingCirugias, setLoadingCirugias] = React.useState(false);
  const [detalle, setDetalle] = React.useState<PresupuestoPacienteDetalle | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const [cirugiaId, setCirugiaId] = React.useState("");
  const [tipo, setTipo] = React.useState("HOSPITALIZACION");
  const [cirugiaOptions, setCirugiaOptions] = React.useState<SelectOption[]>([]);

  const inputReadOnly =
    "mt-1 h-10 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) lg:mt-0.5 lg:h-8";

  const planOptions: SelectOption[] = React.useMemo(() => {
    if (!detalle?.planes.length) return [];
    return detalle.planes.map((p) => ({
      value: String(p.pacientePlanId),
      label: p.label,
    }));
  }, [detalle?.planes]);

  const iafaDisplay = React.useMemo(() => {
    if (!detalle || !selectedPlanId) return "";
    const id = Number(selectedPlanId);
    const plan = detalle.planes.find((p) => p.pacientePlanId === id);
    return plan?.iafaLabel?.trim() || "—";
  }, [detalle, selectedPlanId]);

  const onPacientePicked = React.useCallback(async (p: PacienteListItem) => {
    setLoadingPaciente(true);
    setSelectedPlanId("");
    try {
      const d = await fetchPacientePresupuesto(p.id);
      setDetalle(d);
      const first = d.planes[0];
      setSelectedPlanId(first ? String(first.pacientePlanId) : "");
      if (!d.planes.length) {
        toastService.showInfo("Este paciente no tiene planes activos registrados.");
      }
    } catch {
      setDetalle(null);
      setSelectedPlanId("");
      toastService.showError("No se pudieron cargar los datos del paciente.");
    } finally {
      setLoadingPaciente(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingCirugias(true);
    void listCirugias({ page: 1, per_page: 200, status: "ACTIVO" })
      .then((res) => {
        if (cancelled) return;
        const options = res.data.map((item) => ({
          value: String(item.id),
          label: `${item.codigo} · ${item.descripcion}`,
        }));
        setCirugiaOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setCirugiaOptions([]);
          toastService.showError("No se pudo cargar la lista de cirugías activas.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCirugias(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tipoOptions: SelectOption[] = React.useMemo(
    () => [
      { value: "HOSPITALIZACION", label: "Hospitalización" },
      { value: "CENTRO_QUIRURGICO", label: "Centro Quirúrgico" },
      { value: "UCI_UCIN", label: "UCI/UCIN" },
    ],
    []
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:gap-2">
      <div className="min-w-0">
        <div className="flex h-full min-h-0 w-full flex-col rounded border border-(--border-color-default) bg-(--color-surface) p-4 lg:p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <h2 className="text-sm font-semibold text-(--color-text-primary)">Pre-Facturacion Hospitalaria</h2>
              <p className="mt-0.5 text-xs leading-snug text-(--color-text-secondary)">
                Selecciona un paciente para autocompletar historia, referencia, plan e IAFAS.
              </p>
            </div>
            <PrimaryButton
              type="button"
              className="shrink-0"
              disabled={loadingPaciente}
              onClick={() => setPickerOpen(true)}
            >
              {detalle ? "Cambiar paciente" : "Buscar paciente"}
            </PrimaryButton>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 lg:mt-2 lg:gap-2">
            <div>
              <label className="text-xs text-(--color-text-secondary)">Nombres y apellidos</label>
              <input value={detalle?.nombre_completo ?? ""} readOnly className={inputReadOnly} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° Historia</label>
                <input value={detalle?.hc ?? ""} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">N° Referencia</label>
                <input value={detalle?.nr ?? ""} readOnly className={inputReadOnly} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Plan</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={selectedPlanId}
                    onChange={(v) => setSelectedPlanId(v ?? "")}
                    options={planOptions}
                    ariaLabel="Plan"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                    disabled={!detalle || planOptions.length === 0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">IAFAS</label>
                <input value={iafaDisplay} readOnly className={inputReadOnly} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-2">
              <div>
                <label className="text-xs text-(--color-text-secondary)">Cirugía</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={cirugiaId}
                    onChange={(v) => setCirugiaId(v ?? "")}
                    options={cirugiaOptions}
                    ariaLabel="Cirugía"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                    disabled={loadingCirugias || cirugiaOptions.length === 0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-(--color-text-secondary)">Tipo</label>
                <div className="mt-1 lg:mt-0.5">
                  <SelectMenu
                    value={tipo}
                    onChange={(v) => setTipo(v ?? "HOSPITALIZACION")}
                    options={tipoOptions}
                    ariaLabel="Tipo"
                    buttonClassName="h-10 w-full lg:h-8"
                    menuClassName="min-w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PacientePicker
        open={pickerOpen}
        variant={isLgUp ? "drawer" : "fullscreen"}
        onClose={() => setPickerOpen(false)}
        onPicked={onPacientePicked}
        title="Seleccionar paciente"
        showRegisterButton
        onRegister={() => navigate("/admision/historia-clinica/nuevo/datos-generales")}
        onOpenHistoriaClinica={() => {
          setPickerOpen(false);
          navigate("/admision/historia-clinica");
        }}
      />
    </div>
  );
}
