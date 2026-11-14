
import {
  Routes,
  Route,
  Navigate,
} from "react-router";

import UserLayout from "./layouts/UserLayout";
import PagePlaceholder from "./components/PagePlaceholder";

import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import Signup from "./pages/auth/Signup";

import Attendance from "./pages/user/Attendance";

import AttendanceCapture from "./pages/user/AttendanceCapture";

import AttendanceHistory from "./pages/user/AttendanceHistory";

import Contracts from "./pages/user/Contracts";
import ContractUpload from "./pages/user/ContractUpload";
import ContractDetail from "./pages/user/ContractDetail";

import ContractReview from "./pages/user/ContractReview";

import SalaryUpload from "./pages/user/SalaryUpload";
import SalaryStatement from "./pages/user/SalaryStatement";

// Figma 디자인 완성 전 사용할 임시 화면
const page = (title) => (
  <PagePlaceholder title={title} />
);

export default function App() {
  return (
    <Routes>
      {/* 시작 페이지 */}
      <Route
        path="/"
        element={<Navigate to="/onboarding" replace />}
      />

      {/* 0. 계정 및 온보딩 - 로그인 없이 접근 가능 */}
      <Route
        path="/onboarding"
        element={page("온보딩")}
      />

      <Route 
        path="/signup" 
        element={<Signup />} 
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={page("비밀번호 재설정")}
      />

      {/* 로그인한 사용자만 접근 가능 */}
      <Route element={<ProtectedRoute />}>

        {/* 근로자 공통 레이아웃 */}
        <Route element={<UserLayout />}>

          {/* 2. 홈 및 출퇴근 기록 */}
          <Route
            path="/home"
            element={page("홈")}
          />

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            path="/attendance/capture/:type"
            element={<AttendanceCapture />}
          />

          <Route
            path="/attendance/history"
            element={<AttendanceHistory />}
          />

          <Route
            path="/attendance/:recordId"
            element={page("근무기록 상세")}
          />

          {/* 1. 근로계약서 */}
          <Route
            path="/contracts"
            element={<Contracts />}
          />

          <Route
            path="/contracts/new"
            element={<ContractUpload />}
          />

          <Route
            path="/contracts/:contractId"
            element={<ContractDetail />}
          />

          <Route
            path="/contracts/:contractId/review"
            element={<ContractReview />}
          />

          {/* 3. 급여 비교 */}
          <Route
            path="/salary"
            element={page("급여 비교")}
          />

          <Route
            path="/salary/upload"
            element={<SalaryUpload />}
          />

          <Route
            path="/salary/:statementId"
            element={<SalaryStatement />}
          />

          {/* 4. 리포트 및 진정서 */}
          <Route
            path="/reports"
            element={page("월별 리포트")}
          />

          <Route
            path="/petitions"
            element={page("진정서 목록")}
          />

          <Route
            path="/petitions/new"
            element={page("진정서 생성")}
          />

          <Route
            path="/petitions/:petitionId"
            element={page("진정서 상세")}
          />

          {/* 4. 상담 연결 */}
          <Route
            path="/consultations"
            element={page("내 상담 목록")}
          />

          <Route
            path="/consultations/new"
            element={page("상담 신청")}
          />

          <Route
            path="/consultations/:caseId"
            element={page("상담 상세")}
          />

          {/* 5. 내 정보 */}
          <Route
            path="/profile"
            element={page("내 정보")}
          />

          <Route
            path="/workplace"
            element={page("근무장소 및 사업장")}
          />

        </Route>
      </Route>

      {/* 존재하지 않는 페이지 */}
      <Route
        path="*"
        element={page("404 페이지를 찾을 수 없습니다")}
      />
    </Routes>
  );
}
