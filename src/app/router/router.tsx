import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import RequireGuest from "./RequireGuest";
import AppBootstrap from "./AppBootstrap";
import AppShell from "../layout/AppShell";

import ComingSoonPage from "../../shared/ui/ComingSoonPage";
import LoginPage from "../../modules/login/pages/LoginPage";
import HomePage from "../../modules/inicio/pages/HomePage";
import FacturacionHomePage from "../../modules/facturacion/pages/FacturacionHomePage";
import TarifarioPage from "../../modules/facturacion/tarifario/pages/TarifarioPage";
import TarifarioCrudPage from "../../modules/facturacion/tarifario/pages/TarifarioCrudPage";
import TarifarioCrudLayoutPage from "../../modules/facturacion/tarifario/pages/TarifarioCrudLayoutPage";
import AdmisionHomePage from "../../modules/admision/pages/AdmisionHomePage";

import FicherosPage from "../../modules/ficheros/pages/FicherosPage";
import EspecialidadesPage from "../../modules/ficheros/pages/EspecialidadesPage";
import ConsultoriosPage from "../../modules/ficheros/pages/ConsultoriosPage";
import MedicosPage from "../../modules/ficheros/pages/MedicosPage";
import TurnosPage from "../../modules/ficheros/pages/TurnosPage";

import ProgramacionMedicaPage from "../../modules/admision/citas/pages/ProgramacionMedicaPage";
import AgendaMedicaLayout from "../../modules/admision/citas/agenda/pages/AgendaMedicaLayout";
import AgendaMedicaPage from "../../modules/admision/citas/agenda/pages/AgendaMedicaPage";
import AgendaPacienteSelectPage from "../../modules/admision/citas/agenda/pages/AgendaPacienteSelectPage";
import AgendaMedicaNuevaCitaPage from "../../modules/admision/citas/agenda/pages/AgendaMedicaNuevaCitaPage";
import AtencionCitaPage from "../../modules/admision/citas/agenda/pages/AtencionCitaPage";
import BuscarServiciosPage from "../../modules/admision/citas/agenda/pages/BuscarServiciosPage";

import TiposIafasPage from "../../modules/ficheros/pages/TiposIafasPage";
import IafasPage from "../../modules/ficheros/pages/IafasPage";
import ContratantesPage from "../../modules/ficheros/pages/ContratantesPage";
import TarifasPage from "../../modules/ficheros/pages/TarifasPage";
import TiposClientesPage from "../../modules/ficheros/pages/TiposClientesPage";
import ParametrosIgvPage from "../../modules/ficheros/pages/ParametrosIgvPage";
import RecargoNochePage from "../../modules/ficheros/pages/RecargoNochePage";

import HistoriaPage from "../../modules/admision/historia-clinica/pages/HistoriaPage";
import PacienteWizardPage from "../../modules/admision/historia-clinica/pages/PacienteWizardPage";

export const router = createBrowserRouter([
  {
    element: <AppBootstrap />,
    children: [
      { index: true, element: <Navigate to="inicio" replace /> },

      {
        element: <RequireGuest />,
        children: [{ path: "login", element: <LoginPage /> }],
      },

      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "inicio", element: <HomePage /> },

              { path: "caja",                element: <ComingSoonPage /> },
              { path: "caja/*",              element: <ComingSoonPage /> },
              { path: "farmacia",            element: <ComingSoonPage /> },
              { path: "farmacia/*",          element: <ComingSoonPage /> },
              { path: "hospital",            element: <ComingSoonPage /> },
              { path: "hospital/*",          element: <ComingSoonPage /> },
              { path: "diagnostico-clinico", element: <ComingSoonPage /> },
              { path: "diagnostico-clinico/*", element: <ComingSoonPage /> },
              { path: "gerencia",            element: <ComingSoonPage /> },
              { path: "gerencia/*",          element: <ComingSoonPage /> },
              { path: "seguridad",           element: <ComingSoonPage /> },
              { path: "seguridad/*",         element: <ComingSoonPage /> },
              { path: "*",                   element: <ComingSoonPage /> },

              {
                path: "ficheros",
                element: <FicherosPage />,
                children: [
                  { index: true, element: <Navigate to="especialidades" replace /> },
                  { path: "especialidades", element: <EspecialidadesPage /> },
                  { path: "consultorios", element: <ConsultoriosPage /> },
                  { path: "medicos", element: <MedicosPage /> },
                  { path: "turnos", element: <TurnosPage /> },
                  { path: "tipos-iafas", element: <TiposIafasPage /> },
                  { path: "iafas", element: <IafasPage /> },
                  { path: "contratantes", element: <ContratantesPage /> },
                  { path: "tarifas", element: <TarifasPage /> },
                  { path: "tipos-clientes", element: <TiposClientesPage /> },
                  { path: "parametros/igv", element: <ParametrosIgvPage /> },
                  { path: "parametros/recargo-noche", element: <RecargoNochePage /> },
                ],
              },
              {
                path: "facturacion",
                children: [
                  { index: true, element: <FacturacionHomePage /> },
                  { path: "tarifario", element: <TarifarioPage /> },
                  {
                    path: "tarifario/gestion",
                    element: <TarifarioCrudLayoutPage />,
                    children: [{ path: ":tipo", element: <TarifarioCrudPage /> }],
                  },
                ],
              },
              {
                path: "admision",
                children: [
                  { index: true, element: <AdmisionHomePage /> },

                  {
                    path: "historia-clinica",
                    children: [
                      { index: true, element: <HistoriaPage /> },
                  
                      { path: "nuevo/*", element: <PacienteWizardPage /> },
                      { path: ":pacienteId/*", element: <PacienteWizardPage /> },
                    ],
                  },

                  {
                    path: "citas",
                    children: [
                      { index: true, element: <Navigate to="programacion" replace /> },
                      { path: "programacion", element: <ProgramacionMedicaPage /> },
                      {
                        path: "agenda",
                        element: <AgendaMedicaLayout />,
                        children: [
                          { index: true, element: <AgendaMedicaPage /> },
                          { path: ":citaId/atencion", element: <AtencionCitaPage /> },
                          { path: ":citaId/atencion/buscar-servicios", element: <BuscarServiciosPage /> },
                          { path: "nueva", element: <AgendaMedicaNuevaCitaPage /> },
                          { path: "pacientes", element: <AgendaPacienteSelectPage /> },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
