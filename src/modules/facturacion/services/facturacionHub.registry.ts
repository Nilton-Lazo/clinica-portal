import {
    ClipboardList,
    Package,
    Search,
    BadgeCheck,
    ReceiptText,
    FileText,
    LineChart,
    BadgeDollarSign,
  } from "lucide-react";
  import type { FacturacionHubItem } from "../types/facturacionHub.types";
  
  export const FACTURACION_HUB: FacturacionHubItem[] = [
    {
      id: "procesos",
      title: "Procesos",
      description: "Gestiona la facturación diaria",
      icon: ClipboardList,
      to: "/facturacion/procesos",
      actions: [
        { id: "pre-amb", label: "Pre-Facturación ambulatoria", to: "/facturacion/procesos/pre-ambulatoria" },
        { id: "pre-hosp", label: "Pre-Facturación hospitalaria", to: "/facturacion/procesos/pre-hospitalaria" },
        { id: "ingreso", label: "Ingreso de prestaciones", to: "/facturacion/procesos/ingreso" },
        { id: "consulta", label: "Consulta de prestaciones", to: "/facturacion/procesos/consulta" },
      ],
    },
    {
      id: "paquetes",
      title: "Paquetes",
      description: "Controla los paquetes de atención",
      icon: Package,
      to: "/facturacion/paquetes",
      actions: [
        { id: "registro", label: "Registro de paquetes", to: "/facturacion/paquetes/registro" },
        { id: "consulta", label: "Consulta de paquetes", to: "/facturacion/paquetes/consulta" },
      ],
    },
    {
      id: "consultas",
      title: "Consultas",
      description: "Visualiza información de facturación",
      icon: Search,
      to: "/facturacion/consultas",
      actions: [],
    },
    {
      id: "entidades",
      title: "Entidades y Contratos",
      description: "Administra aseguradoras y planes",
      icon: BadgeCheck,
      to: "/facturacion/entidades",
      actions: [],
    },
    {
      id: "comprobantes",
      title: "Comprobantes y cuentas",
      description: "Controla la emisión y seguimiento",
      icon: ReceiptText,
      to: "/facturacion/comprobantes",
      actions: [],
    },
    {
      id: "tarifario",
      title: "Tarifario",
      description: "Configura precios y servicios",
      icon: FileText,
      to: "/facturacion/tarifario",
      actions: [],
    },
    {
      id: "reportes",
      title: "Reportes",
      description: "Analiza ingresos y facturación",
      icon: LineChart,
      to: "/facturacion/reportes",
      actions: [],
    },
    {
      id: "facturacion",
      title: "Facturación",
      description: "Administra facturación y egresos",
      icon: BadgeDollarSign,
      to: "/facturacion/facturacion",
      actions: [],
    },
  ];
  