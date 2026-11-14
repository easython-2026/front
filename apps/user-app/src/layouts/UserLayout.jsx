
import { NavLink, Outlet, useLocation } from "react-router";
import PaydayPopup from "../components/PaydayPopup";
import "../styles/figma-worker.css";

const tabs = [
  { to: "/home", label: "홈", icon: "home" },
  { to: "/salary", label: "급여비교", icon: "wallet" },
  { to: "/reports", label: "리포트", icon: "report" },
  { to: "/profile", label: "내 정보", icon: "user" },
];

function NavIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h12" />
        <path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    report: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function UserLayout() {
  const { pathname } = useLocation();

  const showTabs = tabs.some(({ to }) => pathname === to);

  return (
    <div className="eth-worker-wrapper">
      <div
        className={`eth-worker-shell ${
          showTabs ? "" : "eth-worker-nested"
        }`}
      >
        <PaydayPopup />

        <Outlet />

        {showTabs && (
          <nav
            className="eth-bottom-nav"
            aria-label="주요 메뉴"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) =>
                  isActive ? "eth-nav-active" : ""
                }
              >
                <NavIcon name={tab.icon} />
                <span>{tab.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
