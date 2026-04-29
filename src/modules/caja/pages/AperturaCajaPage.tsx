import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Building2,
  Calendar,
  Clock,
  Lock,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../shared/ui/buttons";
import { useAuth } from "../../../shared/auth/useAuth";
import { useToast } from "../../../shared/feedback";
import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useServerDateTime } from "../hooks/useServerDateTime";
import { listUsuariosActivos } from "../services/usuariosSistema.service";
import {
  createAperturaCaja,
  getNextCodigoApertura,
  getResumenApertura,
  type CajaAperturaResumen,
} from "../services/aperturaCaja.service";
import { listAreaJefatura } from "../../ficheros/parametros/caja/services/areaJefatura.service";
import type { CajaAperturaTipo } from "../types/aperturaCaja.types";
import type { AuthUser } from "../../login/types/auth.types";

function displayNameUser(u: AuthUser): string {
  const full = [u.nombres, u.apellido_paterno, u.apellido_materno ?? ""].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.name && u.name.trim()) return u.name.trim();
  return u.username;
}

function formatPen(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(String(value).replace(",", ".")) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
}

const control = "h-10 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm";
const labelSm = "text-[11px] font-semibold uppercase tracking-wide text-(--color-text-secondary)";

export default function AperturaCajaPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { formatted, error: dtError } = useServerDateTime(30000);

  const [tab, setTab] = React.useState<CajaAperturaTipo>("NORMAL");
  const [codigo, setCodigo] = React.useState("");
  const [userEntregaId, setUserEntregaId] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  const [monto, setMonto] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [userOptions, setUserOptions] = React.useState<SelectOption[]>([]);
  const [areaOptions, setAreaOptions] = React.useState<SelectOption[]>([]);
  const [resumen, setResumen] = React.useState<CajaAperturaResumen | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadCatalogos = React.useCallback(async () => {
    setLoadError(null);
    try {
      const [usuarios, areasRes, res] = await Promise.all([
        listUsuariosActivos(),
        listAreaJefatura({ page: 1, per_page: 100, status: "ACTIVO" }),
        getResumenApertura(),
      ]);
      setUserOptions([
        { value: "", label: "Selecciona personal", disabled: true },
        ...usuarios.map((u) => ({ value: String(u.id), label: `${u.label} (${u.username})` })),
      ]);
      setAreaOptions([
        { value: "", label: "Selecciona área o jefatura", disabled: true },
        ...areasRes.data.map((a) => ({ value: String(a.id), label: `${a.codigo} — ${a.descripcion}` })),
      ]);
      setResumen(res);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "No se pudieron cargar usuarios, áreas y estado actual de caja."));
    }
  }, []);

  React.useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  const refreshCodigo = React.useCallback(async () => {
    try {
      const c = await getNextCodigoApertura();
      setCodigo(c);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo obtener el siguiente código de apertura de caja."));
    }
  }, [toast]);

  React.useEffect(() => {
    void refreshCodigo();
  }, [refreshCodigo, tab]);

  const recepcionaLabel = user ? `${displayNameUser(user)} (Tú)` : "—";
  const usuarioCaja = user?.username ?? "—";
  const cajaYaAperturadaParaTipo =
    tab === "NORMAL" ? Boolean(resumen?.cajas_activas?.normal) : Boolean(resumen?.cajas_activas?.chica);
  const alertaCajaAbierta =
    tab === "NORMAL"
      ? "Ya tienes una caja normal aperturada. Debes cerrarla antes de abrir otra."
      : "Ya tienes una caja chica aperturada. Debes cerrarla antes de abrir otra.";

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
        toast.error("La sesión no es válida para aperturar caja. Vuelve a iniciar sesión.");
        return;
      }
      const uid = parseInt(userEntregaId, 10);
      const aid = parseInt(areaId, 10);
      const m = String(monto).trim().replace(",", ".");
      const montoNum = Number(m);
      if (!userEntregaId || Number.isNaN(uid)) {
        toast.error("Selecciona el personal que entrega el monto inicial de caja.");
        return;
      }
      if (!areaId || Number.isNaN(aid)) {
        toast.error("Selecciona el área o jefatura responsable de la apertura.");
        return;
      }
      if (m === "" || Number.isNaN(montoNum) || montoNum < 0) {
        toast.error("Ingresa un monto de inicio válido, igual o mayor que cero.");
        return;
      }
      if (cajaYaAperturadaParaTipo) {
        toast.error(alertaCajaAbierta);
        return;
      }
      setSaving(true);
      try {
        await createAperturaCaja({
          tipo: tab,
          user_entrega_id: uid,
          area_jefatura_id: aid,
          monto_inicio: montoNum,
          observaciones: observaciones.trim() || null,
        });
        toast.success(`Caja ${tab === "NORMAL" ? "normal" : "chica"} aperturada correctamente.`);
        navigate("/caja", { replace: true });
      } catch (err) {
        toast.error(getApiErrorMessage(err, "No se pudo registrar la apertura de caja."));
      } finally {
        setSaving(false);
      }
    },
    [alertaCajaAbierta, areaId, cajaYaAperturadaParaTipo, monto, navigate, observaciones, tab, toast, user, userEntregaId]
  );

  const selectBtn =
    "h-10 w-full border-(--border-color-default) bg-(--color-surface) px-3 hover:scale-100 active:scale-100";

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-2">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex rounded-md bg-(--color-background) p-0.5">
            <button
              type="button"
              onClick={() => setTab("NORMAL")}
              className={[
                "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                tab === "NORMAL"
                  ? "bg-(--color-surface) text-(--color-primary) shadow-sm"
                  : "text-(--color-text-secondary) hover:text-(--color-text-primary)",
              ].join(" ")}
            >
              Caja Normal
            </button>
            <button
              type="button"
              onClick={() => setTab("CHICA")}
              className={[
                "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                tab === "CHICA"
                  ? "bg-(--color-surface) text-(--color-primary) shadow-sm"
                  : "text-(--color-text-secondary) hover:text-(--color-text-primary)",
              ].join(" ")}
            >
              Caja Chica
            </button>
          </div>
          <h1 className="mt-3 text-lg font-bold text-(--color-primary)">Apertura de Caja</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-(--color-text-secondary)">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0 text-(--color-primary)" aria-hidden />
              <span className="capitalize">{formatted.fecha}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-(--color-primary)" aria-hidden />
              <span>{formatted.hora}</span>
            </span>
            {dtError ? <span className="text-red-600">{dtError}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-secondary)">
            Código de apertura
          </span>
          <span className="rounded-md bg-(--color-primary)/10 px-4 py-2 text-sm font-semibold tracking-wide text-(--color-primary) tabular-nums">
            {codigo || "—"}
          </span>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}
      {cajaYaAperturadaParaTipo ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {alertaCajaAbierta}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-4 shadow-sm sm:p-4"
      >
        <div className="grid grid-cols-1 gap-4 overflow-visible lg:grid-cols-3 lg:items-stretch lg:gap-2">
          <div className="flex min-h-22 gap-3 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-3">
            <div className="flex w-8 shrink-0 justify-center pt-1">
              <User className="h-4 w-4 text-(--color-text-secondary)" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 overflow-visible">
              <div className={labelSm}>Personal que entrega</div>
              <div className="mt-2 w-full min-w-0 overflow-visible">
                <SelectMenu
                  ariaLabel="Personal que entrega"
                  value={userEntregaId}
                  onChange={setUserEntregaId}
                  options={userOptions}
                  buttonClassName={selectBtn}
                />
              </div>
            </div>
          </div>

          <div className="flex min-h-22 gap-3 rounded-md border border-(--color-border) bg-(--color-primary)/5 p-3">
            <div className="flex w-8 shrink-0 justify-center pt-1">
              <ShieldCheck className="h-4 w-4 text-(--color-primary)" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className={labelSm}>Personal que recepciona</div>
              <div className="mt-2 flex min-h-10 items-center text-sm font-semibold text-(--color-text-primary)">
                {recepcionaLabel}
              </div>
            </div>
          </div>

          <div className="flex min-h-22 gap-3 overflow-visible rounded-md border border-(--color-border) bg-(--color-surface) p-3">
            <div className="flex w-8 shrink-0 justify-center pt-1">
              <Building2 className="h-4 w-4 text-(--color-text-secondary)" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 overflow-visible">
              <div className={labelSm}>Área / Jefatura que entrega</div>
              <div className="mt-2 w-full min-w-0 overflow-visible">
                <SelectMenu
                  ariaLabel="Área o jefatura"
                  value={areaId}
                  onChange={setAreaId}
                  options={areaOptions}
                  buttonClassName={selectBtn}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-(--color-border) bg-(--color-background) p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-(--color-primary)/10">
              <Banknote className="h-5 w-5 text-(--color-primary)" aria-hidden />
            </div>
            <span className="text-sm font-bold text-(--color-text-primary)">Información financiera</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-(--color-text-secondary)">Moneda</span>
              <div className={`${control} flex items-center text-sm font-medium`}>Soles (PEN)</div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-(--color-text-secondary)">Monto de inicio</span>
              <div className={`${control} flex items-center gap-2`}>
                <span className="shrink-0 text-xs font-semibold text-(--color-text-secondary)">S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={monto}
                  onChange={(ev) => setMonto(ev.target.value)}
                  placeholder="0.00"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tabular-nums text-(--color-text-primary) outline-none placeholder:text-(--color-text-secondary)/40"
                />
              </div>
              <p className="text-xs leading-snug text-(--color-text-secondary)">
                Ingrese el total contado físicamente en bóveda.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-(--color-text-secondary)">Usuario-Caja</span>
              <div className={`${control} flex items-center bg-(--color-background) text-sm font-semibold tabular-nums`}>
                <span className="truncate">{usuarioCaja}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label className="text-xs font-medium text-(--color-text-secondary)" htmlFor="caja-obs">
            Observaciones adicionales
          </label>
          <textarea
            id="caja-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            placeholder="Detalle cualquier discrepancia o nota relevante aquí..."
            className="w-full resize-y rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text-primary) outline-none focus:border-(--color-primary)"
          />
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-end gap-3 border-t border-(--color-border) pt-3">
          <SecondaryButton type="button" onClick={() => navigate("/caja")}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving || Boolean(loadError) || cajaYaAperturadaParaTipo}>
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden />
              {saving ? "Guardando…" : "Guardar y abrir caja"}
            </span>
          </PrimaryButton>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-2">
        <div className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-100">
            <Clock className="h-5 w-5 text-sky-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-(--color-text-secondary)">Último cierre</div>
            <div className="truncate text-sm font-bold tabular-nums text-(--color-text-primary)">
              {formatPen(resumen?.ultimo_cierre_monto ?? null)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-100">
            <Wallet className="h-5 w-5 text-orange-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-(--color-text-secondary)">Fondo de emergencia</div>
            <div className="truncate text-sm font-bold tabular-nums text-(--color-text-primary)">
              {formatPen(resumen?.fondo_emergencia_monto ?? null)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-100">
            <Users className="h-5 w-5 text-violet-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-(--color-text-secondary)">Operadores activos</div>
            <div className="truncate text-sm font-bold text-(--color-text-primary)">
              Caja <></>{resumen?.operadores_activos_text ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
