import * as React from "react";
import { useNavigate } from "react-router-dom";
import { clientContext } from "../../../shared/telemetry/clientContext";
import { navigationService } from "../../../shared/telemetry/navigation.service";
import { FACTURACION_HUB } from "../services/facturacionHub.registry";
import FacturacionHubCard from "../components/FacturacionHubCard";
import FacturacionActionsPanel from "../components/FacturacionActionsPanel";

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );
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
    if (isLgUp) setSheetOpen(false);
    else setSheetOpen(true);
  }, [selectedId, isLgUp]);

  const go = React.useCallback(
    (to: string) => {
      clientContext.set({ path: to, screen: `Facturacion:${to}` });
      void navigationService.track({ path: to, screen: `Facturacion:${to}` }).catch(() => undefined);
      navigate(to);
    },
    [navigate]
  );

  const half = Math.ceil(FACTURACION_HUB.length / 2);
  const col1 = FACTURACION_HUB.slice(0, half);
  const col2 = FACTURACION_HUB.slice(half);

  return (
    <div className="w-full h-full">
      <div className="hidden lg:grid gap-4 lg:grid-cols-[1fr_1fr_minmax(320px,400px)] lg:grid-rows-1 h-full">
        <div className="grid gap-3 auto-rows-fr">
          {col1.map((item) => (
            <FacturacionHubCard
              key={item.id}
              item={item}
              active={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        <div className="grid gap-3 auto-rows-fr">
          {col2.map((item) => (
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
          onEnter={() => go(selected.to)}
          onAction={(to) => go(to)}
        />
      </div>

      <div
        className={[
          "lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3",
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

      <FacturacionActionsPanel
        mode="sheet"
        isOpen={sheetOpen && !isLgUp}
        onClose={() => setSheetOpen(false)}
        item={selected}
        onEnter={() => go(selected.to)}
        onAction={(to) => go(to)}
      />
    </div>
  );
}
