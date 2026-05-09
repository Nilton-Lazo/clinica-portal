import { FileText } from "lucide-react";
import type { FacturacionHubItem } from "../types/facturacionHub.types";

export const FACTURACION_HUB: FacturacionHubItem[] = [
  {
    id: "tarifario",
    title: "Tarifario",
    description: "Configura precios y servicios",
    icon: FileText,
    to: "/facturacion/tarifario",
    actions: [],
  },
];
