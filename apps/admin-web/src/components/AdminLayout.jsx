
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";

import { getAdminAuth } from "../services/adminApi";
import { logoutAdmin } from "../services/adminAuthApi";

import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // 로그인 API의 data.staff 사용
  const staff = getAdminAuth()?.staff;

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutAdmin();
    } catch (error) {
      // 서버 로그아웃 실패 시에도 로컬 인증은 삭제됨
      console.error("로그아웃 요청 실패:", error.message);
    } finally {
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-shell">
      {/* 왼쪽 사이드바 */}
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">
          <div className="admin-shell__logo">일</div>
          <div className="admin-shell__brand-text">
            <strong>일한만큼</strong>
            <span>상담기관 관리자</span>
          </div>
        </div>

        <nav className="admin-shell__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `admin-shell__nav-link ${
                isActive ? "is-active" : ""
              }`
            }
          >
            <span className="admin-shell__nav-icon">⌂</span>
            <span>대시보드</span>
          </NavLink>

          <NavLink
            to="/cases"
            className={({ isActive }) =>
              `admin-shell__nav-link ${
                isActive ? "is-active" : ""
              }`
            }
          >
            <span className="admin-shell__nav-icon">▤</span>
            <span>사건 목록</span>
          </NavLink>
        </nav>

        <div className="admin-shell__sidebar-bottom">
          <div className="admin-shell__profile">
            <div className="admin-shell__avatar">
              {staff?.name?.slice(0, 1) || "관"}
            </div>

            <div className="admin-shell__profile-text">
              <strong>
                {staff?.name || "관리자"} 담당자
              </strong>
              <span>
                {staff?.agencyName || "상담기관"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-shell__logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span aria-hidden="true">⇥</span>
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </aside>

      {/* 오른쪽 작업 영역 */}
      <div className="admin-shell__workspace">
        <header className="admin-shell__header">
          <div className="admin-shell__header-title">
            <span>상담기관 관리자</span>
            <h1>일한만큼 관리센터</h1>
          </div>

          <div className="admin-shell__header-right">
            <div className="admin-shell__agency">
              {staff?.agencyName || "상담기관"}
            </div>

            <div className="admin-shell__header-avatar">
              {staff?.name?.slice(0, 1) || "관"}
            </div>
          </div>
        </header>

        <main className="admin-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
