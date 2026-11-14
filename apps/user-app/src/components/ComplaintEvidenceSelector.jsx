
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const TYPE_LABELS = {
  CONTRACT: "근로계약서",
  ATTENDANCE_PHOTO: "출퇴근 사진",
  GPS_LOG: "GPS 위치 기록",
  TIMESTAMP: "시간 기록",
  PAYSLIP: "급여명세서",
  MANUAL_RECORD: "수동 입력 기록",
};

function unwrap(response) {
  return response?.data ?? response;
}

function errorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  if (error?.status === 400) {
    return "증거 선택 내용을 확인해 주세요.";
  }

  if (error?.status === 409) {
    return "현재 진정서 상태에서는 증거를 변경할 수 없습니다.";
  }

  return error?.message ?? "증거 처리에 실패했습니다.";
}

function getAttachedIds(attached) {
  return [...new Set(
    (Array.isArray(attached) ? attached : [])
      .map((item) => item?.id)
      .filter(Boolean)
  )];
}

export default function ComplaintEvidenceSelector({
  complaintId,
  attachedEvidences = [],
  disabled = false,
  onSaved,
}) {
  const [available, setAvailable] = useState([]);
  const [selectedIds, setSelectedIds] = useState(
    () => getAttachedIds(attachedEvidences)
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 전체 증거 목록 불러오기
  useEffect(() => {
    let active = true;

    async function loadEvidences() {
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await apiRequest(
            "report",
            "getEvidences",
            {
              query: { page, size: 100 },
            }
          );

          if (!active) return;

          const data = unwrap(response);

          if (!Array.isArray(data?.evidences)) {
            throw new Error(
              "증거 목록 응답 형식이 올바르지 않습니다."
            );
          }

          all.push(...data.evidences);

          const pages = Number(
            data.pageInfo?.totalPages ?? 1
          );

          if (
            !Number.isSafeInteger(pages) ||
            pages < 1
          ) {
            throw new Error(
              "증거 목록의 페이지 정보를 확인할 수 없습니다."
            );
          }

          totalPages = pages;
          page += 1;
        } while (page <= totalPages);

        if (!active) return;

        // ID 기준 중복 제거
        const unique = [
          ...new Map(
            all.filter((item) => item?.id)
              .map((item) => [item.id, item])
          ).values(),
        ];

        setAvailable(unique);
        setError("");
      } catch (err) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvidences();

    return () => {
      active = false;
    };
  }, []);

  const originalIds = useMemo(
    () => getAttachedIds(attachedEvidences),
    [attachedEvidences]
  );

  const availableIds = useMemo(
    () => new Set(available.map((item) => item.id)),
    [available]
  );

  // 조회 목록에 없는 기존 첨부 증거는
  // 저장 시 누락시키지 않는다.
  const missingOriginalIds = originalIds.filter(
    (id) => !availableIds.has(id)
  );

  const normalizedSelected = [...selectedIds].sort();
  const normalizedOriginal = [...originalIds].sort();

  const changed =
    JSON.stringify(normalizedSelected) !==
    JSON.stringify(normalizedOriginal);

  const canSave =
    !disabled &&
    !loading &&
    !saving &&
    !error &&
    changed &&
    selectedIds.length > 0 &&
    missingOriginalIds.length === 0;

  function toggleEvidence(id, checked) {
    setSelectedIds((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((item) => item !== id)
    );

    setMessage("");
  }

  async function saveEvidences() {
    if (!canSave) return;

    setSaving(true);
    setError("");
    setMessage("");

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

      setMessage("진정서 첨부 증거가 저장되었습니다.");

      // 부모 컴포넌트의 상세 GET 재조회
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>진정서 첨부 증거 관리</h2>

      <p>
        진정서에 포함할 증거를 선택하세요.
        저장하면 선택한 증거 전체가 적용됩니다.
      </p>

      {loading && (
        <p role="status">증거 목록을 불러오는 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!loading && available.length === 0 && !error && (
        <p>등록된 증거가 없습니다.</p>
      )}

      {missingOriginalIds.length > 0 && (
        <p role="alert">
          기존 첨부 증거 중 현재 증거 목록에서
          조회되지 않는 항목이 있습니다.
          누락된 항목이 임의로 삭제되지 않도록
          저장을 차단했습니다.
        </p>
      )}

      {!loading && available.map((evidence) => (
        <label
          key={evidence.id}
          style={{
            display: "block",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(evidence.id)}
            disabled={disabled || saving}
            onChange={(event) =>
              toggleEvidence(
                evidence.id,
                event.target.checked
              )
            }
            style={{ marginRight: 8 }}
          />

          <strong>
            {evidence.title ??
              TYPE_LABELS[evidence.type] ??
              "증거"}
          </strong>

          <p>
            유형:{" "}
            {TYPE_LABELS[evidence.type] ??
              evidence.type ??
              "미확인"}
          </p>

          {evidence.occurredAt && (
            <p>발생 시각: {evidence.occurredAt}</p>
          )}

          {evidence.type === "MANUAL_RECORD" && (
            <p>
              수동 입력 기록 — GPS·사진 인증 원본과
              구분되는 자료입니다.
            </p>
          )}

          {evidence.hash && (
            <details>
              <summary>원본 해시 확인</summary>
              <code style={{
                overflowWrap: "anywhere",
              }}>
                {evidence.hash}
              </code>
            </details>
          )}
        </label>
      ))}

      <p>선택한 증거: {selectedIds.length}개</p>

      {selectedIds.length === 0 && (
        <p>
          최소 1개 이상의 증거를 선택해야
          저장할 수 있습니다.
        </p>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={saveEvidences}
      >
        {saving
          ? "증거 저장 중..."
          : "선택한 증거 저장"}
      </button>

      <button
        type="button"
        disabled={disabled || saving || !changed}
        style={{ marginLeft: 8 }}
        onClick={() => {
          setSelectedIds(originalIds);
          setMessage("선택을 취소했습니다.");
        }}
      >
        선택 취소
      </button>
    </section>
  );
}
