
import { Link } from "react-router";
import "../styles/figma-evidence.css";

const icons = {
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  camera: <><path d="M4 7h4l2-2h4l2 2h4v12H4z" /><circle cx="12" cy="13" r="4" /></>,
  pin: <><path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 9v5m0 4h.01"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h4M9 12h6m-6 4h6"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5"/></>,
  edit: <><path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15"/></>,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5z"/><path d="m8 12 3 3 5-6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
};

export function FeatureIcon({ name, size = 20 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}
export function FeatureHeader({ title, back = "/home", badge }) {
  return <header className="ef-head"><Link to={back} aria-label="뒤로 가기"><FeatureIcon name="arrow"/></Link><strong>{title}</strong><span>{badge}</span></header>;
}
export function FeatureBadge({ children, tone = "neutral" }) {
  return <span className={`ef-badge ef-${tone}`}>{children}</span>;
}
export function FeatureNotice({ children, tone = "info" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`ef-notice ef-${tone}`}><FeatureIcon name={tone === "success" ? "check" : "alert"} size={17}/><span>{children}</span></div>;
}
export function FeatureButton({ children, type = "button", onClick, disabled, variant = "primary" }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`ef-button ef-button-${variant}`}>{children}</button>;
}
export function displayKst(value, options = { hour: "2-digit", minute: "2-digit", hour12: false }) {
  if (!value) return "기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "확인 불가";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ...options }).format(date);
}
export function displayMinutes(value) {
  if (value == null || !Number.isFinite(Number(value))) return "확인 필요";
  const n = Math.max(0, Number(value));
  return `${Math.floor(n / 60)}시간 ${String(Math.floor(n % 60)).padStart(2, "0")}분`;
}
export const unwrap = (response) => response?.data ?? response;
export const errorText = (error) => error?.status === 401 ? "로그인이 필요합니다. 로그인 상태를 확인해 주세요." : error?.message || "요청을 완료하지 못했습니다.";
