import type { RouteMeta } from "../../app/router/routeMeta.types";

export const admisionMeta: Record<string, RouteMeta> = {
    "/admision": {
        title: "Admisión",
        subtitle: "Gestión del ingreso del paciente, registro de información clínica, programación de citas y control administrativo.",
        breadcrumb: [{ label: "Admisión" }],
    },

    "/admision/historia-clinica": {
        title: "Historia clínica",
        subtitle: "Registro y consulta de información clínica del paciente.",
        breadcrumb: [{ label: "Admisión", path: "/admision" }, { label: "Historia clínica" }],
    },
    "/admision/historia-clinica/pre-facturacion-hospitalaria": {
        title: "Pre-Facturacion Hospitalaria",
        subtitle: "Selección de paciente y plan para pre-facturación hospitalaria.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Historia clínica", path: "/admision/historia-clinica" },
            { label: "Pre-Facturacion Hospitalaria" },
        ],
    },

    "/admision/historia-clinica/nuevo": {
        title: "Historia clínica",
        subtitle: "Registro inicial del paciente e historia clínica.",
        breadcrumb: [
        { label: "Admisión", path: "/admision" },
        { label: "Historia clínica", path: "/admision/historia-clinica" },
        { label: "Nuevo" },
        ],
    },

    "/admision/citas/programacion": {
        title: "Programación médica",
        subtitle: "Planificación y control de la atención médica según disponibilidad y especialidad",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Programación médica" },
        ],
    },
    "/admision/citas/presupuestos": {
        title: "Presupuestos",
        subtitle: "Consulta y generación de presupuestos de admisión.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Presupuestos" },
        ],
    },
    "/admision/citas/presupuestos/nuevo": {
        title: "Nuevo presupuesto",
        subtitle: "Genera un presupuesto nuevo.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Presupuestos", path: "/admision/citas/presupuestos" },
            { label: "Nuevo" },
        ],
    },
    "/admision/citas/presupuestos/nuevo/buscar-servicios": {
        title: "Buscar servicios",
        subtitle: "Búsqueda y selección de servicios del tarifario.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Presupuestos", path: "/admision/citas/presupuestos" },
            { label: "Nuevo presupuesto", path: "/admision/citas/presupuestos/nuevo" },
            { label: "Buscar servicios" },
        ],
    },
    "/admision/citas/agenda": {
        title: "Gestión de citas",
        subtitle: "Agendamiento de citas según programación médica.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Gestión de citas" },
        ],
    },
    "/admision/citas/agenda/pacientes": {
        title: "Gestión de citas",
        subtitle: "Selecciona un paciente para la cita.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Gestión de citas", path: "/admision/citas/agenda" },
            { label: "Pacientes" },
        ],
    },
    "/admision/citas/agenda/nueva": {
        title: "Agendar cita",
        subtitle: "Completa los datos y selecciona el paciente para generar la cita.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Gestión de citas", path: "/admision/citas/agenda" },
            { label: "Agendar cita" },
        ],
    },
    "/admision/citas/agenda/:citaId/atencion": {
        title: "Atención de cita",
        subtitle: "Registro de la atención médica, evolución clínica y acciones relacionadas a la cita del paciente.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Gestión de citas", path: "/admision/citas/agenda" },
            { label: "Atención de cita" },
        ],
    },
    "/admision/citas/agenda/:citaId/atencion/buscar-servicios": {
        title: "Buscar servicios",
        subtitle: "Búsqueda y selección de servicios del tarifario.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Gestión de citas", path: "/admision/citas/agenda" },
            { label: "Atención de cita", path: "/admision/citas/agenda/:citaId/atencion" },
            { label: "Buscar servicios" },
        ],
    },
};

  