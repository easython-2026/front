
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { signup, checkEmail } from "../../api/auth";
import { getLanguages } from "../../api/user";

// ========================================
// API 응답 및 요청 데이터 변환 함수
// 실제 백엔드 상세 명세에 맞춰 조정
// ========================================

// 이메일 중복 확인 요청
function makeEmailCheckQuery(email) {
  return { email };
}

// 이메일 중복 확인 응답 해석
function parseEmailCheckResult(response) {
  const available =
    response?.available ??
    response?.data?.available;

  if (typeof available !== "boolean") {
    throw new Error(
      "이메일 중복 확인 응답 형식이 예상과 다릅니다."
    );
  }

  return available;
}

// 지원 언어 목록 응답 변환
function parseLanguages(response) {
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : response?.data?.languages ??
        response?.languages;

  if (!Array.isArray(items)) {
    throw new Error(
      "지원 언어 목록 응답 형식이 예상과 다릅니다."
    );
  }

  return items.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(
        "지원 언어 데이터 형식을 확인해 주세요."
      );
    }

    const code =
      item.code ??
      item.languageCode;

    const name =
      item.name ??
      item.nativeName ??
      item.languageName;

    if (!code || !name) {
      throw new Error(
        "지원 언어의 코드 또는 이름이 없습니다."
      );
    }

    return {
      code: String(code),
      name: String(name),
    };
  });
}

// 회원가입 요청 데이터 생성
function makeSignupPayload(form) {
  // 필드명은 임시 매핑
  // 실제 회원가입 API Request Body와 확인 필요
  return {
    email: form.email.trim(),
    password: form.password,
    name: form.name.trim(),
    languageCode: form.languageCode,
    consents: {
      termsOfService: form.agreeTerms,
      privacyPolicy: form.agreePrivacy,
      marketing: form.agreeMarketing,
    },
  };
}

// ========================================
// 회원가입 페이지
// ========================================

export default function Signup() {
  const navigate = useNavigate();

  // 회원가입 입력값
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    languageCode: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  // 지원 언어
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] =
    useState(true);

  // 이메일 중복 확인 상태
  // null = 미확인
  // true = 사용 가능
  // false = 사용 불가
  const [emailAvailable, setEmailAvailable] =
    useState(null);

  const [emailChecking, setEmailChecking] =
    useState(false);

  // 현재 입력 이메일
  const currentEmailRef = useRef("");

  // 중복 확인에 성공한 이메일
  const checkedEmailRef = useRef(null);

  // 비동기 중복 확인 요청 구분용 번호
  const emailCheckIdRef = useRef(0);

  // 회원가입 처리 상태
  const [loading, setLoading] = useState(false);

  // 메시지
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // 지원 언어 목록 불러오기
  // ========================================
  useEffect(() => {
    let active = true;

    async function loadLanguages() {
      try {
        const response = await getLanguages();

        if (!active) return;

        const items = parseLanguages(response);

        setLanguages(items);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "지원 언어 목록을 불러오지 못했습니다."
        );
      } finally {
        if (active) {
          setLanguagesLoading(false);
        }
      }
    }

    loadLanguages();

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // 입력값 변경
  // ========================================
  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess("");

    // 이메일 변경 시 기존 중복 확인 결과 무효화
    if (name === "email") {
      currentEmailRef.current = value.trim();
      checkedEmailRef.current = null;

      // 진행 중인 이전 요청 결과 무시
      emailCheckIdRef.current += 1;

      setEmailAvailable(null);
    }
  }

  // ========================================
  // 이메일 중복 확인
  // ========================================
  async function handleEmailCheck() {
    const email = form.email.trim();

    if (!email) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    // 요청마다 고유 번호 부여
    const requestId = ++emailCheckIdRef.current;

    setEmailChecking(true);
    setEmailAvailable(null);

    checkedEmailRef.current = null;

    setError("");
    setSuccess("");

    try {
      const response = await checkEmail(
        makeEmailCheckQuery(email)
      );

      // 요청 중 이메일이 변경되었거나
      // 더 최신 요청이 시작되었다면 결과 무시
      if (
        currentEmailRef.current !== email ||
        emailCheckIdRef.current !== requestId
      ) {
        return;
      }

      const available =
        parseEmailCheckResult(response);

      setEmailAvailable(available);

      if (available) {
        checkedEmailRef.current = email;
        setSuccess("사용할 수 있는 이메일입니다.");
      } else {
        checkedEmailRef.current = null;
        setError("이미 사용 중인 이메일입니다.");
      }
    } catch (err) {
      if (
        currentEmailRef.current !== email ||
        emailCheckIdRef.current !== requestId
      ) {
        return;
      }

      checkedEmailRef.current = null;
      setEmailAvailable(null);

      setError(
        err instanceof Error
          ? err.message
          : "이메일 확인에 실패했습니다."
      );
    } finally {
      if (emailCheckIdRef.current === requestId) {
        setEmailChecking(false);
      }
    }
  }

  // ========================================
  // 회원가입 폼 검증
  // ========================================
  function validateForm() {
    if (!form.email.trim()) {
      return "이메일을 입력해 주세요.";
    }

    if (!form.name.trim()) {
      return "이름을 입력해 주세요.";
    }

    if (!form.password) {
      return "비밀번호를 입력해 주세요.";
    }

    if (!form.passwordConfirm) {
      return "비밀번호 확인을 입력해 주세요.";
    }

    if (
      form.password !== form.passwordConfirm
    ) {
      return "비밀번호가 일치하지 않습니다.";
    }

    if (!form.languageCode) {
      return "사용할 언어를 선택해 주세요.";
    }

    if (!form.agreeTerms || !form.agreePrivacy) {
      return "필수 약관에 동의해 주세요.";
    }

    // 이메일 확인 결과가 현재 이메일과 일치하는지 검증
    if (
      emailAvailable !== true ||
      checkedEmailRef.current !==
        form.email.trim()
    ) {
      return "현재 이메일의 중복 확인을 완료해 주세요.";
    }

    return null;
  }

  // ========================================
  // 회원가입 요청
  // ========================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || emailChecking) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 가입 직전 이메일 사용 가능 여부 재확인
      const emailResponse = await checkEmail(
        makeEmailCheckQuery(form.email.trim())
      );

      const available =
        parseEmailCheckResult(emailResponse);

      if (!available) {
        checkedEmailRef.current = null;
        setEmailAvailable(false);

        setError("이미 사용 중인 이메일입니다.");
        return;
      }

      // 회원가입 요청 객체 구성
      const payload = makeSignupPayload(form);

      // 백엔드 회원가입 API 호출
      await signup(payload);

      // 가입 완료 후 로그인 화면으로 이동
      navigate("/login", {
        replace: true,
        state: {
          signupCompleted: true,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "회원가입에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // 화면
  // ========================================
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <h1>이지톤 회원가입</h1>

      <form onSubmit={handleSubmit}>
        {/* 이메일 */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-email">
            이메일
          </label>

          <input
            id="signup-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <button
            type="button"
            onClick={handleEmailCheck}
            disabled={
              emailChecking ||
              loading ||
              !form.email.trim()
            }
          >
            {emailChecking
              ? "확인 중..."
              : "이메일 중복 확인"}
          </button>
        </div>

        {/* 이름 */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-name">
            이름
          </label>

          <input
            id="signup-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-password">
            비밀번호
          </label>

          <input
            id="signup-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-confirm">
            비밀번호 확인
          </label>

          <input
            id="signup-confirm"
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        {/* 언어 선택 */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="signup-language">
            사용 언어
          </label>

          <select
            id="signup-language"
            name="languageCode"
            value={form.languageCode}
            onChange={handleChange}
            disabled={languagesLoading || loading}
            required
          >
            <option value="">
              {languagesLoading
                ? "언어 목록 불러오는 중..."
                : "언어 선택"}
            </option>

            {languages.map((language) => (
              <option
                key={language.code}
                value={language.code}
              >
                {language.name}
              </option>
            ))}
          </select>
        </div>

        {/* 약관 동의 */}
        <fieldset
          style={{
            marginBottom: 16,
            padding: 16,
          }}
        >
          <legend>약관 동의</legend>

          <div>
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                disabled={loading}
              />
              [필수] 서비스 이용약관 동의
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={form.agreePrivacy}
                onChange={handleChange}
                disabled={loading}
              />
              [필수] 개인정보 처리 동의
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="agreeMarketing"
                checked={form.agreeMarketing}
                onChange={handleChange}
                disabled={loading}
              />
              [선택] 마케팅 정보 수신 동의
            </label>
          </div>
        </fieldset>

        {/* 오류 메시지 */}
        {error && (
          <p
            role="alert"
            style={{ color: "red" }}
          >
            {error}
          </p>
        )}

        {/* 성공 메시지 */}
        {success && (
          <p
            role="status"
            style={{ color: "green" }}
          >
            {success}
          </p>
        )}

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={
            loading ||
            emailChecking ||
            languagesLoading
          }
        >
          {loading
            ? "가입 처리 중..."
            : "회원가입"}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        이미 계정이 있으신가요?{" "}
        <Link to="/login">로그인</Link>
      </p>
    </main>
  );
}
