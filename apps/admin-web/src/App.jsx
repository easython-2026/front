
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router";

function Page({ title }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>{title}</h1>
      <Link to="/dashboard">대시보드로 이동</Link>
    </main>
  );
}

function AdminLayout() {
  return (
    <div>
      <header style={{ padding: 20 }}>
        <h2>이지톤 상담기관 관리자</h2>
        <nav style={{ display: "flex", gap: 20 }}>
          <Link to="/dashboard">대시보드</Link>
          <Link to="/cases">상담 사건 목록</Link>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Page title="관리자 로그인" />}
      />

      <Route element={<AdminLayout />}>
        <Route
          path="/dashboard"
          element={<Page title="상담 현황 대시보드" />}
        />

        <Route
          path="/cases"
          element={<Page title="동의 사건 목록" />}
        />

        <Route
          path="/cases/:caseId"
          element={<Page title="상담 사건 상세" />}
        />
      </Route>

      <Route
        path="*"
        element={<Page title="404 페이지 없음" />}
      />
    </Routes>
  );
}
