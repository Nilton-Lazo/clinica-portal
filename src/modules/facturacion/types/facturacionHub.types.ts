import type { LucideIcon } from "lucide-react";

export type FacturacionHubAction = {
  id: string;
  label: string;
  to: string;
};

export type FacturacionHubItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  actions: FacturacionHubAction[];
};
