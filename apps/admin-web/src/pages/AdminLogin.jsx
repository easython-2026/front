
import { useState } from "react";
import { useNavigate } from "react-router";

import symbolLogo from "../assets/symbol-logo.svg";
import wordmarkLogo from "../assets/wordmark-logo-ivory.svg";

import {
  ShieldCheck,
  Languages,
  ClipboardList,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  LoaderCircle,
  CircleAlert,
  ShieldAlert,
} from "lucide-react";

import { loginAdmin } from "../services/adminAuthApi";

import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // 관리자 로그인
  // Mock / 실제 API 공통
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    // 필수 입력값 검사
    if (!email.trim() || !password) {
      setError(
        "이메일과 비밀번호를 모두 입력해 주세요."
      );
      return;
    }

    // 이메일 형식 검사
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError(
        "올바른 이메일 주소를 입력해 주세요."
      );
      return;
    }

    setLoading(true);

    try {
      // 기존 인증 서비스 유지
      await loginAdmin({
        email: email.trim(),
        password,
        rememberMe,
      });

      // 로그인 성공 시 대시보드 이동
      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      switch (err.errorCode) {
        case "INVALID_CREDENTIALS":
          setError(
            "이메일 또는 비밀번호가 올바르지 않습니다."
          );
          break;

        case "VALIDATION_ERROR":
          setError(
            "입력값이 올바르지 않습니다."
          );
          break;

        default:
          setError(
            err.message ||
              "로그인 중 오류가 발생했습니다."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      {/* ========================================
          왼쪽 브랜드 영역
      ======================================== */}

      <section className="admin-login__brand">
        <div className="admin-login__brand-inner">
          {/* ====================================
              SVG 브랜드 로고
          ==================================== */}

          <div className="admin-login__logo">
            {/* 심볼 로고 */}

            <div className="admin-login__logo-symbol">
              <img
                src={symbolLogo}
                alt=""
                className="admin-login__symbol-img"
                aria-hidden="true"
              />
            </div>

            {/* 워드마크 로고 */}

            <img
              src={wordmarkLogo}
              alt="일한만큼"
              className="admin-login__wordmark-img"
            />
          </div>

          {/* ====================================
              브랜드 메시지
          ==================================== */}

          <div className="admin-login__intro">
            <span className="admin-login__badge">
              <ShieldCheck
                size={16}
                strokeWidth={2}
              />

              상담기관 관리자
            </span>

            <h1>
              동의된 사건을
              <br />
              안전하게 검토하세요
            </h1>

            <p>
              노동자가 명시적으로 공유에 동의한
              <br />
              사건과 증거만 확인할 수 있습니다.
            </p>

            {/* ====================================
                서비스 특징
            ==================================== */}

            <ul className="admin-login__features">
              <li>
                <span className="admin-login__feature-icon">
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.8}
                  />
                </span>

                <span>권한 기반 사건 접근</span>
              </li>

              <li>
                <span className="admin-login__feature-icon">
                  <Languages
                    size={22}
                    strokeWidth={1.8}
                  />
                </span>

                <span>번역 메시지 지원</span>
              </li>

              <li>
                <span className="admin-login__feature-icon">
                  <ClipboardList
                    size={22}
                    strokeWidth={1.8}
                  />
                </span>

                <span>처리 단계 일관 관리</span>
              </li>
            </ul>
          </div>

          {/* 브랜드 하단 */}

          <div className="admin-login__brand-footer">
            일한만큼 · 상담기관 관리자 시스템
          </div>
        </div>
      </section>

      {/* ========================================
          오른쪽 로그인 영역
      ======================================== */}

      <main className="admin-login__content">
        <div className="admin-login__form-area">
          {/* ====================================
              로그인 제목
          ==================================== */}

          <div className="admin-login__heading">
            <p className="admin-login__eyebrow">
              ADMIN SIGN IN
            </p>

            <h2>
              상담기관 담당자
              <br />
              로그인
            </h2>

            <p className="admin-login__description">
              인증된 계정으로 로그인해 주세요.
            </p>
          </div>

          {/* ====================================
              로그인 폼
          ==================================== */}

          <form
            className="admin-login__form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* 이메일 */}

            <div className="admin-login__field">
              <label htmlFor="admin-email">
                이메일
              </label>

              <div className="admin-login__input-wrapper">
                <Mail
                  size={21}
                  strokeWidth={1.8}
                  className="admin-login__input-icon"
                  aria-hidden="true"
                />

                <input
                  id="admin-email"
                  type="email"
                  placeholder="이메일 주소를 입력해 주세요"
                  autoComplete="username"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
              </div>
            </div>

            {/* 비밀번호 */}

            <div className="admin-login__field">
              <label htmlFor="admin-password">
                비밀번호
              </label>

              <div className="admin-login__password">
                <LockKeyhole
                  size={21}
                  strokeWidth={1.8}
                  className="admin-login__input-icon"
                  aria-hidden="true"
                />

                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="비밀번호를 입력해 주세요"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />

                {/* 비밀번호 표시 / 숨기기 */}

                <button
                  type="button"
                  className="admin-login__visibility"
                  disabled={loading}
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "비밀번호 숨기기"
                      : "비밀번호 보기"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff
                      size={21}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Eye
                      size={21}
                      strokeWidth={1.8}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* ====================================
                로그인 상태 유지
            ==================================== */}

            <label className="admin-login__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={loading}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
              />

              <span>로그인 상태 유지</span>
            </label>

            {/* ====================================
                API 오류 안내
            ==================================== */}

            {error && (
              <div
                className="admin-login__error"
                role="alert"
              >
                <CircleAlert
                  size={18}
                  strokeWidth={1.9}
                />

                <span>{error}</span>
              </div>
            )}

            {/* ====================================
                로그인 버튼
            ==================================== */}

            <button
              type="submit"
              className="admin-login__submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={22}
                    strokeWidth={2}
                    className="admin-login__spinner"
                  />

                  로그인 중...
                </>
              ) : (
                <>
                  <LogIn
                    size={22}
                    strokeWidth={2}
                  />

                  로그인
                </>
              )}
            </button>
          </form>

          {/* ====================================
              권한 안내
          ==================================== */}

          <div className="admin-login__notice">
            <div className="admin-login__notice-icon">
              <ShieldAlert
                size={23}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <strong>안전한 관리자 접근</strong>

              <p>
                권한이 없는 계정은 사건에
                접근할 수 없습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
