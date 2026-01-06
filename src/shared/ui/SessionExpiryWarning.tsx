type Props = {
  open: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
};

function format(remainingSeconds: number) {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SessionExpiryWarning({
  open,
  remainingSeconds,
  onContinue,
  onLogout,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-(--color-overlay) p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-(--color-surface) shadow-xl border border-(--color-border)">
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-(--color-text-primary)">
            Sesión por expirar
          </h3>

          <p className="mt-2 text-sm sm:text-sm text-(--color-text-secondary)">
            Por inactividad, tu sesión expirará en{" "}
            <span className="font-semibold text-(--color-text-primary)">
              {format(remainingSeconds)}
            </span>
            .
          </p>

          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Para continuar trabajando, confirma para mantener la sesión activa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-4 sm:p-5 pt-0">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-1/2 rounded-md border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-text-primary) hover:bg-(--color-background)"
          >
            Cerrar sesión
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-1/2 rounded-md bg-(--color-primary) px-4 py-2 text-sm font-semibold text-(--color-text-inverse) hover:bg-(--color-primary-hover)"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
