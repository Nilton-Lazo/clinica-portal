import { ClipboardList } from "lucide-react";
import type { EmergenciaHubItem } from "../types/emergenciaHub.types";

export const EMERGENCIA_HUB: EmergenciaHubItem[] = [
  {
    id: "registro",
    title: "Registro de Emergencia",
    description: "Panel de emergencias y registro de ingresos",
    icon: ClipboardList,
    to: "/emergencia/registro",
    actions: [
      { id: "registro", label: "Registro de Emergencia", to: "/emergencia/registro" },
    ],
  },
];
