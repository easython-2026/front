
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getComplaints } from "../../api/report";
import "../../styles/figma-petitions-list.css";

const FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "REVIEW", label: "검토 필요" },
  { key: "PROCESSING", label: "생성 중" },
  { key: "DONE", label: "검토 완료" },
];

function Icon({ name, size = 20 }) {
  const drawings = {
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    file: <>
      <path d="M6 2h8l4 4v16H6z"/>
      <path d="M14 2v5h4M9 12h6m-6 4h6"/>
    </>,
    chevron: <path d="m9 5 7 7-7 7" />,
    refresh: <>
      <path d="M20 7v5h-5M4 17v-5h5"/>
      <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15"/>
    </>,
    clock: <>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <>
      <path d="m12 3 10 18H2z"/>
      <path d="M12 9v5m0 4h.01"/>
    </>,
    lock: <>
      <rect x="5" y="10" width="14" height="11" rx="2"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </>,
    wallet: <>
      <rect x="3" y="6" width="18" height="14" rx="2"/>
      <path d="M3 10h18m-6 5h3"/>
    </>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {drawings[name] ?? drawings.file}
    </svg>
  );
}

// 서버 응답 형태 정규화
function parseComplaints(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  const list = [
    data?.complaints,
    data?.content,
    data?.items,
    data?.results,
  ].find(Array.isArray);

  if (!list) {
    throw new Error(
      "진정서 목록 응답 형식을 확인할 수 없습니다."
    );
  }

  return list;
}

// 진정서 상태에 따른 화면 분류
function statusOf(item) {
  const status = String(
    item.status ?? ""
  ).toUpperCase();

  if (status === "FAILED") {
    return {
      key: "FAILED",
      label: "생성 실패",
      icon: "alert",
    };
  }

  if (status === "PROCESSING") {
    return {
      key: "PROCESSING",
      label: "생성 중",
      icon: "clock",
    };
  }

  if (
    status === "DONE" &&
    item.reviewed === true
  ) {
    return {
      key: "DONE",
      label: "검토 완료",
      icon: "check",
    };
  }

  if (status === "DONE") {
    return {
      key: "REVIEW",
      label: "검토 필요",
      icon: "file",
    };
  }

  return {
    key: "UNKNOWN",
    label: "상태 확인 필요",
    icon: "alert",
  };
}

// 금액 출력
function formatAmount(value) {
  if (
    value == null ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "미확인";
  }

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

// 한국 시간 출력
function formatDate(value) {
  if (!value) return "일시 미제공";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// API 오류 처리
function getError(error) {
  if (error?.status === 401) {
    return {
      auth: true,
      message:
        "로그인 인증이 필요합니다. 다시 로그인한 후 진정서를 조회해 주세요.",
    };
  }

  if (error?.status === 403) {
    return {
      auth: false,
      message:
        "진정서 조회 권한이 없습니다. 계정 권한을 확인해 주세요.",
    };
  }

  return {
    auth: false,
    message:
      error?.message ??
      "진정서 목록을 불러오지 못했습니다.",
  };
}

// 진정서 개별 카드
function PetitionCard({ item }) {
  const id = item.id ?? item.complaintId;

  const status = statusOf(item);

  const title =
    item.title ??
    item.draft?.ko?.title ??
    "임금 관련 진정서 초안";

  const range =
    item.periodStart || item.periodEnd
      ? `${item.periodStart ?? "시작일 미확인"} ~ ${
          item.periodEnd ?? "종료일 미확인"
        }`
      : "기간 미제공";

  return (
    <article className="pcl-record">
      {/* 아이콘 및 상태 배지 */}
      <div className="pcl-record-top">
        <span className="pcl-record-icon">
          <Icon name="file" size={22}/>
        </span>

        <span
          className={`pcl-status pcl-status-${status.key.toLowerCase()}`}
        >
          <Icon
            name={status.icon}
            size={13}
          />
          {status.label}
        </span>
      </div>

      {/* 제목 및 생성 일시 */}
      <h3>{title}</h3>

      <p className="pcl-record-created">
        {formatDate(item.createdAt)}
      </p>

      {/* 진정서 기본 정보 */}
      <div className="pcl-record-details">
        <div>
          <span>대상 기간</span>
          <strong>{range}</strong>
        </div>

        <div>
          <span>확인 필요 차이</span>
          <strong>
            {formatAmount(item.unpaidAmount)}
          </strong>
        </div>

        <div>
          <span>사용자 검토</span>
          <strong>
            {item.reviewed === true
              ? "검토 완료"
              : "검토 전"}
          </strong>
        </div>
      </div>

      {/* 진정서 상세 이동 */}
      {id != null && String(id) !== "" ? (
        <Link
          className="pcl-record-link"
          to={`/petitions/${encodeURIComponent(
            String(id)
          )}`}
        >
          {status.key === "PROCESSING"
            ? "생성 진행상황 확인"
            : status.key === "DONE"
            ? "진정서 및 증거 확인"
            : status.key === "FAILED"
            ? "실패 내용 확인"
            : "대조본 검토하기"}

          <Icon name="chevron" size={17}/>
        </Link>
      ) : (
        <p className="pcl-record-no-id">
          서버가 진정서 ID를 제공하지 않아
          상세 화면을 열 수 없습니다.
        </p>
      )}
    </article>
  );
}

// ============================================
// 진정서 목록 메인 페이지
// ============================================

export default function Petitions() {
  const [items, setItems] = useState([]);

  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);

  // 기존 진정서 목록 API
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setItems([]);

    // 첫 페이지는 기존 기본 API 규격을 유지합니다.
    // 추가 페이지는 서버가 pageInfo를 제공한 경우에만 조회합니다.
    getComplaints(page === 1 ? {} : { page, size: 20 })
      .then((response) => {
        if (!active) return;

        setItems(parseComplaints(response));
        const payload = response?.data ?? response;
        setPageInfo(payload?.pageInfo ?? payload?.pagination ?? null);
      })
      .catch((err) => {
        if (active) {
          setError(getError(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reload, page]);

  // 조회한 진정서들의 상태별 개수
  const counts = useMemo(
    () => ({
      all: items.length,

      review: items.filter(
        (item) =>
          statusOf(item).key === "REVIEW"
      ).length,

      processing: items.filter(
        (item) =>
          statusOf(item).key === "PROCESSING"
      ).length,

      done: items.filter(
        (item) =>
          statusOf(item).key === "DONE"
      ).length,
    }),
    [items]
  );

  // 선택한 상태 필터
  const visible = useMemo(
    () =>
      filter === "ALL"
        ? items
        : items.filter(
            (item) =>
              statusOf(item).key === filter
          ),
    [filter, items]
  );

  return (
    <div className="pcl-page">

      {/* ====================================
          상단바
      ==================================== */}
      <header className="pcl-header">
        <Link
          to="/home"
          aria-label="홈으로 돌아가기"
        >
          <Icon name="back"/>
        </Link>

        <strong>진정서</strong>

        <button
          type="button"
          aria-label="새로고침"
          disabled={loading}
          onClick={() =>
            setReload((n) => n + 1)
          }
        >
          <Icon name="refresh" size={19}/>
        </button>
      </header>

      <main className="pcl-content">

        {/* ====================================
            제목
        ==================================== */}

        <section className="pcl-heading">
          <p className="pcl-eyebrow">
            MY DOCUMENTS
          </p>

          <h1>진정서 초안</h1>

          <p>
            진정서의 생성 상태를 확인하고,
            한국어·선택 언어 대조본과
            관련 증거를 검토할 수 있어요.
          </p>
        </section>

        {/* ====================================
            새 진정서 만들기
        ==================================== */}

        <section className="pcl-hero">
          <span className="pcl-hero-icon">
            <Icon name="file" size={27}/>
          </span>

          <div>
            <p className="pcl-hero-eyebrow">
              AI DRAFT
            </p>

            <h2>
              확인된 기록으로
              <br/>
              진정서를 준비해요
            </h2>

            <p>
              급여 비교 결과를 기준으로 초안을
              만들고, 최종 검토 후 PDF로
              저장할 수 있어요.
            </p>
          </div>

          <Link
            to="/petitions/new"
            className="pcl-main-button"
          >
            <Icon name="plus" size={19}/>
            새 진정서 만들기
          </Link>
        </section>

        {/* ====================================
            진정서 현황
            서버 조회 성공 시에만 표시
        ==================================== */}

        {!loading && !error && (
          <section
            className="pcl-stats"
            aria-label="조회된 진정서 현황"
          >
            <div>
              <span>조회된 전체</span>
              <strong>
                {counts.all}
                <small>건</small>
              </strong>
            </div>

            <div>
              <span>검토 필요</span>
              <strong>
                {counts.review}
                <small>건</small>
              </strong>
            </div>

            <div>
              <span>검토 완료</span>
              <strong>
                {counts.done}
                <small>건</small>
              </strong>
            </div>
          </section>
        )}

        {/* ====================================
            목록 제목
        ==================================== */}

        <div className="pcl-section-head">
          <h2>내 진정서 목록</h2>

          {!loading && !error && (
            <span>
              {counts.all}건 조회
            </span>
          )}
        </div>

        {/* ====================================
            로딩
        ==================================== */}

        {loading && (
          <div
            className="pcl-message"
            role="status"
          >
            <span className="pcl-spinner"/>

            진정서 목록을 불러오고 있어요.
          </div>
        )}

        {/* ====================================
            API 오류 및 401 로그인 안내
        ==================================== */}

        {error && (
          <section
            className="pcl-message pcl-error"
            role="alert"
          >
            <span className="pcl-message-icon">
              <Icon
                name={
                  error.auth
                    ? "lock"
                    : "alert"
                }
                size={25}
              />
            </span>

            <h3>
              {error.auth
                ? "로그인 확인이 필요해요"
                : "목록을 불러오지 못했어요"}
            </h3>

            <p>{error.message}</p>

            {error.auth && (
              <Link
                to="/login"
                className="pcl-main-button"
              >
                다시 로그인하기
              </Link>
            )}

            <button
              type="button"
              className="pcl-outline-button"
              onClick={() =>
                setReload((n) => n + 1)
              }
            >
              다시 불러오기
            </button>
          </section>
        )}

        {/* ====================================
            필터 및 실제 서버 목록
        ==================================== */}

        {!loading && !error && (
          <>
            <div
              className="pcl-filters"
              role="group"
              aria-label="진정서 상태별 보기"
            >
              {FILTERS.map(
                ({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      filter === key
                        ? "active"
                        : ""
                    }
                    aria-pressed={
                      filter === key
                    }
                    onClick={() =>
                      setFilter(key)
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {/* 조회된 데이터에 서버 페이지 정보가 있을 때만 이동 */}
            {visible.length === 0 ? (
              <section className="pcl-message pcl-empty">
                <span className="pcl-message-icon">
                  <Icon name="file" size={28}/>
                </span>

                <h3>
                  {filter === "ALL"
                    ? "아직 생성한 진정서가 없어요"
                    : "해당 상태의 진정서가 없어요"}
                </h3>

                <p>
                  {filter === "ALL"
                    ? "급여 비교를 마친 뒤 진정서 초안을 생성할 수 있어요."
                    : "다른 상태를 선택하거나 목록을 새로고침해 주세요."}
                </p>

                {filter === "ALL" && (
                  <Link
                    className="pcl-outline-button"
                    to="/salary"
                  >
                    <Icon
                      name="wallet"
                      size={17}
                    />
                    급여 비교하러 가기
                  </Link>
                )}
              </section>
            ) : (
              <div className="pcl-record-list">
                {visible.map(
                  (item, index) => (
                    <PetitionCard
                      key={
                        item.id ??
                        item.complaintId ??
                        `record-${index}`
                      }
                      item={item}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}

        {!loading && !error && pageInfo && (
          <div className="pcl-pagination" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, marginTop: 6,
          }}>
            <button
              className="pcl-outline-button"
              style={{ width: "auto", minHeight: 38 }}
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((v) => v - 1)}
            >이전</button>
            <span style={{ fontSize: 12 }}>
              {page}{Number.isSafeInteger(Number(pageInfo.totalPages))
                ? ` / ${pageInfo.totalPages}` : ""}
            </span>
            <button
              className="pcl-outline-button"
              style={{ width: "auto", minHeight: 38 }}
              type="button"
              disabled={
                pageInfo.hasNext !== true &&
                !(Number.isSafeInteger(Number(pageInfo.totalPages)) &&
                  Number(pageInfo.totalPages) > page)
              }
              onClick={() => setPage((v) => v + 1)}
            >다음</button>
          </div>
        )}

        {/* ====================================
            공식 진정 절차 안내
        ==================================== */}

        <section className="pcl-guidance">
          <Icon name="alert" size={18}/>

          <p>
            진정서는 참고용 초안이며 공식 기관에
            자동 제출되지 않습니다. 생성된 문서를
            검토하고 필요한 경우 노동청 등에
            별도로 접수해야 해요.
          </p>
        </section>

      </main>
    </div>
  );
}