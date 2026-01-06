import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../../modules/login/services/auth.service";

export default function RequireGuest() {
  if (authService.hasSession()) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}
