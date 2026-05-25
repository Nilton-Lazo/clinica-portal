import { Building2, Clock, Stethoscope, UserRound } from "lucide-react";
import {
  FicherosModuleHub,
  type FicherosModuleHubOption,
} from "../components/FicherosModuleHub";

const options: FicherosModuleHubOption[] = [
  {
    to: "/ficheros/especialidades",
    label: "Especialidades",
    description: "Gestiona las especialidades clínicas usadas en admisión y agenda.",
    icon: Stethoscope,
  },
  {
    to: "/ficheros/consultorios",
    label: "Consultorios",
    description: "Configura los ambientes o consultorios disponibles para atención.",
    icon: Building2,
  },
  {
    to: "/ficheros/medicos",
    label: "Médicos",
    description: "Administra médicos, especialidad, colegiatura y datos profesionales.",
    icon: UserRound,
  },
  {
    to: "/ficheros/turnos",
    label: "Turnos",
    description: "Define turnos horarios reutilizables para la programación médica.",
    icon: Clock,
  },
];

export default function AdmisionFicherosHubPage() {
  return <FicherosModuleHub options={options} />;
}
