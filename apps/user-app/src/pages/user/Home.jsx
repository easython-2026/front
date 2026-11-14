
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { apiRequest } from "../../api/client";
import { getSalaryOverviewForMonth } from "../../api/salary";
import BrandLogo from "../../components/BrandLogo";

const labels = {
  NOT_STARTED: "미출근",
  WORKING: "근무 중",
  FINISHED: "퇴근 완료",
};

const consultationLabels = {
  RECEIVED: "접수 완료",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "기관 연계",
  CLOSED: "상담 종료",
};

function unwrap(value) {
  return value?.data ?? value;
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  return `${year}-${month}`;
}

function time(value) {
  if (!value) return "기록 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "확인 불가";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function minutes(value) {
  if (
    value == null ||
    !Number.isFinite(Number(value))
  ) {
    return "입력 없음";
  }

  const n = Math.max(0, Number(value));

  return `${Math.floor(n / 60)}시간 ${Math.floor(n % 60)}분`;
}

function money(value) {
  if (
    value == null ||
    !Number.isFinite(Number(value))
  ) {
    return "미제공";
  }

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function errorMessage(error) {
  return error?.status === 401
    ? "로그인이 필요합니다."
    : error?.message ?? "정보를 불러오지 못했습니다.";
}

// ============================================
// 홈 화면 아이콘
// ============================================

function Icon({ name, size = 20 }) {
  const symbols = {
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    camera: (
      <>
        <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),

    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),

    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h4M9 12h6M9 16h6" />
      </>
    ),

    chevron: (
      <path d="m9 5 7 7-7 7" />
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
        <path d="M10 20h4" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9M5.6 15a7 7 0 0 0 11.9 2.5L20 15" />
      </>
    ),
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
      {symbols[name]}
    </svg>
  );
}

// ============================================
// 홈 공통 카드
// ============================================

function Panel({
  title,
  subtitle,
  children,
  to,
}) {
  return (
    <section className="eth-home-panel">
      <div className="eth-panel-heading">
        <div>
          {subtitle && <p>{subtitle}</p>}
          <h2>{title}</h2>
        </div>

        {to && (
          <Link to={to}>
            자세히
            <Icon name="chevron" size={14} />
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}

// ============================================
// 홈 화면
// ============================================

export default function Home() {
  const month = currentMonth();

  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // ==========================================
  // 기존 홈 API 요청 유지
  // ==========================================

  useEffect(() => {
    let active = true;

    const controller = new AbortController();

    const requests = {
      user: () =>
        apiRequest("user", "getMe", {
          signal: controller.signal,
        }),

      attendance: () =>
        apiRequest("attendance", "getToday", {
          signal: controller.signal,
        }),

      salary: () =>
        getSalaryOverviewForMonth(month, {
          signal: controller.signal,
        }),

      contracts: () =>
        apiRequest("contract", "getList", {
          query: { page: 1, size: 5 },
          signal: controller.signal,
        }),

      consultations: () =>
        apiRequest("consultation", "getList", {
          query: { page: 1, size: 5 },
          signal: controller.signal,
        }),

      notifications: () =>
        apiRequest("notification", "getList", {
          query: { page: 1, size: 5 },
          signal: controller.signal,
        }),
    };

    async function load() {
      const entries = Object.entries(requests);

      const results = await Promise.allSettled(
        entries.map(([, call]) => call())
      );

      if (!active) return;

      const nextData = {};
      const nextErrors = {};

      results.forEach((result, index) => {
        const key = entries[index][0];

        if (result.status === "fulfilled") {
          nextData[key] = unwrap(result.value);
        } else {
          nextErrors[key] = errorMessage(
            result.reason
          );
        }
      });

      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [month, reloadKey]);

  // ==========================================
  // 출퇴근 상태
  // ==========================================

  const today = data.attendance;
  const workStatus = today?.workStatus;

  const canIn =
    today?.hasWorkplace === true &&
    workStatus === "NOT_STARTED" &&
    today?.nextAction === "CLOCK_IN";

  const canOut =
    workStatus === "WORKING" &&
    today?.nextAction === "CLOCK_OUT";

  const inProgress = workStatus === "WORKING";
  const done = workStatus === "FINISHED";

  // ==========================================
  // 계약서 / 상담 / 급여 / 알림
  // ==========================================

  const contract = Array.isArray(
    data.contracts?.contracts
  )
    ? data.contracts.contracts[0]
    : null;

  const consultation = Array.isArray(
    data.consultations?.consultations
  )
    ? data.consultations.consultations[0]
    : null;

  const salary = data.salary;
  const comparison = salary?.comparison;

  const notifications = Array.isArray(
    data.notifications?.notifications
  )
    ? data.notifications.notifications
    : [];

  const unreadCount =
    data.notifications?.unreadCount;

  const todayLabel =
    today?.workDate ??
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      dateStyle: "full",
    }).format(new Date());

  return (
    <div className="eth-home">

      {/* ====================================
          상단바 — 수정된 로고 적용
      ==================================== */}

      <header
        className="eth-topbar"
        aria-label="일한만큼 홈 상단바"
      >
        {/* 왼쪽: 심볼 SVG + 글자 SVG */}
        <BrandLogo size="header" />

        {/* 오른쪽: 기존 알림 버튼 유지 */}
        <Link
          to="/notifications"
          className="eth-top-bell"
          aria-label="알림 확인"
        >
          <Icon name="bell" />

          {typeof unreadCount === "number" &&
            unreadCount > 0 && (
              <em>
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </em>
            )}
        </Link>
      </header>

      <main className="eth-mobile-content">

        {/* ====================================
            환영 메시지
        ==================================== */}

        <section className="eth-welcome">
          <p>{todayLabel}</p>

          <h1>
            {inProgress
              ? "지금 근무 중이에요"
              : done
              ? "오늘 기록을 완료했어요"
              : "오늘도 안전하게\n기록을 시작해요"}
          </h1>

          {data.user?.name && (
            <span>
              {data.user.name}님,
              반갑습니다.
            </span>
          )}
        </section>

        {loading && (
          <p
            role="status"
            className="eth-info-message"
          >
            홈 정보를 불러오는 중...
          </p>
        )}

        {/* ====================================
            출퇴근 카드
        ==================================== */}

        <section
          className={`eth-clock-card ${
            done ? "eth-clock-complete" : ""
          }`}
        >
          <div className="eth-clock-ring">
            <div>
              <Icon
                name={done ? "check" : "clock"}
                size={31}
              />

              <b>
                {inProgress
                  ? time(today?.record?.clockInAt)
                  : done
                  ? time(today?.record?.clockOutAt)
                  : "--:--"}
              </b>

              <span>
                {labels[workStatus] ??
                  "상태 확인 중"}
              </span>
            </div>
          </div>

          {/* 기록할 수 있는 상태에 따라 버튼 변경 */}

          {errors.attendance ? (
            <p
              role="alert"
              className="eth-error"
            >
              {errors.attendance}
            </p>
          ) : today?.hasWorkplace === false ? (
            <Link
              className="eth-primary-btn"
              to="/workplace"
            >
              근무장소 먼저 등록하기
            </Link>
          ) : canIn ? (
            <Link
              className="eth-primary-btn"
              to="/attendance/capture/clock-in"
            >
              <Icon name="camera" />
              출근 기록하기
            </Link>
          ) : canOut ? (
            <Link
              className="eth-primary-btn"
              to="/attendance/capture/clock-out"
            >
              <Icon name="camera" />
              퇴근 기록하기
            </Link>
          ) : done ? (
            <div className="eth-complete-line">
              <Icon name="check" />
              오늘의 출퇴근 기록 완료
            </div>
          ) : (
            <Link
              className="eth-secondary-btn"
              to="/attendance"
            >
              출퇴근 상태 확인하기
            </Link>
          )}

          <p className="eth-privacy-note">
            <Icon name="shield" size={15} />
            GPS 인증 성공 후에만 사진을
            촬영할 수 있어요.
          </p>
        </section>

        {/* ====================================
            오늘 근무 현황
        ==================================== */}

        <Panel
          title="기록된 시간"
          subtitle="오늘 근무 현황"
          to="/attendance/history"
        >
          <div className="eth-time-grid">
            <div>
              <span>출근</span>

              <b>
                {time(
                  today?.record?.clockInAt
                )}
              </b>
            </div>

            <div>
              <span>퇴근</span>

              <b>
                {time(
                  today?.record?.clockOutAt
                )}
              </b>
            </div>

            <div>
              <span>휴게</span>

              <b>
                {minutes(
                  today?.record?.breakMinutes
                )}
              </b>
            </div>

            <div>
              <span>실근무</span>

              <b>
                {minutes(
                  today?.record?.workedMinutes
                )}
              </b>
            </div>
          </div>
        </Panel>

        {/* ====================================
            근로계약서 바로가기
        ==================================== */}

        <Link
          to="/contracts"
          className="eth-contract-banner"
        >
          <span className="eth-icon-box">
            <Icon name="file" />
          </span>

          <span>
            <b>근로계약서 확인</b>

            <small>
              {errors.contracts
                ? errors.contracts
                : contract
                ? `${
                    contract.employerName ??
                    "사업장 미확인"
                  } · ${
                    contract.confirmed
                      ? "확정 완료"
                      : "확정 필요"
                  }`
                : "원문과 번역을 함께 살펴보세요"}
            </small>
          </span>

          <Icon name="chevron" />
        </Link>

        {/* ====================================
            이번 달 급여 비교
        ==================================== */}

        <Panel
          title="이번 달 급여 비교"
          subtitle={month}
          to="/salary"
        >
          {errors.salary ? (
            <p
              role="alert"
              className="eth-error"
            >
              {errors.salary}
            </p>
          ) : salary?.status === "COMPARED" ? (
            <div className="eth-salary-grid">
              <div>
                <span>예상 임금</span>

                <strong>
                  {money(
                    comparison?.expectedAmount
                  )}
                </strong>
              </div>

              <div>
                <span>실제 지급</span>

                <strong>
                  {money(
                    comparison?.actualAmount
                  )}
                </strong>
              </div>

              <div className="eth-salary-diff">
                <span>차이 금액</span>

                <strong>
                  {money(
                    comparison?.differenceAmount
                  )}
                </strong>
              </div>
            </div>
          ) : (
            <p className="eth-muted">
              {salary?.status === "READY"
                ? "급여정보가 준비되었어요. 비교를 실행해 보세요."
                : salary?.status ===
                  "NOT_SUBMITTED"
                ? "급여명세서 또는 실제 수령액을 등록해 주세요."
                : "급여 정보를 확인해 주세요."}
            </p>
          )}

          {comparison?.id &&
            salary?.status === "COMPARED" && (
              <Link
                className="eth-inline-link"
                to={`/salary/${encodeURIComponent(
                  comparison.id
                )}`}
              >
                비교 결과 상세 보기 →
              </Link>
            )}
        </Panel>

        {/* ====================================
            상담 현황
        ==================================== */}

        <Panel
          title="상담 현황"
          subtitle="기관 연결"
          to="/consultations"
        >
          {errors.consultations ? (
            <p
              role="alert"
              className="eth-error"
            >
              {errors.consultations}
            </p>
          ) : consultation ? (
            <div className="eth-consult">
              <strong>
                {consultation.agencyName ??
                  "상담기관"}
              </strong>

              <span className="eth-status-pill">
                {consultationLabels[
                  consultation.status
                ] ??
                  consultation.status ??
                  "미확인"}
              </span>

              <p>
                읽지 않은 메시지{" "}
                {consultation.unreadMessages ??
                  0}
                개
              </p>

              {consultation.id && (
                <Link
                  to={`/consultations/${encodeURIComponent(
                    consultation.id
                  )}`}
                >
                  상담 상세 보기 →
                </Link>
              )}
            </div>
          ) : (
            <p className="eth-muted">
              신청한 상담이 없어요.
            </p>
          )}
        </Panel>

        {/* ====================================
            최근 알림
        ==================================== */}

        <Panel
          title="최근 알림"
          subtitle={
            typeof unreadCount === "number"
              ? `읽지 않은 알림 ${unreadCount}개`
              : "내 알림"
          }
          to="/notifications"
        >
          {errors.notifications ? (
            <p
              role="alert"
              className="eth-error"
            >
              {errors.notifications}
            </p>
          ) : notifications.length ? (
            notifications.slice(0, 3).map(
              (item) => (
                <Link
                  key={item.id}
                  className="eth-notice"
                  to="/notifications"
                >
                  <strong>
                    {item.title ?? "알림"}
                  </strong>

                  <span>
                    {item.body ?? ""}
                  </span>
                </Link>
              )
            )
          ) : (
            <p className="eth-muted">
              새로운 알림이 없어요.
            </p>
          )}
        </Panel>

        {/* ====================================
            빠른 이동 버튼
        ==================================== */}

        <div className="eth-quick-links">
          <Link to="/reports">
            월별 리포트
          </Link>

          <Link to="/petitions">
            진정서
          </Link>

          <Link to="/profile/consents">
            개인정보 관리
          </Link>
        </div>

        {/* ====================================
            홈 데이터 새로고침
        ==================================== */}

        <button
          type="button"
          className="eth-refresh"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setReloadKey(
              (value) => value + 1
            );
          }}
        >
          <Icon
            name="refresh"
            size={17}
          />

          {loading
            ? "새로고침 중"
            : "정보 새로고침"}
        </button>
      </main>
    </div>
  );
}