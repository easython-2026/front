
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

function unwrap(response) {
  return response?.data ?? response;
}

function getErrorMessage(error) {
  const code =
    error?.errorCode ??
    error?.data?.errorCode ??
    error?.data?.error?.code;

  if (code === "CONFLICT") {
    return "이미 철회되었거나 현재 변경할 수 없는 상태입니다.";
  }

  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  if (error?.status === 404) {
    return "해당 상담 정보를 찾을 수 없습니다.";
  }

  return error?.message ?? "요청 처리에 실패했습니다.";
}

function formatDate(value) {
  if (!value) return "미확인";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

export default function PrivacySettings() {
  const [consents, setConsents] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadConsents = useCallback(async (signal) => {
    const response = await apiRequest(
      "user",
      "getConsents",
      { signal }
    );

    const data = unwrap(response);

    if (
      !data ||
      typeof data.location !== "boolean" ||
      typeof data.camera !== "boolean" ||
      typeof data.privacy !== "boolean" ||
      !Array.isArray(data.shares)
    ) {
      throw new Error(
        "개인정보 동의 응답 형식이 올바르지 않습니다."
      );
    }

    return data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const data = await loadConsents(controller.signal);

        if (!active) return;

        setConsents(data);
        setForm({
          location: data.location,
          camera: data.camera,
        });
        setError("");
      } catch (err) {
        if (!active || err?.name === "AbortError") return;

        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [loadConsents, reloadKey]);

  const changed =
    form !== null &&
    consents !== null &&
    (
      form.location !== consents.location ||
      form.camera !== consents.camera
    );

  function refresh() {
    setLoading(true);
    setError("");
    setReloadKey((previous) => previous + 1);
  }

  function changeConsent(key, checked) {
    setForm((previous) => ({
      ...previous,
      [key]: checked,
    }));

    setMessage("");
  }

  // 위치·카메라 동의 저장
  async function handleSave(event) {
    event.preventDefault();

    if (
      !form ||
      !consents ||
      !changed ||
      loading ||
      saving ||
      revokingId
    ) {
      return;
    }

    const body = {};

    if (form.location !== consents.location) {
      body.location = form.location;
    }

    if (form.camera !== consents.camera) {
      body.camera = form.camera;
    }

    // privacy는 절대로 PATCH body에 포함하지 않음

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "user",
        "updateConsents",
        { body }
      );

      const updated = await loadConsents();

      setConsents(updated);
      setForm({
        location: updated.location,
        camera: updated.camera,
      });

      setMessage("개인정보 동의 설정을 저장했습니다.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // 상담기관 정보 공유 철회
  async function handleRevoke(share) {
    if (
      !share?.consultationId ||
      share.revokedAt ||
      loading ||
      saving ||
      revokingId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `${share.agencyName ?? "상담기관"}에 대한 정보 공유를 철회하시겠습니까?\n\n철회하면 상담기관의 자료 접근이 제한됩니다. 이미 전달된 정보의 회수 여부는 기관 정책에 따릅니다.`
    );

    if (!confirmed) return;

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

      // 철회 성공 후 서버에 저장된 최신 동의 상태 조회
      const updated = await loadConsents();

      setConsents(updated);

      setForm({
        location: updated.location,
        camera: updated.camera,
      });

      const revokedShare = updated.shares.find(
        (item) =>
          item.consultationId === share.consultationId
      );

      if (revokedShare?.revokedAt) {
        setMessage("상담기관 정보 공유가 철회되었습니다.");
      } else {
        setMessage(
          "철회 요청이 처리되었습니다. 공유 상태를 다시 확인해 주세요."
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRevokingId(null);
    }
  }

  const shares = consents?.shares ?? [];

  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>기록·개인정보 관리</h1>

      <p>
        위치 및 사진 촬영 동의를 관리하고,
        상담기관에 공유한 정보 내역을 확인할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={refresh}
        disabled={loading || saving || revokingId !== null || changed}
      >
        새로고침
      </button>

      {loading && (
        <p role="status">
          개인정보 설정을 불러오는 중...
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status">{message}</p>
      )}

      {!loading && consents && form && (
        <>
          <section style={{ marginTop: 28 }}>
            <h2>1. 개인정보 동의 상태</h2>

            <div style={{ marginBottom: 18 }}>
              <strong>필수 개인정보 동의</strong>

              <p>
                {consents.privacy
                  ? "동의 완료"
                  : "동의되지 않음"}
              </p>

              <p>
                필수 개인정보 동의는
                이 설정 화면에서 변경할 수 없습니다.
              </p>
            </div>

            <form onSubmit={handleSave}>
              <label
                style={{
                  display: "block",
                  marginBottom: 18,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.location}
                  disabled={saving || revokingId !== null}
                  onChange={(event) =>
                    changeConsent(
                      "location",
                      event.target.checked
                    )
                  }
                />
                {" "}위치정보 이용 동의
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: 18,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.camera}
                  disabled={saving || revokingId !== null}
                  onChange={(event) =>
                    changeConsent(
                      "camera",
                      event.target.checked
                    )
                  }
                />
                {" "}카메라 촬영 및 사진 저장 동의
              </label>

              <p>
                위치정보와 카메라 동의를 해제하면
                GPS·사진 인증이 필요한 출퇴근 기능의
                이용이 제한될 수 있습니다.
              </p>

              <button
                type="submit"
                disabled={
                  !changed ||
                  saving ||
                  revokingId !== null
                }
              >
                {saving
                  ? "설정 저장 중..."
                  : "변경사항 저장"}
              </button>

              <button
                type="button"
                disabled={
                  !changed ||
                  saving ||
                  revokingId !== null
                }
                onClick={() => {
                  setForm({
                    location: consents.location,
                    camera: consents.camera,
                  });
                  setMessage("변경사항을 취소했습니다.");
                }}
                style={{ marginLeft: 8 }}
              >
                변경 취소
              </button>
            </form>

            {consents.updatedAt && (
              <p style={{ marginTop: 12 }}>
                최종 변경:{" "}
                {formatDate(consents.updatedAt)}
              </p>
            )}
          </section>

          <hr style={{ margin: "28px 0" }} />

          <section>
            <h2>2. 상담기관 정보 공유 내역</h2>

            {shares.length === 0 && (
              <p>상담기관에 공유한 내역이 없습니다.</p>
            )}

            {shares.map((share) => {
              const revoked = Boolean(share.revokedAt);

              return (
                <article
                  key={share.consultationId}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <h3>
                    {share.agencyName ?? "상담기관"}
                  </h3>

                  <p>
                    공유 상태:{" "}
                    {revoked
                      ? "공유 철회"
                      : "공유 중"}
                  </p>

                  <p>
                    공유 시작:{" "}
                    {formatDate(share.sharedAt)}
                  </p>

                  {revoked && (
                    <p>
                      철회 시각:{" "}
                      {formatDate(share.revokedAt)}
                    </p>
                  )}

                  <Link
                    to={`/consultations/${encodeURIComponent(
                      share.consultationId
                    )}`}
                  >
                    상담 상세 보기
                  </Link>

                  {!revoked && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        disabled={
                          revokingId !== null ||
                          saving ||
                          changed
                        }
                        onClick={() =>
                          handleRevoke(share)
                        }
                      >
                        {revokingId === share.consultationId
                          ? "철회 처리 중..."
                          : "정보 공유 동의 철회"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}

            <p>
              정보 공유를 철회하면 상담기관의
              사건 및 증거 접근 권한은 서버에서 제한됩니다.
              이미 전달된 자료의 회수 여부는
              기관 정책에 따릅니다.
            </p>
          </section>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/profile">
          내 정보로 돌아가기
        </Link>
      </p>
    </main>
  );
}
