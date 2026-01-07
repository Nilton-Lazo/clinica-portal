import type { NavItem } from "./nav.types";
import {
  ClipboardPlus,
  CreditCard,
  ReceiptText,
  Pill,
  Hospital,
  Stethoscope,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export const NAV_ITEMS: NavItem[] = [
  { id: "admision", label: "Admisión", to: "/admision", icon: { kind: "lucide", icon: ClipboardPlus} },
  { id: "caja", label: "Caja", to: "/caja", icon: { kind: "lucide", icon: CreditCard } },
  { id: "facturacion", label: "Facturación", to: "/facturacion", icon: { kind: "lucide", icon: ReceiptText } },
  { id: "farmacia", label: "Farmacia", to: "/farmacia", icon: { kind: "lucide", icon: Pill } },
  { id: "hospital", label: "Hospital", to: "/hospital", icon: { kind: "lucide", icon: Hospital } },
  { id: "diagnostico", label: "D. clínico", to: "/diagnostico-clinico", icon: { kind: "lucide", icon: Stethoscope } },
  { id: "gerencia", label: "Gerencia", to: "/gerencia", icon: { kind: "lucide", icon: BarChart3 } },
  { id: "seguridad", label: "Seguridad", to: "/seguridad", icon: { kind: "lucide", icon: ShieldCheck } },
];
