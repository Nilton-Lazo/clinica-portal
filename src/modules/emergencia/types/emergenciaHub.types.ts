import type { LucideIcon } from "lucide-react";

export type EmergenciaHubAction = {
  id: string;
  label: string;
  to: string;
};

export type EmergenciaHubItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  actions: EmergenciaHubAction[];
};
