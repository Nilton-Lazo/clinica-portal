import * as React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

const base =
  "h-10 rounded-xl px-4 text-sm font-medium transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

export function PrimaryButton(props: Props) {
  const { children, onClick, disabled, type = "button", className } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        disabled
          ? "bg-(--color-panel-context) text-(--color-text-secondary) cursor-not-allowed hover:scale-100 active:scale-100"
          : "bg-(--color-primary) text-(--color-text-inverse)",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SecondaryButton(props: Props) {
  const { children, onClick, disabled, type = "button", className } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        "bg-(--color-panel-context) text-(--color-base-primary)",
        disabled ? "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function DangerButton(props: Props) {
  const { children, onClick, disabled, type = "button", className } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        disabled
          ? "bg-(--color-panel-context) text-(--color-text-secondary) cursor-not-allowed hover:scale-100 active:scale-100"
          : "bg-(--color-danger) text-(--color-text-inverse)",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
