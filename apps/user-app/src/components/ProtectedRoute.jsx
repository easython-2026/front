import { Outlet } from "react-router";

export default function ProtectedRoute() {
  // 개발 중 임시로 로그인 인증 생략
  return <Outlet />;
}