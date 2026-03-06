import * as React from "react";
import { useNavigate } from "react-router-dom";
import { clientContext } from "../../../shared/telemetry/clientContext";
import { navigationService } from "../../../shared/telemetry/navigation.service";
import { ADMISION_HUB } from "../services/admisionHub.registry";
import AdmisionHubCard from "../components/AdmisionHubCard";
import AdmisionActionsPanel from "../components/AdmisionActionsPanel";

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
    if (isLgUp) setSheetOpen(false);
    else setSheetOpen(true);
  }, [selectedId, isLgUp]);

  const go = React.useCallback(
    (to: string, label?: string) => {
      const screen = label ? `Admision:${label}` : `Admision:${to}`;
      clientContext.set({ path: to, screen });
      void navigationService.track({ path: to, screen }).catch(() => {});
      navigate(to);
    },
    [navigate]
  );

  const half = Math.ceil(ADMISION_HUB.length / 2);
  const col1 = ADMISION_HUB.slice(0, half);
  const col2 = ADMISION_HUB.slice(half);

  return (
    <div className="w-full h-full">
      <div className="hidden lg:grid gap-4 lg:grid-cols-[1fr_1fr_minmax(320px,400px)] lg:grid-rows-1 h-full">
        <div className="grid gap-3 auto-rows-fr">
          {col1.map((item) => (
            <AdmisionHubCard
              key={item.id}
              item={item}
              active={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        <div className="grid gap-3 auto-rows-fr">
          {col2.map((item) => (
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
          onEnter={() => go(selected.to)}
          onAction={(to, label) => go(to, label)}
        />
      </div>

      <div
        className={[
          "lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3",
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

      <AdmisionActionsPanel
        mode="sheet"
        isOpen={sheetOpen && !isLgUp}
        onClose={() => setSheetOpen(false)}
        item={selected}
        onEnter={() => go(selected.to)}
        onAction={(to, label) => go(to, label)}
      />
    </div>
  );
}
