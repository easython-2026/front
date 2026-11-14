import { Navigate, Outlet, useLocation } from "react-router";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute 실행됨");
  console.log("로그인 상태:", isAuthenticated);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}