
import { useState } from "react";
import { Link } from "react-router";

import {
  requestPasswordReset,
} from "../../api/auth";

import {
  AuthButton,
  AuthFrame,
  AuthMessage,
} from "./AuthUI";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // 기존 API 호출
      await requestPasswordReset({
        email: email.trim(),
      });

      // 서버가 요청을 성공 처리한 경우
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "재설정 요청에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="비밀번호 재설정"
      backTo="/login"
      kicker="RESET PASSWORD"
      heading="비밀번호를 다시 설정해요"
      description="가입한 이메일을 입력하면 재설정 안내를 요청할 수 있습니다."
    >
      {sent ? (
        <>
          {/* 요청 완료 */}
          <AuthMessage kind="success">
            재설정 요청이 접수되었습니다.
            이메일의 안내를 확인해 주세요.
          </AuthMessage>

          <Link
            className="eth-auth-primary"
            to="/login"
          >
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <form
          className="eth-auth-form"
          onSubmit={handleSubmit}
        >
          {/* 이메일 */}
          <label className="eth-auth-field">
            <span>이메일</span>

            <input
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </label>

          {/* 오류 */}
          <AuthMessage>{error}</AuthMessage>

          {/* 요청 버튼 */}
          <AuthButton
            type="submit"
            loading={loading}
            disabled={!email.trim()}
          >
            {loading
              ? "요청 중..."
              : "재설정 안내 받기"}
          </AuthButton>
        </form>
      )}
    </AuthFrame>
  );
}
