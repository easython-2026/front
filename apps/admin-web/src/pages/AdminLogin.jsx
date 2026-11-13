
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  loginAdmin,
} from "../services/adminAuthApi";

import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    // 필수 입력값 검사
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      // 실제 관리자 로그인 API 호출
      await loginAdmin({
        email,
        password,
        rememberMe,
      });

      // 로그인 성공 시 관리자 대시보드 이동
      navigate("/dashboard", { replace: true });
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
            err.message || "로그인 중 오류가 발생했습니다."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      {/* 왼쪽 브랜드 영역 */}
      <section className="admin-login__brand">
        <div className="admin-login__brand-inner">
          <div className="admin-login__logo">
            <div className="admin-login__logo-symbol">
              일
            </div>
            <span>일한만큼</span>
          </div>

          <div className="admin-login__intro">
            <span className="admin-login__badge">
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

            <ul className="admin-login__features">
              <li>
                <span className="admin-login__feature-icon">
                  ✓
                </span>
                권한 기반 사건 접근
              </li>
              <li>
                <span className="admin-login__feature-icon">
                  ◎
                </span>
                번역 메시지 지원
              </li>
              <li>
                <span className="admin-login__feature-icon">
                  ▤
                </span>
                처리 단계 일관 관리
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 오른쪽 로그인 영역 */}
      <main className="admin-login__content">
        <div className="admin-login__form-area">
          <div className="admin-login__heading">
            <p className="admin-login__eyebrow">
              ADMIN SIGN IN
            </p>

            <h2>상담기관 담당자 로그인</h2>

            <p className="admin-login__description">
              인증된 계정으로 로그인해 주세요.
            </p>
          </div>

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

              <input
                id="admin-email"
                type="email"
                placeholder="staff@agency.org"
                autoComplete="username"
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>

            {/* 비밀번호 */}
            <div className="admin-login__field">
              <label htmlFor="admin-password">
                비밀번호
              </label>

              <div className="admin-login__password">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력해 주세요"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />

                <button
                  type="button"
                  className="admin-login__visibility"
                  disabled={loading}
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "비밀번호 숨기기"
                      : "비밀번호 보기"
                  }
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>

            {/* 로그인 유지 */}
            <label className="admin-login__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={loading}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />
              <span>로그인 상태 유지</span>
            </label>

            {/* API 오류 안내 */}
            {error && (
              <p
                className="admin-login__error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="admin-login__submit"
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="admin-login__notice">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>

            <p>
              권한이 없는 계정은 사건에 접근할 수 없습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
