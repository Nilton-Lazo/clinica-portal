import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginPage from "../../modules/login/pages/LoginPage";
import FacturacionHomePage from "../../modules/facturacion/pages/FacturacionHomePage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },

  { path: "/login", element: <LoginPage /> },

  { path: "/facturacion", element: <FacturacionHomePage /> },
]);
