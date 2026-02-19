import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../../../shared/ui/buttons";
import { ConfirmDialog } from "../../../ficheros/components/ConfirmDialog";
import { EstadoFacturacionBadge } from "./EstadoFacturacionBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { getIgvPorcentaje } from "../services/atencionCita.service";
import { PRECISION_DECIMAL } from "../../../../../shared/constants/decimalPrecision";
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

function PrecioCell({ valor }: { valor: number }) {
  return (
    <div className="flex justify-end items-baseline gap-0 text-xs">
      <span className="inline-block w-8 shrink-0 text-right tabular-nums">S/. </span>
      <span className="tabular-nums inline-block min-w-14 text-right">
        {valor.toFixed(PRECISION_DECIMAL)}
      </span>
    </div>
  );
}

export type ServiciosSolicitadosSectionProps = {
  medicoTratanteId: number | null;
  medicoTratanteLabel: string;
  tarifaId: number | null;
  tarifaDescripcion: string | null;
  lineas: AtencionServicioLineaDisplay[];
  onLineasChange: (lineas: AtencionServicioLineaDisplay[]) => void;
  medicosOptions: SelectOption[];
  currentUsername: string;
  citaId: number;
  hasPendingDataChanges?: boolean;
  onActualizarDatos?: () => Promise<void>;
  pendingChangesMessage?: string;
  montoAPagar: number;
  /** Devuelve el draft del formulario de atención para preservar al ir a Buscar servicios. */
  getAtencionDraft?: () => AtencionDraft | null;
};

export function ServiciosSolicitadosSection({
  medicoTratanteId,
  tarifaId,
  tarifaDescripcion,
  lineas,
  onLineasChange,
  medicosOptions,
  citaId,
  hasPendingDataChanges = false,
  onActualizarDatos,
  pendingChangesMessage = "",
  montoAPagar,
  getAtencionDraft,
}: ServiciosSolicitadosSectionProps) {
  const navigate = useNavigate();
  const [igvPct, setIgvPct] = React.useState(18);
  const [selectedLineaIdx, setSelectedLineaIdx] = React.useState<number | null>(null);
  const [confirmActualizarOpen, setConfirmActualizarOpen] = React.useState(false);
  const [actualizando, setActualizando] = React.useState(false);
  const [estadoFacturacionFilter, setEstadoFacturacionFilter] = React.useState<string>("");
  const [precioSinIgvEditing, setPrecioSinIgvEditing] = React.useState<{ idx: number; value: string } | null>(null);

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
        returnLineas: lineas,
        atencionDraft: draft,
      },
    });
  }, [navigate, citaId, tarifaId, tarifaDescripcion, lineas, getAtencionDraft]);

  const handleBuscarServicio = React.useCallback(() => {
    if (hasPendingDataChanges && onActualizarDatos && pendingChangesMessage) {
      setConfirmActualizarOpen(true);
    } else {
      doNavigateBuscar();
    }
  }, [hasPendingDataChanges, onActualizarDatos, pendingChangesMessage, doNavigateBuscar]);

  const actualizandoRef = React.useRef(false);
  const onConfirmActualizar = React.useCallback(async () => {
    if (!onActualizarDatos || actualizandoRef.current) return;
    actualizandoRef.current = true;
    setActualizando(true);
    try {
      await onActualizarDatos();
      setConfirmActualizarOpen(false);
      doNavigateBuscar();
    } catch {
      // Error ya manejado en el padre
    } finally {
      actualizandoRef.current = false;
      setActualizando(false);
    }
  }, [onActualizarDatos, doNavigateBuscar]);

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

      if (puedeLiberarPrecio && "precio_sin_igv" in upd && typeof upd.precio_sin_igv === "number") {
        const nuevoSinIgv = Math.max(0, upd.precio_sin_igv);
        const factor = 10 ** PRECISION_DECIMAL;
        next.precio_sin_igv = Math.round(nuevoSinIgv * factor) / factor;
        const igv = next.precio_sin_igv * (igvPct / 100);
        next.precio_con_igv = Math.round((next.precio_sin_igv + igv) * factor) / factor;
      } else if (!puedeLiberarPrecio || !("precio_sin_igv" in upd)) {
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
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={(x.cop_var ?? 0) === 0 ? "" : String(x.cop_var)}
          onChange={(e) => updateLinea(x._idx, { cop_var: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-1 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "cop_fijo",
      header: "Copago fijo",
      headerClassName: "text-xs py-1.5 text-center w-28 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={(x.cop_fijo ?? 0) === 0 ? "" : String(x.cop_fijo)}
          onChange={(e) => updateLinea(x._idx, { cop_fijo: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-1 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "descuento",
      header: "Descuento",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={(x.descuento_pct ?? 0) === 0 ? "" : String(x.descuento_pct)}
          onChange={(e) => updateLinea(x._idx, { descuento_pct: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-1 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "aumento",
      header: "Aumento",
      headerClassName: "text-xs py-1.5 text-center w-24 align-middle",
      cellClassName: "text-xs px-1.5 py-1.5 text-center align-middle",
      render: (x) =>
        x.recargo_noche_activo ? (
          <span className="inline-block w-full text-center tabular-nums text-xs text-(--color-text-primary)">
            {(x.aumento_pct ?? 0) === 0 ? "—" : `${x.aumento_pct}%`}
          </span>
        ) : (
          <input
            type="text"
            placeholder=""
            value={(x.aumento_pct ?? 0) === 0 ? "" : String(x.aumento_pct)}
            onChange={(e) => updateLinea(x._idx, { aumento_pct: parseFloat(e.target.value) || 0 })}
            onClick={(ev) => ev.stopPropagation()}
            className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-1 focus:ring-(--color-primary)"
          />
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
          value={x.cantidad ?? 1}
          onChange={(e) => updateLinea(x._idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-7 w-full rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 text-xs tabular-nums text-center outline-none focus:ring-1 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "precio_sin_igv",
      header: <span className="whitespace-nowrap">Precio sin IGV</span>,
      headerClassName: "text-xs py-1.5 text-right w-28 min-w-[6rem] align-middle",
      cellClassName: "text-xs px-2 py-1.5 text-right whitespace-nowrap align-middle",
      render: (x) =>
        x.desea_liberar_precio ? (
          <div className="flex justify-end items-baseline gap-0 text-xs">
            <span className="inline-block w-8 shrink-0 text-right tabular-nums">S/. </span>
            <input
              type="text"
              inputMode="decimal"
              value={precioSinIgvEditing?.idx === x._idx ? precioSinIgvEditing.value : String(x.precio_sin_igv ?? 0)}
              onFocus={(e) => {
                e.target.select?.();
                setPrecioSinIgvEditing({ idx: x._idx, value: String(x.precio_sin_igv ?? 0) });
              }}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, ".");
                setPrecioSinIgvEditing({ idx: x._idx, value: raw });
                const parsed = parseFloat(raw);
                if (raw.trim() === "" || (Number.isFinite(parsed) && parsed >= 0)) {
                  updateLinea(x._idx, { precio_sin_igv: parsed || 0 });
                }
              }}
              onBlur={() => {
                const raw = precioSinIgvEditing?.idx === x._idx ? precioSinIgvEditing.value : String(x.precio_sin_igv ?? 0);
                const v = parseFloat(raw) || 0;
                updateLinea(x._idx, { precio_sin_igv: v });
                setPrecioSinIgvEditing(null);
              }}
              onClick={(ev) => ev.stopPropagation()}
              className="min-w-14 w-20 rounded border border-(--border-color-default) bg-(--color-surface) px-1.5 py-0.5 text-right text-xs tabular-nums outline-none focus:ring-1 focus:ring-(--color-primary)"
            />
          </div>
        ) : (
          <PrecioCell valor={x.precio_sin_igv ?? 0} />
        ),
    },
    {
      key: "precio_con_igv",
      header: <span className="whitespace-nowrap">Precio con IGV</span>,
      headerClassName: "text-xs py-1.5 text-right w-28 min-w-[6rem] align-middle",
      cellClassName: "text-xs px-2 py-1.5 text-right whitespace-nowrap align-middle",
      render: (x) => <PrecioCell valor={x.precio_con_igv ?? 0} />,
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
      headerClassName: "text-xs py-1.5 w-12 align-middle",
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
  ], [medicosOptions, updateLinea, handleRemoveLinea, precioSinIgvEditing]);

  const finalRows = React.useMemo(() => {
    const withIdx = lineas.map((l, i) => ({ ...l, _idx: i }));
    if (!estadoFacturacionFilter) return withIdx;
    return withIdx.filter((l) => (l.estado_facturacion ?? "PENDIENTE") === estadoFacturacionFilter);
  }, [lineas, estadoFacturacionFilter]);

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
    <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
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
                buttonClassName="h-10 rounded-xl w-full"
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
                className="min-w-0 flex-1 basis-full sm:basis-auto sm:flex-initial rounded-xl border border-(--color-primary) bg-(--color-primary)/10 px-3 py-2 text-sm text-(--color-text-primary)"
                role="status"
                aria-live="polite"
              >
                Servicio <span className="font-bold">{medicoChangedMessage.servicioDesc}</span> cambiado con médico <span className="font-bold">{medicoChangedMessage.medicoNombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* Servicios finales: título, tabla y monto (sin subcontenedor) */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-(--color-text-primary)">Servicios finales</h3>
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
                  buttonClassName="h-9 min-w-[120px]"
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
              <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
                No hay servicios. Use «Buscar servicio» para agregar.
              </div>
            ) : (
              <div className="space-y-2">
                {finalRows.map((item) => (
                    <div
                      key={item.id ?? `f-${item._idx}`}
                      onClick={() => setSelectedLineaIdx(item._idx)}
                      className={`rounded-2xl border border-(--border-color-default) p-4 ${
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
                            <span className="text-(--color-text-secondary)">Copago var</span>
                            <input
                              type="text"
                              placeholder=""
                              value={(item.cop_var ?? 0) === 0 ? "" : String(item.cop_var)}
                              onChange={(e) => updateLinea(item._idx, { cop_var: parseFloat(e.target.value) || 0 })}
                              onClick={(ev) => ev.stopPropagation()}
                              className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-center outline-none focus:ring-2 focus:ring-(--color-primary)"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Copago fijo</span>
                            <input
                              type="text"
                              placeholder=""
                              value={(item.cop_fijo ?? 0) === 0 ? "" : String(item.cop_fijo)}
                              onChange={(e) => updateLinea(item._idx, { cop_fijo: parseFloat(e.target.value) || 0 })}
                              onClick={(ev) => ev.stopPropagation()}
                              className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-center outline-none focus:ring-2 focus:ring-(--color-primary)"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Descuento</span>
                            <input
                              type="text"
                              placeholder=""
                              value={(item.descuento_pct ?? 0) === 0 ? "" : String(item.descuento_pct)}
                              onChange={(e) => updateLinea(item._idx, { descuento_pct: parseFloat(e.target.value) || 0 })}
                              onClick={(ev) => ev.stopPropagation()}
                              className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-center outline-none focus:ring-2 focus:ring-(--color-primary)"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Aumento</span>
                            {item.recargo_noche_activo ? (
                              <span className="h-9 flex items-center justify-center tabular-nums text-sm text-(--color-text-primary)">
                                {(item.aumento_pct ?? 0) === 0 ? "—" : `${item.aumento_pct}%`}
                              </span>
                            ) : (
                              <input
                                type="text"
                                placeholder=""
                                value={(item.aumento_pct ?? 0) === 0 ? "" : String(item.aumento_pct)}
                                onChange={(e) => updateLinea(item._idx, { aumento_pct: parseFloat(e.target.value) || 0 })}
                                onClick={(ev) => ev.stopPropagation()}
                                className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-center outline-none focus:ring-2 focus:ring-(--color-primary)"
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Cantidad</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.cantidad ?? 1}
                              onChange={(e) => updateLinea(item._idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                              onClick={(ev) => ev.stopPropagation()}
                              className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-center outline-none focus:ring-2 focus:ring-(--color-primary)"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Precio s/ IGV</span>
                            {item.desea_liberar_precio ? (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={precioSinIgvEditing?.idx === item._idx ? precioSinIgvEditing.value : String(item.precio_sin_igv ?? 0)}
                                onFocus={() => setPrecioSinIgvEditing({ idx: item._idx, value: String(item.precio_sin_igv ?? 0) })}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/,/g, ".");
                                  setPrecioSinIgvEditing({ idx: item._idx, value: raw });
                                  const parsed = parseFloat(raw);
                                  if (raw.trim() === "" || (Number.isFinite(parsed) && parsed >= 0)) {
                                    updateLinea(item._idx, { precio_sin_igv: parsed || 0 });
                                  }
                                }}
                                onBlur={() => {
                                  const raw = precioSinIgvEditing?.idx === item._idx ? precioSinIgvEditing.value : String(item.precio_sin_igv ?? 0);
                                  const v = parseFloat(raw) || 0;
                                  updateLinea(item._idx, { precio_sin_igv: v });
                                  setPrecioSinIgvEditing(null);
                                }}
                                onClick={(ev) => ev.stopPropagation()}
                                className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums text-right outline-none focus:ring-2 focus:ring-(--color-primary)"
                              />
                            ) : (
                              <span className="h-9 flex items-center tabular-nums text-(--color-text-primary)">S/. {(item.precio_sin_igv ?? 0).toFixed(PRECISION_DECIMAL)}</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Precio c/ IGV</span>
                            <span className="h-9 flex items-center tabular-nums text-(--color-text-primary)">S/. {(item.precio_con_igv ?? 0).toFixed(PRECISION_DECIMAL)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Médico</span>
                            <span className="h-9 flex items-center text-(--color-text-primary)">{getMedicoCodigo(item.medico_id, item.medico_codigo, medicosOptions)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-(--color-text-secondary)">Usuario</span>
                            <span className="h-9 flex items-center text-(--color-text-primary)">{item.user_username ?? item.user_nombre ?? "—"}</span>
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
          <div className="mt-4 flex justify-end border-t border-(--border-color-default) pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-(--color-text-secondary)">Monto a pagar S/.</span>
              <span className="min-w-28 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 py-2 text-center text-sm font-semibold tabular-nums text-(--color-text-primary)">
                {montoAPagar.toFixed(PRECISION_DECIMAL)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
