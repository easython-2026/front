
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

function unwrap(response) {
  return response?.data ?? response;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  return error?.message ?? "요청 처리에 실패했습니다.";
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      try {
        const response = await apiRequest(
          "accountSettings",
          "getProfile",
          { signal: controller.signal }
        );

        if (!active) return;

        const data = unwrap(response);

        if (!data || typeof data !== "object") {
          throw new Error("사용자 정보 형식이 올바르지 않습니다.");
        }

        setProfile(data);
        setName(data.name ?? "");
        setLanguage(data.language ?? "");
        setError("");
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const changed =
    profile !== null &&
    (
      name !== (profile.name ?? "") ||
      language !== (profile.language ?? "")
    );

  function refresh() {
    setLoading(true);
    setReloadKey((previous) => previous + 1);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!profile || !changed || saving) return;

    const nextName = name.trim();
    const nextLanguage = language.trim();

    if (!nextName) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (!nextLanguage) {
      setError("언어 코드를 입력해 주세요.");
      return;
    }

    const body = {};

    if (nextName !== profile.name) {
      body.name = nextName;
    }

    if (nextLanguage !== profile.language) {
      body.language = nextLanguage;
    }

    if (Object.keys(body).length === 0) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "accountSettings",
        "updateProfile",
        { body }
      );

      const response = await apiRequest(
        "accountSettings",
        "getProfile"
      );

      const updated = unwrap(response);

      setProfile(updated);
      setName(updated.name ?? "");
      setLanguage(updated.language ?? "");
      setMessage("사용자 정보를 저장했습니다.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{
      maxWidth: 680,
      margin: "0 auto",
      padding: 24,
    }}>
      <h1>내 정보</h1>

      {loading && <p role="status">사용자 정보 조회 중...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!loading && profile && (
        <>
          <section>
            <h2>1. 기본 정보</h2>
            <p>이메일: {profile.email ?? "미제공"}</p>
            <p>가입일: {profile.createdAt ?? "미확인"}</p>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="profile-name">이름</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={saving}
                  required
                  style={{ display: "block", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="profile-language">
                  표시 언어 코드
                </label>
                <input
                  id="profile-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={saving}
                  required
                  placeholder="예: vi, en, ko"
                  style={{ display: "block", width: "100%" }}
                />
                <p>
                  서버에서 지원하는 언어 코드를 입력해야 합니다.
                </p>
              </div>

              <button
                type="submit"
                disabled={!changed || saving}
              >
                {saving ? "저장 중..." : "기본 정보 저장"}
              </button>

              <button
                type="button"
                disabled={!changed || saving}
                onClick={() => {
                  setName(profile.name ?? "");
                  setLanguage(profile.language ?? "");
                  setError("");
                }}
                style={{ marginLeft: 8 }}
              >
                변경 취소
              </button>
            </form>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>2. 급여 알림 설정</h2>

            <p>
              등록된 월급날:{" "}
              {profile.payday == null
                ? "미설정"
                : `매월 ${profile.payday}일`}
            </p>

            <p>
              월급날 알림:{" "}
              {profile.paydayAlertEnabled
                ? "사용"
                : "사용 안 함"}
            </p>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>3. 근무장소 등록 상태</h2>

            <p>
              {profile.hasWorkplace
                ? "근무장소가 등록되어 있습니다."
                : "근무장소가 아직 등록되지 않았습니다."}
            </p>

            <Link to="/workplace">
              근무장소 및 사업장 정보 관리
            </Link>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>4. 개인정보 동의</h2>

            <p>
              위치정보 동의:{" "}
              {profile.consents?.location ? "동의" : "미동의"}
            </p>

            <p>
              카메라 동의:{" "}
              {profile.consents?.camera ? "동의" : "미동의"}
            </p>

            <Link to="/profile/consents">
              기록·개인정보 관리
            </Link>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>5. 서비스 바로가기</h2>

            <p><Link to="/reports">월별 리포트</Link></p>
            <p><Link to="/petitions">진정서 관리</Link></p>
            <p><Link to="/consultations">상담 내역</Link></p>
            <p><Link to="/notifications">알림</Link></p>
          </section>

          <button
            type="button"
            onClick={refresh}
            disabled={saving}
            style={{ marginTop: 24 }}
          >
            사용자 정보 새로고침
          </button>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/home">홈으로 돌아가기</Link>
      </p>
    </main>
  );
}
