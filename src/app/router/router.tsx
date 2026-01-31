import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import RequireGuest from "./RequireGuest";
import AppBootstrap from "./AppBootstrap";
import AppShell from "../layout/AppShell";

import LoginPage from "../../modules/login/pages/LoginPage";
import HomePage from "../../modules/inicio/pages/HomePage";
import FacturacionHomePage from "../../modules/facturacion/pages/FacturacionHomePage";
import TarifarioPage from "../../modules/facturacion/tarifario/pages/TarifarioPage";
import TarifarioCrudPage from "../../modules/facturacion/tarifario/pages/TarifarioCrudPage";
import TarifarioCrudLayoutPage from "../../modules/facturacion/tarifario/pages/TarifarioCrudLayoutPage";
import AdmisionHomePage from "../../modules/admision/pages/AdmisionHomePage";

import FicherosPage from "../../modules/admision/ficheros/pages/FicherosPage";
import EspecialidadesPage from "../../modules/admision/ficheros/pages/EspecialidadesPage";
import ConsultoriosPage from "../../modules/admision/ficheros/pages/ConsultoriosPage";
import MedicosPage from "../../modules/admision/ficheros/pages/MedicosPage";
import TurnosPage from "../../modules/admision/ficheros/pages/TurnosPage";

import ProgramacionMedicaPage from "../../modules/admision/citas/pages/ProgramacionMedicaPage";

import TiposIafasPage from "../../modules/admision/ficheros/pages/TiposIafasPage";
import IafasPage from "../../modules/admision/ficheros/pages/IafasPage";
import ContratantesPage from "../../modules/admision/ficheros/pages/ContratantesPage";
import TarifasPage from "../../modules/admision/ficheros/pages/TarifasPage";
import TiposClientesPage from "../../modules/admision/ficheros/pages/TiposClientesPage";

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
                    ],
                  },

                  {
                    path: "citas",
                    children: [
                      { index: true, element: <Navigate to="programacion" replace /> },
                      { path: "programacion", element: <ProgramacionMedicaPage /> },
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
