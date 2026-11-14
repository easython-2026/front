
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import "../styles/figma-petition.css";

const unwrap = (res) => res?.data ?? res;

const labels = {
  CONTRACT: "근로계약서 원본",
  ATTENDANCE_PHOTO: "출퇴근 인증 사진",
  GPS_LOG: "GPS 위치 기록",
  TIMESTAMP: "서버 타임스탬프",
  PAYSLIP: "급여명세서",
  MANUAL_RECORD: "수동 입력 근무기록",
};

const ids = (list) => [
  ...new Set(
    (Array.isArray(list) ? list : [])
      .map((e) => e?.id)
      .filter((x) => x != null)
      .map(String)
  ),
];

function message(err) {
  if (err?.status === 401)
    return "로그인이 필요합니다.";

  if (err?.status === 409)
    return "현재 진정서 상태에서는 증거를 변경할 수 없습니다.";

  return err?.message ?? "증거를 불러오지 못했습니다.";
}

export default function ComplaintEvidenceSelector({
  complaintId,
  attachedEvidences = [],
  disabled = false,
  onSaved,
  onUnsavedChange,
}) {
  const [available, setAvailable] = useState([]);
  const [selectedIds, setSelectedIds] = useState(
    () => ids(attachedEvidences)
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const originalIds = useMemo(
    () => ids(attachedEvidences),
    [attachedEvidences]
  );

  useEffect(() => {
    setSelectedIds(originalIds);
  }, [originalIds.join("|")]);

  // 증거 전체 목록 불러오기
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    async function run() {
      try {
        let page = 1;
        let totalPages = 1;
        const found = [];

        do {
          const response = unwrap(
            await apiRequest(
              "report",
              "getEvidences",
              {
                query: { page, size: 20 },
              }
            )
          );

          if (!active) return;

          if (!Array.isArray(response?.evidences)) {
            throw new Error(
              "증거 목록 응답 형식이 올바르지 않습니다."
            );
          }

          found.push(...response.evidences);

          const count = Number(
            response.pageInfo?.totalPages ?? 1
          );

          if (
            !Number.isSafeInteger(count) ||
            count < 1
          ) {
            throw new Error(
              "증거 목록 페이지 정보가 올바르지 않습니다."
            );
          }

          totalPages = Math.min(count, 100);
          page += 1;
        } while (page <= totalPages);

        if (active) {
          const unique = [
            ...new Map(
              found
                .filter((e) => e?.id != null)
                .map((e) => [String(e.id), e])
            ).values(),
          ];

          setAvailable(unique);
        }
      } catch (err) {
        if (active) setError(message(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  const dirty =
    JSON.stringify([...selectedIds].sort()) !==
    JSON.stringify([...originalIds].sort());

  const currentIds = new Set(
    available.map((item) => String(item.id))
  );

  const missing = originalIds.filter(
    (id) => !currentIds.has(id)
  );

  // 미저장 변경사항을 부모에 전달하여
  // PDF 다운로드 전 저장하도록 한다.
  useEffect(() => {
    onUnsavedChange?.(dirty);
  }, [dirty, onUnsavedChange]);

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );

    setNotice("");
  }

  async function save() {
    if (
      disabled ||
      saving ||
      loading ||
      error ||
      !dirty ||
      !selectedIds.length ||
      missing.length
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "report",
        "updateComplaintEvidences",
        {
          params: { complaintId },
          body: {
            evidenceIds: selectedIds,
          },
        }
      );

      setNotice("선택한 증거가 서버에 저장되었습니다.");

      onSaved?.();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pf-card pf-attachments">
      <div className="pf-attach-header">
        <h2>관련 증거</h2>
        <span>{selectedIds.length}개 선택</span>
      </div>

      <p className="pf-muted">
        진정서에 연결할 실제 증거를 선택하고 저장해 주세요.
      </p>

      {loading && (
        <p className="pf-muted" role="status">
          증거 목록을 불러오는 중...
        </p>
      )}

      {error && (
        <div role="alert" className="pf-notice pf-error">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="pf-notice pf-success">
          {notice}
        </div>
      )}

      {missing.length > 0 && (
        <div
          className="pf-notice pf-warn-box"
          role="alert"
        >
          기존에 첨부된 증거 {missing.length}개를 목록에서
          확인할 수 없습니다. 누락 방지를 위해 저장을
          제한했어요.
        </div>
      )}

      {!loading && !available.length && !error && (
        <p className="pf-muted">
          저장된 증거가 없습니다. 계약서·출퇴근·급여 기록을
          먼저 등록해 주세요.
        </p>
      )}

      {available.map((item) => {
        const id = String(item.id);
        const checked = selectedIds.includes(id);

        return (
          <label key={id} className="pf-attach-row">
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled || saving}
              onChange={() => toggle(id)}
            />

            <span>
              <b>
                {item.title ||
                  labels[item.type] ||
                  "증거"}
              </b>

              <small>
                {labels[item.type] ||
                  item.type ||
                  "유형 미확인"}

                {item.occurredAt
                  ? ` · ${item.occurredAt}`
                  : ""}
              </small>

              {item.type === "MANUAL_RECORD" && (
                <small>
                  수동 기록 · GPS·사진 원본 아님
                </small>
              )}

              {item.hash && (
                <details>
                  <summary>증거 해시 확인</summary>
                  <code>{item.hash}</code>
                </details>
              )}
            </span>

            <em
              className={`pf-pill ${
                checked ? "pf-good" : ""
              }`}
            >
              {checked ? "첨부 선택" : "미선택"}
            </em>
          </label>
        );
      })}

      <button
        type="button"
        className="pf-primary"
        disabled={
          disabled ||
          saving ||
          loading ||
          Boolean(error) ||
          !dirty ||
          !selectedIds.length ||
          Boolean(missing.length)
        }
        onClick={save}
      >
        {saving
          ? "증거 저장 중..."
          : "선택한 증거 저장"}
      </button>

      {dirty && (
        <button
          type="button"
          className="pf-secondary"
          disabled={saving}
          onClick={() => setSelectedIds(originalIds)}
        >
          선택 취소
        </button>
      )}
    </section>
  );
}