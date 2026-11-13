
import {
  Routes,
  Route,
  Navigate,
} from "react-router";

// 관리자 페이지
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCases from "./pages/AdminCases";
import AdminCaseDetail from "./pages/AdminCaseDetail";

// 관리자 공통 컴포넌트
import AdminLayout from "./components/AdminLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// 404 페이지
function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h2>404 - 페이지를 찾을 수 없습니다.</h2>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 기본 경로 → 대시보드 */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* 관리자 로그인 */}
      <Route
        path="/login"
        element={<AdminLogin />}
      />

      {/* 관리자 로그인 필수 페이지 */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* 관리자 대시보드 */}
          <Route
            path="/dashboard"
            element={<AdminDashboard />}
          />

          {/* 상담 사건 목록 */}
          <Route
            path="/cases"
            element={<AdminCases />}
          />

          {/* 상담 사건 상세 */}
          <Route
            path="/cases/:caseId"
            element={<AdminCaseDetail />}
          />
        </Route>
      </Route>

      {/* 존재하지 않는 경로 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}
