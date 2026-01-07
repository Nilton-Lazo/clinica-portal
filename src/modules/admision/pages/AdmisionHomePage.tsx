import * as React from "react";
import { useNavigate } from "react-router-dom";
import { clientContext } from "../../../shared/telemetry/clientContext";
import { navigationService } from "../../../shared/telemetry/navigation.service";
import { ADMISION_HUB } from "../services/admisionHub.registry";
import AdmisionHubCard from "../components/AdmisionHubCard";
import AdmisionActionsPanel from "../components/AdmisionActionsPanel";

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

export default function AdmisionHomePage() {
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();

  const [selectedId, setSelectedId] = React.useState(ADMISION_HUB[0].id);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const selected = React.useMemo(
    () => ADMISION_HUB.find((x) => x.id === selectedId) ?? ADMISION_HUB[0],
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
      <div className="mx-auto w-full max-w-[1600px] h-full px-4 py-4">
        <div className="hidden lg:grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(420px,520px)] h-full">
          <div className="grid grid-rows-4 gap-6 h-full min-h-0">
            {ADMISION_HUB.slice(0, 4).map((item) => (
              <AdmisionHubCard
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </div>

          <div className="grid grid-rows-4 gap-6 h-full min-h-0">
            {ADMISION_HUB.slice(4, 8).map((item) => (
              <AdmisionHubCard
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </div>

          <AdmisionActionsPanel
            item={selected}
            onEnter={() => go(selected.to, `Admision:${selected.id}`)}
            onAction={(to, label) => go(to, `Admision:${selected.id}:${label}`)}
          />
        </div>

        <div
          className={[
            "lg:hidden",
            "grid grid-cols-1 sm:grid-cols-2 gap-4",
            sheetOpen ? "pb-[calc(60vh+24px)]" : "pb-4",
          ].join(" ")}
        >
          {ADMISION_HUB.map((item) => (
            <AdmisionHubCard
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
      </div>

      <AdmisionActionsPanel
        mode="sheet"
        isOpen={sheetOpen && !isLgUp}
        onClose={() => setSheetOpen(false)}
        item={selected}
        onEnter={() => go(selected.to, `Admision:${selected.id}`)}
        onAction={(to, label) => go(to, `Admision:${selected.id}:${label}`)}
      />
    </div>
  );
}
