
import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import useAuth from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await signIn({
        email,
        password,
      });

      // 로그인 전 접근하려던 경로
      const requestedPath = location.state?.from;

      const target =
        typeof requestedPath?.pathname === "string" &&
        requestedPath.pathname.startsWith("/") &&
        !requestedPath.pathname.startsWith("//") &&
        !requestedPath.pathname.startsWith("/login")
          ? requestedPath.pathname +
            (requestedPath.search || "") +
            (requestedPath.hash || "")
          : "/home";

      navigate(target, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "로그인에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "24px" }}>
      <h1>이지톤 로그인</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email">이메일</label>

          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password">비밀번호</label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p>
        계정이 없으신가요?{" "}
        <Link to="/signup">회원가입</Link>
      </p>

      <Link to="/forgot-password">
        비밀번호 재설정
      </Link>
    </main>
  );
}
