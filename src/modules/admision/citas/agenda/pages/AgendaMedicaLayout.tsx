import { Outlet } from "react-router-dom";
import { AgendaMedicaProvider } from "../hooks/AgendaMedicaContext";

export default function AgendaMedicaLayout() {
  return (
    <AgendaMedicaProvider>
      <Outlet />
    </AgendaMedicaProvider>
  );
}
