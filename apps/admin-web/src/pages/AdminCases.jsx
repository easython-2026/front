
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  getAdminConsultations,
} from "../services/adminConsultationApi";

import "./AdminCases.css";

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "연계",
  CLOSED: "완료",
};

const URGENCY_LABELS = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

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

function formatWon(value) {
  if (value == null) return "확인 필요";

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export default function AdminCases() {
  const navigate = useNavigate();

  const [sort, setSort] = useState("recent");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [cases, setCases] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCases() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminConsultations({
          sort,
          status: status || undefined,
          page,
          size: PAGE_SIZE,
        });

        if (!active) return;

        setCases(
          Array.isArray(data?.consultations)
            ? data.consultations
            : []
        );

        setPageInfo(
          data?.pageInfo || {
            currentPage: page,
            totalPages: 1,
            totalCount: 0,
          }
        );
      } catch (err) {
        if (!active) return;

        setCases([]);
        setPageInfo({
          currentPage: page,
          totalPages: 1,
          totalCount: 0,
        });

        setError(
          err.message || "사건 목록 조회에 실패했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCases();

    return () => {
      active = false;
    };
  }, [sort, status, page, reloadKey]);

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="admin-cases">
      <div className="admin-cases__heading">
        <div>
          <span>상담 사건 관리</span>
          <h2>사건 목록</h2>
          <p>
            노동자가 공유에 동의한 상담 사건만 조회할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="admin-cases__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ 새로고침
        </button>
      </div>

      {/* 목록 도구 */}
      <div className="admin-cases__toolbar">
        <div className="admin-cases__total">
          전체 사건
          <strong>
            {loading || error ? "-" : pageInfo.totalCount}
          </strong>
          건
        </div>

        <div className="admin-cases__filters">
          <label>
            <span>처리 상태</span>
            <select
              value={status}
              onChange={handleStatusChange}
            >
              <option value="">전체 상태</option>
              <option value="RECEIVED">접수</option>
              <option value="REVIEWING">검토 중</option>
              <option value="INFO_REQUESTED">자료 요청</option>
              <option value="REFERRED">연계</option>
              <option value="CLOSED">완료</option>
            </select>
          </label>

          <label>
            <span>정렬 기준</span>
            <select
              value={sort}
              onChange={handleSortChange}
            >
              <option value="recent">최근순</option>
              <option value="urgency">긴급도순</option>
            </select>
          </label>
        </div>
      </div>

      {/* 사건 목록 */}
      <section
        className="admin-cases__table-card"
        aria-busy={loading}
      >
        <div className="admin-cases__table-scroll">
          <table className="admin-cases__table">
            <thead>
              <tr>
                <th>사건 정보</th>
                <th>노동자</th>
                <th>확인 필요 차이</th>
                <th>긴급도</th>
                <th>처리 상태</th>
                <th>담당자</th>
                <th>접수 일시</th>
                <th>상세</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="admin-cases__empty">
                    사건 목록을 불러오는 중입니다.
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="admin-cases__empty">
                    <p role="alert">{error}</p>
                    <button type="button" onClick={handleRefresh}>
                      다시 시도
                    </button>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="admin-cases__empty">
                    해당 조건에 맞는 상담 사건이 없습니다.
                  </td>
                </tr>
              ) : (
                cases.map((item) => {
                  const urgency =
                    item.urgencyLevel ||
                    item.aiSuggestedUrgency;

                  const aiSuggested =
                    !item.urgencyLevel &&
                    Boolean(item.aiSuggestedUrgency);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="admin-cases__case-info">
                          <strong>{item.id}</strong>
                          <span>
                            {item.headline || "사건 요약 준비 중"}
                          </span>

                          {item.hasNewMessage && (
                            <span className="admin-cases__new-message">
                              새 메시지
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="admin-cases__worker">
                          <strong>
                            {item.workerName || "-"}
                          </strong>
                          <span>
                            {item.workerLanguage || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="admin-cases__amount">
                        {formatWon(item.differenceAmount)}
                      </td>

                      <td>
                        <span
                          className={
                            `admin-cases__urgency urgency-${(
                              urgency || "none"
                            ).toLowerCase()}`
                          }
                        >
                          {urgency
                            ? URGENCY_LABELS[urgency] || urgency
                            : "미분류"}
                          {aiSuggested && (
                            <small>AI 제안</small>
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-cases__status status-${(
                            item.status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {STATUS_LABELS[item.status] ||
                            item.status ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {item.assignee?.name || "미배정"}
                      </td>

                      <td className="admin-cases__date">
                        {formatDate(item.receivedAt)}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-cases__detail-button"
                          onClick={() =>
                            navigate(
                              `/cases/${encodeURIComponent(item.id)}`
                            )
                          }
                          aria-label={`${item.id} 상세 보기`}
                        >
                          보기 ›
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="admin-cases__pagination">
          <span>
            {pageInfo.totalCount}건 중 {pageInfo.currentPage} /
            {Math.max(1, pageInfo.totalPages)} 페이지
          </span>

          <div>
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() =>
                setPage((prev) => Math.max(1, prev - 1))
              }
            >
              이전
            </button>

            <button
              type="button"
              disabled={
                loading ||
                page >= pageInfo.totalPages
              }
              onClick={() => setPage((prev) => prev + 1)}
            >
              다음
            </button>
          </div>
        </div>
      </section>

      <div className="admin-cases__notice">
        <strong>긴급도 안내</strong>
        <p>
          AI 제안 긴급도는 상담 검토를 돕기 위한 참고 정보이며,
          법적 긴급도나 임금 체불 여부를 확정하지 않습니다.
          담당자가 사건을 검토한 뒤 우선순위를 확정합니다.
        </p>
      </div>
    </div>
  );
}
