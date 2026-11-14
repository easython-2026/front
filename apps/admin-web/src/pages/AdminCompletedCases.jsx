
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileCheck2,
  History,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getAdminConsultations } from "../services/adminConsultationApi";

import "./AdminCompletedCases.css";

const PAGE_SIZE = 20;

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

function formatWon(value) {
  if (value === null || value === undefined || value === "") {
    return "확인 필요";
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${amount.toLocaleString("ko-KR")}원`
    : "확인 필요";
}

function getDescription(item) {
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

function CompletedCaseRow({ item, onDetail, onHistory }) {
  return (
    <div className="admin-completed__row">
      <div className="admin-completed__case">
        <strong title={item.id}>{item.id}</strong>
        <p title={getDescription(item)}>
          {getDescription(item)}
        </p>
      </div>

      <div className="admin-completed__worker">
        <UserRound size={16} />
        <div>
          <strong>{item.workerName || "이름 없음"}</strong>
          <small>{item.workerLanguage || "언어 미확인"}</small>
        </div>
      </div>

      <div className="admin-completed__amount">
        <span className="admin-completed__mobile-label">
          확인 필요 차이
        </span>
        <strong>{formatWon(item.differenceAmount)}</strong>
      </div>

      <div className="admin-completed__assignee">
        <span className="admin-completed__mobile-label">
          담당자
        </span>
        {item.assignee?.name ||
          item.assigneeName ||
          "미배정"}
      </div>

      <div className="admin-completed__date">
        <CalendarDays size={14} />
        <span title="접수 일시">
          {formatDate(item.receivedAt)}
        </span>
      </div>

      <div className="admin-completed__status">
        <span className="admin-completed__badge">
          <CheckCircle2 size={14} />
          종결
        </span>
      </div>

      <div className="admin-completed__actions">
        <button
          type="button"
          className="admin-completed__detail-button"
          onClick={() => onDetail(item.id)}
          title="사건 상세 보기"
        >
          상세
          <ChevronRight size={15} />
        </button>

        <button
          type="button"
          className="admin-completed__history-button"
          onClick={() => onHistory(item.id)}
          title="상담 처리 기록 보기"
        >
          <History size={15} />
          처리 기록
        </button>
      </div>
    </div>
  );
}

export default function AdminCompletedCases() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCompletedCases() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminConsultations({
          status: "CLOSED",
          sort: "recent",
          page,
          size: PAGE_SIZE,
        });

        if (!active) return;

        const consultations = Array.isArray(data?.consultations)
          ? data.consultations
          : [];

        // 목록 API의 상태 필터가 정상 적용되는지 방어적으로 확인
        setItems(
          consultations.filter(
            (item) => item.status === "CLOSED"
          )
        );

        const info = data?.pageInfo || {};

        setPageInfo({
          currentPage: info.currentPage ?? page,
          totalPages: Math.max(1, info.totalPages ?? 1),
          totalCount: info.totalCount ?? 0,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            "종결된 상담 사건을 불러오지 못했습니다."
        );
        setItems([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCompletedCases();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  // 현재 조회한 페이지 안에서 검색
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      const content = [
        item.id,
        item.workerName,
        item.assigneeName,
        item.assignee?.name,
        getDescription(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return content.includes(keyword);
    });
  }, [items, search]);

  const refresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  const openDetail = (id) => {
    navigate(`/cases/${encodeURIComponent(id)}`);
  };

  const openHistory = (id) => {
    navigate(`/cases/${encodeURIComponent(id)}/history`);
  };

  return (
    <div className="admin-completed">
      {/* 페이지 제목 */}

      <header className="admin-completed__header">
        <div>
          <span className="admin-completed__eyebrow">
            COMPLETED CONSULTATIONS
          </span>

          <h1>
            <FileCheck2 size={29} strokeWidth={1.8} />
            종결 상담 내역
          </h1>

          <p>
            상담 처리가 완료된 사건과 처리 기록을
            조회할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="admin-completed__refresh"
          disabled={loading}
          onClick={refresh}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "admin-completed__spin" : ""
            }
          />
          새로고침
        </button>
      </header>

      {/* 통계 및 안내 */}

      <section className="admin-completed__summary">
        <div className="admin-completed__summary-main">
          <span className="admin-completed__summary-icon">
            <CheckCircle2 size={25} />
          </span>

          <div>
            <span>종결된 상담 사건</span>
            <strong>
              {loading || error
                ? "-"
                : pageInfo.totalCount}
              <small>건</small>
            </strong>
          </div>
        </div>

        <div className="admin-completed__summary-note">
          <ShieldCheck size={20} />
          <p>
            정보 공유 동의가 유지되고 현재 기관에
            접근 권한이 있는 종결 사건만 표시됩니다.
          </p>
        </div>
      </section>

      {/* 검색 */}

      <div className="admin-completed__toolbar">
        <label className="admin-completed__search">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="사건 번호, 노동자, 담당자 검색"
            aria-label="현재 페이지 사건 검색"
          />
        </label>

        <span>현재 페이지 내 검색</span>
      </div>

      {/* API 오류 */}

      {error && (
        <div
          className="admin-completed__error"
          role="alert"
        >
          <CircleAlert size={18} />
          <span>{error}</span>

          <button type="button" onClick={refresh}>
            다시 시도
          </button>
        </div>
      )}

      {/* 종결 사건 목록 */}

      <section className="admin-completed__list">
        <div className="admin-completed__table-head">
          <span>사건 정보</span>
          <span>노동자</span>
          <span>확인 필요 차이</span>
          <span>담당자</span>
          <span>접수 일시</span>
          <span>상태</span>
          <span>관리</span>
        </div>

        {loading ? (
          <div className="admin-completed__empty">
            <LoaderCircle
              size={30}
              className="admin-completed__spin"
            />
            <p>종결된 사건을 불러오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="admin-completed__empty">
            <CircleAlert size={29} />
            <p>종결 사건 목록을 표시할 수 없습니다.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-completed__empty">
            <Inbox size={31} />
            <p>
              {search.trim()
                ? "현재 페이지에 검색 결과가 없습니다."
                : "종결된 상담 사건이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="admin-completed__rows">
            {filteredItems.map((item) => (
              <CompletedCaseRow
                key={item.id}
                item={item}
                onDetail={openDetail}
                onHistory={openHistory}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}

        {!loading && !error && (
          <footer className="admin-completed__pagination">
            <span>
              총 {pageInfo.totalCount}건 ·{" "}
              {pageInfo.currentPage}/
              {pageInfo.totalPages} 페이지
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
                    Math.min(pageInfo.totalPages, prev + 1)
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

      {/* 하단 안내 */}

      <div className="admin-completed__footer">
        <div>
          <ClipboardList size={19} />
          <p>
            종결된 사건은 상담 결과를 다시 저장하여
            중복 종결할 수 없습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/cases")}
        >
          전체 사건 목록
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
