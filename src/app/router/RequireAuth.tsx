import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../../modules/login/services/auth.service";

export default function RequireAuth() {
  if (!authService.hasSession()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
