import { NavLink } from "react-router-dom";
import { Pin, PinOff } from "lucide-react";
import type { NavItem, NavIconSpec } from "./nav.types";

import brandLogo from "../../assets/images/logo.webp";

type Props = {
  items: NavItem[];
  expanded: boolean;
  pinned: boolean;
  onPinToggle: () => void;
  onNavigateMobile?: () => void;
  variant: "desktop" | "drawer";
};

function RenderNavIcon({
  icon,
  sizeClass,
}: {
  icon: NavIconSpec;
  sizeClass: string;
}) {
  if (icon.kind === "image") {
    return (
      <img
        src={icon.src}
        alt={icon.alt}
        className={`${sizeClass} object-contain`}
        draggable={false}
      />
    );
  }

  const Icon = icon.icon;
  const strokeWidth = icon.strokeWidth ?? 1.75;

  return <Icon className={sizeClass} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export default function Sidebar({
  items,
  expanded,
  pinned,
  onPinToggle,
  onNavigateMobile,
  variant,
}: Props) {
  const showLabels = variant === "drawer" ? true : expanded || pinned;

  return (
    <aside className="sidebar-surface h-full bg-(--color-sidebar-bg) text-(--color-text-inverse) flex flex-col overflow-hidden">
      {/* Header / Marca */}
      <div className="h-(--layout-header-height) px-4 flex items-center">
        <NavLink
            to="/inicio"
            onClick={onNavigateMobile}
            className="w-full flex items-center justify-center"
            aria-label="Ir a inicio"
            >
            <div className={`flex items-center ${showLabels ? "gap-3" : ""}`}>
                <img
                src={brandLogo}
                alt="HeartCare"
                className="h-12 w-12 object-contain"
                draggable={false}
                />

                {showLabels && (
                <div className="leading-tight">
                    <div className="text-lg font-bold">HeartCare</div>
                    <div className="text-xs opacity-90">Medical Clinic</div>
                </div>
                )}
            </div>
        </NavLink>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden app-scrollbar py-3">
        <ul className="space-y-2 px-3">
          {items.map((item) => {
            const isDisabled = Boolean(item.disabled);

            const Row = ({ isActive }: { isActive: boolean }) => {
                const active = isActive && !isDisabled;

                const rowBase = [
                    "group relative",
                    "flex items-center gap-3",
                    showLabels ? "px-3" : "px-0 justify-center",
                    "py-2 rounded-xl",
                    "transition-all duration-200 ease-out",
                    "will-change-transform",
                    !showLabels ? "" : "min-w-0",
                ].join(" ");

                const rowHover =
                    isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : active
                        ? ""
                        : "cursor-pointer hover:bg-(--color-surface)/15 hover:translate-x-px";
                
                const iconHover = isDisabled || active ? "" : "group-hover:scale-[1.03]";

                const rowActive = active ? "bg-(--color-surface) text-(--color-text-primary)" : "";

                const iconWrapBase = [
                    "h-12 w-12 rounded-full",
                    "flex items-center justify-center",
                    "transition-[transform,background-color,box-shadow] duration-200 ease-out",
                    "will-change-transform",
                ].join(" ");                                   

                const iconWrapState = active
                ? "bg-(--color-surface)"
                : isDisabled
                    ? "bg-(--color-surface)/10"
                    : "bg-(--color-surface)/10 group-hover:bg-transparent group-hover:shadow-[inset_0_0_0_1px_var(--color-sidebar-ring)]";

                const iconColor = active ? "text-(--color-text-primary)" : "text-(--color-text-inverse)";

                const labelClass = [
                    "min-w-0 truncate",
                    "text-base",
                    "transition-all duration-200 ease-out",
                    active ? "font-medium text-(--color-text-primary)" : "font-normal text-(--color-text-inverse)",
                    isDisabled || active ? "" : "group-hover:font-medium group-hover:translate-x-px",
                  ].join(" ");

                return (
                    <div className={`${rowBase} ${rowHover} ${rowActive}`}>
                    <div className={`${iconWrapBase} ${iconWrapState} ${iconHover}`}>
                        <div className={iconColor}>
                        <RenderNavIcon icon={item.icon} sizeClass="h-6 w-6" />
                        </div>
                    </div>

                    {showLabels && <div className={labelClass}>{item.label}</div>}
                    </div>
                );
                };

            if (isDisabled) {
              return (
                <li key={item.id}>
                  <div>
                    <Row isActive={false} />
                  </div>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  onClick={onNavigateMobile}
                  className="block"
                >
                  {({ isActive }) => <Row isActive={isActive} />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {variant === "desktop" && (
        <div className="p-3">
          <button
            type="button"
            onClick={onPinToggle}
            className={[
              "w-full rounded-xl border border-(--color-surface)/20",
              "px-3 py-2 text-sm font-semibold",
              "hover:bg-(--color-surface)/10 transition-colors",
              "flex items-center justify-center gap-2",
              "overflow-hidden",
            ].join(" ")}
            aria-pressed={pinned}
            aria-label={pinned ? "Desfijar sidebar" : "Fijar sidebar"}
          >
            {pinned ? (
              <PinOff className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Pin className="h-5 w-5" strokeWidth={1.8} />
            )}
            {(expanded || pinned) && <span>{pinned ? "Fijado" : "Fijar"}</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
