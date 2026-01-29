import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import NoticeBanner from "../components/NoticeBanner";
import PacienteSummaryBar from "../components/PacienteSummaryBar";
import { HistoriaClinicaWizardProvider } from "../hooks/HistoriaClinicaWizardProvider";
import { useHistoriaClinicaWizard } from "../hooks/useHistoriaClinicaWizard";

function TabLink(props: { to: string; label: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }) {
  const { to, label, onClick } = props;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "h-10 rounded-xl border px-4 text-sm font-medium inline-flex items-center",
          "bg-(--color-surface) transition-colors",
          isActive
            ? "border-(--color-primary) text-(--color-primary)"
            : "border-(--border-color-default) text-(--color-text-secondary) hover:text-(--color-text-primary)",
        ].join(" ")
      }
      end
    >
      {label}
    </NavLink>
  );
}

function InnerLayout() {
  const vm = useHistoriaClinicaWizard();
  const navigate = useNavigate();
  const location = useLocation();
  const { pacienteId } = useParams();

  const isAcreditacion = location.pathname.endsWith("/acreditacion");
  const showSave = !isAcreditacion;

  React.useEffect(() => {
    if (!isAcreditacion) return;

    if (vm.canGoAcreditacion) return;

    vm.setNotice({ type: "error", text: "No puedes ingresar a Acreditación si no guardas los cambios de Datos generales y Datos adicionales." });
    navigate("../datos-generales", { replace: true });
  }, [isAcreditacion, navigate, vm]);

  React.useEffect(() => {
    if (pacienteId) return;

    if (vm.pacienteId === null) return;

    navigate(`/admision/historia-clinica/${vm.pacienteId}/editar/datos-generales`, { replace: true });
  }, [navigate, pacienteId, vm.pacienteId]);

  const onAcreditacionClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (vm.canGoAcreditacion) return;
      e.preventDefault();
      vm.setNotice({ type: "error", text: "Primero guarda los cambios (Datos generales y Datos adicionales) para habilitar Acreditación." });
    },
    [vm]
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={() => navigate("/admision/historia-clinica")}>Volver a historias</SecondaryButton>

        <div className="flex flex-wrap items-center gap-2">
          <TabLink to="datos-generales" label="Datos generales" />
          <TabLink to="datos-adicionales" label="Datos adicionales" />
          <TabLink to="acreditacion" label="Acreditación" onClick={onAcreditacionClick} />
        </div>

        <div className="ml-auto">
          {showSave ? (
            <PrimaryButton disabled={!vm.ready || vm.saving} onClick={() => void vm.save()}>
              Guardar
            </PrimaryButton>
          ) : null}
        </div>
      </div>

      <PacienteSummaryBar
        hc={vm.summary.hc}
        nombre={vm.summary.nombre}
        nr={vm.summary.nr}
        edad={vm.summary.edad}
        sexo={vm.summary.sexo}
        estado={vm.summary.estado}
      />

      <NoticeBanner notice={vm.notice} onClose={() => vm.setNotice(null)} />

      <div className="erp-form">
        <Outlet />
        </div>
    </div>
  );
}

export default function HistoriaClinicaWizardLayout() {
  const { pacienteId } = useParams();
  const parsedId = pacienteId ? Number(pacienteId) : null;

  const mode = parsedId ? "edit" : "create";

  return (
    <HistoriaClinicaWizardProvider mode={mode} pacienteId={parsedId && Number.isFinite(parsedId) ? parsedId : null}>
      <InnerLayout />
    </HistoriaClinicaWizardProvider>
  );
}
