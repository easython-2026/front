
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Languages,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getAdminConsultationDetail,
} from "../services/adminConsultationApi";

import {
  closeAdminConsultation,
} from "../services/adminResultApi";

import "./AdminCloseCase.css";

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "종결",
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getErrorMessage(error) {
  switch (error?.errorCode) {
    case "VALIDATION_ERROR":
      return error.message ||
        "필수 입력 항목을 확인해 주세요.";

    case "UNAUTHORIZED":
      return "로그인이 만료되었습니다. 다시 로그인해 주세요.";

    case "FORBIDDEN":
    case "CONSENT_NOT_GRANTED":
      return "이 상담 사건에 접근할 권한이 없습니다.";

    case "NOT_FOUND":
      return "상담 사건을 찾을 수 없습니다.";

    case "CONFLICT":
      return "이미 종결된 사건입니다. 사건 상태를 다시 확인해 주세요.";

    case "AI_SERVICE_ERROR":
      return "번역 서비스에서 오류가 발생했습니다. 서버의 저장 여부를 확인한 후 다시 시도해 주세요.";

    default:
      return error?.message ||
        "상담 결과 저장에 실패했습니다.";
  }
}

function FormField({
  id,
  icon: Icon,
  title,
  description,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}) {
  return (
    <div className="admin-close__field">
      <div className="admin-close__field-heading">
        <div className="admin-close__field-icon">
          <Icon size={19} strokeWidth={1.8} />
        </div>

        <div>
          <label htmlFor={id}>
            {title}
            <span className="admin-close__required">
              *
            </span>
          </label>

          <p>{description}</p>
        </div>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        required
        disabled={disabled}
      />
    </div>
  );
}

export default function AdminCloseCase() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] =
    useState("");

  const [content, setContent] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const [shareWithWorker, setShareWithWorker] =
    useState(true);

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  // ========================================
  // 사건 상세 조회
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadCase() {
      setLoading(true);
      setLoadingError("");
      setDetail(null);

      try {
        const data =
          await getAdminConsultationDetail(caseId);

        if (active) {
          setDetail(data);
        }
      } catch (error) {
        if (active) {
          setLoadingError(
            getErrorMessage(error)
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCase();

    return () => {
      active = false;
    };
  }, [caseId, reloadKey]);

  const isClosed = detail?.status === "CLOSED";
  const isRevoked = Boolean(
    detail?.consent?.revokedAt
  );

  const isComplete =
    content.trim().length > 0 &&
    actionTaken.trim().length > 0 &&
    closeReason.trim().length > 0;

  const canSubmit =
    Boolean(detail) &&
    !isClosed &&
    !isRevoked &&
    !result &&
    !submitting &&
    confirmed &&
    isComplete;

  const disabled =
    submitting ||
    isClosed ||
    isRevoked ||
    Boolean(result);

  function resetFeedback() {
    setSubmitError("");
  }

  // ========================================
  // 상담 결과 기록 및 종결
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await closeAdminConsultation(
        caseId,
        {
          content,
          actionTaken,
          closeReason,
          shareWithWorker,
        }
      );

      // 정상 응답을 받은 경우에만 완료 처리
      setResult(response);

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "CLOSED",
            }
          : prev
      );
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  // ========================================
  // 페이지 이동
  // ========================================

  function goToCaseDetail() {
    navigate(`/cases/${caseId}`);
  }

  // ========================================
  // 로딩 상태
  // ========================================

  if (loading) {
    return (
      <div className="admin-close">
        <div className="admin-close__center">
          <LoaderCircle
            size={34}
            className="admin-close__spin"
          />
          <strong>상담 사건을 불러오는 중입니다.</strong>
        </div>
      </div>
    );
  }

  // ========================================
  // 조회 오류
  // ========================================

  if (loadingError || !detail) {
    return (
      <div className="admin-close">
        <button
          type="button"
          className="admin-close__back"
          onClick={() => navigate("/cases")}
        >
          <ArrowLeft size={16} />
          상담 사건 목록
        </button>

        <div className="admin-close__center">
          <AlertCircle size={34} />
          <strong>상담 정보를 확인할 수 없습니다.</strong>
          <p>
            {loadingError ||
              "사건 상세 정보가 없습니다."}
          </p>

          <button
            type="button"
            className="admin-close__outline-button"
            onClick={() =>
              setReloadKey((prev) => prev + 1)
            }
          >
            <RefreshCw size={17} />
            다시 조회
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // 화면
  // ========================================

  return (
    <div className="admin-close">
      {/* 상단 */}

      <header className="admin-close__header">
        <button
          type="button"
          className="admin-close__back"
          onClick={goToCaseDetail}
        >
          <ArrowLeft size={17} />
          사건 상세로 돌아가기
        </button>

        <div className="admin-close__title-row">
          <div className="admin-close__title-icon">
            <ClipboardCheck
              size={27}
              strokeWidth={1.7}
            />
          </div>

          <div>
            <span>CONSULTATION RESULT</span>
            <h1>상담 결과 기록 및 종결</h1>
            <p>
              상담 진행 내용을 정리하고
              사건 처리를 완료합니다.
            </p>
          </div>
        </div>
      </header>

      {/* 기본 정보 */}

      <section className="admin-close__summary">
        <div>
          <span>사건 번호</span>
          <strong>{detail.id}</strong>
        </div>

        <div>
          <span>노동자</span>
          <strong>
            <UserRound size={16} />
            {detail.worker?.name || "확인 필요"}
          </strong>
        </div>

        <div>
          <span>담당자</span>
          <strong>
            {detail.assignee?.name || "미배정"}
          </strong>
        </div>

        <div>
          <span>처리 상태</span>
          <strong
            className={
              isClosed ? "admin-close__closed" : ""
            }
          >
            {STATUS_LABELS[detail.status] ||
              detail.status ||
              "확인 필요"}
          </strong>
        </div>
      </section>

      {/* 저장 성공 화면 */}

      {result ? (
        <section className="admin-close__success-panel">
          <div className="admin-close__success-icon">
            <CheckCircle2 size={38} />
          </div>

          <h2>상담 사건이 종결되었습니다.</h2>

          <p>
            상담 결과가 정상적으로 저장되었으며
            사건 상태가 종결로 변경되었습니다.
          </p>

          <div className="admin-close__completed-info">
            <div>
              <span>처리 상태</span>
              <strong>종결 완료</strong>
            </div>

            <div>
              <span>종결 일시</span>
              <strong>
                {formatDate(result.closedAt)}
              </strong>
            </div>

            <div>
              <span>결과 공유 설정</span>
              <strong>
                {shareWithWorker
                  ? "노동자에게 공유 요청"
                  : "노동자에게 공유하지 않음"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="admin-close__primary-button"
            onClick={goToCaseDetail}
          >
            사건 상세로 이동
            <ArrowRight size={18} />
          </button>
        </section>
      ) : isClosed ? (
        <section className="admin-close__success-panel">
          <div className="admin-close__success-icon">
            <BadgeCheck size={36} />
          </div>

          <h2>이미 종결된 상담 사건입니다.</h2>

          <p>
            이 사건은 종결 상태이므로
            추가 상담 결과를 등록할 수 없습니다.
          </p>

          <button
            type="button"
            className="admin-close__primary-button"
            onClick={goToCaseDetail}
          >
            사건 상세로 돌아가기
            <ArrowRight size={18} />
          </button>
        </section>
      ) : (
        <div className="admin-close__grid">
          {/* 왼쪽 입력 폼 */}

          <form
            className="admin-close__form"
            onSubmit={handleSubmit}
          >
            <div className="admin-close__section-header">
              <div>
                <span>FINAL REPORT</span>
                <h2>상담 결과 작성</h2>
              </div>

              <div className="admin-close__section-icon">
                <FileCheck2 size={22} />
              </div>
            </div>

            <FormField
              id="admin-close-content"
              icon={FileText}
              title="상담 내용"
              description="상담 과정에서 확인한 사실과 논의 내용을 기록합니다."
              placeholder="예: 사업주와의 면담 내용 및 임금 체불 관련 상담을 진행했습니다."
              value={content}
              onChange={(value) => {
                setContent(value);
                resetFeedback();
              }}
              disabled={disabled}
              rows={5}
            />

            <FormField
              id="admin-close-action"
              icon={ShieldCheck}
              title="조치 결과"
              description="상담기관에서 실제로 수행한 조치를 입력합니다."
              placeholder="예: 노무사 연계 및 진정 접수 절차를 안내했습니다."
              value={actionTaken}
              onChange={(value) => {
                setActionTaken(value);
                resetFeedback();
              }}
              disabled={disabled}
              rows={5}
            />

            <FormField
              id="admin-close-reason"
              icon={ClipboardCheck}
              title="종결 사유"
              description="사건을 종결하는 이유를 구체적으로 기록합니다."
              placeholder="예: 노동자의 요청에 따라 진정 접수가 완료되어 상담을 종결합니다."
              value={closeReason}
              onChange={(value) => {
                setCloseReason(value);
                resetFeedback();
              }}
              disabled={disabled}
              rows={4}
            />

            {/* 노동자 공유 여부 */}

            <div className="admin-close__share">
              <div className="admin-close__share-heading">
                <div className="admin-close__share-icon">
                  <Languages size={21} />
                </div>

                <div>
                  <strong>노동자에게 결과 공유</strong>
                  <p>
                    공유 시 노동자가 선택한 언어로
                    결과 요약이 번역되어 전달됩니다.
                  </p>
                </div>
              </div>

              <label className="admin-close__switch-row">
                <span>
                  {shareWithWorker
                    ? "결과 공유 사용"
                    : "결과 공유하지 않음"}
                </span>

                <input
                  type="checkbox"
                  checked={shareWithWorker}
                  onChange={(event) => {
                    setShareWithWorker(
                      event.target.checked
                    );
                    resetFeedback();
                  }}
                  disabled={disabled}
                />

                <span className="admin-close__switch" />
              </label>
            </div>

            {/* 최종 확인 */}

            <label className="admin-close__confirmation">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
                disabled={disabled}
              />

              <span className="admin-close__check-icon">
                <Check size={13} />
              </span>

              <span>
                입력한 상담 내용과 조치 결과를 확인했으며,
                사건 종결 시 추가 처리가 제한될 수 있음을
                이해했습니다.
              </span>
            </label>

            {submitError && (
              <div
                className="admin-close__error"
                role="alert"
              >
                <AlertCircle size={19} />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              className="admin-close__submit"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="admin-close__spin"
                  />
                  종결 처리 중...
                </>
              ) : (
                <>
                  <FileCheck2 size={19} />
                  상담 결과 저장 및 종결
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* 오른쪽 안내 */}

          <aside className="admin-close__sidebar">
            <section className="admin-close__guide">
              <div className="admin-close__guide-heading">
                <ShieldCheck size={21} />
                <h3>종결 전 확인사항</h3>
              </div>

              <div className="admin-close__guide-list">
                <div>
                  <CheckCircle2 size={19} />
                  <p>
                    실제 상담 내용과 확인된 사실만
                    기록해 주세요.
                  </p>
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  <p>
                    노무사 연계, 자료 요청 등 진행한
                    조치를 정확히 작성해 주세요.
                  </p>
                </div>

                <div>
                  <CheckCircle2 size={19} />
                  <p>
                    노동자에게 결과를 공유할지
                    확인해 주세요.
                  </p>
                </div>
              </div>
            </section>

            <section className="admin-close__warning">
              <div>
                <LockKeyhole size={20} />
                <h3>종결 처리 안내</h3>
              </div>

              <p>
                상담 결과가 저장되면 사건 상태가
                CLOSED로 변경됩니다.
              </p>

              <p>
                종결된 사건은 동일한 결과를
                중복 등록할 수 없습니다.
              </p>
            </section>
          </aside>
        </div>
      )}

      {isRevoked && !result && !isClosed && (
        <div className="admin-close__error">
          <AlertCircle size={18} />
          정보 공유 동의가 철회되어
          종결 작업을 진행할 수 없습니다.
        </div>
      )}

      <div className="admin-close__disclaimer">
        <ShieldCheck size={16} />
        상담 결과는 실제 확인된 사실을 기준으로
        작성해야 하며, 자동 번역 결과는 별도 확인이
        필요할 수 있습니다.
      </div>
    </div>
  );
}
