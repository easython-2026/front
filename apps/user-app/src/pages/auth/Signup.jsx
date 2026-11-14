
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  checkEmail,
  signup,
} from "../../api/auth";

import {
  getLanguages,
} from "../../api/user";

import {
  AuthButton,
  AuthFrame,
  AuthMessage,
} from "./AuthUI";

/* 언어 목록 응답 변환 */
function parseLanguages(response) {
  const data = response?.data ?? response;

  const items = Array.isArray(data)
    ? data
    : data?.languages;

  if (!Array.isArray(items)) {
    throw new Error(
      "지원 언어 목록 응답 형식이 예상과 다릅니다."
    );
  }

  return items.map((item) => {
    const code =
      item?.code ??
      item?.languageCode;

    const name =
      item?.nameNative ??
      item?.nameKo ??
      item?.name ??
      item?.nativeName ??
      item?.languageName;

    if (!code || !name) {
      throw new Error(
        "지원 언어 코드 또는 이름이 없습니다."
      );
    }

    return {
      code: String(code),
      name: String(name),
    };
  });
}

/* 이메일 중복 확인 응답 */
function parseEmailAvailable(response) {
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

const initialForm = {
  languageCode: "",
  email: "",
  name: "",
  password: "",
  passwordConfirm: "",
  agreeTerms: false,
  agreePrivacy: false,
  agreeLocationPhoto: false,
};

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState(initialForm);

  const [languages, setLanguages] =
    useState([]);

  const [languagesLoading, setLanguagesLoading] =
    useState(true);

  const [emailAvailable, setEmailAvailable] =
    useState(null);

  const [emailChecking, setEmailChecking] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // 이메일 확인 결과 관리
  const checkedEmailRef = useRef(null);
  const emailCheckSeq = useRef(0);

  /* 지원 언어 불러오기 */
  useEffect(() => {
    let active = true;

    getLanguages()
      .then((result) => {
        if (active) {
          setLanguages(
            parseLanguages(result)
          );
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "언어 목록을 불러오지 못했습니다."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLanguagesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /* 입력값 변경 */
  function change(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");

    // 이메일을 수정하면 중복 확인 무효화
    if (name === "email") {
      emailCheckSeq.current += 1;
      checkedEmailRef.current = null;

      setEmailAvailable(null);
      setEmailChecking(false);
    }
  }

  /* 이메일 중복 확인 */
  async function verifyEmail() {
    const email = form.email.trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError(
        "올바른 이메일 주소를 입력해 주세요."
      );
      return;
    }

    const id = ++emailCheckSeq.current;

    setEmailChecking(true);
    setEmailAvailable(null);

    checkedEmailRef.current = null;

    setError("");
    setSuccess("");

    try {
      const result = await checkEmail({
        email,
      });

      if (emailCheckSeq.current !== id) {
        return;
      }

      const available =
        parseEmailAvailable(result);

      setEmailAvailable(available);

      if (available) {
        checkedEmailRef.current = email;

        setSuccess(
          "사용할 수 있는 이메일입니다."
        );
      } else {
        setError(
          "이미 사용 중인 이메일입니다."
        );
      }
    } catch (err) {
      if (emailCheckSeq.current !== id) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "이메일 중복 확인에 실패했습니다."
      );
    } finally {
      if (emailCheckSeq.current === id) {
        setEmailChecking(false);
      }
    }
  }

  /* 회원가입 검증 */
  function validate() {
    const email = form.email.trim();

    if (!form.languageCode) {
      return "기본 사용 언어를 선택해 주세요.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "이메일 형식을 확인해 주세요.";
    }

    if (
      emailAvailable !== true ||
      checkedEmailRef.current !== email
    ) {
      return "이메일 중복 확인을 완료해 주세요.";
    }

    if (!form.name.trim()) {
      return "이름을 입력해 주세요.";
    }

    if (
      !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(
        form.password
      )
    ) {
      return "비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.";
    }

    if (
      form.password !== form.passwordConfirm
    ) {
      return "비밀번호가 일치하지 않습니다.";
    }

    if (
      !form.agreeTerms ||
      !form.agreePrivacy
    ) {
      return "필수 약관에 동의해 주세요.";
    }

    return null;
  }

  /* 회원가입 API 호출 */
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

      // 가입 직전 이메일 중복 재확인
      const recheck =
        parseEmailAvailable(
          await checkEmail({ email })
        );

      if (!recheck) {
        checkedEmailRef.current = null;
        setEmailAvailable(false);

        setError(
          "이미 사용 중인 이메일입니다."
        );
        return;
      }

      // POST /auth/signup — { email, password, name, language, consents{privacy, location, camera}, agreedAt }
      await signup({
        email,
        password: form.password,
        name: form.name.trim(),
        language: form.languageCode,
        consents: {
          privacy: Boolean(form.agreeTerms && form.agreePrivacy),
          location: Boolean(form.agreeLocationPhoto),
          camera: Boolean(form.agreeLocationPhoto),
        },
        agreedAt: new Date().toISOString(),
      });

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

  return (
    <AuthFrame
      title="회원가입"
      kicker="WELCOME"
      heading={
        "사용할 언어와 계정을\n설정해 주세요"
      }
      description="선택한 언어는 메뉴와 분석 결과 전체에 적용됩니다."
    >
      <form
        className="eth-auth-form"
        onSubmit={handleSubmit}
      >
        {/* 언어 선택 */}
        <label className="eth-auth-field">
          <span>기본 사용 언어</span>

          <select
            value={form.languageCode}
            required
            disabled={
              languagesLoading || loading
            }
            onChange={(event) =>
              change(
                "languageCode",
                event.target.value
              )
            }
          >
            <option value="">
              {languagesLoading
                ? "언어 목록 불러오는 중..."
                : "지원 언어 중 선택"}
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

          <small>
            서버에서 제공하는 지원 언어 목록입니다.
          </small>
        </label>

        {/* 이메일 */}
        <div className="eth-auth-field">
          <label htmlFor="eth-signup-email">
            이메일
          </label>

          <div className="eth-auth-email-row">
            <input
              id="eth-signup-email"
              type="email"
              autoComplete="email"
              value={form.email}
              required
              placeholder="name@example.com"
              onChange={(event) =>
                change(
                  "email",
                  event.target.value
                )
              }
            />

            <button
              type="button"
              disabled={
                emailChecking ||
                loading ||
                !form.email.trim()
              }
              onClick={verifyEmail}
            >
              {emailChecking
                ? "확인 중"
                : "중복 확인"}
            </button>
          </div>

          {emailAvailable === true &&
            checkedEmailRef.current ===
              form.email.trim() && (
              <small className="eth-auth-success">
                사용 가능한 이메일입니다.
              </small>
            )}
        </div>

        {/* 이름 */}
        <label className="eth-auth-field">
          <span>이름</span>

          <input
            type="text"
            autoComplete="name"
            required
            value={form.name}
            placeholder="이름을 입력해 주세요"
            onChange={(event) =>
              change(
                "name",
                event.target.value
              )
            }
          />
        </label>

        {/* 비밀번호 */}
        <label className="eth-auth-field">
          <span>비밀번호</span>

          <input
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            placeholder="8자 이상, 영문·숫자 포함"
            onChange={(event) =>
              change(
                "password",
                event.target.value
              )
            }
          />
        </label>

        {/* 비밀번호 확인 */}
        <label className="eth-auth-field">
          <span>비밀번호 확인</span>

          <input
            type="password"
            autoComplete="new-password"
            required
            value={form.passwordConfirm}
            placeholder="비밀번호 다시 입력"
            onChange={(event) =>
              change(
                "passwordConfirm",
                event.target.value
              )
            }
          />
        </label>

        {/* 필수 및 선택 동의 */}
        <div className="eth-auth-agreements">
          <label>
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(event) =>
                change(
                  "agreeTerms",
                  event.target.checked
                )
              }
            />

            <span>
              <b>필수</b> 서비스 이용약관 동의
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.agreePrivacy}
              onChange={(event) =>
                change(
                  "agreePrivacy",
                  event.target.checked
                )
              }
            />

            <span>
              <b>필수</b> 개인정보 처리 동의
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.agreeLocationPhoto}
              onChange={(event) =>
                change(
                  "agreeLocationPhoto",
                  event.target.checked
                )
              }
            />

            <span>
              <em>선택</em> 위치·사진 수집 및 이용 동의
            </span>
          </label>

          <small>
            선택 동의의 서버 필드가 아직
            제공되지 않아 체크 여부는 가입
            요청에 전송되지 않습니다.
          </small>
        </div>

        {/* 오류 / 성공 안내 */}
        <AuthMessage>{error}</AuthMessage>

        {success && (
          <AuthMessage kind="success">
            {success}
          </AuthMessage>
        )}

        {/* 회원가입 */}
        <AuthButton
          type="submit"
          loading={loading}
          disabled={
            languagesLoading || emailChecking
          }
        >
          {loading
            ? "가입 처리 중..."
            : "가입 완료하고 로그인"}
        </AuthButton>
      </form>

      <Link
        className="eth-auth-text-link"
        to="/login"
      >
        이미 계정이 있어요 · 로그인
      </Link>
    </AuthFrame>
  );
}
