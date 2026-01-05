import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import AppBootstrap from "./AppBootstrap";

import LoginPage from "../../modules/login/pages/LoginPage";
import HomePage from "../../modules/inicio/pages/HomePage";
import FacturacionHomePage from "../../modules/facturacion/pages/FacturacionHomePage";

export const router = createBrowserRouter([
  {
    element: <AppBootstrap />,
    children: [
      {
        path: "/",
        element: <Navigate to="/inicio" replace />,
      },

      {
        path: "/login",
        element: <LoginPage />,
      },

      {
        element: <RequireAuth />,
        children: [
          {
            path: "/inicio",
            element: <HomePage />,
          },
          {
            path: "/facturacion",
            element: <FacturacionHomePage />,
          },
        ],
      },
    ],
  },
]);
