
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
  useSearchParams,
} from "react-router";

import { apiRequest } from "../../api/client";

import ComplaintEvidenceSelector from "../../components/ComplaintEvidenceSelector";

import "../../styles/figma-petition.css";

const unwrap = (value) => value?.data ?? value;

function humanError(err) {
  if (err?.errorCode === "NOT_REVIEWED") {
    return "진정서를 먼저 검토·확정해 주세요.";
  }

  if (err?.status === 401) {
    return "로그인이 필요합니다.";
  }

  if (err?.status === 404) {
    return "진정서를 찾을 수 없습니다.";
  }

  if (err?.status === 409) {
    return "초안 생성 또는 번역이 진행 중입니다.";
  }

  return err?.message ?? "요청을 처리하지 못했습니다.";
}

const shown = (value) =>
  value == null || value === ""
    ? "서버 정보 없음 · 확인 필요"
    : String(value);

// 기존 한국어 초안에서 수정 가능한 데이터만 구성
function formFrom(complaint) {
  const ko = complaint?.draft?.ko;

  if (
    !ko ||
    typeof ko !== "object" ||
    Array.isArray(ko)
  ) {
    return null;
  }

  return {
    title:
      ko.title == null
        ? ""
        : String(ko.title),

    body:
      ko.body == null
        ? ""
        : String(ko.body),

    unpaidAmount:
      ko.unpaidAmount == null
        ? ""
        : String(ko.unpaidAmount),
  };
}

// 서버의 선택 언어 번역본을 표시 가능한 데이터로 변환
function translatedDraft(complaint) {
  const value = complaint?.draft?.translated;

  if (typeof value === "string") {
    return {
      title: "",
      body: value,
      unpaidAmount: "",
    };
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return {
      title: String(value.title ?? ""),
      body: String(value.body ?? ""),

      unpaidAmount:
        value.unpaidAmount == null
          ? ""
          : String(value.unpaidAmount),
    };
  }

  return null;
}

// 제출 전 값 검증
function valid(form) {
  if (!form) {
    return "수정 가능한 한국어 초안을 찾지 못했습니다.";
  }

  if (!form.body.trim()) {
    return "진정서 사건 경위를 입력해 주세요.";
  }

  if (
    form.unpaidAmount !== "" &&
    (
      !/^\d+$/.test(form.unpaidAmount) ||
      !Number.isSafeInteger(
        Number(form.unpaidAmount)
      )
    )
  ) {
    return "차이 금액은 0 이상의 정수로 입력해 주세요.";
  }

  return "";
}

// Figma 3단계 표시
function StepBar({
  step,
  reviewed,
  onStep,
}) {
  const names = [
    "정보 불러오기",
    "대조본 검토",
    "증거·PDF",
  ];

  return (
    <div
      className="pf-stepper"
      aria-label="진정서 진행 단계"
    >
      {names.map((name, index) => (
        <div
          key={name}
          className={
            index <= step ? "active" : ""
          }
        >
          <i>
            {index < step
              ? "✓"
              : index + 1}
          </i>

          {index === 0 ? (
            <span>{name}</span>
          ) : (
            <button
              type="button"
              disabled={
                index === 2 && !reviewed
              }
              onClick={() =>
                onStep(index)
              }
            >
              {name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Figma 문서 항목
function DocField({
  label,
  ko,
  translated,
  mode,
  editable = false,
  type = "text",
  onChange,
  disabled = false,
}) {
  return (
    <div className="pf-doc-field">
      <span>{label}</span>

      <div
        className={`pf-doc-values ${
          mode === "both"
            ? "pf-side-by-side"
            : ""
        }`}
      >
        {/* 한국어 원문 */}
        {mode !== "translated" && (
          <div>
            {mode === "both" && (
              <small>한국어</small>
            )}

            {editable ? (
              type === "textarea" ? (
                <textarea
                  rows="7"
                  value={ko}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      event.target.value
                    )
                  }
                />
              ) : (
                <input
                  type={type}
                  min={
                    type === "number"
                      ? "0"
                      : undefined
                  }
                  value={ko}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      event.target.value
                    )
                  }
                />
              )
            ) : (
              <p>{shown(ko)}</p>
            )}
          </div>
        )}

        {/* 모국어 번역본 */}
        {mode !== "ko" && (
          <div>
            {mode === "both" && (
              <small>선택 언어</small>
            )}

            <p className="pf-translated">
              {shown(translated)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PetitionDetail() {
  const { petitionId } = useParams();
  const [params] = useSearchParams();

  // 초안 생성 후 진입하면 2단계부터 시작
  const [step, setStep] = useState(
    params.get("step") === "evidence"
      ? 2
      : 1
  );

  const [view, setView] = useState("ko");

  const [petition, setPetition] = useState(null);
  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [unsavedEvidence, setUnsavedEvidence] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => {
    setReload((value) => value + 1);
  }, []);

  const handleEvidenceUnsaved = useCallback(
    (dirty) => setUnsavedEvidence(dirty),
    []
  );

  // ========================================
  // 진정서 상세 조회 및 생성·번역 상태 확인
  // ========================================

  useEffect(() => {
    let active = true;
    let timer;

    async function load() {
      try {
        const data = unwrap(
          await apiRequest(
            "report",
            "getComplaint",
            {
              params: {
                complaintId: petitionId,
              },
            }
          )
        );

        if (!active) return;

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "진정서 상세 응답 형식을 확인해 주세요."
          );
        }

        setPetition(data);
        setLoading(false);
        setError("");

        const pending =
          data.status === "PROCESSING" ||
          data.translationStatus === "PROCESSING";

        if (!pending) {
          const next = formFrom(data);
          setForm(next);
          setOriginal(next);
        }

        if (step === 2 && !data.reviewed) {
          setStep(1);
        }

        // 처리 중이면 3초마다 상태 조회
        if (pending) {
          timer = window.setTimeout(
            load,
            3000
          );
        }
      } catch (err) {
        if (active) {
          setLoading(false);
          setError(humanError(err));
        }
      }
    }

    load();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [petitionId, reload]);

  // ========================================
  // 진정서 상태
  // ========================================

  const processing =
    petition?.status === "PROCESSING";

  const failed =
    petition?.status === "FAILED";

  const translating =
    petition?.translationStatus === "PROCESSING";

  const reviewed =
    petition?.reviewed === true;

  const busy =
    loading ||
    saving ||
    confirming ||
    downloading;

  const canEdit =
    Boolean(form) &&
    !busy &&
    !processing &&
    !failed &&
    !translating &&
    !reviewed;

  const changed = Boolean(
    form &&
    original &&
    JSON.stringify(form) !==
      JSON.stringify(original)
  );

  const canConfirm =
    canEdit &&
    !changed &&
    !valid(form);

  const translation = !translating
    ? translatedDraft(petition)
    : null;

  const evidences = useMemo(
    () =>
      Array.isArray(petition?.evidences)
        ? petition.evidences
        : [],
    [petition?.evidences]
  );

  const canDownload =
    reviewed &&
    !busy &&
    !failed &&
    !processing &&
    !translating &&
    !changed &&
    !unsavedEvidence;

  const ko = petition?.draft?.ko;

  const employer =
    petition?.business ??
    petition?.employer;

  const period =
    petition?.periodStart &&
    petition?.periodEnd
      ? `${petition.periodStart} ~ ${petition.periodEnd}`
      : null;

  const guide =
    typeof petition?.officialGuide === "string"
      ? petition.officialGuide
      : petition?.officialGuide?.description ??
        petition?.officialGuide?.instructions ??
        null;

  // ========================================
  // 한국어 초안 수정
  // ========================================

  function update(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
    setError("");
  }

  async function save() {
    if (!canEdit || !changed) return;

    const problem = valid(form);

    if (problem) {
      setError(problem);
      return;
    }

    const originalKo =
      petition?.draft?.ko;

    if (
      !originalKo ||
      typeof originalKo !== "object" ||
      Array.isArray(originalKo)
    ) {
      setError(
        "한국어 초안 객체가 없습니다."
      );
      return;
    }

    // 기존 claims 등 다른 필드 유지
    const updated = {
      ...originalKo,
    };

    if (form.title !== original.title) {
      updated.title = form.title;
    }

    if (form.body !== original.body) {
      updated.body = form.body;
    }

    if (
      form.unpaidAmount !==
      original.unpaidAmount
    ) {
      updated.unpaidAmount =
        form.unpaidAmount === ""
          ? null
          : Number(form.unpaidAmount);
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "report",
        "updateComplaint",
        {
          params: {
            complaintId: petitionId,
          },
          body: {
            draft: updated,
            retranslate: true,
          },
        }
      );

      setMessage(
        "수정 내용을 저장했습니다. 최신 번역 결과를 다시 확인해 주세요."
      );

      refresh();
    } catch (err) {
      setError(humanError(err));
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // 진정서 검토 확정
  // ========================================

  async function confirm() {
    if (!canConfirm) return;

    if (
      !window.confirm(
        "한국어 초안의 사실·날짜·금액과 선택 언어 번역을 확인했나요?"
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
          params: {
            complaintId: petitionId,
          },
          body: {
            confirm: true,
          },
        }
      );

      setMessage(
        "진정서 검토 완료 요청이 처리되었습니다."
      );

      setStep(2);
      refresh();
    } catch (err) {
      setError(humanError(err));
    } finally {
      setConfirming(false);
    }
  }

  // ========================================
  // 실제 서버 PDF 다운로드
  // ========================================

  async function download() {
    if (!canDownload) return;

    setDownloading(true);
    setError("");
    setMessage("");

    try {
      const blob = await apiRequest(
        "report",
        "downloadComplaintPdf",
        {
          params: {
            complaintId: petitionId,
          },
          responseType: "blob",
        }
      );

      if (
        !(blob instanceof Blob) ||
        !blob.type.includes("pdf")
      ) {
        throw new Error(
          "서버에서 올바른 PDF 파일을 받지 못했습니다."
        );
      }

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `complaint_${petitionId}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000
      );

      setMessage(
        "PDF 파일 다운로드를 요청했습니다. 다운로드 폴더를 확인해 주세요."
      );
    } catch (err) {
      setError(humanError(err));
    } finally {
      setDownloading(false);
    }
  }

  // ========================================
  // 화면
  // ========================================

  return (
    <div className="pf-screen">
      <header className="pf-header">
        <Link
          to="/petitions"
          aria-label="진정서 목록으로"
        >
          ‹
        </Link>

        <strong>진정서 초안</strong>

        <button
          type="button"
          onClick={refresh}
          disabled={busy || changed}
        >
          새로고침
        </button>
      </header>

      <main className="pf-content">
        <StepBar
          step={step}
          reviewed={reviewed}
          onStep={setStep}
        />

        {loading && (
          <div className="pf-notice" role="status">
            진정서 생성·번역 상태를 확인하고 있어요.
          </div>
        )}

        {error && (
          <div className="pf-notice pf-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div
            className="pf-notice pf-success"
            role="status"
          >
            {message}
          </div>
        )}

        {processing && (
          <div className="pf-notice">
            AI가 진정서 초안을 생성하고 있어요.
            자동으로 상태를 다시 확인합니다.
          </div>
        )}

        {translating && (
          <div className="pf-notice">
            선택 언어 번역이 진행 중이에요.
            완료 전에는 확정할 수 없습니다.
          </div>
        )}

        {failed && (
          <div className="pf-notice pf-error">
            초안 생성 실패:{" "}
            {petition.failReason ?? "사유 미제공"}
          </div>
        )}

        {/* ====================================
            2단계 - 대조본 검토
        ==================================== */}

        {!loading &&
          !processing &&
          !failed &&
          petition &&
          step === 1 && (
            <>
              {/* Figma 한국어 / 선택 언어 / 나란히 보기 */}
              <div className="pf-doc-tabs">
                {[
                  ["ko", "한국어"],
                  ["translated", "선택 언어"],
                  ["both", "나란히 보기"],
                ].map(([value, title]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      view === value ? "active" : ""
                    }
                    onClick={() =>
                      setView(value)
                    }
                  >
                    {title}
                  </button>
                ))}
              </div>

              {/* 진정서 문서 카드 */}
              <section className="pf-card pf-document">
                <div className="pf-doc-title">
                  <strong>진정서 초안</strong>

                  <em
                    className={`pf-pill ${
                      reviewed
                        ? "pf-good"
                        : "pf-warn"
                    }`}
                  >
                    {reviewed
                      ? "검토 완료"
                      : "검토 필요"}
                  </em>
                </div>

                <DocField
                  label="근로자 정보"
                  ko={
                    petition?.worker?.name ??
                    petition?.workerName
                  }
                  translated={
                    petition?.worker?.translatedName
                  }
                  mode={view}
                />

                <DocField
                  label="피진정인 관련 사업장"
                  ko={[
                    employer?.name,
                    employer?.address,
                    employer?.ownerName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  translated={
                    petition?.translatedBusiness
                  }
                  mode={view}
                />

                <DocField
                  label="근무기간"
                  ko={period}
                  translated={
                    petition?.translatedPeriod
                  }
                  mode={view}
                />

                <DocField
                  label="근로계약 조건"
                  ko={petition?.contractSummary}
                  translated={
                    petition?.translatedContractSummary
                  }
                  mode={view}
                />

                <DocField
                  label="임금 비교"
                  ko={petition?.comparisonSummary}
                  translated={
                    petition?.translatedComparisonSummary
                  }
                  mode={view}
                />

                {/* 문서 제목 */}
                <DocField
                  label="문서 제목"
                  ko={form?.title ?? ""}
                  translated={translation?.title}
                  mode={view}
                  editable={canEdit}
                  disabled={!canEdit}
                  onChange={(value) =>
                    update("title", value)
                  }
                />

                {/* 금액 */}
                <DocField
                  label="확인 필요 차이 (원)"
                  ko={form?.unpaidAmount ?? ""}
                  translated={
                    translation?.unpaidAmount
                  }
                  mode={view}
                  editable={canEdit}
                  disabled={!canEdit}
                  type="number"
                  onChange={(value) =>
                    update("unpaidAmount", value)
                  }
                />

                {/* 본문 */}
                <DocField
                  label="사건 경위"
                  ko={form?.body ?? ""}
                  translated={translation?.body}
                  mode={view}
                  editable={canEdit}
                  disabled={!canEdit}
                  type="textarea"
                  onChange={(value) =>
                    update("body", value)
                  }
                />
              </section>

              {/* 번역 상태 */}
              {view !== "ko" && !translation && (
                <div className="pf-notice pf-warn-box">
                  선택 언어 번역문이 아직 제공되지 않았습니다.
                  서버 번역 상태를 확인해 주세요.
                </div>
              )}

              {/* 기존 초안 근거 정보 */}
              {ko?.claims && (
                <section className="pf-card">
                  <h2>AI 추출 근거</h2>

                  <pre className="pf-claims">
                    {typeof ko.claims === "string"
                      ? ko.claims
                      : JSON.stringify(
                          ko.claims,
                          null,
                          2
                        )}
                  </pre>
                </section>
              )}

              {/* 법률 면책 고지 */}
              <div className="pf-notice pf-warn-box">
                이 문서는 참고용 초안이며 실제 기관에 자동
                제출되지 않습니다. 최종 판단은 노무사·노동청
                확인이 필요합니다.
              </div>

              {/* 변경 사항 저장 */}
              {changed && (
                <div className="pf-actions">
                  <button
                    type="button"
                    className="pf-primary"
                    onClick={save}
                    disabled={!canEdit}
                  >
                    {saving
                      ? "저장 중..."
                      : "수정 저장 및 재번역"}
                  </button>

                  <button
                    type="button"
                    className="pf-secondary"
                    disabled={!canEdit}
                    onClick={() =>
                      setForm({ ...original })
                    }
                  >
                    수정 취소
                  </button>
                </div>
              )}

              {/* 검토 완료 후 증거 확인 */}
              {reviewed ? (
                <button
                  type="button"
                  className="pf-primary"
                  onClick={() =>
                    setStep(2)
                  }
                >
                  증거 확인 및 PDF 다운로드
                </button>
              ) : (
                <button
                  type="button"
                  className="pf-primary"
                  onClick={confirm}
                  disabled={!canConfirm}
                >
                  {confirming
                    ? "확정 중..."
                    : changed
                    ? "수정 내용을 먼저 저장해 주세요"
                    : "검토 완료 · 증거 확인"}
                </button>
              )}
            </>
          )}

        {/* ====================================
            3단계 - 증거 확인 및 PDF
        ==================================== */}

        {!loading &&
          petition &&
          step === 2 && (
            <>
              <div className="pf-heading">
                <p className="pf-eyebrow">
                  ATTACHMENTS
                </p>

                <h1>
                  관련 증거를 확인해 주세요
                </h1>

                <p>
                  실제 서버에 저장된 증거 중 진정서에
                  첨부할 항목을 선택하세요.
                </p>
              </div>

              {/* Figma 증거 선택 목록 */}
              <ComplaintEvidenceSelector
                complaintId={petitionId}
                attachedEvidences={evidences}
                disabled={
                  busy ||
                  processing ||
                  failed ||
                  translating ||
                  changed ||
                  !reviewed
                }
                onSaved={refresh}
                onUnsavedChange={
                  handleEvidenceUnsaved
                }
              />

              {unsavedEvidence && (
                <div className="pf-notice pf-warn-box">
                  선택한 증거의 변경사항을 먼저 저장해야
                  PDF를 받을 수 있습니다.
                </div>
              )}

              {/* 실제 서버 PDF */}
              <button
                type="button"
                className="pf-primary"
                disabled={!canDownload}
                onClick={download}
              >
                {downloading
                  ? "PDF 다운로드 중..."
                  : "진정서 PDF 생성 및 다운로드"}
              </button>

              {/* 공식 진정 절차 */}
              <section className="pf-card pf-official">
                <span className="pf-official-icon">
                  ▤
                </span>

                <div>
                  <b>공식 진정 절차 안내</b>

                  <p>
                    {guide ||
                      "PDF는 진정 자료 준비를 돕는 초안입니다. 노동청 등 공식 기관에 별도로 접수해야 합니다."}
                  </p>
                </div>
              </section>

              <Link
                to="/reports"
                className="pf-secondary pf-as-link"
              >
                리포트로 돌아가기
              </Link>
            </>
          )}

        <Link
          to="/petitions"
          className="pf-footer-link"
        >
          내 진정서 목록
        </Link>
      </main>
    </div>
  );
}
