
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileClock,
  History,
  Languages,
  LoaderCircle,
  MessageCircle,
  Network,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getAdminConsultationDetail,
} from "../services/adminConsultationApi";

import "./AdminCaseHistory.css";

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "종결",
};

const REFERRAL_LABELS = {
  LABOR_ATTORNEY: "노무사",
  INTERPRETER: "통역사",
};

const ITEM_LABELS = {
  CONTRACT: "근로계약서",
  PAYSLIP: "급여명세서",
  ATTENDANCE: "근무기록",
  OTHER: "기타 자료",
};

function formatDate(value) {
  if (!value) return "일시 정보 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "일시 정보 없음";
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
  if (
    error?.errorCode === "CONSENT_NOT_GRANTED" ||
    error?.errorCode === "FORBIDDEN"
  ) {
    return "이 사건의 상담 이력을 열람할 권한이 없습니다.";
  }

  if (error?.errorCode === "NOT_FOUND") {
    return "상담 사건을 찾을 수 없습니다.";
  }

  return (
    error?.message ||
    "상담 처리 기록을 불러오지 못했습니다."
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  count,
}) {
  return (
    <div className="admin-history__section-heading">
      <div className="admin-history__section-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      {count != null && (
        <span className="admin-history__count">
          {count}건
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="admin-history__empty">
      <ClipboardList size={23} />
      <p>{message}</p>
    </div>
  );
}

function RecordItem({ icon: Icon, children, date }) {
  return (
    <article className="admin-history__record">
      <div className="admin-history__record-marker">
        <Icon size={17} />
      </div>

      <div className="admin-history__record-body">
        <div className="admin-history__record-date">
          <CalendarClock size={13} />
          {formatDate(date)}
        </div>

        {children}
      </div>
    </article>
  );
}

function TextDetail({ title, value }) {
  if (value == null || value === "") {
    return null;
  }

  return (
    <div className="admin-history__text-detail">
      <span>{title}</span>
      <p>{String(value)}</p>
    </div>
  );
}

export default function AdminCaseHistory() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setDetail(null);
      }

      setError("");

      try {
        const data = await getAdminConsultationDetail(
          caseId
        );

        if (!data) {
          throw new Error(
            "상담 사건 정보가 없습니다."
          );
        }

        setDetail(data);
      } catch (err) {
        setError(getErrorMessage(err));

        if (
          err?.errorCode === "FORBIDDEN" ||
          err?.errorCode === "CONSENT_NOT_GRANTED"
        ) {
          setDetail(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setDetail(null);
      setError("");

      try {
        const data = await getAdminConsultationDetail(
          caseId
        );

        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const infoRequests = Array.isArray(
    detail?.infoRequests
  )
    ? detail.infoRequests
    : [];

  const referrals = Array.isArray(
    detail?.referrals
  )
    ? detail.referrals
    : [];

  const result = detail?.result || null;
  const isClosed = detail?.status === "CLOSED";

  // 실제 API에서 제공한 시간만 사용한다.
  // 일시가 없는 기록에는 임의의 날짜를 붙이지 않는다.
  const sortedInfoRequests = [...infoRequests].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  const sortedReferrals = [...referrals].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="admin-history">
      <header className="admin-history__header">
        <div>
          <button
            type="button"
            className="admin-history__back"
            onClick={() =>
              navigate(`/cases/${caseId}`)
            }
          >
            <ArrowLeft size={16} />
            사건 상세로 돌아가기
          </button>

          <div className="admin-history__title-row">
            <div className="admin-history__title-icon">
              <History size={26} />
            </div>

            <div>
              <span>CONSULTATION HISTORY</span>
              <h1>상담 처리 기록</h1>
              <p>
                자료 요청과 전문가 연계,
                상담 결과를 확인합니다.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="admin-history__refresh"
          onClick={() => loadHistory(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
            className={
              refreshing ? "admin-history__spin" : ""
            }
          />
          새로고침
        </button>
      </header>

      {loading ? (
        <div className="admin-history__feedback">
          <LoaderCircle
            size={30}
            className="admin-history__spin"
          />
          상담 기록을 불러오는 중입니다.
        </div>
      ) : error && !detail ? (
        <div
          className="admin-history__feedback"
          role="alert"
        >
          <AlertCircle size={28} />
          <strong>상담 기록을 표시할 수 없습니다.</strong>
          <p>{error}</p>
        </div>
      ) : detail ? (
        <>
          {error && (
            <div
              className="admin-history__error"
              role="alert"
            >
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          <section className="admin-history__summary">
            <div>
              <span>사건 번호</span>
              <strong>{detail.id || caseId}</strong>
            </div>

            <div>
              <span>노동자</span>
              <strong>
                <UserRound size={16} />
                {detail.worker?.name || "확인 필요"}
              </strong>
            </div>

            <div>
              <span>처리 상태</span>
              <strong
                className={
                  isClosed
                    ? "admin-history__closed"
                    : ""
                }
              >
                {STATUS_LABELS[detail.status] ||
                  detail.status ||
                  "확인 필요"}
              </strong>
            </div>

            <div>
              <span>종결 일시</span>
              <strong>
                {isClosed
                  ? formatDate(
                      detail.closedAt ||
                        result?.closedAt ||
                        result?.createdAt
                    )
                  : "진행 중"}
              </strong>
            </div>
          </section>

          <div className="admin-history__grid">
            {/* 자료 요청 이력 */}

            <section className="admin-history__card">
              <SectionTitle
                icon={FileClock}
                eyebrow="INFORMATION REQUESTS"
                title="추가 자료 요청"
                count={infoRequests.length}
              />

              {sortedInfoRequests.length === 0 ? (
                <EmptyState message="추가 자료 요청 기록이 없습니다." />
              ) : (
                <div className="admin-history__records">
                  {sortedInfoRequests.map(
                    (item, index) => (
                      <RecordItem
                        key={item.id || index}
                        icon={FileClock}
                        date={item.createdAt}
                      >
                        <h3>
                          {item.message ||
                            "추가 자료 요청"}
                        </h3>

                        {Array.isArray(
                          item.requestedItems
                        ) &&
                          item.requestedItems.length >
                            0 && (
                            <div className="admin-history__chips">
                              {item.requestedItems.map(
                                (type) => (
                                  <span key={type}>
                                    {ITEM_LABELS[type] ||
                                      type}
                                  </span>
                                )
                              )}
                            </div>
                          )}

                        {item.status && (
                          <p className="admin-history__meta">
                            처리 상태: {item.status}
                          </p>
                        )}
                      </RecordItem>
                    )
                  )}
                </div>
              )}
            </section>

            {/* 전문가 연계 이력 */}

            <section className="admin-history__card">
              <SectionTitle
                icon={Network}
                eyebrow="PROFESSIONAL REFERRALS"
                title="전문가 연계"
                count={referrals.length}
              />

              {sortedReferrals.length === 0 ? (
                <EmptyState message="전문가 연계 기록이 없습니다." />
              ) : (
                <div className="admin-history__records">
                  {sortedReferrals.map(
                    (item, index) => (
                      <RecordItem
                        key={item.id || index}
                        icon={Network}
                        date={item.createdAt}
                      >
                        <div className="admin-history__record-title">
                          <h3>
                            {item.organization ||
                              "연계 기관 정보 없음"}
                          </h3>

                          <span className="admin-history__type">
                            {REFERRAL_LABELS[
                              item.type
                            ] ||
                              item.type ||
                              "유형 미확인"}
                          </span>
                        </div>

                        <TextDetail
                          title="연락처"
                          value={item.contact}
                        />

                        <TextDetail
                          title="연계 내용"
                          value={item.note}
                        />

                        {item.status && (
                          <p className="admin-history__meta">
                            연계 상태: {item.status}
                          </p>
                        )}
                      </RecordItem>
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          {/* 최종 결과 */}

          <section className="admin-history__card admin-history__result-card">
            <SectionTitle
              icon={FileCheck2}
              eyebrow="CONSULTATION RESULT"
              title="최종 상담 결과"
            />

            {result ? (
              <div className="admin-history__result">
                <div className="admin-history__result-status">
                  {isClosed ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <ClipboardList size={19} />
                  )}

                  <div>
                    <strong>
                      {isClosed
                        ? "상담 종결"
                        : "상담 결과 정보"}
                    </strong>

                    <p>
                      {isClosed
                        ? "상담 결과가 기록된 사건입니다."
                        : "현재 서버에 등록된 상담 결과입니다."}
                    </p>
                  </div>
                </div>

                <div className="admin-history__result-fields">
                  <TextDetail
                    title="상담 내용"
                    value={result.content}
                  />
                  <TextDetail
                    title="조치 결과"
                    value={result.actionTaken}
                  />
                  <TextDetail
                    title="종결 사유"
                    value={result.closeReason}
                  />
                </div>

                {typeof result.shareWithWorker ===
                  "boolean" && (
                  <div className="admin-history__share">
                    <Languages size={16} />
                    {result.shareWithWorker
                      ? "노동자에게 결과 공유 요청됨"
                      : "노동자에게 결과 공유하지 않음"}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="등록된 상담 결과가 없습니다." />
            )}
          </section>

          {/* 연결 화면 */}

          <section className="admin-history__navigation">
            <div>
              <ShieldCheck size={19} />

              <p>
                이 화면은 서버에 저장된 상담 정보를
                표시합니다. 기록이 누락되었다면
                사건 상세에서 최신 상태를 확인해 주세요.
              </p>
            </div>

            <div className="admin-history__actions">
              <button
                type="button"
                className="admin-history__outline-button"
                onClick={() =>
                  navigate(
                    `/cases/${caseId}/messages`
                  )
                }
              >
                <MessageCircle size={16} />
                상담 메시지
              </button>

              <button
                type="button"
                className="admin-history__primary-button"
                onClick={() =>
                  navigate(`/cases/${caseId}`)
                }
              >
                사건 상세
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
