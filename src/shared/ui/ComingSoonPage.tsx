import { useLocation, useNavigate } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";
import { NAV_ITEMS } from "../../app/layout/nav.registry";
import { useRouteMeta } from "../../app/router/useRouteMeta";

function getModuleInfo(pathname: string): { label: string; description: string } {
  const segment = "/" + (pathname.split("/")[1] ?? "");
  const item = NAV_ITEMS.find((n) => n.to === segment);
  return {
    label: item?.label ?? "Módulo",
    description: "Este módulo está siendo desarrollado y estará disponible próximamente.",
  };
}

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = useRouteMeta();
  const { label, description } = getModuleInfo(location.pathname);
  const title = meta?.title ?? label;
  const bodyText = meta?.subtitle ?? description;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <div className="h-20 w-20 rounded-2xl bg-(--color-primary)/10 flex items-center justify-center">
          <Construction
            className="h-10 w-10 text-(--color-primary)"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--color-primary)/10 text-(--color-primary) text-xs font-semibold uppercase tracking-wide">
            Próximamente
          </div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">{title}</h1>
          <p className="text-sm text-(--color-text-secondary) leading-relaxed">{bodyText}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className={[
            "inline-flex items-center gap-2",
            "h-10 px-5 rounded-lg",
            "bg-(--color-primary) text-(--color-text-inverse)",
            "text-sm font-semibold",
            "hover:bg-(--color-primary-hover) active:bg-(--color-primary-active)",
            "transition-colors",
          ].join(" ")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>
      </div>
    </div>
  );
}
