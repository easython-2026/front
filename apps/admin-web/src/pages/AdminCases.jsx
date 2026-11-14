
import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  MessageCircle,
  AlertCircle,
  Inbox,
  LoaderCircle,
  Filter,
  ArrowDownUp,
} from "lucide-react";

import { getAdminConsultations } from "../services/adminConsultationApi";
import "./AdminCases.css";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "RECEIVED", label: "접수" },
  { value: "REVIEWING", label: "검토 중" },
  { value: "INFO_REQUESTED", label: "자료 요청" },
  { value: "REFERRED", label: "전문가 연계" },
  { value: "CLOSED", label: "완료" },
];

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

function formatWon(value) {
  if (value == null || value === "") {
    return "확인 필요";
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${amount.toLocaleString("ko-KR")}원`
    : "확인 필요";
}

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

function getSummary(item) {
  if (typeof item.summary === "string") {
    return item.summary;
  }

  return (
    item.summary?.ko ||
    item.title ||
    item.description ||
    "사건 요약 정보 없음"
  );
}

function CaseRow({ item, onOpen }) {
  const priority =
    item.urgencyLevel ||
    item.aiSuggestedUrgency;

  const isAiSuggested =
    !item.urgencyLevel &&
    Boolean(item.aiSuggestedUrgency);

  const isHighPriority =
    priority === "HIGH" &&
    item.status !== "CLOSED";

  const unread = Math.max(
    0,
    Number(item.unreadMessages) || 0
  );

  const summary = getSummary(item);

  return (
    <button
      type="button"
      className={
        `admin-cases__row ${
          isHighPriority ? "is-priority" : ""
        }`
      }
      onClick={() => onOpen(item.id)}
      aria-label={`${item.id} 사건 상세 보기${
        isHighPriority
          ? ", 우선 검토 대상"
          : ""
      }`}
    >
      {/* 사건 정보 */}

      <div className="admin-cases__case-info">
        <strong title={item.id}>
          {isHighPriority && (
            <span
              className="admin-cases__priority-dot"
              aria-hidden="true"
            />
          )}
          {item.id}
        </strong>

        <span title={summary}>
          {summary}
        </span>

        {isHighPriority && (
            <span className="admin-cases__priority-label">
                <AlertCircle
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
                />
                <span className="admin-cases__priority-label-text">
                우선 검토 대상
                </span>
            </span>
            )}

        {unread > 0 && (
          <span className="admin-cases__unread">
            <MessageCircle size={12} />
            미읽음 {unread}
          </span>
        )}
      </div>

      {/* 노동자 */}

      <div className="admin-cases__worker">
        <strong>
          {item.workerName || "이름 없음"}
        </strong>

        <small>
          {item.workerLanguage || "-"}
        </small>
      </div>

      {/* 임금 차이 */}

      <div className="admin-cases__amount">
        <strong
          title={formatWon(item.differenceAmount)}
        >
          {formatWon(item.differenceAmount)}
        </strong>
      </div>

      {/* 긴급도 */}

      <div className="admin-cases__urgency">
        <span
          className={
            `admin-cases__badge urgency-${(
              priority || "none"
            ).toLowerCase()}`
          }
        >
          {URGENCY_LABELS[priority] ||
            priority ||
            "미분류"}

          {isAiSuggested && (
            <small>AI 제안</small>
          )}
        </span>
      </div>

      {/* 처리 상태 */}

      <div className="admin-cases__status">
        <span
          className={
            `admin-cases__badge status-${(
              item.status || "none"
            ).toLowerCase()}`
          }
        >
          {STATUS_LABELS[item.status] ||
            item.status ||
            "확인 필요"}
        </span>
      </div>

      {/* 담당자 */}

      <div className="admin-cases__assignee">
        <span>
          {item.assignee?.name ||
            item.assigneeName ||
            "미배정"}
        </span>
      </div>

      {/* 접수 일시 */}

      <div className="admin-cases__date">
        <span>
          {formatDate(item.receivedAt)}
        </span>
      </div>

      {/* 상세 */}

      <div className="admin-cases__open">
        보기
        <ChevronRight size={15} />
      </div>
    </button>
  );
}

export default function AdminCases() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  // URL이 단일 정렬 상태의 기준이 된다.
  const sort =
    searchParams.get("sort") === "urgency"
      ? "urgency"
      : "recent";

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [consultations, setConsultations] =
    useState([]);

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
          ...(status ? { status } : {}),
          page,
          size: PAGE_SIZE,
        });

        if (!active) return;

        setConsultations(
          Array.isArray(data?.consultations)
            ? data.consultations
            : []
        );

        const info = data?.pageInfo || {};

        setPageInfo({
          currentPage: info.currentPage ?? page,
          totalPages: Math.max(
            1,
            info.totalPages ?? 1
          ),
          totalCount: info.totalCount ?? 0,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            "상담 사건 목록을 불러오지 못했습니다."
        );
        setConsultations([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      active = false;
    };
  }, [sort, status, page, reloadKey]);

  const handleSortChange = (nextSort) => {
    setPage(1);

    setSearchParams(
      nextSort === "urgency"
        ? { sort: "urgency" }
        : {}
    );
  };

  const handleOpen = (id) => {
    navigate(
      `/cases/${encodeURIComponent(id)}`
    );
  };

  return (
    <div className="admin-cases">
      {/* 헤더 */}

      <header className="admin-cases__header">
        <div>
          <p className="admin-cases__eyebrow">
            상담 사건 관리
          </p>

          <h1>사건 목록</h1>

          <p className="admin-cases__description">
            노동자가 공유에 동의한 상담 사건만
            조회할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="admin-cases__refresh"
          onClick={() =>
            setReloadKey((prev) => prev + 1)
          }
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "admin-cases__spin" : ""
            }
          />
          새로고침
        </button>
      </header>

      {/* 필터 */}

      <section className="admin-cases__toolbar">
        <div className="admin-cases__total">
          전체 사건

          <strong>
            {loading || error
              ? "-"
              : pageInfo.totalCount}
          </strong>
          건
        </div>

        <div className="admin-cases__filters">
          <label className="admin-cases__filter">
            <span>
              <Filter size={14} />
              처리 상태
            </span>

            <select
              value={status}
              disabled={loading}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-cases__filter">
            <span>
              <ArrowDownUp size={14} />
              정렬 기준
            </span>

            <select
              value={sort}
              disabled={loading}
              onChange={(event) =>
                handleSortChange(event.target.value)
              }
            >
              <option value="recent">
                최근순
              </option>
              <option value="urgency">
                긴급도순
              </option>
            </select>
          </label>
        </div>
      </section>

      {/* 오류 */}

      {error && (
        <div
          className="admin-cases__error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setReloadKey((prev) => prev + 1)
            }
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 가로형 테이블 */}

      <section className="admin-cases__list">
        <div className="admin-cases__table-head">
          <span>사건 정보</span>
          <span>노동자</span>
          <span>확인 필요 차이</span>
          <span>긴급도</span>
          <span>처리 상태</span>
          <span>담당자</span>
          <span>접수 일시</span>
          <span>상세</span>
        </div>

        {loading ? (
          <div className="admin-cases__empty">
            <LoaderCircle
              size={28}
              className="admin-cases__spin"
            />
            <p>사건을 불러오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="admin-cases__empty">
            <AlertCircle size={28} />
            <p>사건 목록을 표시할 수 없습니다.</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="admin-cases__empty">
            <Inbox size={29} />
            <p>해당 조건의 상담 사건이 없습니다.</p>
          </div>
        ) : (
          <div className="admin-cases__rows">
            {consultations.map((item) => (
              <CaseRow
                key={item.id}
                item={item}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}

        {!loading && !error && (
          <footer className="admin-cases__pagination">
            <span>
              총 {pageInfo.totalCount}건 ·{" "}
              {pageInfo.currentPage}/
              {pageInfo.totalPages}페이지
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
              >
                <ChevronLeft size={16} />
                이전
              </button>

              <button
                type="button"
                disabled={page >= pageInfo.totalPages}
                onClick={() =>
                  setPage((prev) =>
                    Math.min(
                      pageInfo.totalPages,
                      prev + 1
                    )
                  )
                }
              >
                다음
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        )}
      </section>

      <div className="admin-cases__notice">
        <ClipboardList size={17} />
        빨간 점은 긴급도 높음인 미종결 사건을
        의미합니다. AI 제안 긴급도와 담당자가
        확정한 긴급도는 구분해서 표시합니다.
      </div>
    </div>
  );
}
