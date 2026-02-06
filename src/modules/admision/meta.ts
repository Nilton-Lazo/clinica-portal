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

    "/admision/historia-clinica/nuevo": {
        title: "Historia clínica",
        subtitle: "Registro inicial del paciente e historia clínica.",
        breadcrumb: [
        { label: "Admisión", path: "/admision" },
        { label: "Historia clínica", path: "/admision/historia-clinica" },
        { label: "Nuevo" },
        ],
    },

    "/admision/ficheros": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Ficheros" },
        ],
    },

    "/admision/ficheros/especialidades": {
        title: "Ficheros",
        subtitle: "Gestión de tablas maestras y registros configurables del sistema.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Ficheros", path: "/admision/ficheros" },
            { label: "Especialidades" },
        ],
    },

    "/admision/citas/programacion": {
        title: "Programación medica",
        subtitle: "Planificación y control de la atención médica según disponibilidad y especialidad",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Programacion" },
        ],
    },
    "/admision/citas/agenda": {
        title: "Agenda medica",
        subtitle: "Agendamiento de citas según programación médica.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Agenda médica" },
        ],
    },
    "/admision/citas/agenda/pacientes": {
        title: "Agenda medica",
        subtitle: "Selecciona un paciente para la cita.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Agenda médica", path: "/admision/citas/agenda" },
            { label: "Pacientes" },
        ],
    },
    "/admision/citas/agenda/nueva": {
        title: "Agenda medica",
        subtitle: "Generar cita.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Agenda médica", path: "/admision/citas/agenda" },
            { label: "Generar cita" },
        ],
    },
    "/admision/citas/agenda/:citaId/atencion": {
        title: "Atención de cita",
        subtitle: "Registro de la atención médica, evolución clínica y acciones relacionadas a la cita del paciente.",
        breadcrumb: [
            { label: "Admisión", path: "/admision" },
            { label: "Citas", path: "/admision/citas" },
            { label: "Agenda médica", path: "/admision/citas/agenda" },
            { label: "Atención de cita" },
        ],
    },
};

  