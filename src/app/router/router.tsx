import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import RequireGuest from "./RequireGuest";
import AppBootstrap from "./AppBootstrap";
import AppShell from "../layout/AppShell";

import LoginPage from "../../modules/login/pages/LoginPage";
import HomePage from "../../modules/inicio/pages/HomePage";
import FacturacionHomePage from "../../modules/facturacion/pages/FacturacionHomePage";
import AdmisionHomePage from "../../modules/admision/pages/AdmisionHomePage";


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
              { path: "facturacion", element: <FacturacionHomePage /> },
              { path: "admision", element: <AdmisionHomePage /> },
            ],
          },
        ],
      },
    ],
  },
]);
