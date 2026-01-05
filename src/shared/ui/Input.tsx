import * as React from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  type = "text",
  error,
  disabled,
  ...props
}: Props) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = React.useState(false);

  const inputType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-(--color-text-primary)">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          type={inputType}
          disabled={disabled}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm",
            "bg-(--color-surface)",
            "text-(--color-text-primary)",
            "border-(--color-border)",
            "focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20",
            "focus:border-(--color-primary)",
            "disabled:bg-slate-100 disabled:cursor-not-allowed",
            error ? "border-(--color-danger)" : "",
            isPassword ? "pr-10" : "",
          ].join(" ")}
        />

        {isPassword && (
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="
                absolute right-3 top-1/2 -translate-y-1/2
                text-(--color-text-secondary)
                hover:text-(--color-primary)
                focus:outline-none
                "
                aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
            >
                {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
                ) : (
                <EyeIcon className="h-5 w-5" />
                )}
            </button>
            )}
      </div>

      {error && (
        <p className="text-xs text-(--color-danger) mt-1">{error}</p>
      )}
    </div>
  );
}
