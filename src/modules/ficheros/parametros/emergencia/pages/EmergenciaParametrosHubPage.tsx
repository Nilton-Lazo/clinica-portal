import { Link } from "react-router-dom";
import { AlertCircle, Tag, FileText, FileCheck } from "lucide-react";

const options = [
  {
    to: "/ficheros/parametros/emergencia/tipo",
    label: "Tipo Emergencia",
    description: "Gestiona tipos: Accidental, Externa, Médica, Accidente de trabajo, etc.",
    icon: AlertCircle,
  },
  {
    to: "/ficheros/parametros/emergencia/topico",
    label: "Tópico",
    description: "Gestiona tópicos: Tópico Emergencia, Tópico Urgencia.",
    icon: Tag,
  },
  {
    to: "/ficheros/parametros/emergencia/tipo-documento",
    label: "Tipo Documento",
    description: "Gestiona tipos de documento para SOAT y otros.",
    icon: FileText,
  },
  {
    to: "/ficheros/parametros/emergencia/documento-atencion",
    label: "Documento de Atención",
    description: "Gestiona documentos de atención con código único definido por el usuario.",
    icon: FileCheck,
  },
];

export default function EmergenciaParametrosHubPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="min-w-0">
        <div className="text-base font-semibold text-(--color-text-primary)">Parámetros Emergencia</div>
        <div className="text-sm text-(--color-text-secondary)">
          Gestiona las opciones de Tipo Emergencia, Tópico, Tipo Documento y Documento de Atención para el módulo de emergencias.
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
