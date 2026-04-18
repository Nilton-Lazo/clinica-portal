import { DoorOpen, Receipt, type LucideIcon } from "lucide-react";

export type CajaHubItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
};

export const CAJA_HUB_ITEMS: CajaHubItem[] = [
  {
    id: "apertura",
    title: "Apertura de caja",
    description: "Registra el saldo inicial y abre el turno de caja.",
    icon: DoorOpen,
    to: "/caja/apertura",
  },
  {
    id: "emision-comprobantes",
    title: "Emisión de comprobantes",
    description: "Genera y administra comprobantes de pago según la normativa vigente.",
    icon: Receipt,
    to: "/caja/emision-comprobantes",
  },
];
