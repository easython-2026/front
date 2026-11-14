import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { checkEmail, signup } from "../../api/auth";
import { getLanguages } from "../../api/user";
import { AuthButton, AuthFrame, AuthMessage } from "./AuthUI";

function parseLanguages(response) {
  const items = response?.data?.languages ?? response?.languages ?? response;
  if (!Array.isArray(items)) {
    throw new Error("지원 언어 목록 응답 형식이 예상과 다릅니다.");
  }
  return items.map((item) => ({
    code: String(item.code ?? item.languageCode ?? ""),
    name: String(
      item.nameNative ?? item.nameKo ?? item.name ?? item.nativeName ?? ""
    ),
  })).filter((item) => item.code && item.name);
}

function parseEmailAvailable(response) {
  const available = response?.data?.available ?? response?.available;
  if (typeof available !== "boolean") {
    throw new Error("이메일 중복 확인 응답 형식이 예상과 다릅니다.");
  }
  return available;
}

const initialForm = {
  languageCode: "",
  email: "",
  name: "",
  password: "",
  passwordConfirm: "",
  agreePrivacy: false,
  agreeLocation: false,
  agreeCamera: false,
  agreedAt: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const checkedEmailRef = useRef(null);
  const emailCheckSeq = useRef(0);

  useEffect(() => {
    let active = true;
    getLanguages()
      .then((response) => {
        if (active) setLanguages(parseLanguages(response));
      })
      .catch((err) => {
        if (active) setError(err?.message || "언어 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLanguagesLoading(false);
      });
    return () => { active = false; };
  }, []);

  function change(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(prev.agreePrivacy && (name === "agreeLocation" || name === "agreeCamera")
        ? { agreedAt: new Date().toISOString() } : {}),
    }));
    setError("");
    setSuccess("");
    if (name === "email") {
      emailCheckSeq.current += 1;
      checkedEmailRef.current = null;
      setEmailAvailable(null);
      setEmailChecking(false);
    }
  }

  function changePrivacy(checked) {
    setForm((prev) => ({
      ...prev,
      agreePrivacy: checked,
      // 개인정보 처리 동의 시각: ISO 8601 (UTC Z 표기)
      agreedAt: checked ? new Date().toISOString() : "",
    }));
    setError("");
    setSuccess("");
  }

  async function verifyEmail() {
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    const requestId = ++emailCheckSeq.current;
    checkedEmailRef.current = null;
    setEmailAvailable(null);
    setEmailChecking(true);
    setError("");
    setSuccess("");
    try {
      const available = parseEmailAvailable(await checkEmail({ email }));
      if (requestId !== emailCheckSeq.current) return;
      setEmailAvailable(available);
      if (available) {
        checkedEmailRef.current = email;
        setSuccess("사용할 수 있는 이메일입니다.");
      } else {
        setError("이미 사용 중인 이메일입니다.");
      }
    } catch (err) {
      if (requestId === emailCheckSeq.current) {
        setError(err?.message || "이메일 중복 확인에 실패했습니다.");
      }
    } finally {
      if (requestId === emailCheckSeq.current) setEmailChecking(false);
    }
  }

  function validate() {
    const email = form.email.trim();
    if (!form.languageCode || !languages.some((x) => x.code === form.languageCode)) {
      return "기본 사용 언어를 선택해 주세요.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "이메일 형식을 확인해 주세요.";
    }
    if (emailAvailable !== true || checkedEmailRef.current !== email) {
      return "이메일 중복 확인을 완료해 주세요.";
    }
    if (!form.name.trim()) return "이름을 입력해 주세요.";
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      return "비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.";
    }
    if (form.password !== form.passwordConfirm) {
      return "비밀번호가 일치하지 않습니다.";
    }
    if (!form.agreePrivacy || !form.agreedAt) {
      return "필수 개인정보 처리 동의가 필요합니다.";
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || emailChecking) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const email = form.email.trim();
      const available = parseEmailAvailable(await checkEmail({ email }));
      if (!available) {
        checkedEmailRef.current = null;
        setEmailAvailable(false);
        setError("이미 사용 중인 이메일입니다.");
        return;
      }

      // 실제 백엔드 회원가입 API 명세와 동일한 필드만 전송
      await signup({
        email,
        password: form.password,
        name: form.name.trim(),
        language: form.languageCode,
        consents: {
          privacy: form.agreePrivacy,
          location: form.agreeLocation,
          camera: form.agreeCamera,
        },
        agreedAt: form.agreedAt,
      });

      navigate("/login", { replace: true, state: { signupCompleted: true } });
    } catch (err) {
      setError(err?.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="회원가입"
      kicker="WELCOME"
      heading={"사용할 언어와 계정을\n설정해 주세요"}
      description="가입 후 서비스에서 사용할 기본 언어를 선택해 주세요."
    >
      <form className="eth-auth-form" onSubmit={handleSubmit}>
        <label className="eth-auth-field">
          <span>기본 사용 언어</span>
          <select
            value={form.languageCode}
            required
            disabled={languagesLoading || loading}
            onChange={(event) => change("languageCode", event.target.value)}
          >
            <option value="">
              {languagesLoading ? "언어 목록 불러오는 중..." : "지원 언어 중 선택"}
            </option>
            {languages.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
          <small>서버에서 제공하는 지원 언어 목록입니다.</small>
        </label>

        <div className="eth-auth-field">
          <label htmlFor="eth-signup-email">이메일</label>
          <div className="eth-auth-email-row">
            <input
              id="eth-signup-email"
              type="email"
              autoComplete="email"
              value={form.email}
              required
              disabled={loading}
              placeholder="name@example.com"
              onChange={(event) => change("email", event.target.value)}
            />
            <button
              type="button"
              disabled={emailChecking || loading || !form.email.trim()}
              onClick={verifyEmail}
            >
              {emailChecking ? "확인 중" : "중복 확인"}
            </button>
          </div>
          {emailAvailable === true && checkedEmailRef.current === form.email.trim() && (
            <small className="eth-auth-success">사용 가능한 이메일입니다.</small>
          )}
        </div>

        <label className="eth-auth-field">
          <span>이름</span>
          <input
            type="text"
            autoComplete="name"
            value={form.name}
            required
            disabled={loading}
            placeholder="이름을 입력해 주세요"
            onChange={(event) => change("name", event.target.value)}
          />
        </label>

        <label className="eth-auth-field">
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            required
            disabled={loading}
            placeholder="8자 이상, 영문·숫자 포함"
            onChange={(event) => change("password", event.target.value)}
          />
        </label>

        <label className="eth-auth-field">
          <span>비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.passwordConfirm}
            required
            disabled={loading}
            placeholder="비밀번호 다시 입력"
            onChange={(event) => change("passwordConfirm", event.target.value)}
          />
        </label>

        <div className="eth-auth-agreements">
          <label>
            <input
              type="checkbox"
              checked={form.agreePrivacy}
              disabled={loading}
              onChange={(event) => changePrivacy(event.target.checked)}
            />
            <span><b>필수</b> 개인정보 처리 동의</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.agreeLocation}
              disabled={loading}
              onChange={(event) => change("agreeLocation", event.target.checked)}
            />
            <span><em>선택</em> 위치 정보 수집·이용 동의</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.agreeCamera}
              disabled={loading}
              onChange={(event) => change("agreeCamera", event.target.checked)}
            />
            <span><em>선택</em> 사진 촬영·저장 동의</span>
          </label>
          <small>
            위치 정보에 동의하지 않으면 출퇴근 GPS 인증을 이용할 수 없습니다.
            선택 항목은 동의하지 않아도 회원가입할 수 있습니다.
          </small>
        </div>

        <AuthMessage>{error}</AuthMessage>
        {success && <AuthMessage kind="success">{success}</AuthMessage>}
        <AuthButton
          type="submit"
          loading={loading}
          disabled={languagesLoading || emailChecking}
        >
          {loading ? "가입 처리 중..." : "가입 완료하고 로그인"}
        </AuthButton>
      </form>
      <Link className="eth-auth-text-link" to="/login">
        이미 계정이 있어요 · 로그인
      </Link>
    </AuthFrame>
  );
}
