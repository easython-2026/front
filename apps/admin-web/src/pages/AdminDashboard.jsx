
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  getAdminDashboard,
  getAdminConsultations,
} from "../services/adminConsultationApi";
import "./AdminDashboard.css";

const INITIAL_SUMMARY = {
  newCount: 0,
  inProgressCount: 0,
  closedCount: 0,
  highUrgencyCount: 0,
  unreadMessageCount: 0,
};

const URGENCY_LABELS = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

function formatWon(amount) {
  if (amount == null) return "확인 필요";

  return `${Number(amount).toLocaleString("ko-KR")}원`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [consultations, setConsultations] = useState([]);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);

  const [summaryError, setSummaryError] = useState("");
  const [casesError, setCasesError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setSummaryLoading(true);
      setCasesLoading(true);
      setSummaryError("");
      setCasesError("");

      // 상담 현황 통계 조회
      const summaryRequest = getAdminDashboard()
        .then((data) => {
          if (!active) return;

          setSummary({
            newCount: data.newCount ?? 0,
            inProgressCount: data.inProgressCount ?? 0,
            closedCount: data.closedCount ?? 0,
            highUrgencyCount: data.highUrgencyCount ?? 0,
            unreadMessageCount: data.unreadMessageCount ?? 0,
          });
        })
        .catch((error) => {
          if (!active) return;

          setSummaryError(
            error.message || "상담 현황 조회에 실패했습니다."
          );
        })
        .finally(() => {
          if (active) setSummaryLoading(false);
        });

      // 최근 접수된 상담 사건 3건 조회
      const casesRequest = getAdminConsultations({
        sort: "recent",
        page: 1,
        size: 3,
      })
        .then((data) => {
          if (!active) return;

          setConsultations(
            Array.isArray(data.consultations)
              ? data.consultations
              : []
          );
        })
        .catch((error) => {
          if (!active) return;

          setCasesError(
            error.message || "최근 사건 조회에 실패했습니다."
          );
        })
        .finally(() => {
          if (active) setCasesLoading(false);
        });

      await Promise.allSettled([
        summaryRequest,
        casesRequest,
      ]);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const totalCases =
    summary.newCount +
    summary.inProgressCount +
    summary.closedCount;

  const receivedPercent = totalCases
    ? (summary.newCount / totalCases) * 100
    : 0;

  const progressPercent = totalCases
    ? (summary.inProgressCount / totalCases) * 100
    : 0;

  const donutStyle = {
    background: totalCases
      ? `conic-gradient(
          #DD7357 0% ${receivedPercent}%,
          #5168E8 ${receivedPercent}%
          ${receivedPercent + progressPercent}%,
          #45814B ${receivedPercent + progressPercent}% 100%
        )`
      : "#EAE5E1",
  };

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__heading">
        <div>
          <span>상담 현황</span>
          <h2>대시보드</h2>
        </div>

        <button
          type="button"
          className="admin-dashboard__reload"
          onClick={handleReload}
          disabled={summaryLoading || casesLoading}
        >
          새로고침
        </button>
      </div>

      {/* 통계 로딩 및 오류 */}
      {summaryError && (
        <div className="admin-dashboard__error" role="alert">
          상담 현황: {summaryError}
        </div>
      )}

      <section
        className="admin-dashboard__stats"
        aria-label="상담 현황 통계"
        aria-busy={summaryLoading}
      >
        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon is-coral">
            ▤
          </div>

          <div className="admin-dashboard__stat-text">
            <p>신규 접수</p>
            <small>공유 동의된 사건</small>
          </div>

          <strong>
            {summaryLoading || summaryError
              ? "-"
              : summary.newCount}
          </strong>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon is-blue">
            ◷
          </div>

          <div className="admin-dashboard__stat-text">
            <p>진행 중</p>
            <small>검토·자료 요청·연계</small>
          </div>

          <strong>
            {summaryLoading || summaryError
              ? "-"
              : summary.inProgressCount}
          </strong>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon is-green">
            ✓
          </div>

          <div className="admin-dashboard__stat-text">
            <p>완료</p>
            <small>처리 완료된 사건</small>
          </div>

          <strong>
            {summaryLoading || summaryError
              ? "-"
              : summary.closedCount}
          </strong>
        </div>
      </section>

      {/* API에서 제공하는 추가 정보 */}
      {!summaryLoading && !summaryError && (
        <section className="admin-dashboard__alerts">
          <div>
            <span className="admin-dashboard__alert-dot is-urgent" />
            우선 검토 대상
            <strong>{summary.highUrgencyCount}건</strong>
          </div>

          <div>
            <span className="admin-dashboard__alert-dot is-message" />
            읽지 않은 메시지가 있는 사건
            <strong>{summary.unreadMessageCount}건</strong>
          </div>
        </section>
      )}

      <section className="admin-dashboard__content">
        {/* 최근 상담 사건 */}
        <article className="admin-dashboard__panel">
          <div className="admin-dashboard__panel-header">
            <div>
              <span>최근 공유 동의 사건</span>
              <h3>검토가 필요한 사건</h3>
            </div>

            <button
              type="button"
              className="admin-dashboard__view-all"
              onClick={() => navigate("/cases")}
            >
              전체 보기
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div
            className="admin-dashboard__case-list"
            aria-busy={casesLoading}
          >
            {casesLoading ? (
              <p className="admin-dashboard__empty">
                최근 사건을 불러오는 중입니다.
              </p>
            ) : casesError ? (
              <p className="admin-dashboard__empty" role="alert">
                {casesError}
              </p>
            ) : consultations.length === 0 ? (
              <p className="admin-dashboard__empty">
                접수된 상담 사건이 없습니다.
              </p>
            ) : (
              consultations.map((item) => {
                const priority =
                  item.urgencyLevel ||
                  item.aiSuggestedUrgency;

                const isSuggested =
                  !item.urgencyLevel &&
                  Boolean(item.aiSuggestedUrgency);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="admin-dashboard__case"
                    onClick={() =>
                      navigate(
                        `/cases/${encodeURIComponent(item.id)}`
                      )
                    }
                  >
                    <div className="admin-dashboard__case-info">
                      <strong>{item.workerName || "이름 없음"}</strong>
                      <span>{item.id}</span>
                      <small>{formatDate(item.receivedAt)}</small>
                    </div>

                    <div className="admin-dashboard__case-amount">
                      <span>확인 필요 차이</span>
                      <strong>
                        {formatWon(item.differenceAmount)}
                      </strong>
                    </div>

                    <span
                      className={
                        `admin-dashboard__priority ` +
                        `priority-${(priority || "none").toLowerCase()}`
                      }
                    >
                      {priority
                        ? `${URGENCY_LABELS[priority] || priority}${
                            isSuggested ? " (AI)" : ""
                          }`
                        : "미분류"}
                    </span>

                    <span
                      className="admin-dashboard__case-arrow"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </article>

        {/* 상태별 사건 차트 */}
        <article className="admin-dashboard__panel">
          <div className="admin-dashboard__panel-header">
            <div>
              <span>처리 현황</span>
              <h3>상태별 사건</h3>
            </div>
          </div>

          <div className="admin-dashboard__chart-area">
            {summaryLoading ? (
              <p className="admin-dashboard__empty">
                통계를 불러오는 중입니다.
              </p>
            ) : summaryError ? (
              <p className="admin-dashboard__empty">
                통계를 표시할 수 없습니다.
              </p>
            ) : (
              <>
                <div
                  className="admin-dashboard__donut"
                  style={donutStyle}
                  role="img"
                  aria-label={
                    `전체 ${totalCases}건, ` +
                    `접수 ${summary.newCount}건, ` +
                    `진행 중 ${summary.inProgressCount}건, ` +
                    `완료 ${summary.closedCount}건`
                  }
                >
                  <div className="admin-dashboard__donut-center">
                    <strong>{totalCases}</strong>
                    <span>전체 사건</span>
                  </div>
                </div>

                <div className="admin-dashboard__legend">
                  <div>
                    <span className="dot is-coral" />
                    접수
                    <strong>{summary.newCount}</strong>
                  </div>

                  <div>
                    <span className="dot is-blue" />
                    진행 중
                    <strong>{summary.inProgressCount}</strong>
                  </div>

                  <div>
                    <span className="dot is-green" />
                    완료
                    <strong>{summary.closedCount}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      <div className="admin-dashboard__notice">
        <span aria-hidden="true">♢</span>
        <div>
          <strong>정보 공유 원칙</strong>
          <p>
            노동자가 명시적으로 공유에 동의한 사건만
            표시됩니다. 미동의 자료는 조회할 수 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
