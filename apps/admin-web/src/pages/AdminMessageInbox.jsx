
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Inbox,
  LoaderCircle,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Search,
} from "lucide-react";

import { getAdminConsultations } from "../services/adminConsultationApi";
import "./AdminMessageInbox.css";

// ========================================
// 기본 설정
// ========================================

const PAGE_SIZE = 20;

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "완료",
};

// ========================================
// 날짜 포맷
// ========================================

function formatDate(value) {
  if (!value) return "일시 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "일시 없음";
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
// 관리자 사건 목록 API의 미읽음 여부
//
// GET /api/v1/admin/consultations
//
// hasNewMessage: boolean
//
// 주의:
// unreadMessages는 노동자 상담 목록 API의 필드.
// 관리자 사건 목록에서는 hasNewMessage 사용.
// ========================================

function hasUnreadMessage(item) {
  return item?.hasNewMessage === true;
}

// ========================================
// 개별 사건 메시지 행
// ========================================

function ConversationRow({ item, onOpen }) {
  const hasUnread = hasUnreadMessage(item);

  const workerName =
    item.workerName || "이름 없음";

  const assigneeName =
    item.assignee?.name ||
    item.assigneeName ||
    "미배정";

  return (
    <button
      type="button"
      className={`admin-inbox__conversation ${
        hasUnread ? "has-unread" : ""
      }`}
      onClick={() => onOpen(item.id)}
      aria-label={
        `${workerName}, 사건 ${item.id}, ` +
        (hasUnread
          ? "읽지 않은 노동자 메시지 있음"
          : "읽지 않은 노동자 메시지 없음")
      }
    >
      {/* ====================================
          노동자 아바타
      ==================================== */}

      <span className="admin-inbox__avatar">
        {workerName.slice(0, 1)}
      </span>

      {/* ====================================
          사건 정보
      ==================================== */}

      <span className="admin-inbox__conversation-main">
        {/* 노동자 이름 / 사건 ID / 미읽음 표시 */}

        <span className="admin-inbox__conversation-top">
          <strong className="admin-inbox__worker-name">
            {workerName}
          </strong>

          {/* 미읽음 빨간 점 */}

          {hasUnread && (
            <span
              className="admin-inbox__red-dot"
              aria-hidden="true"
            />
          )}

          {/* 사건 ID */}

          <span className="admin-inbox__case-id">
            {item.id}
          </span>

          {/* 미읽음 메시지 배지 */}

          {hasUnread && (
            <span className="admin-inbox__unread-badge">
              <MessageCircle
                size={13}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className="admin-inbox__unread-text">
                새 메시지
              </span>
            </span>
          )}
        </span>

        {/* ====================================
            처리 상태 및 담당자
        ==================================== */}

        <span className="admin-inbox__conversation-sub">
          <span>
            {STATUS_LABELS[item.status] ||
              item.status ||
              "상태 미확인"}
          </span>

          <span className="admin-inbox__separator">
            ·
          </span>

          <span>
            담당자: {assigneeName}
          </span>
        </span>

        {/* ====================================
            접수 일시
        ==================================== */}

        <span className="admin-inbox__conversation-date">
          <Clock3
            size={13}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            접수: {formatDate(item.receivedAt)}
          </span>
        </span>
      </span>

      {/* ====================================
          대화 열기
      ==================================== */}

      <span className="admin-inbox__open">
        <span>대화 열기</span>

        <ArrowRight
          size={18}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

// ========================================
// 통합 상담 메시지함
// ========================================

export default function AdminMessageInbox() {
  const navigate = useNavigate();

  // ========================================
  // 상태 관리
  // ========================================

  const [consultations, setConsultations] =
    useState([]);

  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // 상담 사건 목록 조회
  //
  // 기존 API 사용
  // GET /api/v1/admin/consultations
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadConsultations() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminConsultations({
          sort: "recent",
          page,
          size: PAGE_SIZE,
        });

        if (!active) return;

        const items =
          Array.isArray(data?.consultations)
            ? data.consultations
            : [];

        setConsultations(items);

        const info = data?.pageInfo || {};

        setPageInfo({
          currentPage:
            info.currentPage ?? page,

          totalPages: Math.max(
            1,
            info.totalPages ?? 1
          ),

          totalCount:
            info.totalCount ?? items.length,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            "상담 메시지함을 불러오지 못했습니다."
        );

        setConsultations([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadConsultations();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  // ========================================
  // 검색 + 미읽음 우선 정렬
  //
  // 관리자 API의 hasNewMessage 사용
  // 현재 조회된 페이지 안에서만 정렬
  // ========================================

  const visibleConsultations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    // 1. 현재 페이지에서 검색
    const filtered = consultations.filter((item) => {
      if (!keyword) return true;

      const searchable = [
        item.id,
        item.workerName,
        item.assignee?.name,
        item.assigneeName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });

    // 2. 미읽음 사건을 위쪽에 배치
    //    미읽음 여부가 같으면 서버 최근순 유지
    return [...filtered].sort((a, b) => {
      const aUnread =
        hasUnreadMessage(a) ? 1 : 0;

      const bUnread =
        hasUnreadMessage(b) ? 1 : 0;

      return bUnread - aUnread;
    });
  }, [consultations, search]);

  // ========================================
  // 현재 페이지의 미읽음 사건 개수
  //
  // unreadMessages가 아니라
  // hasNewMessage === true인 사건 수
  // ========================================

  const unreadCases = useMemo(() => {
    return consultations.filter(
      hasUnreadMessage
    ).length;
  }, [consultations]);

  // ========================================
  // 새로고침
  // ========================================

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  // ========================================
  // 개별 상담 메시지 화면 이동
  // ========================================

  const handleOpenConversation = (id) => {
    navigate(
      `/cases/${encodeURIComponent(id)}/messages`
    );
  };

  // ========================================
  // 페이지 변경
  // ========================================

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setSearch("");
  };

  // ========================================
  // 화면
  // ========================================

  return (
    <div className="admin-inbox">
      {/* ====================================
          페이지 헤더
      ==================================== */}

      <header className="admin-inbox__header">
        <div>
          <span className="admin-inbox__eyebrow">
            CONSULTATION MESSAGES
          </span>

          <h1>
            <MessagesSquare
              size={29}
              strokeWidth={1.8}
            />

            상담 메시지함
          </h1>

          <p>
            상담 사건을 선택하여 노동자와의
            대화를 확인하세요.
          </p>
        </div>

        <button
          type="button"
          className="admin-inbox__refresh"
          onClick={handleReload}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "admin-inbox__spin"
                : ""
            }
          />

          새로고침
        </button>
      </header>

      {/* ====================================
          상담 현황 요약
      ==================================== */}

      <section className="admin-inbox__summary">
        {/* 현재 페이지 상담 사건 수 */}

        <div className="admin-inbox__summary-item">
          <div className="admin-inbox__summary-icon">
            <MessageCircle size={21} />
          </div>

          <div>
            <span>
              현재 페이지 상담 사건
            </span>

            <strong>
              {loading || error
                ? "-"
                : consultations.length}

              <small>건</small>
            </strong>
          </div>
        </div>

        {/* 현재 페이지 미읽음 사건 수 */}

        <div
          className={`admin-inbox__summary-item ${
            !loading &&
            !error &&
            unreadCases > 0
              ? "has-unread"
              : ""
          }`}
        >
          <div className="admin-inbox__summary-icon is-unread">
            <MessagesSquare size={21} />
          </div>

          <div>
            <span>
              현재 페이지 미읽음 표시 사건
            </span>

            <strong>
              {loading || error
                ? "-"
                : unreadCases}

              <small>건</small>
            </strong>
          </div>

          {/* 미읽음이 있을 때만 빨간 점 */}

          {!loading &&
            !error &&
            unreadCases > 0 && (
              <span
                className="admin-inbox__summary-dot"
                aria-label="읽지 않은 메시지가 있습니다"
              />
            )}
        </div>
      </section>

      {/* ====================================
          검색
      ==================================== */}

      <div className="admin-inbox__toolbar">
        <label className="admin-inbox__search">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="사건 번호 또는 노동자 이름 검색"
            aria-label="현재 페이지 상담 검색"
          />
        </label>

        <span className="admin-inbox__sort-info">
          미읽음 사건 우선 표시
        </span>
      </div>

      {/* ====================================
          API 오류
      ==================================== */}

      {error && (
        <div
          className="admin-inbox__error"
          role="alert"
        >
          <CircleAlert size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={handleReload}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* ====================================
          사건별 메시지 목록
      ==================================== */}

      <section
        className="admin-inbox__list"
        aria-label="상담 메시지 사건 목록"
        aria-busy={loading}
      >
        {loading ? (
          <div className="admin-inbox__empty">
            <LoaderCircle
              size={30}
              className="admin-inbox__spin"
            />

            <p>
              상담 사건을 불러오는 중입니다.
            </p>
          </div>
        ) : error ? (
          <div className="admin-inbox__empty">
            <CircleAlert size={28} />

            <p>
              상담 사건을 표시할 수 없습니다.
            </p>
          </div>
        ) : visibleConsultations.length === 0 ? (
          <div className="admin-inbox__empty">
            <Inbox size={31} />

            <p>
              {search.trim()
                ? "현재 페이지에서 검색 결과가 없습니다."
                : "조회 가능한 상담 사건이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="admin-inbox__rows">
            {visibleConsultations.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                onOpen={handleOpenConversation}
              />
            ))}
          </div>
        )}
      </section>

      {/* ====================================
          페이지네이션
      ==================================== */}

      {!loading && !error && (
        <footer className="admin-inbox__pagination">
          <span>
            전체 {pageInfo.totalCount}건 ·{" "}
            {pageInfo.currentPage}/
            {pageInfo.totalPages}페이지
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                handlePageChange(
                  Math.max(1, page - 1)
                )
              }
            >
              <ChevronLeft size={16} />
              이전
            </button>

            <button
              type="button"
              disabled={
                page >= pageInfo.totalPages
              }
              onClick={() =>
                handlePageChange(
                  Math.min(
                    pageInfo.totalPages,
                    page + 1
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

      {/* ====================================
          하단 안내
      ==================================== */}

      <p className="admin-inbox__notice">
        빨간 점과 강조 배경은 읽지 않은 노동자
        메시지가 있는 사건을 의미합니다.
        미읽음 우선 정렬과 검색은 현재 조회된
        페이지에만 적용됩니다.
      </p>
    </div>
  );
}
