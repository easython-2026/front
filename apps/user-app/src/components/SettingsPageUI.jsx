
import { Link } from "react-router";
import "../styles/figma-management.css";

const paths = {
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  camera: <>
    <path d="M4 7h4l2-2h4l2 2h4v12H4z"/>
    <circle cx="12" cy="13" r="4"/>
  </>,
  pin: <>
    <path d="M12 22s7-6.2 7-13a7 7 0 0 0-14 0c0 6.8 7 13 7 13Z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </>,
  shield: <>
    <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5z"/>
    <path d="m8 12 3 3 5-6"/>
  </>,
  file: <>
    <path d="M6 2h8l4 4v16H6z"/>
    <path d="M14 2v5h4M9 12h6m-6 4h6"/>
  </>,
  clock: <>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 2"/>
  </>,
  wallet: <>
    <rect x="3" y="6" width="18" height="14" rx="2"/>
    <path d="M3 10h18m-6 5h3"/>
  </>,
  bell: <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
    <path d="M10 21h4"/>
  </>,
  alert: <>
    <path d="m12 3 10 18H2z"/>
    <path d="M12 9v5m0 4h.01"/>
  </>,
  check: <path d="m5 12 4 4L19 6"/>,
  refresh: <>
    <path d="M20 7v5h-5M4 17v-5h5"/>
    <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15"/>
  </>,
  trash: <>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>
  </>,
  message: <>
    <path d="M3 4h18v14H8l-5 4z"/>
    <path d="M7 9h10m-10 4h7"/>
  </>,
};

export function SettingsIcon({ name, size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.file}
    </svg>
  );
}

export function SettingsHeader({
  title,
  back = "/profile",
  onRefresh,
  disabled = false,
}) {
  return (
    <header className="efx-header">
      <Link to={back} aria-label="뒤로 가기">
        <SettingsIcon name="back" />
      </Link>

      <strong>{title}</strong>

      {onRefresh ? (
        <button
          type="button"
          aria-label="새로고침"
          onClick={onRefresh}
          disabled={disabled}
        >
          <SettingsIcon name="refresh" size={18}/>
        </button>
      ) : <span/>}
    </header>
  );
}

export function SettingsNotice({
  tone = "info",
  children,
}) {
  if (!children) return null;

  return (
    <div
      className={`efx-notice efx-notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <SettingsIcon
        name={tone === "success" ? "check" : "alert"}
        size={17}
      />
      <span>{children}</span>
    </div>
  );
}

export function SettingsBadge({
  tone = "neutral",
  children,
}) {
  return (
    <span className={`efx-badge efx-badge-${tone}`}>
      {children}
    </span>
  );
}

export const unwrap = (response) =>
  response?.data ?? response;

export function settingsError(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }
  if (error?.status === 403) {
    return "이 정보에 접근할 권한이 없습니다.";
  }
  return error?.message ?? "요청을 처리하지 못했습니다.";
}

export function formatKst(value) {
  if (!value) return "일시 미제공";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
