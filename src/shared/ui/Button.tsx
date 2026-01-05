import * as React from "react";

type ButtonVariant = "primary";
type ButtonSize = "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex w-full items-center justify-center rounded-md font-semibold transition-colors focus:outline-none";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]",
  };

  const sizes: Record<ButtonSize, string> = {
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        base,
        variants[variant],
        sizes[size],
        "disabled:opacity-60 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {loading ? "Ingresando..." : children}
    </button>
  );
}
