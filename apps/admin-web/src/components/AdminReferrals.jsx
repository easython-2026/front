
import { useState } from "react";

import {
  Scale,
  Languages,
  Building2,
  Phone,
  FileText,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";

import {
  createAdminReferral,
} from "../services/adminConsultationApi";

import "./AdminReferrals.css";

// ========================================
// 연계 유형
// ========================================

const REFERRAL_TYPES = {
  LABOR_ATTORNEY: {
    label: "노무사",
    description: "임금 체불 및 노동 상담",
  },

  INTERPRETER: {
    label: "통역사",
    description: "언어 통역 및 소통 지원",
  },
};

// ========================================
// 날짜 포맷
// ========================================

function formatDateTime(value) {
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

// ========================================
// 연계 이력 카드
// ========================================

function ReferralHistoryItem({ referral }) {
  const isAttorney =
    referral.type === "LABOR_ATTORNEY";

  const TypeIcon = isAttorney
    ? Scale
    : Languages;

  return (
    <article className="admin-referrals__history-item">
      <div className="admin-referrals__history-top">
        <div
          className={`admin-referrals__history-icon ${
            isAttorney ? "is-attorney" : "is-interpreter"
          }`}
        >
          <TypeIcon size={20} strokeWidth={1.8} />
        </div>

        <div className="admin-referrals__history-heading">
          <span className="admin-referrals__history-type">
            {REFERRAL_TYPES[referral.type]?.label ||
              "전문가 연계"}
          </span>

          <strong>
            {referral.organization ||
              "연계 기관 정보 없음"}
          </strong>
        </div>

        <ArrowUpRight
          size={17}
          className="admin-referrals__history-arrow"
        />
      </div>

      <div className="admin-referrals__history-body">
        {referral.contact && (
          <div>
            <Phone size={15} />
            <span>{referral.contact}</span>
          </div>
        )}

        {referral.note && (
          <div>
            <FileText size={15} />
            <span>{referral.note}</span>
          </div>
        )}

        <div className="admin-referrals__history-date">
          <CalendarDays size={15} />
          <span>
            {formatDateTime(referral.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ========================================
// 관리자 전문가 연계
// ========================================

export default function AdminReferrals({
  detail,
  onUpdated,
}) {
  const [type, setType] = useState("");
  const [organization, setOrganization] =
    useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 상세 API 응답에 포함된 연계 기록
  const referrals = Array.isArray(detail.referrals)
    ? detail.referrals
    : [];

  const isClosed = detail.status === "CLOSED";

  const canSubmit =
    !isClosed &&
    !submitting &&
    Boolean(type) &&
    Boolean(organization.trim());

  // ========================================
  // 입력 변경 시 메시지 초기화
  // ========================================

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  // ========================================
  // 전문가 연계 등록
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await createAdminReferral(
        detail.id,
        {
          type,
          organization,
          contact,
          note,
        }
      );

      // API 응답 검증
      if (
        !result?.id ||
        result?.status !== "REFERRED"
      ) {
        throw new Error(
          "전문가 연계 응답 형식이 올바르지 않습니다."
        );
      }

      // 저장 성공 후 입력 초기화
      setType("");
      setOrganization("");
      setContact("");
      setNote("");

      setSuccess(
        "전문가 연계가 등록되었습니다."
      );

      // 상세 API를 다시 조회하여
      // 최신 연계 이력과 사건 상태 반영
      onUpdated?.();

    } catch (err) {
      if (
        err.errorCode === "CONSENT_NOT_GRANTED" ||
        err.errorCode === "FORBIDDEN"
      ) {
        setError(
          "이 사건에 접근할 권한이 없거나 정보 공유 동의가 철회되었습니다."
        );

        onUpdated?.();
      } else if (
        err.errorCode === "CONFLICT"
      ) {
        setError(
          "종결된 사건에는 연계 기록을 추가할 수 없습니다."
        );
      } else {
        setError(
          err.message ||
            "전문가 연계 등록에 실패했습니다."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-referrals">
      {/* ====================================
          헤더
      ==================================== */}

      <div className="admin-referrals__header">
        <div className="admin-referrals__header-icon">
          <Scale size={23} strokeWidth={1.8} />
        </div>

        <div className="admin-referrals__header-content">
          <span>EXPERT REFERRAL</span>
          <h3>전문가 연계</h3>
          <p>
            사건 검토에 필요한 외부 전문가
            연계를 관리합니다.
          </p>
        </div>

        <div className="admin-referrals__count">
          {referrals.length}건
        </div>
      </div>

      {/* ====================================
          기존 연계 이력
      ==================================== */}

      <div className="admin-referrals__history">
        <div className="admin-referrals__section-heading">
          <h4>연계 내역</h4>
          <span>총 {referrals.length}건</span>
        </div>

        {referrals.length === 0 ? (
          <div className="admin-referrals__empty">
            <div className="admin-referrals__empty-icon">
              <Building2 size={24} strokeWidth={1.7} />
            </div>

            <strong>
              아직 등록된 연계 내역이 없습니다.
            </strong>

            <p>
              아래에서 노무사 또는 통역사 연계를
              등록할 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="admin-referrals__history-list">
            {[...referrals]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((referral, index) => (
                <ReferralHistoryItem
                  key={referral.id ?? index}
                  referral={referral}
                />
              ))}
          </div>
        )}
      </div>

      {/* ====================================
          새 전문가 연계 등록
      ==================================== */}

      <form
        className="admin-referrals__form"
        onSubmit={handleSubmit}
      >
        <div className="admin-referrals__section-heading">
          <h4>
            <Plus size={17} />
            새로운 전문가 연계
          </h4>
        </div>

        {/* 연계 유형 */}

        <div className="admin-referrals__field">
          <label>
            연계 유형
            <span className="admin-referrals__required">
              *
            </span>
          </label>

          <div className="admin-referrals__type-grid">
            <button
              type="button"
              className={`admin-referrals__type-option ${
                type === "LABOR_ATTORNEY"
                  ? "is-selected"
                  : ""
              }`}
              onClick={() => {
                setType("LABOR_ATTORNEY");
                clearFeedback();
              }}
              disabled={isClosed || submitting}
              aria-pressed={
                type === "LABOR_ATTORNEY"
              }
            >
              <Scale size={23} strokeWidth={1.8} />

              <strong>노무사</strong>
              <small>노동 상담 및 권리 구제</small>
            </button>

            <button
              type="button"
              className={`admin-referrals__type-option ${
                type === "INTERPRETER"
                  ? "is-selected"
                  : ""
              }`}
              onClick={() => {
                setType("INTERPRETER");
                clearFeedback();
              }}
              disabled={isClosed || submitting}
              aria-pressed={
                type === "INTERPRETER"
              }
            >
              <Languages
                size={23}
                strokeWidth={1.8}
              />

              <strong>통역사</strong>
              <small>다국어 소통 지원</small>
            </button>
          </div>
        </div>

        {/* 연계 기관명 */}

        <div className="admin-referrals__field">
          <label htmlFor="admin-referral-org">
            기관 또는 전문가명
            <span className="admin-referrals__required">
              *
            </span>
          </label>

          <div className="admin-referrals__input-wrap">
            <Building2 size={18} />

            <input
              id="admin-referral-org"
              type="text"
              value={organization}
              onChange={(event) => {
                setOrganization(event.target.value);
                clearFeedback();
              }}
              placeholder="기관 또는 전문가명을 입력하세요"
              disabled={isClosed || submitting}
              required
            />
          </div>
        </div>

        {/* 연락처 */}

        <div className="admin-referrals__field">
          <label htmlFor="admin-referral-contact">
            연락처
            <span className="admin-referrals__optional">
              선택
            </span>
          </label>

          <div className="admin-referrals__input-wrap">
            <Phone size={18} />

            <input
              id="admin-referral-contact"
              type="text"
              value={contact}
              onChange={(event) => {
                setContact(event.target.value);
                clearFeedback();
              }}
              placeholder="전화번호 또는 이메일"
              disabled={isClosed || submitting}
            />
          </div>
        </div>

        {/* 연계 메모 */}

        <div className="admin-referrals__field">
          <label htmlFor="admin-referral-note">
            연계 내용
            <span className="admin-referrals__optional">
              선택
            </span>
          </label>

          <div className="admin-referrals__textarea-wrap">
            <FileText size={18} />

            <textarea
              id="admin-referral-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                clearFeedback();
              }}
              rows={4}
              placeholder="연계 목적 및 전달 사항을 기록하세요."
              disabled={isClosed || submitting}
            />
          </div>
        </div>

        {/* ====================================
            저장 결과 메시지
        ==================================== */}

        {error && (
          <div
            className="admin-referrals__error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="admin-referrals__success"
            role="status"
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* 종결 사건 안내 */}

        {isClosed && (
          <div className="admin-referrals__locked">
            <LockKeyhole size={18} />
            <span>
              종결된 사건은 전문가 연계를
              추가할 수 없습니다.
            </span>
          </div>
        )}

        {/* ====================================
            저장 버튼
        ==================================== */}

        <button
          type="submit"
          className="admin-referrals__submit"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={18}
                className="admin-referrals__spin"
              />
              등록 중...
            </>
          ) : (
            <>
              <Send size={18} strokeWidth={1.9} />
              전문가 연계 등록
            </>
          )}
        </button>
      </form>
    </section>
  );
}
