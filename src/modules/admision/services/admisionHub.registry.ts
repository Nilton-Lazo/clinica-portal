import {
    FileText,
    CalendarDays,
    FlaskConical,
    Image,
    Microscope,
    Ambulance,
    Folder,
    WalletCards,
  } from "lucide-react";
  import type { AdmisionHubItem } from "../types/admisionHub.types";
  
  export const ADMISION_HUB: AdmisionHubItem[] = [
    {
      id: "historia-clinica",
      title: "Historia clínica",
      description: "Gestiona datos clínicos del paciente",
      icon: FileText,
      to: "/admision/historia-clinica",
      actions: [
        { id: "consulta", label: "Consulta Historia clínica", to: "/admision/historia-clinica/consulta" },
        { id: "busqueda", label: "Búsqueda de atención al paciente", to: "/admision/historia-clinica/busqueda-atencion" },
        { id: "prestaciones", label: "Prestaciones (Sin Historia clínica)", to: "/admision/historia-clinica/prestaciones-sin-hc" },
      ],
    },
    {
      id: "citas",
      title: "Citas",
      description: "Administra la agenda médica",
      icon: CalendarDays,
      to: "/admision/citas",
      actions: [
        { id: "agenda", label: "Agenda de citas", to: "/admision/citas/agenda" },
        { id: "nueva", label: "Registrar cita", to: "/admision/citas/nueva" },
        { id: "consultar", label: "Consultar citas", to: "/admision/citas/consulta" },
      ],
    },
    {
      id: "laboratorio",
      title: "Laboratorio",
      description: "Gestiona exámenes de laboratorio",
      icon: FlaskConical,
      to: "/admision/laboratorio",
      actions: [
        { id: "ordenes", label: "Órdenes de laboratorio", to: "/admision/laboratorio/ordenes" },
        { id: "resultados", label: "Resultados", to: "/admision/laboratorio/resultados" },
      ],
    },
    {
      id: "imagenologia",
      title: "Imagenología",
      description: "Administra estudios por imágenes",
      icon: Image,
      to: "/admision/imagenologia",
      actions: [
        { id: "ordenes", label: "Órdenes de imagen", to: "/admision/imagenologia/ordenes" },
        { id: "resultados", label: "Resultados", to: "/admision/imagenologia/resultados" },
      ],
    },
    {
      id: "patologia",
      title: "Patología",
      description: "Gestiona estudios patológicos",
      icon: Microscope,
      to: "/admision/patologia",
      actions: [
        { id: "ordenes", label: "Órdenes de patología", to: "/admision/patologia/ordenes" },
        { id: "informes", label: "Informes", to: "/admision/patologia/informes" },
      ],
    },
    {
      id: "emergencia",
      title: "Emergencia",
      description: "Administra atención de emergencia",
      icon: Ambulance,
      to: "/admision/emergencia",
      actions: [
        { id: "triaje", label: "Triaje", to: "/admision/emergencia/triaje" },
        { id: "atencion", label: "Atención", to: "/admision/emergencia/atencion" },
      ],
    },
    {
      id: "ficheros",
      title: "Ficheros",
      description: "Gestiona archivos clínicos",
      icon: Folder,
      to: "/admision/ficheros",
      actions: [
        { id: "pacientes", label: "Pacientes", to: "/admision/ficheros/pacientes" },
        { id: "medicos", label: "Médicos", to: "/admision/ficheros/medicos" },
        { id: "especialidades", label: "Especialidades", to: "/admision/ficheros/especialidades" },
      ],
    },
    {
      id: "caja",
      title: "Caja",
      description: "Controla operaciones de caja",
      icon: WalletCards,
      to: "/admision/caja",
      actions: [
        { id: "aperturas", label: "Apertura/Cierre", to: "/admision/caja/apertura-cierre" },
        { id: "movimientos", label: "Movimientos", to: "/admision/caja/movimientos" },
      ],
    },
  ];
  