
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getAdminConsultationDetail } from "../services/adminConsultationApi";
import "./AdminCaseDetail.css";

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "완료",
};

const URGENCY_LABELS = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const SCOPE_LABELS = {
  SUMMARY: "사건 요약",
  ATTENDANCE: "근무기록",
  WAGE: "임금 비교",
  CONTRACT: "근로계약서",
  COMPLAINT_DRAFT: "진정서 초안",
  EVIDENCE: "증거 자료",
};

const FLAG_LABELS = {
  NO_BREAK: "휴게시간 미입력",
  EDITED: "수정 이력 있음",
  MISSING_CLOCK_OUT: "퇴근 기록 누락",
};

const formatMoney = (amount) =>
  amount == null
    ? "확인 필요"
    : `${Number(amount).toLocaleString("ko-KR")}원`;

function formatDate(value, withTime = false) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).format(date);
}

function formatTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMinutes(minutes) {
  if (minutes == null) return "확인 필요";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${hours}시간 ${rest}분`;
}

export default function AdminCaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      setLoading(true);
      setError("");
      setErrorCode("");
      setDetail(null);

      try {
        const data =
          await getAdminConsultationDetail(caseId);

        if (active) setDetail(data);
      } catch (err) {
        if (!active) return;

        setErrorCode(err.errorCode || "");
        setError(
          err.message || "사건 상세 조회에 실패했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [caseId, reloadKey]);

  if (loading) {
    return (
      <div className="admin-detail">
        <p className="admin-detail__feedback">
          상담 사건 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (error) {
    const accessDenied = [
      "FORBIDDEN",
      "CONSENT_NOT_GRANTED",
    ].includes(errorCode);

    return (
      <div className="admin-detail">
        <button
          className="admin-detail__back"
          onClick={() => navigate("/cases")}
        >
          ← 사건 목록
        </button>

        <div className="admin-detail__feedback" role="alert">
          <h2>
            {accessDenied
              ? "사건 정보를 열람할 수 없습니다."
              : "사건 정보를 불러오지 못했습니다."}
          </h2>
          <p>{error}</p>

          {!accessDenied && (
            <button
              className="admin-detail__primary"
              onClick={() => setReloadKey((v) => v + 1)}
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const urgency =
    detail.urgencyLevel || detail.aiSuggestedUrgency;

  const urgencySuggested =
    !detail.urgencyLevel &&
    Boolean(detail.aiSuggestedUrgency);

  const sharedScope = detail.consent?.sharedScope || [];

  return (
    <div className="admin-detail">
      <div className="admin-detail__top">
        <div>
          <button
            type="button"
            className="admin-detail__back"
            onClick={() => navigate("/cases")}
          >
            ← 사건 목록으로
          </button>

          <p className="admin-detail__eyebrow">
            상담 사건 상세
          </p>

          <h2>{detail.id}</h2>
        </div>

        <div className="admin-detail__top-actions">
          <span className={`admin-detail__status status-${detail.status?.toLowerCase()}`}>
            {STATUS_LABELS[detail.status] || detail.status}
          </span>

          <button
            type="button"
            className="admin-detail__refresh"
            onClick={() => setReloadKey((v) => v + 1)}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <section className="admin-detail__overview">
        <div>
          <span>노동자</span>
          <strong>{detail.worker?.name || "확인 필요"}</strong>
          <small>언어: {detail.worker?.language || "-"}</small>
        </div>

        <div>
          <span>상담 우선순위</span>
          <strong>
            {URGENCY_LABELS[urgency] || "미분류"}
            {urgencySuggested && (
              <small className="admin-detail__ai"> AI 제안</small>
            )}
          </strong>
          <small>최종 우선순위는 담당자가 검토합니다.</small>
        </div>

        <div>
          <span>담당자</span>
          <strong>{detail.assignee?.name || "미배정"}</strong>
          <small>상담기관 담당자</small>
        </div>
      </section>

      <div className="admin-detail__grid">
        <div className="admin-detail__main-column">
          {/* AI 사건 요약 */}
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>AI SUMMARY</span>
                <h3>사건 요약</h3>
              </div>
            </div>

            {detail.summary?.ko ? (
              <p className="admin-detail__summary">
                {detail.summary.ko}
              </p>
            ) : (
              <p className="admin-detail__empty">
                공유된 사건 요약이 없습니다.
              </p>
            )}
          </section>

          {/* 임금 비교 */}
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>WAGE COMPARISON</span>
                <h3>임금 비교</h3>
              </div>
            </div>

            {detail.wageComparison ? (
              <>
                <div className="admin-detail__wages">
                  <div>
                    <span>예상 임금</span>
                    <strong>
                      {formatMoney(
                        detail.wageComparison.expectedAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>실제 지급액</span>
                    <strong>
                      {formatMoney(
                        detail.wageComparison.actualAmount
                      )}
                    </strong>
                  </div>

                  <div className="admin-detail__wage-difference">
                    <span>확인 필요 차이</span>
                    <strong>
                      {formatMoney(
                        detail.wageComparison.differenceAmount
                      )}
                    </strong>
                  </div>
                </div>

                {Array.isArray(
                  detail.wageComparison.uncertainties
                ) &&
                  detail.wageComparison.uncertainties.map(
                    (item, index) => (
                      <p
                        className="admin-detail__warning"
                        key={`${item.code}-${index}`}
                      >
                        확인 필요: {item.message}
                      </p>
                    )
                  )}
              </>
            ) : (
              <p className="admin-detail__empty">
                공유된 임금 비교 자료가 없습니다.
              </p>
            )}
          </section>

          {/* 근무 타임라인 */}
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>ATTENDANCE TIMELINE</span>
                <h3>근무 타임라인</h3>
              </div>
            </div>

            {Array.isArray(detail.timeline) ? (
              detail.timeline.length === 0 ? (
                <p className="admin-detail__empty">
                  공유된 근무기록이 없습니다.
                </p>
              ) : (
                <div className="admin-detail__table-wrap">
                  <table className="admin-detail__table">
                    <thead>
                      <tr>
                        <th>근무일</th>
                        <th>출근</th>
                        <th>퇴근</th>
                        <th>휴게</th>
                        <th>실근무시간</th>
                        <th>확인 사항</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.timeline.map((record, index) => (
                        <tr key={`${record.date}-${index}`}>
                          <td>{record.date}</td>
                          <td>{formatTime(record.clockInAt)}</td>
                          <td>{formatTime(record.clockOutAt)}</td>
                          <td>
                            {record.breakMinutes == null
                              ? "미입력"
                              : `${record.breakMinutes}분`}
                          </td>
                          <td>
                            {formatMinutes(record.workedMinutes)}
                          </td>
                          <td>
                            {(record.flags || []).length
                              ? record.flags.map(
                                  (flag) =>
                                    FLAG_LABELS[flag] || flag
                                ).join(", ")
                              : "정상"}
                            {(record.edits || []).length > 0 && (
                              <details>
                                <summary>수정 이력</summary>
                                {record.edits.map((edit, editIndex) => (
                                  <p key={editIndex}>
                                    {edit.field}: {edit.before ?? "-"}
                                    {" → "}
                                    {edit.after ?? "-"}
                                    {" / "}
                                    {edit.reason}
                                  </p>
                                ))}
                              </details>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <p className="admin-detail__empty">
                근무기록이 공유되지 않았습니다.
              </p>
            )}
          </section>

          {/* 근로계약서 */}
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>CONTRACT</span>
                <h3>근로계약서 검토</h3>
              </div>
            </div>

            {detail.contract ? (
              <div className="admin-detail__contract">
                {detail.contract.terms &&
                  Object.entries(detail.contract.terms).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span>{key}</span>
                        <strong>
                          {value == null
                            ? "-"
                            : typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                        </strong>
                      </div>
                    )
                  )}

                {(detail.contract.reviews || []).map(
                  (review, index) => (
                    <p className="admin-detail__warning" key={index}>
                      {review.message}
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="admin-detail__empty">
                계약서가 공유되지 않았습니다.
              </p>
            )}
          </section>

          {/* 공유 증거 */}
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>SHARED EVIDENCE</span>
                <h3>공유된 증거</h3>
              </div>
            </div>

            {Array.isArray(detail.evidences) &&
            detail.evidences.length > 0 ? (
              <div className="admin-detail__evidences">
                {detail.evidences.map((evidence) => (
                  <div key={evidence.id}>
                    <div>
                      <strong>{evidence.title}</strong>
                      <span>
                        {evidence.type} ·{" "}
                        {formatDate(evidence.occurredAt, true)}
                      </span>
                    </div>

                    {evidence.fileUrl && (
                      <a
                        href={evidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        파일 열기
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-detail__empty">
                공유된 증거 파일이 없습니다.
              </p>
            )}
          </section>
        </div>

        {/* 오른쪽 사건 관리 정보 */}
        <aside className="admin-detail__side-column">
          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>SHARING CONSENT</span>
                <h3>정보 공유 동의</h3>
              </div>
            </div>

            <div className="admin-detail__consent">
              <span>동의 일시</span>
              <strong>
                {formatDate(detail.consent?.agreedAt, true)}
              </strong>

              <span>공유 범위</span>
              <div className="admin-detail__scopes">
                {sharedScope.length ? (
                  sharedScope.map((scope) => (
                    <span key={scope}>
                      {SCOPE_LABELS[scope] || scope}
                    </span>
                  ))
                ) : (
                  <p>공유 범위 정보 없음</p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>PROCESSING</span>
                <h3>처리 현황</h3>
              </div>
            </div>

            <div className="admin-detail__processing">
              <div>
                <span>현재 상태</span>
                <strong>
                  {STATUS_LABELS[detail.status] || detail.status}
                </strong>
              </div>

              <div>
                <span>담당자</span>
                <strong>
                  {detail.assignee?.name || "미배정"}
                </strong>
              </div>

              <div>
                <span>추가 자료 요청</span>
                <strong>
                  {detail.infoRequests?.length ?? 0}건
                </strong>
              </div>

              <div>
                <span>전문가 연계</span>
                <strong>
                  {detail.referrals?.length ?? 0}건
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-detail__card">
            <div className="admin-detail__card-header">
              <div>
                <span>NEXT ACTION</span>
                <h3>상담 처리</h3>
              </div>
            </div>

            <p className="admin-detail__side-description">
              담당자 배정, 긴급도 확정, 처리 상태 변경,
              추가 자료 요청 및 상담 결과 기록은
              다음 개발 단계에서 연결합니다.
            </p>
          </section>
        </aside>
      </div>

      <div className="admin-detail__disclaimer">
        {detail.disclaimer ||
          "참고용 자료이며 최종 법적 판단은 전문가 확인이 필요합니다."}
      </div>
    </div>
  );
}
