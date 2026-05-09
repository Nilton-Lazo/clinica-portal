import { FileText, CalendarDays } from "lucide-react";
import type { AdmisionHubItem } from "../types/admisionHub.types";

export const ADMISION_HUB: AdmisionHubItem[] = [
  {
    id: "historia-clinica",
    title: "Historia clínica",
    description: "Gestiona datos clínicos del paciente",
    icon: FileText,
    to: "/admision/historia-clinica",
    actions: [
      {
        id: "principal",
        label: "Historia clínica principal",
        to: "/admision/historia-clinica",
      },
      {
        id: "pre-facturacion-hospitalaria",
        label: "Pre-Facturacion Hospitalaria",
        to: "/admision/historia-clinica/pre-facturacion-hospitalaria",
      },
    ],
  },
  {
    id: "citas",
    title: "Citas",
    description: "Administra la agenda médica",
    icon: CalendarDays,
    to: "/admision/citas",
    actions: [
      {
        id: "programacion",
        label: "Programación médica",
        to: "/admision/citas/programacion",
      },
      { id: "agenda", label: "Gestión de citas", to: "/admision/citas/agenda" },
      { id: "presupuestos", label: "Presupuestos", to: "/admision/citas/presupuestos" },
    ],
  },
];
