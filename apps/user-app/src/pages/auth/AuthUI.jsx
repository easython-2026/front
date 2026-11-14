
import { Link } from "react-router";
import "../../styles/figma-auth.css";

const iconPaths = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  camera: (
    <>
      <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),

  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h4M9 12h6M9 16h6" />
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

  check: (
    <path d="m5 12 4 4L19 6" />
  ),

  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),

  message: (
    <>
      <path d="M3 4h18v14H8l-5 4z" />
      <path d="M7 9h10M7 13h7" />
    </>
  ),

  chevron: (
    <path d="m9 5 7 7-7 7" />
  ),

  back: (
    <path d="M19 12H5M11 6l-6 6 6 6" />
  ),

  alert: (
    <>
      <path d="m12 3 10 18H2z" />
      <path d="M12 9v5M12 18h.01" />
    </>
  ),
};

export function AuthIcon({
  name,
  size = 20,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function AuthButton({
  children,
  disabled = false,
  loading = false,
  type = "button",
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="eth-auth-primary"
    >
      {children}
    </button>
  );
}

export function AuthFrame({
  title,
  backTo = "/onboarding",
  kicker,
  heading,
  description,
  children,
}) {
  return (
    <div className="eth-auth-root">
      <div className="eth-auth-screen">

        {/* 상단바 */}
        <header className="eth-auth-topbar">
          <Link
            to={backTo}
            aria-label="뒤로 가기"
            className="eth-auth-back"
          >
            <AuthIcon name="back" />
          </Link>

          <strong>{title}</strong>
          <span />
        </header>

        {/* 화면 본문 */}
        <main className="eth-auth-content">
          <div className="eth-auth-heading">
            <p className="eth-auth-eyebrow">
              {kicker}
            </p>

            <h1>{heading}</h1>
            <p>{description}</p>
          </div>

          {children}
        </main>

      </div>
    </div>
  );
}

export function AuthMessage({
  kind = "error",
  children,
}) {
  if (!children) return null;

  return (
    <div
      className={`eth-auth-notice eth-auth-notice-${kind}`}
      role={
        kind === "error" ? "alert" : "status"
      }
    >
      <AuthIcon
        name={
          kind === "error" ? "alert" : "check"
        }
        size={17}
      />

      <span>{children}</span>
    </div>
  );
}
