import type { LucideIcon } from "lucide-react";

export type AdmisionHubAction = {
  id: string;
  label: string;
  to: string;
};

export type AdmisionHubItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  actions: AdmisionHubAction[];
};
