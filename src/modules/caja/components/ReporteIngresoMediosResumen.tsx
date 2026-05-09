import { formatDecimalFixed } from "../../../shared/constants/decimalPrecision";
import type { ReporteIngresosMedio } from "../services/reporteIngresosCaja.service";
import imgAmex from "../../../assets/images/amex.png";
import imgEfectivo from "../../../assets/images/efectivo.png";
import imgLogo from "../../../assets/images/logo.webp";
import imgPlin from "../../../assets/images/plin.png";
import imgTransferencia from "../../../assets/images/transferencia.png";
import imgVisa from "../../../assets/images/visa.png";
import imgYape from "../../../assets/images/yape.png";
import imgAdelanto from "../../../assets/images/adelanto.png";
import imgCredito from "../../../assets/images/credito.png";
import imgEgresos from "../../../assets/images/egresos.png";
import imgIngresos from "../../../assets/images/ingresos.png";

function iconSrc(codigo: string, descripcion: string): string {
  const t = `${codigo} ${descripcion}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("adelanto") || t.includes("custodia")) return imgAdelanto;
  if (t.includes("credito")) return imgCredito;
  if (t.includes("egreso")) return imgEgresos;
  if (t.includes("ingreso")) return imgIngresos;
  if (t.includes("yape")) return imgYape;
  if (t.includes("plin")) return imgPlin;
  if (t.includes("visa")) return imgVisa;
  if (t.includes("amex") || t.includes("american")) return imgAmex;
  if (t.includes("efect") || t.includes("cash") || /(^|\s)efe(\s|$)/.test(t)) return imgEfectivo;
  if (t.includes("transfer") || t.includes("bcp") || t.includes("abono") || t.includes("deposito") || t.includes("banco")) {
    return imgTransferencia;
  }
  return imgLogo;
}

function montoLabel(raw: string): string {
  const n = parseFloat(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n)) return "0.00";
  return formatDecimalFixed(n, 2);
}

function MedioCard(props: {
  medio: ReporteIngresosMedio;
  totalStr: string;
}) {
  const { medio, totalStr } = props;
  const src = iconSrc(medio.codigo, medio.descripcion);
  const cardClass =
    "grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-(--border-color-default) bg-(--color-surface) p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";

  return (
    <li className={cardClass}>
      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm ring-1 ring-black/5">
        <img src={src} alt="" className="max-h-9 max-w-[calc(100%-2px)] object-contain" loading="lazy" decoding="async" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-(--color-text-primary)">{medio.descripcion}</p>
        <p className="mt-0.5 truncate text-xs tabular-nums text-(--color-text-secondary)">{medio.codigo}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center text-right">
        <span className="text-[10px] font-medium uppercase tracking-wide text-(--color-text-secondary)">PEN</span>
        <span className="text-sm font-semibold tabular-nums text-(--color-text-primary)">S/. {montoLabel(totalStr)}</span>
      </div>
    </li>
  );
}

export function ReporteIngresoMediosResumen(props: {
  medios: ReporteIngresosMedio[];
  mediosAdicionales: ReporteIngresosMedio[];
  totalesPorMedio: Record<string, string>;
}) {
  const { medios, mediosAdicionales, totalesPorMedio } = props;

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 gap-2.5 sm:gap-3 xl:grid-cols-2">
        {medios.map((m) => {
          const totalStr = totalesPorMedio[String(m.id)] ?? "0.00";
          return <MedioCard key={`base-${m.id}`} medio={m} totalStr={totalStr} />;
        })}
      </ul>
      {mediosAdicionales.length > 0 ? (
        <div className="border-t border-(--color-border) pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">Complementarios</h3>
            <span className="h-px flex-1 bg-(--color-border)" aria-hidden />
          </div>
          <ul className="grid grid-cols-1 gap-2.5 sm:gap-3 xl:grid-cols-2">
            {mediosAdicionales.map((m) => {
              const totalStr = totalesPorMedio[String(m.id)] ?? "0.00";
              return <MedioCard key={`extra-${m.id}`} medio={m} totalStr={totalStr} />;
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
