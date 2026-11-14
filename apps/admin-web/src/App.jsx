
import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AdminLayout from "./components/AdminLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// 관리자 로그인
import AdminLogin from "./pages/AdminLogin";

// 대시보드
import AdminDashboard from "./pages/AdminDashboard";

// 상담 사건 관리
import AdminCases from "./pages/AdminCases";
import AdminCaseDetail from "./pages/AdminCaseDetail";
import AdminCompletedCases from "./pages/AdminCompletedCases";

// 상담 메시지
import AdminMessages from "./pages/AdminMessages";
import AdminMessageInbox from "./pages/AdminMessageInbox";

// 상담 결과 및 처리 기록
import AdminCloseCase from "./pages/AdminCloseCase";
import AdminCaseHistory from "./pages/AdminCaseHistory";

// 기관 담당자
import AdminStaff from "./pages/AdminStaff";

export default function App() {
  return (
    <Routes>
      {/* ====================================
          관리자 로그인
      ==================================== */}

      <Route
        path="/login"
        element={<AdminLogin />}
      />

      {/* ====================================
          인증된 관리자 전용 페이지
      ==================================== */}

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* 기본 경로 */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

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

          {/* 종결 상담 내역 - 신규 */}

          <Route
            path="/completed"
            element={<AdminCompletedCases />}
          />

          {/* 통합 상담 메시지함 */}

          <Route
            path="/messages"
            element={<AdminMessageInbox />}
          />

          {/* 기관 담당자 목록 */}

          <Route
            path="/staff"
            element={<AdminStaff />}
          />

          {/* 상담 사건 상세 */}

          <Route
            path="/cases/:caseId"
            element={<AdminCaseDetail />}
          />

          {/* 개별 상담 메시지 */}

          <Route
            path="/cases/:caseId/messages"
            element={<AdminMessages />}
          />

          {/* 상담 결과 기록 및 종결 */}

          <Route
            path="/cases/:caseId/close"
            element={<AdminCloseCase />}
          />

          {/* 상담 처리 기록 */}

          <Route
            path="/cases/:caseId/history"
            element={<AdminCaseHistory />}
          />
        </Route>
      </Route>

      {/* ====================================
          존재하지 않는 경로 처리
      ==================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
