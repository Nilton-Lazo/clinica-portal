import * as React from "react";
import { useNavigate } from "react-router-dom";
import { clientContext } from "../../../shared/telemetry/clientContext";
import { navigationService } from "../../../shared/telemetry/navigation.service";
import { FACTURACION_HUB } from "../services/facturacionHub.registry";
import FacturacionHubCard from "../components/FacturacionHubCard";
import FacturacionActionsPanel from "../components/FacturacionActionsPanel";

function useIsLgUp() {
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

export default function FacturacionHomePage() {
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();

  const [selectedId, setSelectedId] = React.useState(FACTURACION_HUB[0].id);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const selected = React.useMemo(
    () => FACTURACION_HUB.find((x) => x.id === selectedId) ?? FACTURACION_HUB[0],
    [selectedId]
  );

  React.useEffect(() => {
    if (isLgUp) {
      setSheetOpen(false);
      return;
    }
    setSheetOpen(true);
  }, [selectedId, isLgUp]);

  const go = React.useCallback(
    (to: string, screen: string) => {
      clientContext.set({ path: to, screen });
      void navigationService.track({ path: to, screen }).catch(() => {});
      navigate(to);
    },
    [navigate]
  );

  return (
    <div className="w-full h-full">
      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(420px,520px)] h-full">
        <div className="grid grid-rows-4 gap-6 h-full min-h-0">
          {FACTURACION_HUB.slice(0, 4).map((item) => (
            <FacturacionHubCard
              key={item.id}
              item={item}
              active={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        <div className="grid grid-rows-4 gap-6 h-full min-h-0">
          {FACTURACION_HUB.slice(4, 8).map((item) => (
            <FacturacionHubCard
              key={item.id}
              item={item}
              active={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        <FacturacionActionsPanel
          item={selected}
          onEnter={() => go(selected.to, `Facturacion:${selected.id}`)}
          onAction={(to, label) => go(to, `Facturacion:${selected.id}:${label}`)}
        />
      </div>

      {/* ================= MOBILE / TABLET ================= */}
      <div
        className={[
          "lg:hidden",
          "grid grid-cols-1 sm:grid-cols-2 gap-4",
          sheetOpen ? "pb-[calc(60vh+24px)]" : "pb-4",
        ].join(" ")}
      >
        {FACTURACION_HUB.map((item) => (
          <FacturacionHubCard
            key={item.id}
            item={item}
            active={item.id === selectedId}
            onSelect={() => {
              setSelectedId(item.id);
              setSheetOpen(true);
            }}
          />
        ))}
      </div>

      {/* Sheet de acciones (mobile) */}
      <FacturacionActionsPanel
        mode="sheet"
        isOpen={sheetOpen && !isLgUp}
        onClose={() => setSheetOpen(false)}
        item={selected}
        onEnter={() => go(selected.to, `Facturacion:${selected.id}`)}
        onAction={(to, label) => go(to, `Facturacion:${selected.id}:${label}`)}
      />
    </div>
  );
}
