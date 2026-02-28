import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ServicioPicker } from "./ServicioPicker";
import type { TarifaServicioBusqueda } from "../services/atencionCita.service";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../../../shared/ui/buttons";
import { ConfirmDialog } from "../../../../ficheros/components/ConfirmDialog";
import { EstadoFacturacionBadge } from "./EstadoFacturacionBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { getIgvPorcentaje } from "../services/atencionCita.service";
import { PRECISION_DECIMAL, formatDecimalDisplay } from "../../../../../shared/constants/decimalPrecision";
import type {
  AtencionDraft,
  AtencionServicioLineaDisplay,
} from "../types/atencionCita.types";

function calcularPrecios(
  precioBaseSinIgv: number,
  cantidad: number,
  descuentoPct: number,
  aumentoPct: number,
  igvPct: number
): { precioSinIgv: number; precioConIgv: number } {
  let subtotal = precioBaseSinIgv * Math.max(0, cantidad);
  if (descuentoPct > 0) subtotal *= 1 - descuentoPct / 100;
  if (aumentoPct > 0) subtotal *= 1 + aumentoPct / 100;
  const factor = 10 ** PRECISION_DECIMAL;
  const precioSinIgv = Math.round(subtotal * factor) / factor;
  const igv = precioSinIgv * (igvPct / 100);
  const precioConIgv = Math.round((precioSinIgv + igv) * factor) / factor;
  return { precioSinIgv, precioConIgv };
}

/** Código de categoría "Consultas Médicas": habilita copago fijo y deshabilita copago variable. */
const CATEGORIA_CONSULTAS_MEDICAS_CODIGO = "50";

const FACTOR_REDONDO = 10 ** 4;

/**
 * Parte que paga el paciente por una línea (con IGV), para monto a pagar.
 * La línea guarda precio_sin_igv y precio_con_igv como TOTAL de la línea (no unitario).
 * - Tarifa precio directo (Particular/Privado): paciente paga todo el importe con IGV.
 * - Categoría Consultas Médicas (50): paciente paga copago fijo (ya con IGV).
 * - Resto: paciente paga (100 - cop_var)% del importe sin IGV, convertido a con IGV.
 */
function pacientePagaConIgv(
  line: AtencionServicioLineaDisplay,
  igvPct: number,
  tarifaEsPrecioDirecto: boolean
): number {
  const importeSinIgv = (line.precio_sin_igv ?? 0) as number;
  const importeConIgv = (line.precio_con_igv ?? 0) as number;

  if (tarifaEsPrecioDirecto) {
    return Math.round(importeConIgv * FACTOR_REDONDO) / FACTOR_REDONDO;
  }
  const esCat50 = (line.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO;
  if (esCat50) {
    const copFijo = (line.cop_fijo ?? 0) as number;
    const cant = Math.max(1, Math.floor(Number(line.cantidad) || 1));
    return copFijo > 0 ? Math.round(copFijo * cant * FACTOR_REDONDO) / FACTOR_REDONDO : 0;
  }
  const copVar = (line.cop_var ?? 0) as number;
  const pacienteSinIgv = Math.round(importeSinIgv * (1 - copVar / 100) * FACTOR_REDONDO) / FACTOR_REDONDO;
  const pacienteConIgv = Math.round(pacienteSinIgv * (1 + igvPct / 100) * FACTOR_REDONDO) / FACTOR_REDONDO;
  return pacienteConIgv;
}

function getMedicoCodigo(medicoId: number | undefined, medicoCodigo: string | null | undefined, medicosOptions: SelectOption[]): string {
  if (medicoId != null) {
    const opt = medicosOptions.find((o) => o.value === String(medicoId));
    const label = opt?.label ?? "";
    const code = label.includes(" · ") ? label.split(" · ")[0]?.trim() : label.split(/\s+/)[0];
    if (code) return code;
  }
  const fallback = (medicoCodigo ?? "").trim().split(/[\s·]+/)[0];
  return fallback || "—";
}

/** S/. + número; bloque centrado en la celda (como tabla de reporte). */
function PrecioCell({ valor }: { valor: number }) {
  return (
    <div className="inline-flex items-baseline gap-0 text-xs">
      <span className="w-8 shrink-0 text-right tabular-nums">S/. </span>
      <span className="min-w-14 text-right tabular-nums">
        {formatDecimalDisplay(valor)}
      </span>
    </div>
  );
}

export type ServiciosSolicitadosSectionProps = {
  medicoTratanteId: number | null;
  medicoTratanteLabel: string;
  tarifaId: number | null;
  tarifaDescripcion: string | null;
  /** Si true, la tarifa usa precio directo (ej. Particular/Privado). */
  tarifaEsPrecioDirecto?: boolean;
  lineas: AtencionServicioLineaDisplay[];
  onLineasChange: (lineas: AtencionServicioLineaDisplay[]) => void;
  medicosOptions: SelectOption[];
  currentUsername: string;
  citaId: number;
  hasPendingDataChanges?: boolean;
  onActualizarDatos?: () => Promise<void>;
  pendingChangesMessage?: string;
  /** Notifica al padre el monto a pagar calculado (suma de lo que paga el paciente, con IGV). */
  onMontoAPagarChange?: (monto: number) => void;
  /** Copago variable por defecto para nuevos servicios (%). */
  copVarDefault?: number;
  onCopVarDefaultChange?: (value: number) => void;
  /** Devuelve el draft del formulario de atención para preservar al ir a Buscar servicios. */
  getAtencionDraft?: () => AtencionDraft | null;
  /** Callback al elegir servicios desde el panel (evita navegar a la página de búsqueda). */
  onServiciosSelected?: (servicios: TarifaServicioBusqueda[]) => void;
};

export function ServiciosSolicitadosSection({
  medicoTratanteId,
  tarifaId,
  tarifaDescripcion,
  tarifaEsPrecioDirecto = false,
  lineas,
  onLineasChange,
  medicosOptions,
  citaId,
  hasPendingDataChanges = false,
  onActualizarDatos,
  pendingChangesMessage = "",
  onMontoAPagarChange,
  copVarDefault = 0,
  onCopVarDefaultChange,
  getAtencionDraft,
  onServiciosSelected,
}: ServiciosSolicitadosSectionProps) {
  const navigate = useNavigate();
  const [igvPct, setIgvPct] = React.useState(18);
  const [servicioPickerOpen, setServicioPickerOpen] = React.useState(false);
  const [selectedLineaIdx, setSelectedLineaIdx] = React.useState<number | null>(null);
  const [confirmActualizarOpen, setConfirmActualizarOpen] = React.useState(false);
  const [actualizando, setActualizando] = React.useState(false);

  const [isLgUp, setIsLgUp] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  const [estadoFacturacionFilter, setEstadoFacturacionFilter] = React.useState<string>("");
  const [precioSinIgvEditing, setPrecioSinIgvEditing] = React.useState<{ idx: number; value: string } | null>(null);
  const [copFijoEditing, setCopFijoEditing] = React.useState<{ idx: number; value: string } | null>(null);
  const [reporteExpandido, setReporteExpandido] = React.useState(false);
  const reporteSectionRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (reporteExpandido && reporteSectionRef.current) {
      reporteSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reporteExpandido]);

  const [medicoChangedMessage, setMedicoChangedMessage] = React.useState<{ servicioDesc: string; medicoNombre: string } | null>(null);
  const medicoChangedTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const DRAFT_STORAGE_KEY_PREFIX = "admision:atencionCitaDraft:";

  const doNavigateBuscar = React.useCallback(() => {
    const draft = getAtencionDraft?.() ?? undefined;
    if (draft && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${citaId}`, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }
    navigate(`/admision/citas/agenda/${citaId}/atencion/buscar-servicios`, {
      state: {
        tarifaId,
        tarifaDescripcion,
        tarifaEsPrecioDirecto,
        returnLineas: lineas,
        atencionDraft: draft,
        copVarDefault,
      },
    });
  }, [navigate, citaId, tarifaId, tarifaDescripcion, tarifaEsPrecioDirecto, lineas, getAtencionDraft, copVarDefault]);

  const openServicioPicker = React.useCallback(() => {
    setServicioPickerOpen(true);
  }, []);

  const handleBuscarServicio = React.useCallback(() => {
    if (hasPendingDataChanges && onActualizarDatos && pendingChangesMessage) {
      setConfirmActualizarOpen(true);
    } else if (onServiciosSelected) {
      openServicioPicker();
    } else {
      doNavigateBuscar();
    }
  }, [hasPendingDataChanges, onActualizarDatos, pendingChangesMessage, onServiciosSelected, openServicioPicker, doNavigateBuscar]);

  const actualizandoRef = React.useRef(false);
  const onConfirmActualizar = React.useCallback(async () => {
    if (!onActualizarDatos || actualizandoRef.current) return;
    actualizandoRef.current = true;
    setActualizando(true);
    try {
      await onActualizarDatos();
      setConfirmActualizarOpen(false);
      if (onServiciosSelected) openServicioPicker();
      else doNavigateBuscar();
    } catch {
      // Error ya manejado en el padre
    } finally {
      actualizandoRef.current = false;
      setActualizando(false);
    }
  }, [onActualizarDatos, onServiciosSelected, openServicioPicker, doNavigateBuscar]);

  React.useEffect(() => {
    getIgvPorcentaje().then(setIgvPct).catch(() => {});
  }, []);

  const medicoOptionsForLinea = React.useMemo(() => {
    return medicosOptions.length ? medicosOptions : [{ value: "", label: "Seleccione médico" }];
  }, [medicosOptions]);

  const selectedLinea = selectedLineaIdx != null ? lineas[selectedLineaIdx] : null;

  const handleMedicoChangeForLinea = React.useCallback(
    (value: string) => {
      if (selectedLineaIdx == null) return;
      const id = value ? Number(value) : medicoTratanteId ?? 0;
      const opt = medicosOptions.find((o) => o.value === (value || String(medicoTratanteId ?? "")));
      const raw = opt?.label ?? "";
      const codigo = raw.includes(" · ") ? raw.split(" · ")[0]?.trim() ?? "" : raw.split(/\s+/)[0] ?? "";
      const medicoNombreCompleto = raw.includes(" · ") ? raw.split(" · ").slice(1).join(" · ").trim() : raw.trim() || codigo;
      const linea = lineas[selectedLineaIdx];
      const servicioDesc = (linea?.servicio_descripcion ?? "").trim() || (linea?.servicio_codigo ?? "Servicio");
      const servicioCorto = servicioDesc.length > 40 ? servicioDesc.slice(0, 37) + "…" : servicioDesc;

      onLineasChange(
        lineas.map((item, i) =>
          i === selectedLineaIdx ? { ...item, medico_id: id, medico_codigo: codigo } : item
        )
      );

      if (medicoChangedTimeoutRef.current) clearTimeout(medicoChangedTimeoutRef.current);
      setMedicoChangedMessage({ servicioDesc: servicioCorto, medicoNombre: medicoNombreCompleto });
      medicoChangedTimeoutRef.current = setTimeout(() => {
        setMedicoChangedMessage(null);
        medicoChangedTimeoutRef.current = null;
      }, 10000);
    },
    [selectedLineaIdx, lineas, medicosOptions, medicoTratanteId, onLineasChange]
  );

  React.useEffect(() => () => {
    if (medicoChangedTimeoutRef.current) clearTimeout(medicoChangedTimeoutRef.current);
  }, []);

  const updateLinea = React.useCallback(
    (idx: number, upd: Partial<AtencionServicioLineaDisplay>) => {
      const p = lineas[idx];
      if (!p) return;
      const next = { ...p, ...upd };
      const puedeLiberarPrecio = Boolean(p.desea_liberar_precio);

      if (puedeLiberarPrecio && "precio_con_igv" in upd && typeof upd.precio_con_igv === "number") {
        const factor = 10 ** PRECISION_DECIMAL;
        const nuevoConIgv = Math.max(0, upd.precio_con_igv);
        next.precio_con_igv = Math.round(nuevoConIgv * factor) / factor;
        next.precio_sin_igv = Math.round((next.precio_con_igv / (1 + igvPct / 100)) * factor) / factor;
      } else if (puedeLiberarPrecio && "precio_sin_igv" in upd && typeof upd.precio_sin_igv === "number") {
        const nuevoSinIgv = Math.max(0, upd.precio_sin_igv);
        const factor = 10 ** PRECISION_DECIMAL;
        next.precio_sin_igv = Math.round(nuevoSinIgv * factor) / factor;
        const igv = next.precio_sin_igv * (igvPct / 100);
        next.precio_con_igv = Math.round((next.precio_sin_igv + igv) * factor) / factor;
      } else if (!puedeLiberarPrecio || (!("precio_sin_igv" in upd) && !("precio_con_igv" in upd))) {
        const factorDesc = Math.max(0.01, 1 - (p.descuento_pct ?? 0) / 100);
        const factorAum = 1 + (p.aumento_pct ?? 0) / 100;
        const precioBase = (p.precio_sin_igv ?? 0) / Math.max(0.001, p.cantidad ?? 1) / factorDesc / factorAum;
        if ("cantidad" in upd || "descuento_pct" in upd || "aumento_pct" in upd) {
          const { precioSinIgv, precioConIgv } = calcularPrecios(
            precioBase,
            next.cantidad ?? 1,
            next.descuento_pct ?? 0,
            next.aumento_pct ?? 0,
            igvPct
          );
          next.precio_sin_igv = precioSinIgv;
          next.precio_con_igv = precioConIgv;
        }
      }
      onLineasChange(lineas.map((item, i) => (i === idx ? next : item)));
    },
    [lineas, onLineasChange, igvPct]
  );

  const handleRemoveLinea = React.useCallback(
    (idx: number) => {
      onLineasChange(lineas.filter((_, i) => i !== idx));
      if (selectedLineaIdx === idx) setSelectedLineaIdx(null);
      else if (selectedLineaIdx != null && selectedLineaIdx > idx) setSelectedLineaIdx(selectedLineaIdx - 1);
    },
    [lineas, onLineasChange, selectedLineaIdx]
  );

  const finalColumns: DataTableColumn<AtencionServicioLineaDisplay & { _idx: number }>[] = React.useMemo(() => [
    { key: "codigo", header: "Código", headerClassName: "text-xs py-1.5 text-center w-24 align-middle", cellClassName: "text-xs px-2 py-1.5 text-center tabular-nums align-middle", render: (x) => x.servicio_codigo ?? "—" },
    {
      key: "descripcion",
      header: "Descripción de servicio",
      headerClassName: "text-xs py-1.5 text-left align-middle",
      cellClassName: "text-xs px-2 py-1.5 max-w-[200px] align-middle",
      render: (x) => (
        <span className="block wrap-break-word whitespace-normal text-left leading-snug">
          {x.servicio_descripcion ?? "—"}
          {x.recargo_noche_activo && (
            <span className="block mt-0.5 text-[10px] text-(--color-primary) font-medium">Se activó recargo de noche</span>
          )}
        </span>
      ),
    },
    {
      key: "cop_var",
      header: "Copago variable",
      headerClassName: "text-xs py-1.5 text-center w-28 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => {
        if (tarifaEsPrecioDirecto) {
          return (
            <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)">
              {(x.cop_var ?? 0) === 0 ? "—" : `${x.cop_var}%`}
            </span>
          );
        }
        const esConsultasMedicas = (x.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO;
        if (esConsultasMedicas) {
          return (
            <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)" title="No aplica para Consultas Médicas">
              —
            </span>
          );
        }
        return (
          <input
            type="text"
            value={(x.cop_var ?? 0) === 0 ? "" : String(x.cop_var)}
            onChange={(e) => updateLinea(x._idx, { cop_var: parseFloat(e.target.value) || 0 })}
            onClick={(ev) => ev.stopPropagation()}
            className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
          />
        );
      },
    },
    {
      key: "cop_fijo",
      header: "Copago fijo",
      headerClassName: "text-xs py-1.5 text-center w-28 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => {
        if (tarifaEsPrecioDirecto) {
          return (
            <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)">
              {(x.cop_fijo ?? 0) === 0 ? "—" : String(x.cop_fijo)}
            </span>
          );
        }
        const esConsultasMedicas = (x.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO;
        if (!esConsultasMedicas) {
          return (
            <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)" title="Solo para Consultas Médicas">
              —
            </span>
          );
        }
        const copFijo = (x.cop_fijo ?? 0) as number;
        const isEditing = copFijoEditing?.idx === x._idx;
        const displayValue = isEditing ? copFijoEditing.value : (copFijo === 0 ? "" : String(copFijo));
        return (
          <div className="inline-flex items-baseline gap-0 text-xs">
            <span className="w-8 shrink-0 text-right tabular-nums">S/. </span>
            <input
              type="text"
              inputMode="decimal"
              value={displayValue}
              onFocus={(e) => {
                e.target.select?.();
                setCopFijoEditing({ idx: x._idx, value: copFijo === 0 ? "" : String(copFijo) });
              }}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, ".");
                setCopFijoEditing({ idx: x._idx, value: raw });
                const v = parseFloat(raw);
                if (raw.trim() === "" || (Number.isFinite(v) && v >= 0)) {
                  updateLinea(x._idx, { cop_fijo: v || 0 });
                }
              }}
              onBlur={() => {
                const raw = copFijoEditing?.idx === x._idx ? copFijoEditing.value : (copFijo === 0 ? "" : String(copFijo));
                const v = parseFloat(raw) || 0;
                updateLinea(x._idx, { cop_fijo: v });
                setCopFijoEditing(null);
              }}
              onClick={(ev) => ev.stopPropagation()}
              className="h-7 w-20 rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
            />
          </div>
        );
      },
    },
    {
      key: "descuento",
      header: "Descuento",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)">
          {(x.descuento_pct ?? 0) === 0 ? "—" : `${x.descuento_pct}%`}
        </span>
      ),
    },
    {
      key: "aumento",
      header: "Aumento",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-secondary)">
          {x.recargo_noche_activo && (x.aumento_pct ?? 0) !== 0 ? `${x.aumento_pct}%` : (x.aumento_pct ?? 0) === 0 ? "—" : `${x.aumento_pct}%`}
        </span>
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <input
          type="number"
          min={1}
          step={1}
          value={Math.max(1, Math.floor(Number(x.cantidad) || 1))}
          onChange={(e) => updateLinea(x._idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
        />
      ),
    },
    {
      key: "precio_con_igv",
      header: <span className="whitespace-nowrap">Precio con IGV</span>,
      headerClassName: "text-xs py-1.5 text-center w-28 min-w-[6rem] align-middle",
      cellClassName: "text-xs px-2 py-1.5 text-center whitespace-nowrap align-middle",
      render: (x) =>
        x.desea_liberar_precio ? (
          <div className="inline-flex items-baseline gap-0 text-xs">
            <span className="w-8 shrink-0 text-right tabular-nums">S/. </span>
            <input
              type="text"
              inputMode="decimal"
              value={precioSinIgvEditing?.idx === x._idx ? precioSinIgvEditing.value : String(x.precio_con_igv ?? 0)}
              onFocus={(e) => {
                e.target.select?.();
                setPrecioSinIgvEditing({ idx: x._idx, value: String(x.precio_con_igv ?? 0) });
              }}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, ".");
                setPrecioSinIgvEditing({ idx: x._idx, value: raw });
                const parsed = parseFloat(raw);
                if (raw.trim() === "" || (Number.isFinite(parsed) && parsed >= 0)) {
                  updateLinea(x._idx, { precio_con_igv: parsed || 0 });
                }
              }}
              onBlur={() => {
                const raw = precioSinIgvEditing?.idx === x._idx ? precioSinIgvEditing.value : String(x.precio_con_igv ?? 0);
                const v = parseFloat(raw) || 0;
                updateLinea(x._idx, { precio_con_igv: v });
                setPrecioSinIgvEditing(null);
              }}
              onClick={(ev) => ev.stopPropagation()}
              className="min-w-14 w-20 rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 py-0.5 text-right text-xs tabular-nums outline-none focus:ring-0 focus:border-(--color-primary)"
            />
          </div>
        ) : (
          <PrecioCell valor={x.precio_con_igv ?? 0} />
        ),
    },
    { key: "medico", header: "Médico", headerClassName: "text-xs py-1.5 text-center w-20 align-middle", cellClassName: "text-xs px-2 py-1.5 text-center tabular-nums align-middle", render: (x) => getMedicoCodigo(x.medico_id, x.medico_codigo, medicosOptions) },
    { key: "usuario", header: "Usuario", headerClassName: "text-xs py-1.5 text-center w-28 align-middle", cellClassName: "text-xs px-2 py-1.5 text-center align-middle", render: (x) => (x.user_username ?? x.user_nombre ?? "—") },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-2 py-1.5 text-center align-middle",
      render: (x) => <EstadoFacturacionBadge estado={x.estado_facturacion} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-xs py-1.5 w-12 text-center align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <div onClick={(e) => e.stopPropagation()} title="Eliminar">
          <DangerButton
            type="button"
            onClick={() => handleRemoveLinea(x._idx)}
            className="h-6! min-h-6! min-w-6! w-6! p-0! flex items-center justify-center shrink-0 rounded"
          >
            <Trash2 className="h-3 w-3" />
          </DangerButton>
        </div>
      ),
    },
  ], [medicosOptions, updateLinea, handleRemoveLinea, precioSinIgvEditing, copFijoEditing, tarifaEsPrecioDirecto]);

  const finalRows = React.useMemo(() => {
    const withIdx = lineas.map((l, i) => ({ ...l, _idx: i }));
    if (!estadoFacturacionFilter) return withIdx;
    return withIdx.filter((l) => (l.estado_facturacion ?? "PENDIENTE") === estadoFacturacionFilter);
  }, [lineas, estadoFacturacionFilter]);

  /** Monto a pagar = suma de lo que paga el paciente (solo líneas PENDIENTE), con IGV. */
  const montoAPagarComputed = React.useMemo(() => {
    const pending = lineas.filter((l) => (l.estado_facturacion ?? "PENDIENTE") === "PENDIENTE");
    const total = pending.reduce(
      (sum, l) => sum + pacientePagaConIgv(l, igvPct, tarifaEsPrecioDirecto),
      0
    );
    return Math.round(total * FACTOR_REDONDO) / FACTOR_REDONDO;
  }, [lineas, igvPct, tarifaEsPrecioDirecto]);

  React.useEffect(() => {
    onMontoAPagarChange?.(montoAPagarComputed);
  }, [montoAPagarComputed, onMontoAPagarChange]);

  /** Para tarifarios con copago: total pago aseguradora (con IGV) y filas del reporte con todos los valores con IGV. */
  const reporteConIgv = React.useMemo(() => {
    if (tarifaEsPrecioDirecto || finalRows.length === 0) return { totalPagoAseguradora: 0, filas: [] as Array<{ precioUnitarioConIgv: number; importeConIgv: number; copagoVariableConIgv: number | null; copagoFijoConIgv: number | null; pagoAseguradoraConIgv: number | null }>, totalCopVar: 0, totalCopFijo: 0, totalPagoAsegu: 0 };
    const filas = finalRows.map((item) => {
      const cant = Math.max(1, Math.floor(Number(item.cantidad) || 1));
      const importeConIgv = (item.precio_con_igv ?? 0) as number;
      const precioUnitarioConIgv = Math.round((importeConIgv / cant) * FACTOR_REDONDO) / FACTOR_REDONDO;
      const esCat50 = (item.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO;
      const copFijoConIgv = (item.cop_fijo ?? 0) as number;
      const copVar = (item.cop_var ?? 0) as number;
      const copagoVariableConIgv: number | null = !esCat50 ? Math.round(importeConIgv * (1 - copVar / 100) * FACTOR_REDONDO) / FACTOR_REDONDO : null;
      const copagoFijoConIgv: number | null = esCat50 && copFijoConIgv > 0 ? Math.round(copFijoConIgv * cant * FACTOR_REDONDO) / FACTOR_REDONDO : null;
      const pagoAseguradoraConIgv: number | null = esCat50 && copFijoConIgv > 0
        ? Math.round((importeConIgv - copFijoConIgv * cant) * FACTOR_REDONDO) / FACTOR_REDONDO
        : !esCat50 && copVar >= 0 ? Math.round(importeConIgv * (copVar / 100) * FACTOR_REDONDO) / FACTOR_REDONDO : null;
      return { precioUnitarioConIgv, importeConIgv, copagoVariableConIgv, copagoFijoConIgv, pagoAseguradoraConIgv };
    });
    const totalCopVar = filas.reduce((s, f) => s + (f.copagoVariableConIgv ?? 0), 0);
    const totalCopFijo = filas.reduce((s, f) => s + (f.copagoFijoConIgv ?? 0), 0);
    const totalPagoAsegu = filas.reduce((s, f) => s + (f.pagoAseguradoraConIgv ?? 0), 0);
    return { totalPagoAseguradora: Math.round(totalPagoAsegu * FACTOR_REDONDO) / FACTOR_REDONDO, filas, totalCopVar, totalCopFijo, totalPagoAsegu };
  }, [tarifaEsPrecioDirecto, finalRows]);

  const estadoFacturacionOptions: SelectOption[] = [
    { value: "", label: "Todos" },
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "FACTURADO", label: "Facturado" },
  ];

  /** Nombre completo del médico de la fila seleccionada (para mostrar encima de la tabla). */
  const selectedMedicoNombreCompleto = React.useMemo(() => {
    if (!selectedLinea?.medico_id) return null;
    const opt = medicosOptions.find((o) => o.value === String(selectedLinea.medico_id));
    const label = opt?.label ?? "";
    const part = label.includes(" · ") ? label.split(" · ").slice(1).join(" · ").trim() : label.trim();
    return part || null;
  }, [selectedLinea?.medico_id, medicosOptions]);

  /** Nombre de usuario de la fila seleccionada (para mostrar encima de la tabla). */
  const selectedUsuarioNombre = selectedLinea?.user_nombre ?? null;

  return (
    <div className="rounded border border-(--border-color-default) bg-(--color-surface) p-4">
      <h2 className="text-sm font-semibold text-(--color-text-primary)">Servicios solicitados</h2>

      <div className="mt-3 flex flex-col gap-3">
        <ConfirmDialog
          open={confirmActualizarOpen}
          title="Actualizar datos"
          description={pendingChangesMessage}
          confirmText={actualizando ? "Actualizando…" : "Actualizar datos"}
          cancelText="Cancelar"
          onCancel={() => !actualizando && setConfirmActualizarOpen(false)}
          onConfirm={onConfirmActualizar}
        />

        {/* Campo médico (aplica a la fila seleccionada) y Buscar servicio */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-(--color-text-secondary)">
            {selectedLineaIdx != null ? "Asigne médico a la fila seleccionada" : "Asigne médico del servicio (seleccione una fila en la tabla)"}
          </span>
          <div className="flex flex-wrap items-center gap-3 gap-y-2">
            <div className="w-full min-w-0 sm:w-[280px] sm:min-w-[200px]">
              <SelectMenu
                value={selectedLinea ? (selectedLinea.medico_id ? String(selectedLinea.medico_id) : "") : (medicoTratanteId ? String(medicoTratanteId) : "")}
                onChange={(value) => {
                  if (selectedLineaIdx != null) handleMedicoChangeForLinea(value);
                }}
                options={medicoOptionsForLinea}
                ariaLabel="Médico"
                buttonClassName="h-8 rounded w-full"
                menuClassName="w-[280px] min-w-[280px]"
              />
            </div>
            <PrimaryButton onClick={handleBuscarServicio} disabled={!tarifaId}>
              Buscar servicio
            </PrimaryButton>
            {selectedLinea != null && (
              <SecondaryButton onClick={() => setSelectedLineaIdx(null)}>
                Deseleccionar
              </SecondaryButton>
            )}
            {medicoChangedMessage != null && (
              <div
                className="min-w-0 flex-1 basis-full sm:basis-auto sm:flex-initial rounded border border-(--color-primary) bg-(--color-primary)/10 px-3 py-2 text-sm text-(--color-text-primary)"
                role="status"
                aria-live="polite"
              >
                Servicio <span className="font-bold">{medicoChangedMessage.servicioDesc}</span> cambiado con médico <span className="font-bold">{medicoChangedMessage.medicoNombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* Servicios finales: título con "Definir Copago variable" a la derecha, luego filtros */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 gap-y-1">
              <h3 className="text-sm font-medium text-(--color-text-primary)">Servicios finales</h3>
              {!tarifaEsPrecioDirecto && (
                <>
                  <span className="hidden sm:block h-5 w-px shrink-0 bg-(--border-color-default)" aria-hidden />
                  <div className="flex items-center gap-2">
                    <label htmlFor="cop-var-default" className="text-xs text-(--color-text-secondary) whitespace-nowrap">
                      Definir Copago variable
                    </label>
                    <input
                      id="cop-var-default"
                      type="text"
                      inputMode="numeric"
                      value={copVarDefault === 0 ? "" : String(copVarDefault)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, ".");
                        const v = parseFloat(raw);
                        if (raw.trim() === "" || (Number.isFinite(v) && v >= 0 && v <= 100)) {
                          const newVal = raw.trim() === "" ? 0 : v;
                          onCopVarDefaultChange?.(newVal);
                          // Aplicar el mismo valor a todos los servicios que usan copago variable (ayuda al usuario; cada uno sigue siendo editable).
                          const nextLineas = lineas.map((l) => {
                            if ((l.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO) return l;
                            return { ...l, cop_var: newVal };
                          });
                          onLineasChange(nextLineas);
                        }
                      }}
                      className="h-7 w-16 rounded border border-(--border-color-default) bg-(--color-surface) px-2 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
                      title="Copago variable por defecto. Al cambiar, se aplica a todos los servicios; puede editar cada uno después."
                    />
                    <span className="text-xs text-(--color-text-secondary)">%</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {selectedLineaIdx != null && (
                <>
                  <span className="text-sm text-(--color-text-primary)">
                    <span className="font-medium text-(--color-text-secondary)">Médico:</span> {selectedMedicoNombreCompleto ?? "—"}
                  </span>
                  <span className="text-sm text-(--color-text-primary)">
                    <span className="font-medium text-(--color-text-secondary)">Usuario:</span> {selectedUsuarioNombre?.trim() || "—"}
                  </span>
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-(--color-text-secondary)">Estado:</span>
                <SelectMenu
                  value={estadoFacturacionFilter}
                  onChange={setEstadoFacturacionFilter}
                  options={estadoFacturacionOptions}
                  ariaLabel="Filtrar por estado"
                  buttonClassName="h-8 rounded min-w-[120px]"
                  menuClassName="min-w-[120px]"
                />
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <DataTable
              rows={finalRows}
              columns={finalColumns}
              loading={false}
              selectedId={selectedLineaIdx != null ? `f-${selectedLineaIdx}` : null}
              getRowId={(x) => `f-${x._idx}`}
              onSelect={(x) => setSelectedLineaIdx(x._idx)}
              emptyText="No hay servicios. Use «Buscar servicio» para agregar."
            />
          </div>
          <div className="lg:hidden">
            {finalRows.length === 0 ? (
              <div className="rounded border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
                No hay servicios. Use «Buscar servicio» para agregar.
              </div>
            ) : (
              <div className="space-y-2">
                {finalRows.map((item) => (
                    <div
                      key={item.id ?? `f-${item._idx}`}
                      onClick={() => setSelectedLineaIdx(item._idx)}
                      className={`rounded border border-(--border-color-default) p-4 ${
                        selectedLineaIdx === item._idx ? "bg-(--color-surface-hover)" : "bg-(--color-surface)"
                      }`}
                    >
                      <div className="flex flex-col gap-3 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold tabular-nums text-(--color-primary)">{item.servicio_codigo ?? "—"}</span>
                            <span className="text-(--color-text-primary)"> · </span>
                            <span className="text-sm text-(--color-text-primary)">{item.servicio_descripcion ?? "—"}</span>
                            {item.recargo_noche_activo && (
                              <span className="block mt-0.5 text-xs text-(--color-primary) font-medium">Se activó recargo de noche</span>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DangerButton
                              type="button"
                              onClick={() => handleRemoveLinea(item._idx)}
                              className="h-9 min-w-9 px-2 flex items-center justify-center shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </DangerButton>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Copago variable</span>
                            {tarifaEsPrecioDirecto ? (
                              <span className="h-9 flex items-center justify-center tabular-nums text-(--color-text-secondary)">
                                {(item.cop_var ?? 0) === 0 ? "—" : `${item.cop_var}%`}
                              </span>
                            ) : (item.categoria_codigo ?? "").trim() === CATEGORIA_CONSULTAS_MEDICAS_CODIGO ? (
                              <span className="h-9 flex items-center justify-center text-(--color-text-secondary)">—</span>
                            ) : (
                              <input
                                type="text"
                                placeholder="%"
                                value={(item.cop_var ?? 0) === 0 ? "" : String(item.cop_var)}
                                onChange={(e) => updateLinea(item._idx, { cop_var: parseFloat(e.target.value) || 0 })}
                                onClick={(ev) => ev.stopPropagation()}
                                className="h-9 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-2 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Copago fijo</span>
                            {tarifaEsPrecioDirecto ? (
                              <span className="h-9 flex items-center justify-center tabular-nums text-(--color-text-secondary)">
                                {(item.cop_fijo ?? 0) === 0 ? "—" : String(item.cop_fijo)}
                              </span>
                            ) : (item.categoria_codigo ?? "").trim() !== CATEGORIA_CONSULTAS_MEDICAS_CODIGO ? (
                              <span className="h-9 flex items-center justify-center text-(--color-text-secondary)">—</span>
                            ) : (() => {
                              const copFijo = (item.cop_fijo ?? 0) as number;
                              const isEditing = copFijoEditing?.idx === item._idx;
                              const displayValue = isEditing ? copFijoEditing.value : (copFijo === 0 ? "" : String(copFijo));
                              return (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={displayValue}
                                  onFocus={(e) => {
                                    e.target.select?.();
                                    setCopFijoEditing({ idx: item._idx, value: copFijo === 0 ? "" : String(copFijo) });
                                  }}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/,/g, ".");
                                    setCopFijoEditing({ idx: item._idx, value: raw });
                                    const v = parseFloat(raw);
                                    if (raw.trim() === "" || (Number.isFinite(v) && v >= 0)) {
                                      updateLinea(item._idx, { cop_fijo: v || 0 });
                                    }
                                  }}
                                  onBlur={() => {
                                    const raw = copFijoEditing?.idx === item._idx ? copFijoEditing.value : (copFijo === 0 ? "" : String(copFijo));
                                    const v = parseFloat(raw) || 0;
                                    updateLinea(item._idx, { cop_fijo: v });
                                    setCopFijoEditing(null);
                                  }}
                                  onClick={(ev) => ev.stopPropagation()}
                                  className="h-9 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-2 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
                                />
                              );
                            })()}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Descuento</span>
                            <span className="h-9 flex items-center justify-center tabular-nums text-xs text-(--color-text-secondary)">
                              {(item.descuento_pct ?? 0) === 0 ? "—" : `${item.descuento_pct}%`}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Aumento</span>
                            <span className="h-9 flex items-center justify-center tabular-nums text-xs text-(--color-text-secondary)">
                              {(item.aumento_pct ?? 0) === 0 ? "—" : `${item.aumento_pct}%`}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Cantidad</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={Math.max(1, Math.floor(Number(item.cantidad) || 1))}
                              onChange={(e) => updateLinea(item._idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                              onClick={(ev) => ev.stopPropagation()}
                              className="h-9 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-2 text-xs tabular-nums text-center outline-none focus:ring-0 focus:border-(--color-primary)"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Precio c/ IGV</span>
                            {item.desea_liberar_precio ? (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={precioSinIgvEditing?.idx === item._idx ? precioSinIgvEditing.value : String(item.precio_con_igv ?? 0)}
                                onFocus={() => setPrecioSinIgvEditing({ idx: item._idx, value: String(item.precio_con_igv ?? 0) })}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/,/g, ".");
                                  setPrecioSinIgvEditing({ idx: item._idx, value: raw });
                                  const parsed = parseFloat(raw);
                                  if (raw.trim() === "" || (Number.isFinite(parsed) && parsed >= 0)) {
                                    updateLinea(item._idx, { precio_con_igv: parsed || 0 });
                                  }
                                }}
                                onBlur={() => {
                                  const raw = precioSinIgvEditing?.idx === item._idx ? precioSinIgvEditing.value : String(item.precio_con_igv ?? 0);
                                  const v = parseFloat(raw) || 0;
                                  updateLinea(item._idx, { precio_con_igv: v });
                                  setPrecioSinIgvEditing(null);
                                }}
                                onClick={(ev) => ev.stopPropagation()}
                                className="h-9 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-2 text-xs tabular-nums text-right outline-none focus:ring-0 focus:border-(--color-primary)"
                              />
                            ) : (
                              <span className="h-9 flex items-center tabular-nums text-xs text-(--color-text-primary)">S/. {formatDecimalDisplay(item.precio_con_igv)}</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Médico</span>
                            <span className="h-9 flex items-center text-xs text-(--color-text-primary)">{getMedicoCodigo(item.medico_id, item.medico_codigo, medicosOptions)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Usuario</span>
                            <span className="h-9 flex items-center text-xs text-(--color-text-primary)">{item.user_username ?? item.user_nombre ?? "—"}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Estado</span>
                            <span className="h-9 flex items-center"><EstadoFacturacionBadge estado={item.estado_facturacion} /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-(--border-color-default) pt-4">
            {!tarifaEsPrecioDirecto && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-(--color-text-secondary)">Monto a pagar aseguradora S/.</span>
                <span className="min-w-28 rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-center text-sm font-semibold tabular-nums text-(--color-text-primary)">
                  {formatDecimalDisplay(reporteConIgv.totalPagoAseguradora)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-(--color-text-secondary)">Monto a pagar paciente S/.</span>
              <span className="min-w-28 rounded border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-center text-sm font-semibold tabular-nums text-(--color-text-primary)">
                {formatDecimalDisplay(montoAPagarComputed)}
              </span>
            </div>
          </div>

          {/* Detalle para reporte: desplegable; solo para tarifarios con copago. Todo con IGV. */}
          {!tarifaEsPrecioDirecto && finalRows.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setReporteExpandido((e) => !e)}
                  className="inline-flex items-center justify-center gap-2 rounded border border-(--border-color-default) bg-(--color-surface) py-2.5 px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-surface-hover)"
                  aria-expanded={reporteExpandido}
                >
                {reporteExpandido ? (
                  <>
                    <ChevronUp className="h-4 w-4 shrink-0" />
                    Ocultar detalle para reporte
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                    Ver detalle para reporte
                  </>
                )}
                </button>
              </div>
              {reporteExpandido && (() => {
                const hasDescuento = finalRows.some((r) => (r.descuento_pct ?? 0) > 0);
                const hasAumento = finalRows.some((r) => (r.aumento_pct ?? 0) > 0);
                const renderSoles = (val: number | null) => {
                  if (val == null || (typeof val === "number" && !Number.isFinite(val))) return "—";
                  return (
                    <div className="flex w-full items-baseline gap-0 text-sm">
                      <span className="w-8 shrink-0 text-right tabular-nums">S/. </span>
                      <span className="min-w-0 flex-1 text-right tabular-nums">{formatDecimalDisplay(val)}</span>
                    </div>
                  );
                };
                /** En móvil: celda de monto con S/. y número alineados a contabilidad. */
                const renderSolesCelda = (val: number | null) => {
                  if (val == null || (typeof val === "number" && !Number.isFinite(val))) {
                    return <span className="flex w-full min-w-0 justify-end tabular-nums text-(--color-text-primary)">—</span>;
                  }
                  return (
                    <span className="flex w-full min-w-0 items-baseline gap-0 tabular-nums text-(--color-text-primary)">
                      <span className="w-8 shrink-0 text-right">S/. </span>
                      <span className="min-w-0 flex-1 text-right">{formatDecimalDisplay(val)}</span>
                    </span>
                  );
                };
                const thBase = "px-3 py-2 font-semibold align-middle whitespace-normal";
                const tdBase = "px-3 py-2 align-middle text-sm";
                const monedaMin = "min-w-[7rem]";
                const { filas, totalCopVar, totalCopFijo, totalPagoAsegu } = reporteConIgv;
                return (
                  <div ref={reporteSectionRef} className="flex flex-col gap-2">
                    <div className="hidden lg:block rounded border border-(--border-color-default) overflow-hidden bg-(--color-surface)">
                      <div className="min-h-0 overflow-auto app-scrollbar app-scrollbar-no-gutter">
                        <table className="w-full text-sm min-w-[700px]">
                          <thead className="sticky top-0 bg-(--color-primary) text-(--color-text-inverse)">
                            <tr>
                              <th className={`${thBase} text-center`}>Código</th>
                              <th className={`${thBase} text-left`}>Descripción de servicio</th>
                              <th className={`${thBase} text-center`}>Cantidad</th>
                              <th className={`${thBase} text-right ${monedaMin}`}>Precio unitario</th>
                              <th className={`${thBase} text-right ${monedaMin}`}>Importe neto</th>
                              {hasDescuento && <th className={`${thBase} text-center`}>Descuento</th>}
                              {hasAumento && <th className={`${thBase} text-center`}>Aumento</th>}
                              <th className={`${thBase} text-right ${monedaMin}`}>Copago variable</th>
                              <th className={`${thBase} text-right ${monedaMin}`}>Copago fijo</th>
                              <th className={`${thBase} text-right ${monedaMin}`}>Pago aseguradora</th>
                            </tr>
                          </thead>
                          <tbody>
                            {finalRows.map((item, i) => {
                              const cant = Math.max(1, Math.floor(Number(item.cantidad) || 1));
                              const row = filas[i];
                              const descPct = (item.descuento_pct ?? 0) as number;
                              const aumPct = (item.aumento_pct ?? 0) as number;
                              if (!row) return null;
                              return (
                                <tr key={item.id ?? `resumen-${i}`} className="border-t border-(--border-color-default) bg-(--color-surface) hover:bg-(--color-surface-hover)">
                                  <td className={`${tdBase} text-center tabular-nums text-(--color-primary)`}>{item.servicio_codigo ?? "—"}</td>
                                  <td className={`${tdBase} text-left text-(--color-text-primary) whitespace-normal`}>{item.servicio_descripcion ?? "—"}</td>
                                  <td className={`${tdBase} text-center tabular-nums`}>{formatDecimalDisplay(cant)}</td>
                                  <td className={`${tdBase} text-right ${monedaMin}`}>{renderSoles(row.precioUnitarioConIgv)}</td>
                                  <td className={`${tdBase} text-right ${monedaMin}`}>{renderSoles(row.importeConIgv)}</td>
                                  {hasDescuento && <td className={`${tdBase} text-center tabular-nums`}>{descPct === 0 ? "—" : `${descPct}%`}</td>}
                                  {hasAumento && <td className={`${tdBase} text-center tabular-nums`}>{aumPct === 0 ? "—" : `${aumPct}%`}</td>}
                                  <td className={`${tdBase} text-right ${monedaMin}`}>{row.copagoVariableConIgv != null ? renderSoles(row.copagoVariableConIgv) : "—"}</td>
                                  <td className={`${tdBase} text-right ${monedaMin}`}>{row.copagoFijoConIgv != null ? renderSoles(row.copagoFijoConIgv) : "—"}</td>
                                  <td className={`${tdBase} text-right ${monedaMin}`}>{row.pagoAseguradoraConIgv != null ? renderSoles(row.pagoAseguradoraConIgv) : "—"}</td>
                                </tr>
                              );
                            })}
                            <tr className="border-t border-(--color-primary) bg-(--color-surface) font-semibold">
                              <td className={`${tdBase} text-right text-(--color-text-primary)`} colSpan={5 + (hasDescuento ? 1 : 0) + (hasAumento ? 1 : 0)}>Total</td>
                              <td className={`${tdBase} text-right ${monedaMin}`}>{renderSoles(totalCopVar)}</td>
                              <td className={`${tdBase} text-right ${monedaMin}`}>{renderSoles(totalCopFijo)}</td>
                              <td className={`${tdBase} text-right ${monedaMin}`}>{renderSoles(totalPagoAsegu)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="lg:hidden space-y-2">
                      {finalRows.map((item, i) => {
                        const cant = Math.max(1, Math.floor(Number(item.cantidad) || 1));
                        const row = filas[i];
                        if (!row) return null;
                        return (
                          <div key={item.id ?? `resumen-m-${i}`} className="rounded border border-(--border-color-default) bg-(--color-surface) p-4">
                            <div className="flex flex-col gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold tabular-nums text-(--color-primary)">{item.servicio_codigo ?? "—"}</span>
                                <span className="text-(--color-text-primary)">·</span>
                                <span className="text-(--color-text-primary) flex-1 min-w-0 wrap-break-word">{item.servicio_descripcion ?? "—"}</span>
                              </div>
                              <div className="grid grid-cols-[1fr_minmax(8rem,1fr)] gap-x-4 gap-y-1 text-(--color-text-secondary)">
                                <span>Cantidad:</span>
                                <span className="tabular-nums text-right text-(--color-text-primary)">{formatDecimalDisplay(cant)}</span>
                                <span>Precio unit. c/ IGV:</span>
                                {renderSolesCelda(row.precioUnitarioConIgv)}
                                <span>Importe c/ IGV:</span>
                                {renderSolesCelda(row.importeConIgv)}
                                <span>Copago variable:</span>
                                {renderSolesCelda(row.copagoVariableConIgv)}
                                <span>Copago fijo:</span>
                                {renderSolesCelda(row.copagoFijoConIgv)}
                                <span>Pago aseguradora:</span>
                                {renderSolesCelda(row.pagoAseguradoraConIgv)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="rounded border-t border-(--color-primary) bg-(--color-surface) p-4 font-semibold text-sm">
                        <div className="grid grid-cols-[1fr_minmax(8rem,1fr)] gap-x-4 gap-y-1 text-(--color-text-secondary)">
                          <span className="text-(--color-text-primary)">Total</span>
                          <span />
                          <span>Copago variable:</span>
                          <span className="flex w-full min-w-0 items-baseline gap-0 tabular-nums text-(--color-text-primary)">
                            <span className="w-8 shrink-0 text-right">S/. </span>
                            <span className="min-w-0 flex-1 text-right">{formatDecimalDisplay(totalCopVar)}</span>
                          </span>
                          <span>Copago fijo:</span>
                          <span className="flex w-full min-w-0 items-baseline gap-0 tabular-nums text-(--color-text-primary)">
                            <span className="w-8 shrink-0 text-right">S/. </span>
                            <span className="min-w-0 flex-1 text-right">{formatDecimalDisplay(totalCopFijo)}</span>
                          </span>
                          <span>Pago aseguradora:</span>
                          <span className="flex w-full min-w-0 items-baseline gap-0 tabular-nums text-(--color-text-primary)">
                            <span className="w-8 shrink-0 text-right">S/. </span>
                            <span className="min-w-0 flex-1 text-right">{formatDecimalDisplay(totalPagoAsegu)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {onServiciosSelected && (
        <ServicioPicker
          open={servicioPickerOpen}
          variant={isLgUp ? "drawer" : "fullscreen"}
          onClose={() => setServicioPickerOpen(false)}
          onSelect={(selected) => {
            onServiciosSelected(selected);
            setServicioPickerOpen(false);
          }}
          tarifaId={tarifaId}
          tarifaDescripcion={tarifaDescripcion ?? undefined}
          igvPct={igvPct}
        />
      )}
    </div>
  );
}
