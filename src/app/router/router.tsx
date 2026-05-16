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
import TarifarioGestionRedirect from "../../modules/facturacion/tarifario/pages/TarifarioGestionRedirect";
import TarifarioClonacionPage from "../../modules/ficheros/pages/TarifarioClonacionPage";
import TarifarioCategoriasPage from "../../modules/ficheros/pages/TarifarioCategoriasPage";
import TarifarioSubcategoriasPage from "../../modules/ficheros/pages/TarifarioSubcategoriasPage";
import AdmisionHomePage from "../../modules/admision/pages/AdmisionHomePage";

import FicherosPage from "../../modules/ficheros/pages/FicherosPage";
import EspecialidadesPage from "../../modules/ficheros/pages/EspecialidadesPage";
import ConsultoriosPage from "../../modules/ficheros/pages/ConsultoriosPage";
import MedicosPage from "../../modules/ficheros/pages/MedicosPage";
import TurnosPage from "../../modules/ficheros/pages/TurnosPage";
import ClientesPage from "../../modules/ficheros/pages/ClientesPage";
import PaquetesPage from "../../modules/ficheros/pages/PaquetesPage";
import PaqueteServiciosPage from "../../modules/ficheros/pages/PaqueteServiciosPage";
import CirugiasPage from "../../modules/ficheros/pages/CirugiasPage";
import HospitalizacionParametrosLayout from "../../modules/ficheros/parametros/hospitalizacion/pages/HospitalizacionParametrosLayout";
import HospitalizacionParametrosHubPage from "../../modules/ficheros/parametros/hospitalizacion/pages/HospitalizacionParametrosHubPage";

import ProgramacionMedicaPage from "../../modules/admision/citas/pages/ProgramacionMedicaPage";
import AgendaMedicaLayout from "../../modules/admision/citas/agenda/pages/AgendaMedicaLayout";
import AgendaMedicaPage from "../../modules/admision/citas/agenda/pages/AgendaMedicaPage";
import AgendaPacienteSelectPage from "../../modules/admision/citas/agenda/pages/AgendaPacienteSelectPage";
import AgendaMedicaNuevaCitaPage from "../../modules/admision/citas/agenda/pages/AgendaMedicaNuevaCitaPage";
import AtencionCitaPage from "../../modules/admision/citas/agenda/pages/AtencionCitaPage";
import BuscarServiciosPage from "../../modules/admision/citas/agenda/pages/BuscarServiciosPage";
import PresupuestosPage from "../../modules/admision/citas/presupuestos/pages/PresupuestosPage";
import PresupuestoNuevoPage from "../../modules/admision/citas/presupuestos/pages/PresupuestoNuevoPage";
import TiposIafasPage from "../../modules/ficheros/pages/TiposIafasPage";
import IafasPage from "../../modules/ficheros/pages/IafasPage";
import ContratantesPage from "../../modules/ficheros/pages/ContratantesPage";
import TarifasPage from "../../modules/ficheros/pages/TarifasPage";
import TiposClientesPage from "../../modules/ficheros/pages/TiposClientesPage";
import ParametrosIgvPage from "../../modules/ficheros/pages/ParametrosIgvPage";
import RecargoNochePage from "../../modules/ficheros/pages/RecargoNochePage";
import EmergenciaParametrosLayout from "../../modules/ficheros/parametros/emergencia/pages/EmergenciaParametrosLayout";
import EmergenciaParametrosHubPage from "../../modules/ficheros/parametros/emergencia/pages/EmergenciaParametrosHubPage";
import TipoEmergenciaPage from "../../modules/ficheros/parametros/emergencia/pages/TipoEmergenciaPage";
import TopicoPage from "../../modules/ficheros/parametros/emergencia/pages/TopicoPage";
import TipoDocumentoPage from "../../modules/ficheros/parametros/emergencia/pages/TipoDocumentoPage";
import DocumentoAtencionPage from "../../modules/ficheros/parametros/emergencia/pages/DocumentoAtencionPage";
import ServiciosDefaultEmergenciaPage from "../../modules/ficheros/parametros/emergencia/pages/ServiciosDefaultEmergenciaPage";
import CajaParametrosLayout from "../../modules/ficheros/parametros/caja/pages/CajaParametrosLayout";
import CajaParametrosHubPage from "../../modules/ficheros/parametros/caja/pages/CajaParametrosHubPage";
import AreaJefaturaPage from "../../modules/ficheros/parametros/caja/pages/AreaJefaturaPage";
import TipoDocumentoCajaPage from "../../modules/ficheros/parametros/caja/pages/TipoDocumentoCajaPage";
import NumeracionComprobanteCajaPage from "../../modules/ficheros/parametros/caja/pages/NumeracionComprobanteCajaPage";
import FormaPagoCajaPage from "../../modules/ficheros/parametros/caja/pages/FormaPagoCajaPage";
import MedioPagoCajaPage from "../../modules/ficheros/parametros/caja/pages/MedioPagoCajaPage";
import BancoTarjetaCajaPage from "../../modules/ficheros/parametros/caja/pages/BancoTarjetaCajaPage";

import HistoriaPage from "../../modules/admision/historia-clinica/pages/HistoriaPage";
import PacienteWizardPage from "../../modules/admision/historia-clinica/pages/PacienteWizardPage";
import PreFacturacionHospitalariaPage from "../../modules/admision/historia-clinica/pages/PreFacturacionHospitalariaPage";

import EmergenciaHomePage from "../../modules/emergencia/pages/EmergenciaHomePage";
import RegistroEmergenciaPage from "../../modules/emergencia/pages/RegistroEmergenciaPage";
import AtencionEmergenciaPage from "../../modules/emergencia/pages/AtencionEmergenciaPage";
import NuevoRegistroEmergenciaPage from "../../modules/emergencia/registro/pages/NuevoRegistroEmergenciaPage";
import CajaHomePage from "../../modules/caja/pages/CajaHomePage";
import AperturaCajaPage from "../../modules/caja/pages/AperturaCajaPage";
import EmisionComprobantesPage from "../../modules/caja/pages/EmisionComprobantesPage";
import ReporteIngresosCajaPage from "../../modules/caja/pages/ReporteIngresosCajaPage";

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
                path: "caja",
                children: [
                  { index: true, element: <CajaHomePage /> },
                  { path: "apertura", element: <AperturaCajaPage /> },
                  { path: "emision-comprobantes", element: <EmisionComprobantesPage /> },
                  { path: "reporte-ingresos", element: <ReporteIngresosCajaPage /> },
                ],
              },
              { path: "farmacia",            element: <ComingSoonPage /> },
              { path: "farmacia/*",          element: <ComingSoonPage /> },
              { path: "hospital",            element: <ComingSoonPage /> },
              { path: "hospital/*",          element: <ComingSoonPage /> },
              {
                path: "emergencia",
                children: [
                  { index: true, element: <EmergenciaHomePage /> },
                  { path: "registro", element: <RegistroEmergenciaPage /> },
                  { path: "registro/nuevo", element: <NuevoRegistroEmergenciaPage /> },
                  { path: "registro/:id/editar", element: <NuevoRegistroEmergenciaPage /> },
                  { path: "atencion/:id", element: <AtencionEmergenciaPage /> },
                ],
              },
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
                  { path: "clientes", element: <ClientesPage /> },
                  { path: "paquetes", element: <PaquetesPage /> },
                  { path: "paquetes-servicios", element: <PaqueteServiciosPage /> },
                  { path: "tipos-iafas", element: <TiposIafasPage /> },
                  { path: "iafas", element: <IafasPage /> },
                  { path: "contratantes", element: <ContratantesPage /> },
                  { path: "clonacion-tarifa", element: <TarifarioClonacionPage /> },
                  { path: "tarifario-categorias", element: <TarifarioCategoriasPage /> },
                  { path: "tarifario-subcategorias", element: <TarifarioSubcategoriasPage /> },
                  { path: "tarifas", element: <TarifasPage /> },
                  { path: "tipos-clientes", element: <TiposClientesPage /> },
                  { path: "parametros/igv", element: <ParametrosIgvPage /> },
                  { path: "parametros/recargo-noche", element: <RecargoNochePage /> },
                  {
                    path: "parametros/emergencia",
                    element: <EmergenciaParametrosLayout />,
                    children: [
                      { index: true, element: <EmergenciaParametrosHubPage /> },
                      { path: "tipo", element: <TipoEmergenciaPage /> },
                      { path: "topico", element: <TopicoPage /> },
                      { path: "tipo-documento", element: <TipoDocumentoPage /> },
                      { path: "documento-atencion", element: <DocumentoAtencionPage /> },
                      { path: "servicios-defaults", element: <ServiciosDefaultEmergenciaPage /> },
                    ],
                  },
                  {
                    path: "parametros/hospitalizacion",
                    element: <HospitalizacionParametrosLayout />,
                    children: [
                      { index: true, element: <HospitalizacionParametrosHubPage /> },
                      { path: "cirugias", element: <CirugiasPage /> },
                    ],
                  },
                  {
                    path: "parametros/caja",
                    element: <CajaParametrosLayout />,
                    children: [
                      { index: true, element: <CajaParametrosHubPage /> },
                      { path: "area-jefatura", element: <AreaJefaturaPage /> },
                      { path: "tipo-documento", element: <TipoDocumentoCajaPage /> },
                      { path: "numeracion-comprobante", element: <NumeracionComprobanteCajaPage /> },
                      { path: "forma-pago", element: <FormaPagoCajaPage /> },
                      { path: "medio-pago", element: <MedioPagoCajaPage /> },
                      { path: "banco-tarjeta", element: <BancoTarjetaCajaPage /> },
                    ],
                  },
                ],
              },
              {
                path: "facturacion",
                children: [
                  { index: true, element: <FacturacionHomePage /> },
                  { path: "tarifario", element: <TarifarioPage /> },
                  { path: "tarifario/gestion/:tipo", element: <TarifarioGestionRedirect /> },
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
                      {
                        path: "pre-facturacion-hospitalaria/buscar-servicios",
                        element: <BuscarServiciosPage />,
                      },
                      { path: "pre-facturacion-hospitalaria", element: <PreFacturacionHospitalariaPage /> },
                      { path: "nuevo/*", element: <PacienteWizardPage /> },
                      { path: ":pacienteId/*", element: <PacienteWizardPage /> },
                    ],
                  },

                  {
                    path: "citas",
                    children: [
                      { index: true, element: <Navigate to="programacion" replace /> },
                      { path: "programacion", element: <ProgramacionMedicaPage /> },
                      { path: "presupuestos/nuevo/buscar-servicios", element: <BuscarServiciosPage /> },
                      { path: "presupuestos/nuevo", element: <PresupuestoNuevoPage /> },
                      { path: "presupuestos/:id", element: <PresupuestoNuevoPage /> },
                      { path: "presupuestos", element: <PresupuestosPage /> },
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
