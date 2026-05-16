import * as React from "react";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";
import { toastService } from "../../../../shared/notifications";
import {
  createCuentaBitacoraNota,
  createPacienteBitacoraNota,
  listCuentaBitacoraNotas,
  listPacienteBitacoraNotas,
  type CuentaBitacoraNotaItem,
} from "../services/cuentaBitacora.service";
import { toUserFriendlyMessage } from "../utils/userFriendlyError";
import { useRealtimeModuleRefresh } from "../../../../shared/realtime/useRealtimeModuleRefresh";

type Variant = "drawer" | "fullscreen";

type Props = {
  open: boolean;
  variant: Variant;
  nroCuenta: string;
  pacienteId: number | null;
  contextLine: string;
  currentUserId: number;
  onClose: () => void;
};

const MAX_LEN = 4000;

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { fecha: "—", hora: "—" };
  const fecha = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return { fecha, hora };
};

export default function CuentaBitacoraDrawer(props: Props) {
  const { open, variant, nroCuenta, pacienteId, contextLine, currentUserId, onClose } = props;
  const [items, setItems] = React.useState<CuentaBitacoraNotaItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const listTopRef = React.useRef<HTMLDivElement | null>(null);
  const requestIdRef = React.useRef(0);

  const useCuenta = Boolean(nroCuenta.trim());
  const canUseBitacora = useCuenta || (pacienteId != null && pacienteId > 0);

  const load = React.useCallback(async () => {
    const rid = ++requestIdRef.current;
    setLoading(true);
    try {
      let data: CuentaBitacoraNotaItem[];
      if (nroCuenta.trim()) {
        const res = await listCuentaBitacoraNotas(nroCuenta.trim(), { per_page: 100, page: 1 });
        data = res.data;
      } else if (pacienteId != null && pacienteId > 0) {
        const res = await listPacienteBitacoraNotas(pacienteId, { per_page: 100, page: 1 });
        data = res.data;
      } else {
        data = [];
      }
      if (requestIdRef.current !== rid) return;
      setItems(data);
    } catch (e) {
      if (requestIdRef.current !== rid) return;
      setItems([]);
      toastService.showError(toUserFriendlyMessage(e, "No se pudieron cargar las notas de bitácora."));
    } finally {
      if (requestIdRef.current === rid) setLoading(false);
    }
  }, [nroCuenta, pacienteId]);

  React.useEffect(() => {
    if (!open) return;
    setDraft("");
    void load();
  }, [open, load]);

  useRealtimeModuleRefresh({
    module: "admision",
    entities: ["cuenta_bitacora_nota"],
    onEvent: (event) => {
      if (!open) return;
      if (event.scope && nroCuenta.trim() && event.scope !== nroCuenta.trim()) return;
      void load();
    },
  });

  const handleSave = React.useCallback(async () => {
    const text = draft.trim();
    if (!text) {
      toastService.showError("Escribe una nota antes de guardarla en la bitácora.");
      return;
    }
    if (!canUseBitacora) {
      toastService.showError("Selecciona una cuenta o paciente para registrar la nota de bitácora.");
      return;
    }
    setSaving(true);
    try {
      let created: CuentaBitacoraNotaItem;
      if (nroCuenta.trim()) {
        created = await createCuentaBitacoraNota(nroCuenta.trim(), text);
      } else if (pacienteId != null && pacienteId > 0) {
        created = await createPacienteBitacoraNota(pacienteId, text);
      } else {
        return;
      }
      setItems((prev) => [created, ...prev]);
      setDraft("");
      toastService.showInfo("Nota registrada.");
      requestAnimationFrame(() => {
        listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      toastService.showError(toUserFriendlyMessage(e, "No se pudo guardar la nota de bitácora."));
    } finally {
      setSaving(false);
    }
  }, [nroCuenta, pacienteId, draft, canUseBitacora]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0 rounded border border-(--border-color-default) bg-(--color-surface) p-3">
        <label htmlFor="cuenta-bitacora-draft" className="text-xs font-medium text-(--color-text-secondary)">
          Nueva anotación
        </label>
        <textarea
          id="cuenta-bitacora-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          rows={4}
          maxLength={MAX_LEN}
          placeholder="Escriba aquí…"
          disabled={saving || !canUseBitacora}
          className="mt-1.5 w-full resize-y rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-primary) focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-(--color-text-secondary)">
          <span>{draft.length}/{MAX_LEN}</span>
          <PrimaryButton
            type="button"
            disabled={saving || !draft.trim() || !canUseBitacora}
            onClick={() => void handleSave()}
          >
            {saving ? "Guardando…" : "Guardar nota"}
          </PrimaryButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded border border-(--border-color-default) bg-(--color-surface)">
        <div ref={listTopRef} className="sticky top-0 z-1 border-b border-(--border-color-default) bg-(--color-surface) px-3 py-2">
          <h3 className="text-xs font-semibold text-(--color-text-primary)">Historial</h3>
        </div>
        {loading ? (
          <p className="px-3 py-6 text-center text-sm text-(--color-text-secondary)">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-(--color-text-secondary)">Aún no hay anotaciones.</p>
        ) : (
          <ul className="divide-y divide-(--border-color-default)">
            {items.map((n) => {
              const { fecha, hora } = fmtDateTime(n.created_at);
              const mine = n.usuario.id === currentUserId;
              const autor = (n.usuario.nombre || n.usuario.username || "Usuario").trim();
              return (
                <li
                  key={n.id}
                  className={`px-3 py-3 ${mine ? "border-l-[3px] border-l-(--color-primary) bg-(--color-primary)/10" : ""}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold text-(--color-text-primary)">{autor}</span>
                    <span className="text-[10px] tabular-nums text-(--color-text-secondary)">
                      {fecha} · {hora}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-(--color-text-primary)">{n.contenido}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  const header = (
    <div className="flex shrink-0 flex-col gap-3 border-b border-(--border-color-default) pb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="cuenta-bitacora-title" className="text-base font-semibold text-(--color-text-primary)">
            Bitácora
          </h2>
          {contextLine ? <p className="mt-0.5 text-xs text-(--color-text-secondary)">{contextLine}</p> : null}
        </div>
        <SecondaryButton type="button" onClick={onClose}>
          Cerrar
        </SecondaryButton>
      </div>
    </div>
  );

  const shell = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {header}
      {body}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div
        className="fixed inset-0 z-40 flex items-stretch justify-center bg-black/40"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cuenta-bitacora-title"
      >
        <div
          className="flex h-full w-full max-w-2xl flex-col bg-(--color-app-bg) p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {shell}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/40"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cuenta-bitacora-title"
    >
      <div
        className="flex h-full w-full max-w-[440px] flex-col bg-(--color-app-bg) p-4 shadow-xl sm:max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        {shell}
      </div>
    </div>
  );
}
