import { Link } from "react-router-dom";
import { BriefcaseBusiness, CreditCard, FileText, Hash, HandCoins, WalletCards } from "lucide-react";

const options = [
  {
    to: "/ficheros/parametros/caja/area-jefatura",
    label: "Área o Jefatura",
    description: "Gestiona áreas o jefaturas para la configuración del módulo de Caja.",
    icon: BriefcaseBusiness,
  },
  {
    to: "/ficheros/parametros/caja/tipo-documento",
    label: "Tipo de documento",
    description: "Gestiona tipos de documento para la configuración del módulo de Caja.",
    icon: FileText,
  },
  {
    to: "/ficheros/parametros/caja/numeracion-comprobante",
    label: "Numeración de comprobante",
    description: "Gestiona series y correlativos por tipo de documento para Caja.",
    icon: Hash,
  },
  {
    to: "/ficheros/parametros/caja/forma-pago",
    label: "Forma de pago",
    description: "Gestiona formas de pago para la configuración del módulo de Caja.",
    icon: HandCoins,
  },
  {
    to: "/ficheros/parametros/caja/medio-pago",
    label: "Medio de pago",
    description: "Gestiona medios de pago y su relación con formas de pago activas.",
    icon: WalletCards,
  },
  {
    to: "/ficheros/parametros/caja/banco-tarjeta",
    label: "Banco o tarjeta",
    description: "Gestiona bancos o tarjetas vinculados a formas y medios de pago activos.",
    icon: CreditCard,
  },
];

export default function CajaParametrosHubPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="min-w-0">
        <div className="text-base font-semibold text-(--color-text-primary)">Parámetros Caja</div>
        <div className="text-sm text-(--color-text-secondary)">
          Gestiona las opciones de configuración para el módulo de Caja.
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 rounded border border-(--border-color-default) bg-(--color-surface) p-4 transition-colors hover:border-(--color-primary)/40 hover:bg-(--color-surface-hover)"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-primary)/10">
              <Icon className="h-6 w-6 text-(--color-primary)" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-(--color-text-primary)">{label}</div>
              <div className="mt-0.5 text-xs text-(--color-text-secondary)">{description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
