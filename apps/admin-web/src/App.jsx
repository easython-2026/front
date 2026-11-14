import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AdminLayout from "./components/AdminLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCases from "./pages/AdminCases";
import AdminCaseDetail from "./pages/AdminCaseDetail";
import AdminMessages from "./pages/AdminMessages";
import AdminCloseCase from "./pages/AdminCloseCase";

export default function App() {
  return (
    <Routes>
      {/* 관리자 로그인 */}
      <Route
        path="/login"
        element={<AdminLogin />}
      />

      {/* 인증된 관리자 전용 페이지 */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/"
            element={
              <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/cases"
            element={<AdminCases />}
          />

          <Route
            path="/cases/:caseId"
            element={<AdminCaseDetail />}
          />

          <Route
            path="/cases/:caseId/messages"
            element={<AdminMessages />}
          />

          <Route
            path="/cases/:caseId/close"
            element={<AdminCloseCase />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
    </Routes>
  );
}