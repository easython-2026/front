
import { useState } from "react";
import { Link } from "react-router";

import {
  requestDataDeletion,
} from "../../api/user";

import {
  SettingsBadge,
  SettingsHeader,
  SettingsIcon,
  SettingsNotice,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

const options = [
  [
    "CONTRACTS",
    "근로계약서",
    "업로드 및 분석한 계약서",
  ],
  [
    "ATTENDANCE",
    "출퇴근·근무기록",
    "시각·GPS·인증 사진 등",
  ],
  [
    "PAYROLL",
    "급여자료",
    "급여명세서 및 임금 비교 자료",
  ],
  [
    "COMPLAINTS",
    "진정서",
    "진정서 초안 및 첨부 내역",
  ],
  [
    "ALL",
    "전체 기록",
    "위의 모든 기록에 대한 삭제 요청",
  ],
];

export default function DataDeletion() {
  const [targets, setTargets] = useState([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function toggle(value) {
    if (result) return;

    setTargets((prev) =>
      value === "ALL"
        ? prev.includes("ALL")
          ? []
          : ["ALL"]
        : prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [
            ...prev.filter((v) => v !== "ALL"),
            value,
          ]
    );

    setError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (
      busy ||
      !targets.length ||
      result
    ) {
      return;
    }

    if (
      !window.confirm(
        "선택한 기록에 대한 삭제 요청을 접수하시겠습니까? 일부 자료는 관련 법령에 따라 보존될 수 있습니다."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      // 기존 프론트의 targets 필드 사용.
      // 실제 서버 스키마 확인 필요.
      const payload = { targets };

      if (reason.trim()) {
        payload.reason = reason.trim();
      }

      const data = unwrap(
        await requestDataDeletion(payload)
      );

      setResult({
        requestId: data?.requestId ?? null,
        status: data?.status ?? "UNKNOWN",
      });
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="efx-screen">
      <SettingsHeader title="개인정보 삭제 요청"/>

      <main className="efx-content">
        <div className="efx-heading">
          <p className="efx-eyebrow">DATA DELETION</p>
          <h1>내 기록의 삭제를 요청해요</h1>
          <p>
            삭제할 정보의 범위를 선택해 주세요.
          </p>
        </div>

        <SettingsNotice tone="warning">
          법령상 보존이 필요한 자료는 요청 즉시
          삭제되지 않을 수 있습니다. 
        </SettingsNotice>

        {error && (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        )}

        {/* 서버 요청 응답 */}
        {result ? (
          <section className="efx-card efx-success-card">
            <SettingsIcon name="check" size={34}/>

            <h2>삭제 요청을 전송했어요</h2>

            <p>
              현재 처리 상태는 서버 응답을
              기준으로 표시합니다.
            </p>

            <div className="efx-info-line">
              <span>요청 번호</span>
              <b>{result.requestId ?? "미제공"}</b>
            </div>

            <div className="efx-info-line">
              <span>서버 상태</span>
              <SettingsBadge
                tone={
                  result.status === "RECEIVED"
                    ? "success"
                    : "neutral"
                }
              >
                {result.status}
              </SettingsBadge>
            </div>

            <Link
              className="efx-main-button"
              to="/profile"
            >
              내 정보로 이동
            </Link>
          </section>
        ) : (
          <form
            onSubmit={submit}
            className="efx-stack"
          >
            {/* 삭제 대상 선택 */}
            <section className="efx-card">
              <div className="efx-section-head">
                <h2>삭제 대상 선택</h2>

                <SettingsBadge>
                  {targets.length
                    ? "선택됨"
                    : "미선택"}
                </SettingsBadge>
              </div>

              <div className="efx-check-list">
                {options.map(([code, title, detail]) => (
                  <label
                    key={code}
                    className="efx-check-row"
                  >
                    <input
                      type="checkbox"
                      checked={targets.includes(code)}
                      disabled={busy}
                      onChange={() => toggle(code)}
                    />

                    <span>
                      <b>{title}</b>
                      <small>{detail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* 요청 사유 */}
            <section className="efx-card efx-stack">
              <h2>추가 요청사항 (선택)</h2>

              <textarea
                rows="3"
                value={reason}
                disabled={busy}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                maxLength={500}
                placeholder="요청 사유 또는 참고사항을 입력해 주세요."
              />
            </section>

            <button
              type="submit"
              className="efx-main-button"
              disabled={!targets.length || busy}
            >
              {busy
                ? "요청 중..."
                : "선택한 기록 삭제 요청"}
            </button>

            <Link
              className="efx-outline-button"
              to="/profile/consents"
            >
              정보 공유 내역 확인
            </Link>
          </form>
        )}
      </main>
    </div>
  );
}
