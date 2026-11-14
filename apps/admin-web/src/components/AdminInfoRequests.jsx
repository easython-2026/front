
import { useState } from "react";

import {
  createAdminInfoRequest,
} from "../services/adminConsultationApi";

import "./AdminInfoRequests.css";

const REQUEST_STATUS_LABELS = {
  PENDING: "응답 대기",
  ANSWERED: "응답 완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

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

export default function AdminInfoRequests({
  detail,
  onUpdated,
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requests = Array.isArray(detail.infoRequests)
    ? detail.infoRequests
    : [];

  const isClosed = detail.status === "CLOSED";

  const canSubmit =
    !isClosed &&
    !submitting &&
    message.trim().length > 0 &&
    message.length <= 2000;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createAdminInfoRequest(detail.id, {
        message,
      });

      setMessage("");
      setSuccess("추가 자료 요청이 등록되었습니다.");

      // 서버 또는 Mock 데이터에서 다시 조회
      onUpdated?.();
    } catch (err) {
      if (
        err.errorCode === "CONSENT_NOT_GRANTED" ||
        err.errorCode === "FORBIDDEN"
      ) {
        setError(
          "사건 접근 권한 또는 공유 동의를 확인해 주세요."
        );

        // 동의 철회 시 상세 화면의 접근 상태 재확인
        onUpdated?.();
      } else {
        setError(
          err.message ||
            "추가 자료 요청에 실패했습니다."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-info-requests">
      <div className="admin-info-requests__header">
        <div>
          <span>INFORMATION REQUEST</span>
          <h3>추가 자료 요청</h3>
          <p>
            상담 검토에 필요한 정보를 노동자에게
            요청합니다.
          </p>
        </div>

        <span className="admin-info-requests__count">
          {requests.length}건
        </span>
      </div>

      {/* 기존 자료 요청 목록 */}
      <div className="admin-info-requests__history">
        <h4>요청 내역</h4>

        {requests.length === 0 ? (
          <div className="admin-info-requests__empty">
            아직 등록된 자료 요청이 없습니다.
          </div>
        ) : (
          <div className="admin-info-requests__list">
            {[...requests].reverse().map((request, index) => (
              <div
                className="admin-info-requests__item"
                key={request.id ?? index}
              >
                <div className="admin-info-requests__item-top">
                  <strong>
                    {REQUEST_STATUS_LABELS[
                      request.status
                    ] ||
                      request.status ||
                      "상태 확인 필요"}
                  </strong>

                  <span>
                    {formatDateTime(request.createdAt)}
                  </span>
                </div>

                <p>
                  {request.message ||
                    request.content ||
                    "요청 내용이 제공되지 않았습니다."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가 자료 요청 작성 */}
      <form
        className="admin-info-requests__form"
        onSubmit={handleSubmit}
      >
        <h4>새로운 자료 요청</h4>

        <label htmlFor="admin-info-request-message">
          요청 내용
        </label>

        <textarea
          id="admin-info-request-message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError("");
            setSuccess("");
          }}
          rows={5}
          maxLength={2000}
          disabled={isClosed || submitting}
          placeholder={
            "예: 10월 급여명세서 또는 실제 입금 내역을 확인할 수 있는 자료를 제출해 주세요."
          }
        />

        <div className="admin-info-requests__form-bottom">
          <span>{message.length} / 2,000자</span>

          <button
            type="submit"
            disabled={!canSubmit}
          >
            {submitting
              ? "요청 등록 중..."
              : "자료 요청 등록"}
          </button>
        </div>

        {isClosed && (
          <p className="admin-info-requests__hint">
            종결된 사건에는 추가 자료를 요청할 수 없습니다.
          </p>
        )}

        {error && (
          <p
            className="admin-info-requests__error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="admin-info-requests__success"
            role="status"
          >
            {success}
          </p>
        )}
      </form>

      <p className="admin-info-requests__notice">
        자료 요청 시 상담 검토에 필요한 최소한의
        정보만 요청해 주세요. 민감한 개인정보는
        불필요하게 수집하지 않도록 주의해야 합니다.
      </p>
    </section>
  );
}
