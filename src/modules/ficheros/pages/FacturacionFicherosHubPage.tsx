import {
  Copy,
  FolderTree,
  Package,
  Handshake,
  IdCard,
  Receipt,
  ShieldCheck,
  Tags,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  FicherosModuleHub,
  type FicherosModuleHubOption,
} from "../components/FicherosModuleHub";

const options: FicherosModuleHubOption[] = [
  {
    to: "/ficheros/tipos-iafas",
    label: "Tipos de IAFAS",
    description: "Clasifica los tipos de aseguradoras o financiadores de salud.",
    icon: ShieldCheck,
  },
  {
    to: "/ficheros/iafas",
    label: "IAFAS",
    description: "Administra aseguradoras, cobertura, vigencia y datos tributarios.",
    icon: IdCard,
  },
  {
    to: "/ficheros/contratantes",
    label: "Contratantes",
    description: "Mantiene empresas o entidades contratantes de planes y convenios.",
    icon: Handshake,
  },
  {
    to: "/ficheros/tarifas",
    label: "Tarifas",
    description: "Gestiona tarifarios operativos, base y reglas comerciales.",
    icon: Receipt,
  },
  {
    to: "/ficheros/tipos-clientes",
    label: "Tipos de clientes",
    description: "Relaciona clientes, contratantes, IAFAS y tarifa operativa.",
    icon: UserRoundCheck,
  },
  {
    to: "/ficheros/clonacion-tarifa",
    label: "Clonación de tarifa",
    description: "Replica estructuras y servicios desde el tarifario base.",
    icon: Copy,
  },
  {
    to: "/ficheros/tarifario-categorias",
    label: "Categorías",
    description: "Mantiene categorías tarifarias por tarifa seleccionada.",
    icon: Tags,
  },
  {
    to: "/ficheros/tarifario-subcategorias",
    label: "Subcategorías",
    description: "Organiza subcategorías tarifarias dependientes de categorías.",
    icon: FolderTree,
  },
  {
    to: "/ficheros/paquetes",
    label: "Paquetes",
    description: "Administra paquetes comerciales asociados a una tarifa.",
    icon: Package,
  },
  {
    to: "/ficheros/paquetes-servicios",
    label: "Servicios por paquete",
    description: "Sincroniza servicios tarifarios incluidos en cada paquete.",
    icon: FolderTree,
  },
  {
    to: "/ficheros/clientes",
    label: "Clientes",
    description: "Gestiona clientes naturales o jurídicos vinculados a la atención.",
    icon: UsersRound,
  },
];

export default function FacturacionFicherosHubPage() {
  return <FicherosModuleHub options={options} />;
}
