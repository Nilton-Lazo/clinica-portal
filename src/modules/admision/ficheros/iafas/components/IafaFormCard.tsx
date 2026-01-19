import * as React from "react";
import type { RecordStatus, TipoIafaLookup } from "../../types/iafas.types";
import { StatusBadge } from "../../components/StatusBadge";
import type { Mode } from "../hooks/useIafas";
import { Calendar } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

function useIsTouchUi(): boolean {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = () => setIsTouch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}

function formatDateForDisplay(iso: string): string {
  const t = (iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

function toTipoLabel(x: TipoIafaLookup): string {
  const c = (x.codigo ?? "").trim();
  const d = (x.descripcion ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${x.id}`;
}

export default function IafaFormCard(props: {
  mode: Mode;
  selected: { codigo: string; estado: RecordStatus } | null;

  codigo: string;
  saving: boolean;

  tipoIafaId: number;
  onTipoIafaIdChange: (v: number) => void;
  tipos: TipoIafaLookup[];
  tiposLoading: boolean;

  razonSocial: string;
  onRazonSocialChange: (v: string) => void;

  descripcionCorta: string;
  onDescripcionCortaChange: (v: string) => void;

  ruc: string;
  onRucChange: (v: string) => void;

  direccion: string;
  onDireccionChange: (v: string) => void;

  representanteLegal: string;
  onRepresentanteLegalChange: (v: string) => void;

  telefono: string;
  onTelefonoChange: (v: string) => void;

  paginaWeb: string;
  onPaginaWebChange: (v: string) => void;

  fechaInicio: string;
  onFechaInicioChange: (v: string) => void;

  fechaFin: string;
  onFechaFinChange: (v: string) => void;

  estado: RecordStatus;
  onEstadoChange: (v: RecordStatus) => void;

  isValid: boolean;
  isDirty: boolean;
  canDeactivate: boolean;

  onSave: () => void;
  onCancel: () => void;
  onDeactivate: () => void;
}) {
  const {
    mode,
    selected,
    codigo,
    saving,

    tipoIafaId,
    onTipoIafaIdChange,
    tipos,
    tiposLoading,

    razonSocial,
    onRazonSocialChange,
    descripcionCorta,
    onDescripcionCortaChange,
    ruc,
    onRucChange,

    direccion,
    onDireccionChange,
    representanteLegal,
    onRepresentanteLegalChange,
    telefono,
    onTelefonoChange,
    paginaWeb,
    onPaginaWebChange,

    fechaInicio,
    onFechaInicioChange,
    fechaFin,
    onFechaFinChange,

    estado,
    onEstadoChange,

    isValid,
    isDirty,
    canDeactivate,
    onSave,
    onCancel,
    onDeactivate,
  } = props;

  const isTouchUi = useIsTouchUi();
  const saveEnabled = isValid && isDirty && !saving;

  const estadoOptions: SelectOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "SUSPENDIDO", label: "Suspendido" },
  ];

  const tipoOptions: SelectOption[] = [
    {
      value: "0",
      label: tiposLoading ? "Cargando tipos…" : "Selecciona un tipo de IAFAS",
      disabled: true,
    },
    ...tipos.map((x) => ({ value: String(x.id), label: toTipoLabel(x) })),
  ];

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {mode === "new" ? "Nuevo registro" : `Editando: ${codigo ?? ""}`}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {mode === "new" ? "Crea una IAFAS." : "Modifica campos y guarda cambios."}
          </div>
        </div>

        {selected ? <StatusBadge status={selected.estado} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Código</label>
            <input
              value={codigo}
              readOnly
              placeholder={mode === "new" ? "Generando" : ""}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Estado</label>
            <div className="mt-1">
              <SelectMenu
                value={estado}
                onChange={(v) => onEstadoChange(v as RecordStatus)}
                options={estadoOptions}
                ariaLabel="Estado"
                buttonClassName="w-full"
                menuClassName="min-w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Tipo de IAFAS</label>
          <div className="mt-1">
            <SelectMenu
              value={String(tipoIafaId)}
              onChange={(v) => onTipoIafaIdChange(Number(v))}
              options={tipoOptions}
              ariaLabel="Tipo de IAFAS"
              buttonClassName="w-full"
              menuClassName="min-w-full max-w-[calc(100vw-2rem)]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Razón social</label>
          <input
            value={razonSocial}
            onChange={(e) => onRazonSocialChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Descripción corta</label>
            <input
              value={descripcionCorta}
              onChange={(e) => onDescripcionCortaChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">RUC</label>
            <input
              value={ruc}
              inputMode="numeric"
              onChange={(e) => onRucChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Dirección</label>
          <input
            value={direccion}
            onChange={(e) => onDireccionChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Representante legal</label>
            <input
              value={representanteLegal}
              onChange={(e) => onRepresentanteLegalChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => onTelefonoChange(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-(--color-text-primary)">Página web</label>
          <input
            type="url"
            value={paginaWeb}
            onChange={(e) => onPaginaWebChange(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--color-text-primary)">Inicio de cobertura</label>

            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={fechaInicio ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {fechaInicio ? formatDateForDisplay(fechaInicio) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => onFechaInicioChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Inicio de cobertura"
                />
              </div>
            ) : (
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            )}
          </div>

          <div>
            <label className="text-sm text-(--color-text-primary)">Fin de cobertura</label>

            {isTouchUi ? (
              <div className="relative mt-1 rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary)">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={fechaFin ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {fechaFin ? formatDateForDisplay(fechaFin) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => onFechaFinChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Fin de cobertura"
                />
              </div>
            ) : (
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton disabled={!saveEnabled} onClick={onSave}>
          {saving ? "Guardando..." : mode === "new" ? "Crear" : "Guardar cambios"}
        </PrimaryButton>

        <SecondaryButton disabled={saving} onClick={onCancel}>
          Cancelar
        </SecondaryButton>

        <DangerButton disabled={!canDeactivate || saving} onClick={onDeactivate}>
          Desactivar
        </DangerButton>
      </div>
    </div>
  );
}
