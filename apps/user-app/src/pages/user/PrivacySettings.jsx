
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { getConsents } from "../../api/user";
import { apiRequest } from "../../api/client";

import {
  SettingsBadge,
  SettingsHeader,
  SettingsIcon,
  SettingsNotice,
  formatKst,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

export default function PrivacySettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    const response = unwrap(
      await getConsents()
    );

    if (
      typeof response?.privacy !== "boolean" ||
      !Array.isArray(response?.shares)
    ) {
      throw new Error(
        "개인정보 동의 및 공유 내역 응답을 확인할 수 없습니다."
      );
    }

    return response;
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(settingsError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load, reload]);

  // 상담기관 정보 공유 철회
  async function revoke(share) {
    if (
      !share?.consultationId ||
      share.revokedAt ||
      revokingId
    ) {
      return;
    }

    if (
      !window.confirm(
        `${share.agencyName ?? "상담기관"}에 대한 정보 공유를 철회할까요?\n이미 전달된 자료의 회수는 기관 정책에 따릅니다.`
      )
    ) {
      return;
    }

    setRevokingId(share.consultationId);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "consultation",
        "revokeConsent",
        {
          params: {
            consultationId: share.consultationId,
          },
        }
      );

      const updated = await load();
      setData(updated);

      const target = updated.shares.find(
        (item) =>
          String(item.consultationId) ===
          String(share.consultationId)
      );

      setMessage(
        target?.revokedAt
          ? "상담기관 정보 공유가 철회되었습니다."
          : "철회 요청을 전송했습니다. 최신 공유 상태를 확인해 주세요."
      );
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="efx-screen">
      <SettingsHeader
        title="개인정보 및 공유 동의"
        onRefresh={() =>
          setReload((n) => n + 1)
        }
        disabled={loading || revokingId !== null}
      />

      <main className="efx-content">
        <div className="efx-heading">
          <p className="efx-eyebrow">PRIVACY & SHARING</p>
          <h1>내 정보의 사용 내역을 확인해요</h1>
          <p>
            동의 상태와 상담기관에 공유한 정보의
            접근 권한을 관리할 수 있어요.
          </p>
        </div>

        {loading && (
          <SettingsNotice>
            개인정보 동의 내역을 조회 중입니다.
          </SettingsNotice>
        )}

        {error && (
          <SettingsNotice tone="error">{error}</SettingsNotice>
        )}

        {message && (
          <SettingsNotice tone="success">{message}</SettingsNotice>
        )}

        {data && (
          <>
            {/* 필수 개인정보 동의 */}
            <section className="efx-card">
              <div className="efx-section-head">
                <h2>기본 개인정보 동의</h2>

                <SettingsBadge
                  tone={data.privacy ? "success" : "warning"}
                >
                  {data.privacy
                    ? "동의 완료"
                    : "동의 확인 필요"}
                </SettingsBadge>
              </div>

              <p className="efx-muted">
                필수 개인정보 이용 동의는 여기에서
                변경할 수 없습니다. 자세한 내용은
                서비스 개인정보 처리 안내를 확인해 주세요.
              </p>

              {data.updatedAt && (
                <p className="efx-meta">
                  최종 갱신: {formatKst(data.updatedAt)}
                </p>
              )}
            </section>

            {/* 선택 권한 */}
            <div className="efx-section-head">
              <h2>선택 권한 및 동의</h2>
            </div>

            <Link
              className="efx-link-row"
              to="/profile/permissions/camera"
            >
              <span className="efx-small-icon">
                <SettingsIcon name="camera"/>
              </span>
              <span>
                <b>카메라 촬영 동의</b>
                <small>기기 권한 및 사진 수집 동의</small>
              </span>
              <SettingsBadge
                tone={
                  data.camera === true
                    ? "success"
                    : "warning"
                }
              >
                {data.camera === true
                  ? "동의"
                  : data.camera === false
                  ? "미동의"
                  : "확인 필요"}
              </SettingsBadge>
            </Link>

            <Link
              className="efx-link-row"
              to="/profile/permissions/location"
            >
              <span className="efx-small-icon">
                <SettingsIcon name="pin"/>
              </span>
              <span>
                <b>위치정보 이용 동의</b>
                <small>GPS 출퇴근 인증</small>
              </span>
              <SettingsBadge
                tone={
                  data.location === true
                    ? "success"
                    : "warning"
                }
              >
                {data.location === true
                  ? "동의"
                  : data.location === false
                  ? "미동의"
                  : "확인 필요"}
              </SettingsBadge>
            </Link>

            {/* 상담기관 공유 내역 */}
            <div className="efx-section-head">
              <h2>상담기관 정보 공유</h2>
              <SettingsBadge>
                {data.shares.length}건
              </SettingsBadge>
            </div>

            {data.shares.length === 0 && (
              <section className="efx-card efx-empty">
                <SettingsIcon name="shield" size={30}/>
                <b>공유 내역이 없어요</b>
                <p>상담기관에 공유한 기록이 없습니다.</p>
              </section>
            )}

            {data.shares.map((share, i) => {
              const revoked = Boolean(share.revokedAt);

              return (
                <section
                  className="efx-card efx-share-card"
                  key={share.consultationId ?? i}
                >
                  <div className="efx-section-head">
                    <h3>
                      {share.agencyName ?? "상담기관"}
                    </h3>

                    <SettingsBadge
                      tone={revoked ? "neutral" : "success"}
                    >
                      {revoked ? "공유 철회" : "공유 중"}
                    </SettingsBadge>
                  </div>

                  <div className="efx-info-line">
                    <span>공유 시작</span>
                    <b>{formatKst(share.sharedAt)}</b>
                  </div>

                  {revoked && (
                    <div className="efx-info-line">
                      <span>철회 시각</span>
                      <b>{formatKst(share.revokedAt)}</b>
                    </div>
                  )}

                  {share.consultationId && (
                    <Link
                      className="efx-subtle-link"
                      to={`/consultations/${encodeURIComponent(
                        share.consultationId
                      )}`}
                    >
                      상담 상세 보기
                    </Link>
                  )}

                  {!revoked && (
                    <button
                      type="button"
                      className="efx-outline-button efx-danger-outline"
                      disabled={revokingId !== null}
                      onClick={() => revoke(share)}
                    >
                      {revokingId === share.consultationId
                        ? "철회 중..."
                        : "정보 공유 철회"}
                    </button>
                  )}
                </section>
              );
            })}

            <SettingsNotice tone="warning">
              공유를 철회하면 서버에서 상담기관의 접근
              권한을 제한합니다. 이미 전달된 자료를
              되돌리는 기능은 아닙니다.
            </SettingsNotice>

            <Link
              className="efx-link-row"
              to="/profile/data-deletion"
            >
              <SettingsIcon name="trash"/>
              <span>
                <b>개인정보·기록 삭제 요청</b>
                <small>보존 정책 및 삭제 대상 선택</small>
              </span>
              <SettingsIcon name="chevron" size={16}/>
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
