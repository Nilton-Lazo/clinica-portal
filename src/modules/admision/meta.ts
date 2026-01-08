import type { RouteMeta } from "../../app/router/routeMeta.types";

export const admisionMeta: Record<string, RouteMeta> = {
    "/admision": {
        title: "Admisión",
        subtitle: "Gestión del ingreso del paciente, registro de información clínica, programación de citas y control administrativo.",
        breadcrumb: [{ label: "Admisión" }],
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
};

  