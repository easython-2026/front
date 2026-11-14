
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

const WORK_LABELS = {
  NOT_STARTED: "미출근",
  WORKING: "근무 중",
  FINISHED: "퇴근 완료",
};

const CONSULTATION_LABELS = {
  RECEIVED: "접수 완료",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "추가 자료 요청",
  REFERRED: "기관 연계",
  CLOSED: "상담 종료",
};

function currentMonth() {
  // 서버의 급여 귀속 월과 맞추기 위해 한국 시간 사용
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function unwrap(response) {
  return response?.data ?? response;
}

function money(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "미제공";
  }

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function formatTime(value) {
  if (!value) return "기록 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "시간 확인 불가";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMinutes(value) {
  if (value == null) return "미제공";

  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "미제공";
  }

  const hours = Math.floor(minutes / 60);
  const remaining = Math.floor(minutes % 60);

  return `${hours}시간 ${remaining}분`;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  return error?.message ?? "정보를 불러오지 못했습니다.";
}

function DashboardCard({ title, children, to, linkText }) {
  return (
    <section
      style={{
        padding: 20,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
      }}
    >
      <h2 style={{
        fontSize: 19,
        marginTop: 0,
      }}>
        {title}
      </h2>

      {children}

      {to && (
        <p style={{ marginBottom: 0, marginTop: 16 }}>
          <Link to={to}>
            {linkText ?? "자세히 보기"}
          </Link>
        </p>
      )}
    </section>
  );
}

export default function Home() {
  const month = currentMonth();

  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

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
        apiRequest("salary", "getOverview", {
          query: { month },
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

    async function loadDashboard() {
      const entries = Object.entries(requests);

      try {
        const results = await Promise.allSettled(
          entries.map(([, request]) => request())
        );

        if (!active) return;

        const nextData = {};
        const nextErrors = {};

        results.forEach((result, index) => {
          const key = entries[index][0];

          if (result.status === "fulfilled") {
            nextData[key] = unwrap(result.value);
          } else {
            nextErrors[key] = getErrorMessage(
              result.reason
            );
          }
        });

        setData(nextData);
        setErrors(nextErrors);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
      controller.abort();
    };
  }, [month, reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((previous) => previous + 1);
  }

  const user = data.user;
  const today = data.attendance;
  const salary = data.salary;

  const contracts = Array.isArray(data.contracts?.contracts)
    ? data.contracts.contracts
    : [];

  const consultations = Array.isArray(
    data.consultations?.consultations
  )
    ? data.consultations.consultations
    : [];

  const notifications = Array.isArray(
    data.notifications?.notifications
  )
    ? data.notifications.notifications
    : [];

  const latestContract = contracts[0] ?? null;
  const latestConsultation = consultations[0] ?? null;

  const unreadCount = data.notifications?.unreadCount;
  const workStatus = today?.workStatus;
  const nextAction = today?.nextAction;

  const canClockIn =
    today?.hasWorkplace === true &&
    workStatus === "NOT_STARTED" &&
    nextAction === "CLOCK_IN";

  const canClockOut =
    workStatus === "WORKING" &&
    nextAction === "CLOCK_OUT";

  const comparison = salary?.comparison;

  return (
    <main
      style={{
        maxWidth: 850,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>
            안녕하세요
            {user?.name ? `, ${user.name}님` : ""}!
          </h1>

          <p style={{
            marginTop: 0,
            color: "#666",
          }}>
            오늘의 근무와 급여 정보를 확인해 보세요.
          </p>
        </div>

        <Link to="/notifications">
          알림
          {typeof unreadCount === "number" &&
            unreadCount > 0 &&
            ` (${unreadCount})`}
        </Link>
      </header>

      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        style={{ marginBottom: 24 }}
      >
        {loading ? "새로고침 중..." : "전체 새로고침"}
      </button>

      {loading && (
        <p role="status">
          홈 정보를 불러오는 중...
        </p>
      )}

      {errors.user && (
        <p role="alert">
          사용자 정보: {errors.user}
        </p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      }}>
        {/* 오늘 출퇴근 */}
        <DashboardCard
          title="오늘의 출퇴근"
          to="/attendance/history"
          linkText="근무기록 보기"
        >
          {errors.attendance ? (
            <p role="alert">{errors.attendance}</p>
          ) : today ? (
            <>
              <p>
                근무일: {today.workDate ?? "미확인"}
              </p>

              <p>
                상태:{" "}
                <strong>
                  {WORK_LABELS[workStatus] ??
                    workStatus ??
                    "미확인"}
                </strong>
              </p>

              <p>
                출근 시각:{" "}
                {formatTime(today.record?.clockInAt)}
              </p>

              <p>
                퇴근 시각:{" "}
                {formatTime(today.record?.clockOutAt)}
              </p>

              <p>
                실근무시간:{" "}
                {formatMinutes(
                  today.record?.workedMinutes
                )}
              </p>

              {today.hasWorkplace === false && (
                <div>
                  <p>
                    근무장소를 등록해야 GPS 출근
                    인증을 진행할 수 있습니다.
                  </p>

                  <Link to="/workplace">
                    근무장소 등록하기
                  </Link>
                </div>
              )}

              {canClockIn && (
                <p>
                  <Link to="/attendance/capture/CLOCK_IN">
                    출근 인증 시작
                  </Link>
                </p>
              )}

              {canClockOut && (
                <p>
                  <Link to="/attendance/capture/CLOCK_OUT">
                    퇴근 인증 시작
                  </Link>
                </p>
              )}

              {workStatus === "FINISHED" && (
                <p>
                  오늘의 출퇴근 기록이 완료되었습니다.
                </p>
              )}

              {!canClockIn &&
                !canClockOut &&
                workStatus !== "FINISHED" &&
                today.hasWorkplace !== false && (
                  <p>
                    현재 출퇴근 가능 상태를 확인해 주세요.
                  </p>
                )}
            </>
          ) : (
            <p>출퇴근 정보를 조회 중입니다.</p>
          )}
        </DashboardCard>

        {/* 급여 */}
        <DashboardCard
          title={`${month} 급여`}
          to="/salary"
          linkText="급여 관리로 이동"
        >
          {errors.salary ? (
            <p role="alert">{errors.salary}</p>
          ) : salary ? (
            <>
              {salary.status === "NOT_SUBMITTED" && (
                <p>
                  이번 달 급여명세서 또는
                  실제 수령액이 아직 등록되지 않았습니다.
                </p>
              )}

              {salary.status === "READY" && (
                <p>
                  급여정보가 준비되었습니다.
                  임금 비교를 실행해 보세요.
                </p>
              )}

              {salary.status === "COMPARED" && (
                <>
                  <p>
                    예상 임금:{" "}
                    {money(comparison?.expectedAmount)}
                  </p>

                  <p>
                    실제 지급액:{" "}
                    {money(comparison?.actualAmount)}
                  </p>

                  <p>
                    차이 금액:{" "}
                    {money(comparison?.differenceAmount)}
                  </p>

                  {comparison?.id && (
                    <Link
                      to={`/salary/${encodeURIComponent(
                        comparison.id
                      )}`}
                    >
                      비교 결과 상세 보기
                    </Link>
                  )}
                </>
              )}

              {![
                "NOT_SUBMITTED",
                "READY",
                "COMPARED",
              ].includes(salary.status) && (
                <p>
                  급여 상태: {salary.status ?? "미확인"}
                </p>
              )}
            </>
          ) : (
            <p>급여 정보를 조회 중입니다.</p>
          )}
        </DashboardCard>

        {/* 근로계약서 */}
        <DashboardCard
          title="근로계약서"
          to="/contracts"
          linkText="계약서 목록 보기"
        >
          {errors.contracts ? (
            <p role="alert">{errors.contracts}</p>
          ) : latestContract ? (
            <>
              <p>
                최근 계약서:{" "}
                {latestContract.employerName ??
                  "사업장명 미확인"}
              </p>

              <p>
                분석 상태:{" "}
                {latestContract.status ?? "미확인"}
              </p>

              <p>
                사용자 확정:{" "}
                {latestContract.confirmed
                  ? "확정 완료"
                  : "확정 필요"}
              </p>

              {latestContract.checkCount != null && (
                <p>
                  확인 필요 항목:{" "}
                  {latestContract.checkCount}개
                </p>
              )}

              {latestContract.id && (
                <Link
                  to={`/contracts/${encodeURIComponent(
                    latestContract.id
                  )}`}
                >
                  최근 계약서 상세 보기
                </Link>
              )}
            </>
          ) : (
            <p>등록된 근로계약서가 없습니다.</p>
          )}
        </DashboardCard>

        {/* 상담 */}
        <DashboardCard
          title="상담 현황"
          to="/consultations"
          linkText="전체 상담 보기"
        >
          {errors.consultations ? (
            <p role="alert">{errors.consultations}</p>
          ) : latestConsultation ? (
            <>
              <p>
                상담기관:{" "}
                {latestConsultation.agencyName ??
                  "기관명 미확인"}
              </p>

              <p>
                진행 상태:{" "}
                {CONSULTATION_LABELS[
                  latestConsultation.status
                ] ??
                  latestConsultation.status ??
                  "미확인"}
              </p>

              <p>
                읽지 않은 메시지:{" "}
                {latestConsultation.unreadMessages ?? 0}개
              </p>

              <p>
                정보 공유:{" "}
                {latestConsultation.shared
                  ? "공유 중"
                  : "공유되지 않음"}
              </p>

              {latestConsultation.id && (
                <Link
                  to={`/consultations/${encodeURIComponent(
                    latestConsultation.id
                  )}`}
                >
                  상담 상세 보기
                </Link>
              )}
            </>
          ) : (
            <p>진행한 상담이 없습니다.</p>
          )}
        </DashboardCard>
      </div>

      {/* 최근 알림 */}
      <section style={{ marginTop: 28 }}>
        <h2>최근 알림</h2>

        {errors.notifications && (
          <p role="alert">
            {errors.notifications}
          </p>
        )}

        {!errors.notifications &&
          notifications.length === 0 && (
            <p>최근 알림이 없습니다.</p>
          )}

        {!errors.notifications &&
          notifications.map((item) => (
            <article
              key={item.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #ddd",
              }}
            >
              <strong>
                {item.title ?? "알림"}
              </strong>

              <p>{item.body ?? ""}</p>

              <small>
                {item.read ? "읽음" : "읽지 않음"}
              </small>
            </article>
          ))}

        <p>
          <Link to="/notifications">
            전체 알림 확인하기
          </Link>
        </p>
      </section>

      {/* 빠른 메뉴 */}
      <section style={{ marginTop: 28 }}>
        <h2>빠른 메뉴</h2>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <Link to="/attendance/history">
            근무기록
          </Link>

          <Link to="/salary">
            급여 비교
          </Link>

          <Link to="/reports">
            월별 리포트
          </Link>

          <Link to="/evidences">
            증거 관리
          </Link>

          <Link to="/petitions">
            진정서
          </Link>

          <Link to="/consultations">
            상담
          </Link>

          <Link to="/profile">
            내 정보
          </Link>
        </div>
      </section>
    </main>
  );
}
