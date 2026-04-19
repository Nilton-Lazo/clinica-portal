import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "./nav.registry";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../../shared/auth/useAuth";
import SessionExpiryController from "../../shared/ui/SessionExpiryController";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

const PIN_KEY = "erp:ui:sidebar:pinned";
const TRANSITION_MS = 220;
const TRANSITION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export default function AppShell() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHistoriaList =
    location.pathname === "/admision/historia-clinica" ||
    location.pathname === "/admision/historia-clinica/";
  const isHistoriaClinicaWizard = location.pathname.includes("/admision/historia-clinica/");
  const isProgramacionMedica = location.pathname.includes("/admision/citas/programacion");
  const isAgendaCitas = location.pathname.includes("/admision/citas/agenda");
  const isPresupuestosCitas = location.pathname.includes("/admision/citas/presupuestos");
  const isTarifario = location.pathname.startsWith("/facturacion/tarifario");
  const isEmergenciaRegistro = location.pathname.startsWith("/emergencia/registro");
  const isEmergenciaAtencion = location.pathname.startsWith("/emergencia/atencion");
  const isCajaScroll =
    location.pathname.startsWith("/caja/apertura") ||
    location.pathname.startsWith("/caja/emision-comprobantes") ||
    location.pathname.startsWith("/caja/reporte-ingresos");
  const isScrollableContent =
    (isHistoriaClinicaWizard && !isHistoriaList) ||
    isProgramacionMedica ||
    isAgendaCitas ||
    isPresupuestosCitas ||
    isTarifario ||
    isEmergenciaRegistro ||
    isEmergenciaAtencion ||
    isCajaScroll;

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hoverExpanded, setHoverExpanded] = React.useState(false);

  const [pinned, setPinned] = React.useState(
    () => localStorage.getItem(PIN_KEY) === "1"
  );

  React.useEffect(() => {
    if (!isDesktop) setHoverExpanded(false);
  }, [isDesktop]);

  React.useEffect(() => {
    if (!isDesktop) setDrawerOpen(false);
  }, [location.pathname, isDesktop]);

  const expanded = isDesktop && canHover ? hoverExpanded : false;

  const sidebarW =
    pinned || expanded
      ? "var(--layout-sidebar-expanded)"
      : "var(--layout-sidebar-collapsed)";

  const onLogout = React.useCallback(async () => {
    await authService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  const onPinToggle = React.useCallback(() => {
    setPinned((v) => {
      const next = !v;
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-(--color-background)">
      {isDesktop && (
        <div
          className="fixed inset-y-0 left-0 z-40 shrink-0"
          style={{
            width: sidebarW,
            transition: `width ${TRANSITION_MS}ms ${TRANSITION_EASE}`,
          }}
          onMouseEnter={() => {
            if (!pinned && canHover) setHoverExpanded(true);
          }}
          onMouseLeave={() => {
            if (!pinned && canHover) setHoverExpanded(false);
          }}
        >
          <Sidebar
            items={NAV_ITEMS}
            expanded={expanded}
            pinned={pinned}
            onPinToggle={onPinToggle}
            variant="desktop"
          />
        </div>
      )}

      <div
        className="h-full min-w-0 flex flex-col"
        style={{
          paddingLeft: isDesktop ? sidebarW : "0px",
          transition: `padding-left ${TRANSITION_MS}ms ${TRANSITION_EASE}`,
        }}
      >
        <AppHeader onOpenMenu={() => setDrawerOpen(true)} onLogout={onLogout} />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto min-w-0">
          <div
            className={[
              "mx-auto flex w-full flex-col p-4 lg:p-2",
              isScrollableContent
                ? ""
                : "min-h-0 flex-1 overflow-y-auto lg:overflow-hidden",
            ].join(" ")}
          >
            <Outlet />
          </div>
        </main>

        <SessionExpiryController />
      </div>

      {!isDesktop && (
        <div
          className={[
            "fixed inset-0 z-50",
            "transition-opacity duration-200",
            drawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
          aria-hidden={!drawerOpen}
        >
          <div
            className="absolute inset-0 bg-(--color-overlay)"
            onClick={() => setDrawerOpen(false)}
          />

          <div
            className={[
              "absolute inset-y-0 left-0 w-[86vw] max-w-57.5 shadow-xl",
              "transition-transform duration-200 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <Sidebar
              items={NAV_ITEMS}
              expanded
              pinned
              onPinToggle={() => {}}
              onNavigateMobile={() => setDrawerOpen(false)}
              variant="drawer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
