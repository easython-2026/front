
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiRequest } from "../../api/client";

import ComplaintEvidenceSelector from "../../components/ComplaintEvidenceSelector";

function unwrap(response) {
  return response?.data ?? response;
}

function getErrorMessage(error) {
  const code =
    error?.errorCode ??
    error?.data?.errorCode ??
    error?.code;

  if (code === "NOT_REVIEWED") {
    return "진정서를 먼저 검토하고 확정해 주세요.";
  }

  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  if (error?.status === 404) {
    return "진정서를 찾을 수 없습니다.";
  }

  if (error?.status === 409) {
    return "진정서 생성 또는 번역이 진행 중입니다.";
  }

  return error instanceof Error
    ? error.message
    : "요청 처리 중 오류가 발생했습니다.";
}

function makeDraftForm(complaint) {
  const ko = complaint?.draft?.ko;

  // API의 한국어 초안은 객체다.
  // 문자열 등 예상 외 형식이면 임의 변환하지 않는다.
  if (!ko || typeof ko !== "object" || Array.isArray(ko)) {
    return null;
  }

  return {
    title: ko.title == null ? "" : String(ko.title),
    body: ko.body == null ? "" : String(ko.body),
    unpaidAmount:
      ko.unpaidAmount == null
        ? ""
        : String(ko.unpaidAmount),
  };
}

function validateForm(form) {
  if (!form) {
    return "한국어 초안의 데이터 구조를 확인할 수 없습니다.";
  }

  if (!form.body.trim()) {
    return "진정서 내용을 입력해 주세요.";
  }

  if (form.unpaidAmount !== "") {
    const amount = Number(form.unpaidAmount);

    if (
      !/^\d+$/.test(form.unpaidAmount) ||
      !Number.isSafeInteger(amount)
    ) {
      return "차이 금액은 0 이상의 정수로 입력해 주세요.";
    }
  }

  return null;
}

export default function PetitionDetail() {
  const { petitionId } = useParams();

  const [petition, setPetition] = useState(null);
  const [draftForm, setDraftForm] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ======================================
  // 1. 진정서 조회 및 비동기 상태 확인
  // ======================================
  useEffect(() => {
    if (!petitionId) return;

    let active = true;
    let timer = null;

    async function loadPetition() {
      try {
        const response = await apiRequest(
          "report",
          "getComplaint",
          { params: { complaintId: petitionId } }
        );

        if (!active) return;

        const data = unwrap(response);

        if (!data || typeof data !== "object") {
          throw new Error(
            "진정서 상세 응답 형식이 올바르지 않습니다."
          );
        }

        setPetition(data);
        setError("");
        setLoading(false);

        const creating = data.status === "PROCESSING";
        const translating =
          data.translationStatus === "PROCESSING";

        // 생성·번역 중에는 편집 폼을 초기화하지 않는다.
        if (!creating && !translating) {
          const nextForm = makeDraftForm(data);
          setDraftForm(nextForm);
          setOriginalForm(nextForm);
        }

        if (creating || translating) {
          timer = setTimeout(loadPetition, 3000);
        }
      } catch (err) {
        if (!active) return;

        setError(getErrorMessage(err));
        setLoading(false);
      }
    }

    loadPetition();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [petitionId, reloadKey]);

  const processing = petition?.status === "PROCESSING";
  const failed = petition?.status === "FAILED";
  const translating =
    petition?.translationStatus === "PROCESSING";

  const reviewed = petition?.reviewed === true;

  const busy = loading || saving || confirming || downloading;

  const canEdit =
    !busy &&
    !processing &&
    !failed &&
    !translating &&
    draftForm !== null;

  const hasChanges =
    draftForm !== null &&
    originalForm !== null &&
    JSON.stringify(draftForm) !==
      JSON.stringify(originalForm);

  const canConfirm =
    canEdit &&
    !reviewed &&
    !hasChanges &&
    !validateForm(draftForm);

  const canDownload =
    !busy &&
    reviewed &&
    !processing &&
    !failed &&
    !translating &&
    !hasChanges;

  const evidences = Array.isArray(petition?.evidences)
    ? petition.evidences
    : [];

  function refresh() {
    setLoading(true);
    setError("");
    setReloadKey((prev) => prev + 1);
  }

  function handleFormChange(key, value) {
    setDraftForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
    setMessage("");
  }

  // ======================================
  // 2. 초안 수정 및 모국어 재번역
  // ======================================
  async function handleSave() {
    if (!canEdit || !hasChanges) return;

    const validationError = validateForm(draftForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    const originalKo = petition?.draft?.ko;

    if (
      !originalKo ||
      typeof originalKo !== "object" ||
      Array.isArray(originalKo)
    ) {
      setError("수정 가능한 한국어 초안이 없습니다.");
      return;
    }

    const changes = {};

    if (draftForm.title !== originalForm.title) {
      changes.title = draftForm.title;
    }

    if (draftForm.body !== originalForm.body) {
      changes.body = draftForm.body;
    }

    if (
      draftForm.unpaidAmount !==
      originalForm.unpaidAmount
    ) {
      changes.unpaidAmount =
        draftForm.unpaidAmount === ""
          ? null
          : Number(draftForm.unpaidAmount);
    }

    // draft.ko의 기존 claims 등은 보존한다.
    const updatedKo = {
      ...originalKo,
      ...changes,
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "report",
        "updateComplaint",
        {
          params: { complaintId: petitionId },
          body: {
            draft: updatedKo,
            retranslate: true,
          },
        }
      );

      setMessage(
        "수정 내용이 저장되었습니다. 모국어 번역 상태를 확인합니다."
      );

      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ======================================
  // 3. 최종 검토 완료
  // ======================================
  async function handleConfirm() {
    if (!canConfirm) return;

    if (
      !window.confirm(
        "한국어 진정서와 모국어 번역문, 금액 및 사실관계를 모두 확인했습니까?"
      )
    ) {
      return;
    }

    setConfirming(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "report",
        "updateComplaint",
        {
          params: { complaintId: petitionId },
          body: { confirm: true },
        }
      );

      setMessage(
        "검토 완료 요청이 처리되었습니다. 확정 상태를 다시 조회합니다."
      );

      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  }

  // ======================================
  // 4. 실제 PDF 다운로드
  // ======================================
  async function handleDownload() {
    if (!canDownload) return;

    setDownloading(true);
    setError("");
    setMessage("");

    try {
      // apiRequest가 responseType: "blob"을
      // 지원하도록 client.js 설정 필요
      const blob = await apiRequest(
        "report",
        "downloadComplaintPdf",
        {
          params: { complaintId: petitionId },
          responseType: "blob",
        }
      );

      if (!(blob instanceof Blob)) {
        throw new Error(
          "PDF 파일 응답을 확인할 수 없습니다. api/client.js의 Blob 처리를 확인해 주세요."
        );
      }

      if (!blob.type.includes("pdf")) {
        throw new Error(
          "서버가 PDF가 아닌 응답을 반환했습니다."
        );
      }

      const url = URL.createObjectURL(blob);

      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `complaint_${petitionId}.pdf`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setMessage("PDF 다운로드를 요청했습니다.");
      } finally {
        // 클릭 이후 Blob URL 정리
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        padding: 24,
        margin: "0 auto",
      }}
    >
      <h1>진정서 수정 및 확정</h1>
      <p>진정서 ID: {petitionId}</p>

      <button
        type="button"
        disabled={busy || hasChanges}
        onClick={refresh}
      >
        다시 조회
      </button>

      {loading && <p role="status">진정서 조회 중...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {petition && (
        <>
          {/* 상태 */}
          <section style={{ marginTop: 24 }}>
            <h2>1. 진정서 상태</h2>

            <p>생성 상태: {petition.status ?? "미확인"}</p>

            <p>
              번역 상태:{" "}
              {petition.translationStatus ?? "미확인"}
            </p>

            <p>
              사용자 검토:{" "}
              {reviewed ? "완료" : "미완료"}
            </p>

            {processing && (
              <p role="status">
                진정서를 생성 중입니다.
                3초마다 다시 확인합니다.
              </p>
            )}

            {translating && (
              <p role="status">
                모국어 번역이 진행 중입니다.
                번역 완료 전에는 확정할 수 없습니다.
              </p>
            )}

            {failed && (
              <p role="alert">
                생성 실패:{" "}
                {petition.failReason ?? "사유 미제공"}
              </p>
            )}
          </section>

          {/* 원문 수정 */}
          {!processing && !failed && draftForm && (
            <section style={{ marginTop: 28 }}>
              <h2>2. 한국어 진정서 수정</h2>

              <label htmlFor="petition-title">
                제목
              </label>

              <input
                id="petition-title"
                type="text"
                value={draftForm.title}
                disabled={!canEdit}
                onChange={(e) =>
                  handleFormChange("title", e.target.value)
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: 16,
                }}
              />

              <label htmlFor="petition-body">
                진정서 내용
              </label>

              <textarea
                id="petition-body"
                value={draftForm.body}
                disabled={!canEdit}
                onChange={(e) =>
                  handleFormChange("body", e.target.value)
                }
                rows={12}
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: 16,
                }}
              />

              <label htmlFor="petition-amount">
                청구 금액 (원)
              </label>

              <input
                id="petition-amount"
                type="number"
                min="0"
                step="1"
                value={draftForm.unpaidAmount}
                disabled={!canEdit}
                onChange={(e) =>
                  handleFormChange(
                    "unpaidAmount",
                    e.target.value
                  )
                }
                style={{
                  display: "block",
                  marginBottom: 16,
                }}
              />

              <p>
                변경사항: {hasChanges ? "있음" : "없음"}
              </p>

              <button
                type="button"
                disabled={!canEdit || !hasChanges}
                onClick={handleSave}
              >
                {saving
                  ? "저장 중..."
                  : "수정 저장 및 재번역"}
              </button>

              <button
                type="button"
                disabled={!canEdit || !hasChanges}
                onClick={() => {
                  setDraftForm({ ...originalForm });
                  setMessage("수정 내용을 취소했습니다.");
                }}
                style={{ marginLeft: 8 }}
              >
                수정 취소
              </button>
            </section>
          )}

          {/* 번역문 */}
          {!processing && !failed && (
            <section style={{ marginTop: 28 }}>
              <h2>3. 모국어 번역문</h2>

              {translating ? (
                <p>
                  최신 번역을 생성 중입니다.
                  완료될 때까지 번역문을 표시하지 않습니다.
                </p>
              ) : petition.draft?.translated != null ? (
                <pre style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {typeof petition.draft.translated === "string"
                    ? petition.draft.translated
                    : JSON.stringify(
                        petition.draft.translated,
                        null,
                        2
                      )}
                </pre>
              ) : (
                <p>번역문이 아직 제공되지 않았습니다.</p>
              )}
            </section>
          )}

          {/* 증거 첨부 관리 */}
            {!processing && !failed && (
                <section style={{ marginTop: 28 }}>
                    <h2>4. 첨부 증거</h2>

                    <ComplaintEvidenceSelector
                        complaintId={petitionId}
                        attachedEvidences={evidences}
                        disabled={
                            busy ||
                            translating ||
                            hasChanges
                        }
                        onSaved={refresh}
                    />
                </section>
            )}

          {/* 검토 완료 */}
          {!processing && !failed && (
            <section style={{ marginTop: 28 }}>
              <h2>5. 최종 검토 완료</h2>

              <p>
                진정서의 사실관계, 금액, 날짜,
                번역문을 모두 확인한 후 확정해 주세요.
              </p>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
              >
                {reviewed
                  ? "검토 완료"
                  : confirming
                    ? "확정 중..."
                    : "진정서 검토 완료"}
              </button>
            </section>
          )}

          {/* PDF */}
          <section style={{ marginTop: 28 }}>
            <h2>6. PDF 다운로드</h2>

            <p>
              진정서 검토가 완료되어야
              PDF를 다운로드할 수 있습니다.
            </p>

            <button
              type="button"
              disabled={!canDownload}
              onClick={handleDownload}
            >
              {downloading
                ? "다운로드 중..."
                : "진정서 PDF 다운로드"}
            </button>

            {!reviewed && (
              <p>아직 사용자 검토가 완료되지 않았습니다.</p>
            )}
          </section>

          {petition.officialGuide && (
            <section style={{ marginTop: 28 }}>
              <h2>7. 공식 진정 절차 안내</h2>
              <pre style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}>
                {JSON.stringify(
                  petition.officialGuide,
                  null,
                  2
                )}
              </pre>
            </section>
          )}

          {petition.disclaimer && (
            <p style={{ marginTop: 28 }}>
              {petition.disclaimer}
            </p>
          )}
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/petitions">
          진정서 목록으로 이동
        </Link>
      </p>
    </main>
  );
}
