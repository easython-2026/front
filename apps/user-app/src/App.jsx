
import {
  Routes,
  Route,
  Navigate,
} from "react-router";

// 공통 레이아웃 및 컴포넌트
import UserLayout from "./layouts/UserLayout";
import PagePlaceholder from "./components/PagePlaceholder";
import ProtectedRoute from "./components/ProtectedRoute";

// 인증
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/auth/Onboarding";
import ForgotPassword from "./pages/auth/ForgotPassword";

// 홈 및 출퇴근
import Attendance from "./pages/user/Attendance";
import AttendanceCapture from "./pages/user/AttendanceCapture";
import AttendanceHistory from "./pages/user/AttendanceHistory";
import AttendanceDetail from "./pages/user/AttendanceDetail";

// 근로계약서
import Contracts from "./pages/user/Contracts";
import ContractUpload from "./pages/user/ContractUpload";
import ContractReviewFigma from "./pages/user/ContractReviewFigma";

// 급여 비교
import Salary from "./pages/user/Salary";
import SalaryUpload from "./pages/user/SalaryUpload";
import SalaryStatement from "./pages/user/SalaryStatement";
import SalaryComparison from "./pages/user/SalaryComparison";

// 리포트 및 증거
import Reports from "./pages/user/Reports";
import Evidences from "./pages/user/Evidences";

// 진정서
import Petitions from "./pages/user/Petitions";
import PetitionCreate from "./pages/user/PetitionCreate";
import PetitionDetail from "./pages/user/PetitionDetail";

// 상담
import Consultations from "./pages/user/Consultations";
import ConsultationCreate from "./pages/user/ConsultationCreate";
import ConsultationDetail from "./pages/user/ConsultationDetail";

// 알림
import Notifications from "./pages/user/Notifications";

// 내 정보
import PrivacySettings from "./pages/user/PrivacySettings";
import PermissionSettings from "./pages/user/PermissionSettings";
import DataDeletion from "./pages/user/DataDeletion";
import Profile from "./pages/user/Profile";
import Workplace from "./pages/user/Workplace";
import BusinessInfo from "./pages/user/BusinessInfo";

// 홈
import Home from "./pages/user/Home";

// 아직 Figma UI가 없는 임시 화면
const page = (title) => (
  <PagePlaceholder title={title} />
);

export default function App() {
  return (
    <Routes>
      {/* ========================================
          0. 공개 페이지
      ======================================== */}

      <Route
        path="/"
        element={
          <Navigate to="/onboarding" replace />
        }
      />

      <Route
        path="/onboarding"
        element={<Onboarding />}
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
        element={<ForgotPassword />}
      />

      {/* ========================================
          1. 로그인 필수 페이지
      ======================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>

          {/* 홈 */}
          <Route
            path="/home"
            element={<Home />}
          />

          {/* ====================================
              출퇴근 및 근무기록
          ==================================== */}

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
            element={<AttendanceDetail />}
          />

          {/* ====================================
              근로계약서
          ==================================== */}

          {/* Figma 등록 화면 */}
          <Route
            path="/contracts"
            element={<ContractUpload />}
          />

          <Route
            path="/contracts/new"
            element={<ContractUpload />}
          />

          {/* 계약서 목록 */}
          <Route
            path="/contracts/list"
            element={<Contracts />}
          />

          {/* 분석 결과 및 수정 */}
          <Route
            path="/contracts/:contractId"
            element={<ContractReviewFigma />}
          />

          <Route
            path="/contracts/:contractId/review"
            element={<ContractReviewFigma />}
          />

          {/* ====================================
              급여 및 임금 비교
          ==================================== */}

          <Route
            path="/salary"
            element={<Salary />}
          />

          <Route
            path="/salary/upload"
            element={<SalaryUpload />}
          />

          <Route
            path="/salary/statements/:statementId"
            element={<SalaryStatement />}
          />

          <Route
            path="/salary/:comparisonId"
            element={<SalaryComparison />}
          />

          {/* ====================================
              월별 리포트 및 증거
          ==================================== */}

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/reports/evidences"
            element={<Evidences />}
          />

          {/* 이전 주소 호환 */}
          <Route
            path="/evidences"
            element={
              <Navigate
                to="/reports/evidences"
                replace
              />
            }
          />

          {/* ====================================
              진정서
          ==================================== */}

          <Route
            path="/petitions"
            element={<Petitions />}
          />

          <Route
            path="/petitions/new"
            element={<PetitionCreate />}
          />

          <Route
            path="/petitions/:petitionId"
            element={<PetitionDetail />}
          />

          {/* ====================================
              상담
          ==================================== */}

          <Route
            path="/consultations"
            element={<Consultations />}
          />

          <Route
            path="/consultations/new"
            element={<ConsultationCreate />}
          />

          <Route
            path="/consultations/:consultationId"
            element={<ConsultationDetail />}
          />

          {/* ====================================
              알림
          ==================================== */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          {/* ====================================
              내 정보
          ==================================== */}

          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* 개인정보 및 정보 공유 */}
          <Route
            path="/profile/consents"
            element={<PrivacySettings />}
          />

          {/* 카메라 / 위치 권한 */}
          <Route
            path="/profile/permissions/:type"
            element={<PermissionSettings />}
          />

          {/* 개인정보 삭제 요청 */}
          <Route
            path="/profile/data-deletion"
            element={<DataDeletion />}
          />

          {/* ====================================
              근무장소 및 사업장 정보
          ==================================== */}

          <Route
            path="/workplace"
            element={<Workplace />}
          />

          <Route
            path="/workplace/business"
            element={<BusinessInfo />}
          />

        </Route>
      </Route>

      {/* ========================================
          2. 없는 페이지
      ======================================== */}

      <Route
        path="*"
        element={page("404 페이지를 찾을 수 없습니다")}
      />
    </Routes>
  );
}
