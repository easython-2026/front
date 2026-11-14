
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../../hooks/useAuth";

import {
  deleteAccount,
  getConsents,
  getLanguages,
  getMyProfile,
  updateMyProfile,
} from "../../api/user";

import {
  SettingsIcon,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

import "../../styles/figma-settings.css";

function languageList(value) {
  const data = unwrap(value);
  const list = Array.isArray(data)
    ? data
    : data?.languages;

  if (!Array.isArray(list)) {
    throw new Error(
      "지원 언어 목록 형식을 확인해 주세요."
    );
  }

  return list
    .map((v) => ({
      code: String(
        v.code ?? v.languageCode ?? ""
      ),
      name: String(
        v.name ??
        v.nativeName ??
        v.languageName ??
        ""
      ),
    }))
    .filter((v) => v.code && v.name);
}

// 메뉴 이동 컴포넌트
function SettingLink({
  to,
  icon,
  title,
  detail,
  danger = false,
}) {
  return (
    <Link
      className={`pfs-setting-row${
        danger ? " pfs-danger" : ""
      }`}
      to={to}
    >
      <span className="pfs-setting-icon">
        <SettingsIcon name={icon}/>
      </span>

      <span className="pfs-setting-copy">
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>

      <SettingsIcon name="chevron" size={16}/>
    </Link>
  );
}

// 로그아웃·탈퇴 버튼
function SettingButton({
  icon,
  title,
  detail,
  danger = false,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      className={`pfs-setting-row${
        danger ? " pfs-danger" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="pfs-setting-icon">
        <SettingsIcon name={icon}/>
      </span>

      <span className="pfs-setting-copy">
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>

      <SettingsIcon name="chevron" size={16}/>
    </button>
  );
}

// 프로필 수정·회원 탈퇴 하단 시트
function Sheet({
  title,
  close,
  children,
  busy,
}) {
  return (
    <div
      className="pfs-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          close();
        }
      }}
    >
      <section
        className="pfs-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="pfs-sheet-handle"/>

        <div className="pfs-sheet-head">
          <div>
            <p className="pfs-eyebrow">
              MY ACCOUNT
            </p>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            disabled={busy}
          >
            ✕
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [profile, setProfile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [consents, setConsents] = useState(null);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState("");
  const [deleteText, setDeleteText] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [languageError, setLanguageError] = useState("");
  const [reload, setReload] = useState(0);

  // ========================================
  // 프로필, 지원 언어, 동의 내역 조회
  // ========================================

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.allSettled([
      getMyProfile(),
      getLanguages(),
      getConsents(),
    ])
      .then(([p, l, c]) => {
        if (!active) return;

        if (p.status === "fulfilled") {
          const data = unwrap(p.value);

          if (
            data &&
            typeof data === "object"
          ) {
            setProfile(data);
            setName(data.name ?? "");
            setError("");
          } else {
            setError(
              "프로필 응답 형식을 확인해 주세요."
            );
          }
        } else {
          setError(settingsError(p.reason));
        }

        if (l.status === "fulfilled") {
          try {
            setLanguages(
              languageList(l.value)
            );
            setLanguageError("");
          } catch (err) {
            setLanguageError(
              settingsError(err)
            );
          }
        } else {
          setLanguageError(
            settingsError(l.reason)
          );
        }

        if (c.status === "fulfilled") {
          setConsents(unwrap(c.value));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reload]);

  // ========================================
  // 이름 수정
  // ========================================

  async function saveName(event) {
    event.preventDefault();

    const next = name.trim();

    if (!next) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (next === profile?.name) {
      setDialog("");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await updateMyProfile({
        name: next,
      });

      const after = unwrap(
        await getMyProfile()
      );

      setProfile(after);
      setName(after.name ?? "");
      setDialog("");
      setNotice(
        "프로필이 저장되었습니다."
      );
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // 언어 변경
  // ========================================

  async function changeLanguage(value) {
    if (
      !value ||
      busy ||
      value === profile?.language
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await updateMyProfile({
        language: value,
      });

      const after = unwrap(
        await getMyProfile()
      );

      setProfile(after);
      setNotice(
        "표시 언어가 저장되었습니다."
      );
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // 로그아웃
  // ========================================

  async function logout() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(settingsError(err));

      navigate("/login", {
        replace: true,
      });
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // 회원 탈퇴
  // ========================================

  async function removeAccount() {
    if (
      busy ||
      deleteText !== "탈퇴"
    ) {
      return;
    }

    if (
      !window.confirm(
        "회원 탈퇴를 진행할까요? 법령상 보존이 필요한 기록은 즉시 삭제되지 않을 수 있습니다."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteAccount();

      try {
        await signOut();
      } catch {
        // 기존 signOut의 finally에서
        // 로컬 세션을 종료함
      }

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (!busy) {
      setDialog("");
      setError("");
    }
  }

  const language = profile?.language ?? "";

  return (
    <div className="pfs-screen">
      {/* 상단 헤더 */}
      <header className="pfs-header">
        <strong>내 정보</strong>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() =>
            setReload((n) => n + 1)
          }
          aria-label="정보 새로고침"
        >
          <SettingsIcon name="refresh" size={19}/>
        </button>
      </header>

      <main className="pfs-content">
        {loading && (
          <p
            className="pfs-notice"
            role="status"
          >
            내 정보를 불러오는 중입니다.
          </p>
        )}

        {error && !dialog && (
          <p
            className="pfs-notice pfs-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            className="pfs-notice pfs-success"
            role="status"
          >
            {notice}
          </p>
        )}

        {profile && (
          <>
            {/* 프로필 카드 */}
            <section className="pfs-profile-card">
              <div className="pfs-avatar">
                {profile.name?.trim()?.slice(0, 2) || "일"}
              </div>

              <div className="pfs-profile-info">
                <b>
                  {profile.name ?? "사용자 계정"}
                </b>

                <small>
                  {profile.email ?? "이메일 미제공"}
                </small>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setName(profile.name ?? "");
                  setDialog("edit");
                }}
              >
                <SettingsIcon name="file" size={16}/>
                수정
              </button>
            </section>

            {/* ================================
                서비스 설정
            ================================ */}

            <section className="pfs-group">
              <h2>서비스 설정</h2>

              <div className="pfs-group-card">
                <div className="pfs-setting-row">
                  <span className="pfs-setting-icon">
                    <SettingsIcon name="shield"/>
                  </span>

                  <span className="pfs-setting-copy">
                    <b>언어 설정</b>

                    <small>
                      {(languages.find(
                        (v) => v.code === language
                      )?.name ?? language) || "언어 미설정"}
                      {" · "}
                      메뉴·분석 결과 적용
                    </small>
                  </span>

                  <select
                    aria-label="표시 언어"
                    value={language}
                    disabled={
                      !languages.length || busy
                    }
                    onChange={(event) =>
                      changeLanguage(event.target.value)
                    }
                  >
                    {!language && (
                      <option value="">선택</option>
                    )}

                    {language &&
                      !languages.some(
                        (v) => v.code === language
                      ) && (
                        <option value={language}>
                          {language}
                        </option>
                      )}

                    {languages.map((v) => (
                      <option
                        key={v.code}
                        value={v.code}
                      >
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {languageError && (
                  <p className="pfs-inline-hint">
                    언어 목록: {languageError}
                  </p>
                )}

                <SettingLink
                  to="/workplace"
                  icon="pin"
                  title="근무장소 관리"
                  detail="GPS 인증 기준 장소 등록·변경"
                />

                <SettingLink
                  to="/workplace/business"
                  icon="file"
                  title="사업장 정보 관리"
                  detail="사업장명·주소·대표자명"
                />

                <SettingLink
                  to="/salary"
                  icon="wallet"
                  title="월급날 관리"
                  detail={
                    profile.payday == null
                      ? "급여비교에서 지급일 설정"
                      : `매월 ${profile.payday}일 · 알림 ${
                          profile.paydayAlertEnabled
                            ? "켜짐"
                            : "설정 확인"
                        }`
                  }
                />

                <SettingLink
                  to="/notifications"
                  icon="bell"
                  title="알림"
                  detail="월급날·근무기록·상담 진행 소식"
                />
              </div>
            </section>

            {/* ================================
                권한 및 개인정보
            ================================ */}

            <section className="pfs-group">
              <h2>권한 및 개인정보</h2>

              <div className="pfs-group-card">
                <SettingLink
                  to="/profile/permissions/camera"
                  icon="camera"
                  title="카메라 권한"
                  detail={`사진 촬영 동의 · ${
                    consents?.camera === true
                      ? "동의"
                      : consents?.camera === false
                      ? "미동의"
                      : "상태 확인 필요"
                  }`}
                />

                <SettingLink
                  to="/profile/permissions/location"
                  icon="pin"
                  title="위치 권한"
                  detail={`GPS 이용 동의 · ${
                    consents?.location === true
                      ? "동의"
                      : consents?.location === false
                      ? "미동의"
                      : "상태 확인 필요"
                  }`}
                />

                <SettingLink
                  to="/reports/evidences"
                  icon="shield"
                  title="저장된 증거"
                  detail="계약서·출퇴근·급여 증거 목록"
                />

                <SettingLink
                  to="/profile/consents"
                  icon="check"
                  title="정보 공유 동의 내역"
                  detail="필수 동의 및 상담기관 공유 철회"
                />

                <SettingLink
                  to="/profile/data-deletion"
                  icon="trash"
                  title="개인정보 및 기록 삭제 요청"
                  detail="삭제 범위 선택·보존 정책 확인"
                />
              </div>
            </section>

            {/* ================================
                계정
            ================================ */}

            <section className="pfs-group">
              <h2>계정</h2>

              <div className="pfs-group-card">
                <SettingLink
                  to="/forgot-password"
                  icon="shield"
                  title="비밀번호 재설정"
                />

                <SettingButton
                  icon="back"
                  title="로그아웃"
                  onClick={logout}
                  disabled={busy}
                />

                <SettingButton
                  icon="alert"
                  title="회원 탈퇴"
                  detail="계정 이용 종료 및 보존 정책 확인"
                  danger
                  disabled={busy}
                  onClick={() => {
                    setDeleteText("");
                    setDialog("delete");
                  }}
                />
              </div>
            </section>
          </>
        )}

        {/* 홈으로 돌아가기 버튼 없음 */}
      </main>

      {/* 프로필 수정 */}
      {dialog === "edit" && (
        <Sheet
          title="프로필 수정"
          busy={busy}
          close={close}
        >
          <form
            className="pfs-sheet-form"
            onSubmit={saveName}
          >
            <label>
              이름
              <input
                value={name}
                required
                disabled={busy}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            <label>
              이메일
              <input
                value={profile?.email ?? ""}
                readOnly
                disabled
              />
            </label>

            {error && (
              <p
                className="pfs-notice pfs-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="pfs-primary"
            >
              {busy
                ? "저장 중..."
                : "변경사항 저장"}
            </button>
          </form>
        </Sheet>
      )}

      {/* 회원 탈퇴 */}
      {dialog === "delete" && (
        <Sheet
          title="회원 탈퇴"
          busy={busy}
          close={close}
        >
          <p className="pfs-notice pfs-warn">
            계정을 탈퇴하면 서비스를 이용할 수 없습니다.
          </p>

          <label className="pfs-confirm-label">
            탈퇴하려면 ‘탈퇴’를 입력해 주세요.

            <input
              placeholder="탈퇴"
              value={deleteText}
              disabled={busy}
              onChange={(event) =>
                setDeleteText(event.target.value)
              }
            />
          </label>

          {error && (
            <p
              className="pfs-notice pfs-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="pfs-primary pfs-danger-btn"
            disabled={
              busy || deleteText !== "탈퇴"
            }
            onClick={removeAccount}
          >
            {busy
              ? "처리 중..."
              : "회원 탈퇴 요청"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
