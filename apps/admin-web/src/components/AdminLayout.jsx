
import { useState } from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router";

import {
  LayoutDashboard,
  ClipboardList,
  MessagesSquare,
  UsersRound,
  LogOut,
  LoaderCircle,
  UserRound,
  Building2,
  FileCheck2,
} from "lucide-react";

import {
  getAdminAuth,
} from "../services/adminApi";

import {
  logoutAdmin,
} from "../services/adminAuthApi";

import "./AdminLayout.css";

import symbolLogo from "../assets/symbol-logo.svg";
import wordmarkLogo from "../assets/wordmark-logo-ivory.svg";

// ========================================
// 관리자 사이드바 메뉴
// ========================================

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/cases",
    label: "사건 목록",
    icon: ClipboardList,
    end: false,
  },
  {
    to: "/completed",
    label: "종결 상담 내역",
    icon: FileCheck2,
    end: true,
  },
  {
    to: "/messages",
    label: "상담 메시지함",
    icon: MessagesSquare,
    end: true,
  },
  {
    to: "/staff",
    label: "기관 담당자",
    icon: UsersRound,
    end: true,
  },
];

// ========================================
// 관리자 공통 레이아웃
// ========================================

export default function AdminLayout() {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] =
    useState(false);

  // 기존 로그인 API의 data.staff 사용
  const staff = getAdminAuth()?.staff;

  const staffName =
    staff?.name || "관리자";

  const agencyName =
    staff?.agencyName || "상담기관";

  const staffInitial =
    staff?.name?.slice(0, 1) || "관";

  // ========================================
  // 관리자 로그아웃
  // ========================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      // 기존 로그아웃 API 호출
      await logoutAdmin();
    } catch (error) {
      // 기존 서비스가 실패 시에도
      // 로컬 인증을 삭제하는 구조 유지
      console.error(
        "로그아웃 요청 실패:",
        error.message
      );
    } finally {
      navigate("/login", {
        replace: true,
      });

      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-shell">
      {/* ====================================
          왼쪽 사이드바
      ==================================== */}

      <aside className="admin-shell__sidebar">
        {/* 브랜드 로고 */}

        <div className="admin-shell__brand">
            <div className="admin-shell__logo">
                <img
                src={symbolLogo}
                alt=""
                className="admin-shell__symbol-img"
                />
            </div>

            <div className="admin-shell__brand-text">
                <img
                src={wordmarkLogo}
                alt="일한만큼"
                className="admin-shell__wordmark-img"
                />

                <span>상담기관 관리자</span>
            </div>
        </div>

        {/* ====================================
            관리자 메뉴
        ==================================== */}

        <nav
          className="admin-shell__nav"
          aria-label="관리자 메뉴"
        >
          {NAV_ITEMS.map(
            ({
              to,
              label,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `admin-shell__nav-link ${
                    isActive
                      ? "is-active"
                      : ""
                  }`
                }
              >
                <span className="admin-shell__nav-icon">
                  <Icon
                    size={21}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>

                <span className="admin-shell__nav-label">
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        {/* ====================================
            하단 관리자 정보
        ==================================== */}

        <div className="admin-shell__sidebar-bottom">
          {/* 관리자 프로필 */}

          <div className="admin-shell__profile">
            <div
              className="admin-shell__avatar"
              aria-hidden="true"
            >
              {staffInitial}
            </div>

            <div className="admin-shell__profile-text">
                <strong>{staffName}</strong>

              <span title={agencyName}>
                {agencyName}
              </span>
            </div>
          </div>

          {/* 로그아웃 버튼 */}

          <button
            type="button"
            className="admin-shell__logout"
            onClick={handleLogout}
            disabled={loggingOut}
            title={
              loggingOut
                ? "로그아웃 중"
                : "로그아웃"
            }
            aria-label={
              loggingOut
                ? "로그아웃 중"
                : "로그아웃"
            }
          >
            {loggingOut ? (
              <LoaderCircle
                size={21}
                strokeWidth={1.8}
                className="admin-shell__spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}

            <span className="admin-shell__logout-label">
              {loggingOut
                ? "로그아웃 중..."
                : "로그아웃"}
            </span>
          </button>
        </div>
      </aside>

      {/* ====================================
          오른쪽 작업 영역
      ==================================== */}

      <div className="admin-shell__workspace">
        {/* 상단 헤더 */}

        <header className="admin-shell__header">
          <div className="admin-shell__header-title">
            <span>
              상담기관 관리자
            </span>

            <h1>
              일한만큼 관리센터
            </h1>
          </div>

          <div className="admin-shell__header-right">
            {/* 상담기관 정보 */}

            <div className="admin-shell__agency">
              <Building2
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>
                {agencyName}
              </span>
            </div>

            {/* 로그인 관리자 정보 */}

            <div
              className="admin-shell__header-profile"
              title={`${staffName} 담당자`}
            >
              <div className="admin-shell__header-avatar">
                {staffInitial}
              </div>

              <div className="admin-shell__header-profile-text">
                <strong>
                  {staffName}
                </strong>

                <span>
                  <UserRound
                    size={12}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  관리자
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ====================================
            페이지 렌더링
        ==================================== */}

        <main className="admin-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
