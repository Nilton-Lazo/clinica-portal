import type { LucideIcon } from "lucide-react";

export type NavIconSpec =
  | { kind: "lucide"; icon: LucideIcon; strokeWidth?: number }
  | { kind: "image"; src: string; alt: string };

export type NavItem = {
  id: string;
  label: string;
  to: string;
  icon: NavIconSpec;
  disabled?: boolean;
};
