
import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import useAuth from "../../hooks/useAuth";

import {
  AuthButton,
  AuthFrame,
  AuthMessage,
} from "./AuthUI";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // 기존 로그인 API 연결
      await signIn(
        {
          email: email.trim(),
          password,
        },
        {
          remember,
        }
      );

      // 로그인 전 접근하려던 페이지
      const requestedPath = location.state?.from;

      const isValidPath =
        typeof requestedPath?.pathname === "string" &&
        requestedPath.pathname.startsWith("/") &&
        !requestedPath.pathname.startsWith("//") &&
        !requestedPath.pathname.startsWith("/login");

      const target = isValidPath
        ? requestedPath.pathname +
          (requestedPath.search || "") +
          (requestedPath.hash || "")
        : "/home";

      navigate(target, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "로그인에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="로그인"
      kicker="WELCOME BACK"
      heading="다시 만나서 반가워요"
      description="근무기록과 급여 비교를 이어서 확인하세요."
    >
      {/* 회원가입 완료 메시지 */}
      {location.state?.signupCompleted && (
        <AuthMessage kind="success">
          가입이 완료되었습니다.
          로그인해 주세요.
        </AuthMessage>
      )}

      <form
        className="eth-auth-form"
        onSubmit={handleSubmit}
      >
        {/* 이메일 */}
        <label className="eth-auth-field">
          <span>이메일</span>

          <input
            type="email"
            value={email}
            placeholder="name@example.com"
            autoComplete="username"
            required
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </label>

        {/* 비밀번호 */}
        <label className="eth-auth-field">
          <span>비밀번호</span>

          <input
            type="password"
            value={password}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            required
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />
        </label>

        {/* 로그인 옵션 */}
        <div className="eth-auth-login-options">
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) =>
                setRemember(event.target.checked)
              }
            />

            로그인 상태 유지
          </label>

          <Link to="/forgot-password">
            비밀번호 재설정
          </Link>
        </div>

        {/* 오류 안내 */}
        <AuthMessage>{error}</AuthMessage>

        {/* 로그인 버튼 */}
        <AuthButton
          type="submit"
          loading={loading}
          disabled={!email.trim() || !password}
        >
          {loading ? "로그인 중..." : "로그인"}
        </AuthButton>
      </form>

      {/* 회원가입 이동 */}
      <Link
        className="eth-auth-text-link"
        to="/signup"
      >
        처음이신가요? · 회원가입
      </Link>
    </AuthFrame>
  );
}
