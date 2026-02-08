import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton, DangerButton } from "../../../../../shared/ui/buttons";
import { ConfirmDialog } from "../../../ficheros/components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { getIgvPorcentaje } from "../services/atencionCita.service";
import type {
  AtencionServicioLineaDisplay,
  PrecargaServicioItem,
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
  const precioSinIgv = Math.round(subtotal * 1000) / 1000;
  const igv = precioSinIgv * (igvPct / 100);
  const precioConIgv = Math.round((precioSinIgv + igv) * 1000) / 1000;
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
    <div className="flex justify-end items-baseline gap-0">
      <span className="inline-block w-10 shrink-0 text-right tabular-nums">S/. </span>
      <span className="tabular-nums inline-block min-w-18 text-right">
        {valor.toFixed(3)}
      </span>
    </div>
  );
}

export type ServiciosSolicitadosSectionProps = {
  medicoTratanteId: number | null;
  medicoTratanteLabel: string;
  tarifaId: number | null;
  tarifaDescripcion: string | null;
  precargaServicios: PrecargaServicioItem[];
  onPrecargaChange: (items: PrecargaServicioItem[]) => void;
  lineas: AtencionServicioLineaDisplay[];
  onLineasChange: (lineas: AtencionServicioLineaDisplay[]) => void;
  medicosOptions: SelectOption[];
  currentUsername: string;
  citaId: number;
  hasPendingDataChanges?: boolean;
  onActualizarDatos?: () => Promise<void>;
  pendingChangesMessage?: string;
};

export function ServiciosSolicitadosSection({
  medicoTratanteId,
  medicoTratanteLabel,
  tarifaId,
  tarifaDescripcion,
  precargaServicios,
  onPrecargaChange,
  lineas,
  onLineasChange,
  medicosOptions,
  currentUsername,
  citaId,
  hasPendingDataChanges = false,
  onActualizarDatos,
  pendingChangesMessage = "",
}: ServiciosSolicitadosSectionProps) {
  const navigate = useNavigate();
  const [igvPct, setIgvPct] = React.useState(18);
  const [selectedPrecargaIdx, setSelectedPrecargaIdx] = React.useState<number | null>(null);
  const [confirmActualizarOpen, setConfirmActualizarOpen] = React.useState(false);
  const [actualizando, setActualizando] = React.useState(false);

  const doNavigateBuscar = React.useCallback(() => {
    navigate(`/admision/citas/agenda/${citaId}/atencion/buscar-servicios`, {
      state: {
        tarifaId,
        tarifaDescripcion,
        returnLineas: lineas,
        returnPrecarga: precargaServicios,
      },
    });
  }, [navigate, citaId, tarifaId, tarifaDescripcion, lineas, precargaServicios]);

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

  const medicoOptionsForPrecarga = React.useMemo(() => {
    return medicosOptions.length ? medicosOptions : [{ value: "", label: "Seleccione médico" }];
  }, [medicosOptions]);

  const selectedPrecarga = selectedPrecargaIdx != null ? precargaServicios[selectedPrecargaIdx] : null;

  const handleMedicoChange = React.useCallback(
    (value: string) => {
      if (selectedPrecargaIdx == null) return;
      const id = value ? Number(value) : medicoTratanteId ?? 0;
      const opt = medicosOptions.find((o) => o.value === (value || String(medicoTratanteId ?? "")));
      const label = opt?.label ?? medicoTratanteLabel;
      const raw = opt?.label ?? "";
      const codigo = raw.includes(" · ") ? raw.split(" · ")[0]?.trim() ?? "" : raw.split(/\s+/)[0] ?? "";
      const nombre = (raw.includes(" · ") ? raw.split(" · ").slice(1).join(" · ").trim() : raw.split(/\s+/).slice(1).join(" ").trim()) || medicoTratanteLabel;
      onPrecargaChange(
        precargaServicios.map((p, i) =>
          i === selectedPrecargaIdx
            ? { ...p, medico_id: id, medico_codigo: codigo, medico_nombre: nombre }
            : p
        )
      );
    },
    [selectedPrecargaIdx, precargaServicios, medicosOptions, medicoTratanteId, medicoTratanteLabel, onPrecargaChange]
  );

  const updatePrecarga = React.useCallback(
    (idx: number, upd: Partial<PrecargaServicioItem>) => {
      const p = precargaServicios[idx];
      if (!p) return;
      const factorDesc = Math.max(0.01, 1 - (p.descuento_pct ?? 0) / 100);
      const factorAum = 1 + (p.aumento_pct ?? 0) / 100;
      const precioBase = p.precio_sin_igv / Math.max(0.001, p.cantidad) / factorDesc / factorAum;
      const next = { ...p, ...upd };
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
      onPrecargaChange(precargaServicios.map((item, i) => (i === idx ? next : item)));
    },
    [precargaServicios, onPrecargaChange, igvPct]
  );

  const handleCargarServicios = React.useCallback(() => {
    const nuevas: AtencionServicioLineaDisplay[] = precargaServicios.map((p) => ({
      tarifa_servicio_id: p.tarifa_servicio_id,
      medico_id: p.medico_id,
      cop_var: p.cop_var,
      cop_fijo: p.cop_fijo,
      descuento_pct: p.descuento_pct,
      aumento_pct: p.aumento_pct,
      cantidad: p.cantidad,
      precio_sin_igv: p.precio_sin_igv,
      precio_con_igv: p.precio_con_igv,
      servicio_codigo: p.servicio_codigo,
      servicio_descripcion: p.servicio_descripcion,
      medico_codigo: p.medico_codigo,
      user_nombre: currentUsername,
    }));
    onLineasChange([...lineas, ...nuevas]);
    onPrecargaChange([]);
    setSelectedPrecargaIdx(null);
  }, [precargaServicios, lineas, onLineasChange, onPrecargaChange, currentUsername]);

  const handleRemoveLinea = React.useCallback(
    (idx: number) => {
      onLineasChange(lineas.filter((_, i) => i !== idx));
    },
    [lineas, onLineasChange]
  );

  const handleRemovePrecarga = React.useCallback(
    (idx: number) => {
      onPrecargaChange(precargaServicios.filter((_, i) => i !== idx));
      if (selectedPrecargaIdx === idx) setSelectedPrecargaIdx(null);
      else if (selectedPrecargaIdx != null && selectedPrecargaIdx > idx) setSelectedPrecargaIdx(selectedPrecargaIdx - 1);
    },
    [precargaServicios, onPrecargaChange, selectedPrecargaIdx]
  );

  const precargaColumns: DataTableColumn<PrecargaServicioItem & { _idx: number }>[] = [
    { key: "codigo", header: "Código", headerClassName: "text-center w-24", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => x.servicio_codigo || "—" },
    {
      key: "descripcion",
      header: "Descripción de servicio",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2 min-w-[140px]",
      render: (x) => <span className="truncate block">{x.servicio_descripcion || "—"}</span>,
    },
    {
      key: "cop_var",
      header: "Copago variable",
      headerClassName: "text-center w-28",
      cellClassName: "px-2 py-2",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={x.cop_var === 0 ? "" : String(x.cop_var)}
          onChange={(e) => updatePrecarga(x._idx, { cop_var: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "cop_fijo",
      header: "Copago fijo",
      headerClassName: "text-center w-28",
      cellClassName: "px-2 py-2",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={x.cop_fijo === 0 ? "" : String(x.cop_fijo)}
          onChange={(e) => updatePrecarga(x._idx, { cop_fijo: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "descuento",
      header: "Descuento",
      headerClassName: "text-center w-24",
      cellClassName: "px-2 py-2",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={x.descuento_pct === 0 ? "" : String(x.descuento_pct)}
          onChange={(e) => updatePrecarga(x._idx, { descuento_pct: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "aumento",
      header: "Aumento",
      headerClassName: "text-center w-24",
      cellClassName: "px-2 py-2",
      render: (x) => (
        <input
          type="text"
          placeholder=""
          value={x.aumento_pct === 0 ? "" : String(x.aumento_pct)}
          onChange={(e) => updatePrecarga(x._idx, { aumento_pct: parseFloat(e.target.value) || 0 })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      headerClassName: "text-center w-24",
      cellClassName: "px-2 py-2",
      render: (x) => (
        <input
          type="number"
          min={1}
          step={1}
          value={x.cantidad}
          onChange={(e) => updatePrecarga(x._idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          onClick={(ev) => ev.stopPropagation()}
          className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      ),
    },
    {
      key: "precio_sin_igv",
      header: <span className="whitespace-nowrap">Precio sin IGV</span>,
      headerClassName: "text-right w-32 min-w-[7rem]",
      cellClassName: "px-3 py-2 text-right whitespace-nowrap",
      render: (x) => <PrecioCell valor={x.precio_sin_igv} />,
    },
    {
      key: "precio_con_igv",
      header: <span className="whitespace-nowrap">Precio con IGV</span>,
      headerClassName: "text-right w-32 min-w-[7rem]",
      cellClassName: "px-3 py-2 text-right whitespace-nowrap",
      render: (x) => <PrecioCell valor={x.precio_con_igv} />,
    },
    {
      key: "actions_precarga",
      header: "",
      headerClassName: "w-14",
      cellClassName: "px-2 py-2 text-center",
      render: (x) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DangerButton
            type="button"
            onClick={() => handleRemovePrecarga(x._idx)}
            className="h-9 min-w-9 px-2 flex items-center justify-center shrink-0"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </DangerButton>
        </div>
      ),
    },
  ];

  const tieneAumento = lineas.some((l) => (l.aumento_pct ?? 0) !== 0);

  const finalColumns: DataTableColumn<AtencionServicioLineaDisplay & { _idx: number }>[] = React.useMemo(() => {
    const base: DataTableColumn<AtencionServicioLineaDisplay & { _idx: number }>[] = [
      { key: "codigo", header: "Código", headerClassName: "text-center w-24", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => x.servicio_codigo ?? "—" },
      {
        key: "descripcion",
        header: "Descripción de servicio",
        headerClassName: "text-left",
        cellClassName: "px-3 py-2 min-w-[140px]",
        render: (x) => <span className="truncate block">{x.servicio_descripcion ?? "—"}</span>,
      },
      { key: "cop_var", header: "Copago variable", headerClassName: "text-center w-28", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => (x.cop_var ?? 0).toFixed(2) },
      { key: "cop_fijo", header: "Copago fijo", headerClassName: "text-center w-28", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => (x.cop_fijo ?? 0).toFixed(2) },
      { key: "descuento", header: "Descuento", headerClassName: "text-center w-24", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => (x.descuento_pct ?? 0).toFixed(2) },
    ];
    if (tieneAumento) {
      base.push({ key: "aumento", header: "Aumento", headerClassName: "text-center w-24", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => (x.aumento_pct ?? 0).toFixed(2) });
    }
    base.push(
      { key: "cantidad", header: "Cantidad", headerClassName: "text-center w-24", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => (x.cantidad ?? 1).toFixed(2) },
      {
        key: "precio_con_igv",
      header: <span className="whitespace-nowrap">Precio con IGV</span>,
      headerClassName: "text-center w-32 min-w-[7rem]",
      cellClassName: "px-3 py-2 text-center whitespace-nowrap",
      render: (x) => (
        <div className="flex justify-center">
          <PrecioCell valor={x.precio_con_igv ?? 0} />
        </div>
      ),
    },
      { key: "medico", header: "Médico", headerClassName: "text-center w-20", cellClassName: "px-3 py-2 text-center tabular-nums", render: (x) => getMedicoCodigo(x.medico_id, x.medico_codigo, medicosOptions) },
      { key: "usuario", header: "Usuario", headerClassName: "text-center w-32", cellClassName: "px-3 py-2 text-center", render: (x) => x.user_nombre ?? "—" },
      {
        key: "actions",
        header: "",
        headerClassName: "w-14",
        cellClassName: "px-2 py-2 text-center",
        render: (x) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DangerButton
              type="button"
              onClick={() => handleRemoveLinea(x._idx)}
              className="h-9 min-w-9 px-2 flex items-center justify-center shrink-0"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </DangerButton>
          </div>
        ),
      },
    );
    return base;
  }, [tieneAumento, medicosOptions, handleRemoveLinea]);

  const precargaRows = precargaServicios.map((p, i) => ({ ...p, _idx: i }));
  const finalRows = lineas.map((l, i) => ({ ...l, _idx: i }));

  return (
    <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <h2 className="text-sm font-semibold text-(--color-text-primary)">Servicios solicitados</h2>

      <div className="mt-3 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={handleBuscarServicio} disabled={!tarifaId}>
            Buscar servicio
          </PrimaryButton>
        </div>

        <ConfirmDialog
          open={confirmActualizarOpen}
          title="Actualizar datos"
          description={pendingChangesMessage}
          confirmText={actualizando ? "Actualizando…" : "Actualizar datos"}
          cancelText="Cancelar"
          onCancel={() => !actualizando && setConfirmActualizarOpen(false)}
          onConfirm={onConfirmActualizar}
        />

        {/* Campo médico arriba de tabla precarga */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-(--color-text-secondary)">Asigne médico del servicio</span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[280px] min-w-[280px]">
              <SelectMenu
                value={selectedPrecarga ? (selectedPrecarga.medico_id ? String(selectedPrecarga.medico_id) : "") : (medicoTratanteId ? String(medicoTratanteId) : "")}
                onChange={(value) => {
                  if (selectedPrecargaIdx != null) handleMedicoChange(value);
                }}
                options={medicoOptionsForPrecarga}
                ariaLabel="Médico"
                buttonClassName="h-10 rounded-xl w-full"
                menuClassName="w-[280px] min-w-[280px]"
              />
            </div>
            {selectedPrecarga && (
              <SecondaryButton onClick={() => setSelectedPrecargaIdx(null)}>
                Deseleccionar
              </SecondaryButton>
            )}
          </div>
        </div>

        {/* Tabla precarga */}
        <div className="flex flex-col gap-2 rounded-2xl bg-(--color-panel-options-bg) p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-(--color-text-primary)">Servicios a precargar</h3>
            {precargaServicios.length > 0 && (
              <PrimaryButton onClick={handleCargarServicios}>Cargar servicios</PrimaryButton>
            )}
          </div>
          <div className="hidden lg:block">
            <DataTable
              rows={precargaRows}
              columns={precargaColumns}
              loading={false}
              selectedId={selectedPrecargaIdx != null ? `p-${selectedPrecargaIdx}` : null}
              getRowId={(x) => `p-${x._idx}`}
              onSelect={(x) => setSelectedPrecargaIdx(x._idx)}
              emptyText="No hay servicios precargados."
            />
          </div>
          <div className="lg:hidden">
            {precargaServicios.length === 0 ? (
              <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
                No hay servicios precargados.
              </div>
            ) : (
              <div className="space-y-2">
                {precargaServicios.map((p, idx) => (
                  <div
                    key={`p-${idx}`}
                    onClick={() => setSelectedPrecargaIdx(idx)}
                    className={`rounded-2xl border border-(--border-color-default) p-4 ${
                      selectedPrecargaIdx === idx ? "bg-(--color-surface-hover)" : "bg-(--color-surface)"
                    }`}
                  >
                    <div className="flex flex-col gap-3 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold tabular-nums text-(--color-primary)">{p.servicio_codigo || "—"}</span>
                          <span className="text-(--color-text-primary)"> · </span>
                          <span className="text-sm text-(--color-text-primary)">{p.servicio_descripcion || "—"}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DangerButton
                            type="button"
                            onClick={() => handleRemovePrecarga(idx)}
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
                            value={p.cop_var === 0 ? "" : String(p.cop_var)}
                            onChange={(e) => updatePrecarga(idx, { cop_var: parseFloat(e.target.value) || 0 })}
                            onClick={(ev) => ev.stopPropagation()}
                            className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Copago fijo</span>
                          <input
                            type="text"
                            placeholder=""
                            value={p.cop_fijo === 0 ? "" : String(p.cop_fijo)}
                            onChange={(e) => updatePrecarga(idx, { cop_fijo: parseFloat(e.target.value) || 0 })}
                            onClick={(ev) => ev.stopPropagation()}
                            className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Descuento</span>
                          <input
                            type="text"
                            placeholder=""
                            value={p.descuento_pct === 0 ? "" : String(p.descuento_pct)}
                            onChange={(e) => updatePrecarga(idx, { descuento_pct: parseFloat(e.target.value) || 0 })}
                            onClick={(ev) => ev.stopPropagation()}
                            className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Aumento</span>
                          <input
                            type="text"
                            placeholder=""
                            value={p.aumento_pct === 0 ? "" : String(p.aumento_pct)}
                            onChange={(e) => updatePrecarga(idx, { aumento_pct: parseFloat(e.target.value) || 0 })}
                            onClick={(ev) => ev.stopPropagation()}
                            className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Cantidad</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={p.cantidad}
                            onChange={(e) => updatePrecarga(idx, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            onClick={(ev) => ev.stopPropagation()}
                            className="h-9 w-full rounded-lg border border-(--border-color-default) bg-(--color-surface) px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-(--color-primary)"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Precio s/ IGV</span>
                          <span className="h-9 flex items-center tabular-nums text-(--color-text-primary)">S/. {p.precio_sin_igv.toFixed(3)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Precio c/ IGV</span>
                          <span className="h-9 flex items-center tabular-nums text-(--color-text-primary)">S/. {p.precio_con_igv.toFixed(3)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-(--color-text-secondary)">Médico</span>
                          <span className="h-9 flex items-center text-(--color-text-primary)">{getMedicoCodigo(p.medico_id, p.medico_codigo, medicosOptions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabla final */}
        <div className="flex flex-col gap-2 rounded-2xl bg-(--color-surface) p-4">
          <h3 className="text-sm font-medium text-(--color-text-primary)">Servicios finales</h3>
          <div className="hidden lg:block">
            <DataTable
              rows={finalRows}
              columns={finalColumns}
              loading={false}
              selectedId={null}
              getRowId={(x) => x.id ?? `f-${x._idx}`}
              onSelect={() => {}}
              emptyText="No hay servicios cargados."
            />
          </div>
          <div className="lg:hidden">
            <MobileEntityList
              rows={finalRows}
              loading={false}
              selectedId={null}
              getRowId={(x) => x.id ?? `f-${x._idx}`}
              onSelect={() => {}}
              renderMain={(item) => (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    <span className="tabular-nums">{item.servicio_codigo ?? "—"}</span>
                    <span className="text-(--color-text-primary)"> · </span>
                    <span>{item.servicio_descripcion ?? "—"}</span>
                  </div>
                  <div className="mt-1 text-xs flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Cop. var:</span> <span className="text-(--color-text-primary) font-normal">{(item.cop_var ?? 0).toFixed(2)}</span></span>
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Cop. fijo:</span> <span className="text-(--color-text-primary) font-normal">{(item.cop_fijo ?? 0).toFixed(2)}</span></span>
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Dscto:</span> <span className="text-(--color-text-primary) font-normal">{(item.descuento_pct ?? 0).toFixed(2)}</span></span>
                    {tieneAumento && (
                      <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Aum:</span> <span className="text-(--color-text-primary) font-normal">{(item.aumento_pct ?? 0).toFixed(2)}</span></span>
                    )}
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Cant:</span> <span className="text-(--color-text-primary) font-normal">{(item.cantidad ?? 1).toFixed(2)}</span></span>
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Precio c/ IGV:</span> <span className="text-(--color-text-primary) font-normal tabular-nums">S/. {(item.precio_con_igv ?? 0).toFixed(3)}</span></span>
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Méd:</span> <span className="text-(--color-text-primary) font-normal">{getMedicoCodigo(item.medico_id, item.medico_codigo, medicosOptions)}</span></span>
                    <span className="whitespace-nowrap"><span className="font-semibold text-(--color-text-secondary)">Usr:</span> <span className="text-(--color-text-primary) font-normal">{item.user_nombre ?? "—"}</span></span>
                  </div>
                </div>
              )}
              renderRight={(item) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <DangerButton
                    type="button"
                    onClick={() => handleRemoveLinea(item._idx)}
                    className="h-9 min-w-9 px-2 flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </DangerButton>
                </div>
              )}
              emptyText="No hay servicios cargados."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
