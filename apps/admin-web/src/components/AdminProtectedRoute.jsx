
import { Navigate, Outlet, useLocation } from "react-router";
import { isAdminLoggedIn } from "../services/adminAuthApi";

export default function AdminProtectedRoute() {
  const location = useLocation();

  if (!isAdminLoggedIn()) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}
