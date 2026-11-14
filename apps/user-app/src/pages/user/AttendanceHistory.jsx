
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { apiRequest } from "../../api/client";

// ========================================
// 날짜 관련 함수
// ========================================
function getCurrentMonth() {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

function moveMonth(year, month, amount) {
  const date = new Date(
    year,
    month - 1 + amount,
    1
  );

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function formatMonth(year, month) {
  return `${year}년 ${month}월`;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return (
      "로그인 인증이 필요합니다. " +
      "프론트엔드 로그인 검사를 생략해도 " +
      "백엔드 인증은 별도로 적용됩니다."
    );
  }

  return error instanceof Error
    ? error.message
    : "근무기록을 불러오지 못했습니다.";
}

// ========================================
// 근무기록 조회 페이지
// ========================================
export default function AttendanceHistory() {
  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth);

  const [viewType, setViewType] =
    useState("monthly");

  const [attendanceData, setAttendanceData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const { year, month } = selectedMonth;

  // ========================================
  // 서버 조회
  // ========================================
  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      // 조회 조건 변경 시 기존 결과 제거
      // 실제 데이터 조회는 아래 비동기 요청에서 처리
      try {
        const response = await apiRequest(
          "attendance",
          viewType === "monthly"
            ? "getMonthly"
            : "getWeekly",
          {
            query: {
              year,
              month,
            },
          }
        );

        if (!active) return;

        setAttendanceData(response);
      } catch (err) {
        if (!active) return;

        setError(getErrorMessage(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      active = false;
    };
  }, [year, month, viewType]);

  // ========================================
  // 조회 조건 변경
  // ========================================
  function changeMonth(amount) {
    setLoading(true);
    setAttendanceData(null);
    setError("");

    setSelectedMonth((previous) =>
      moveMonth(
        previous.year,
        previous.month,
        amount
      )
    );
  }

  function changeViewType(nextType) {
    if (nextType === viewType) return;

    setLoading(true);
    setAttendanceData(null);
    setError("");
    setViewType(nextType);
  }

  // ========================================
  // 화면
  // ========================================
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1>근무기록 조회</h1>

      <p>
        월별 또는 주별 근무기록을
        확인할 수 있습니다.
      </p>

      {/* 1. 조회 유형 */}
      <section style={{ marginBottom: 24 }}>
        <h2>1. 조회 유형</h2>

        <button
          type="button"
          onClick={() =>
            changeViewType("monthly")
          }
          disabled={loading}
          aria-pressed={viewType === "monthly"}
        >
          월별 기록
        </button>

        <button
          type="button"
          onClick={() =>
            changeViewType("weekly")
          }
          disabled={loading}
          aria-pressed={viewType === "weekly"}
          style={{ marginLeft: 8 }}
        >
          주별 기록
        </button>
      </section>

      {/* 2. 조회 기간 */}
      <section style={{ marginBottom: 24 }}>
        <h2>2. 조회 기간</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={loading}
          >
            이전 달
          </button>

          <strong>
            {formatMonth(year, month)}
          </strong>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={loading}
          >
            다음 달
          </button>
        </div>

        <p style={{ fontSize: 13 }}>
          주별 조회의 정확한 주간 선택 방식은
          백엔드 요청 명세 확인 후 적용합니다.
        </p>
      </section>

      {/* 3. 근무기록 결과 */}
      <section style={{ marginBottom: 32 }}>
        <h2>3. 근무기록 결과</h2>

        <p>
          조회 유형:{" "}
          {viewType === "monthly"
            ? "월별"
            : "주별"}
        </p>

        <p>
          기준 월: {formatMonth(year, month)}
        </p>

        {loading && (
          <p role="status">
            근무기록을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p
            role="alert"
            style={{ color: "red" }}
          >
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          attendanceData === null && (
            <p>조회된 데이터가 없습니다.</p>
          )}

        {!loading &&
          !error &&
          attendanceData !== null && (
            <div>
              <h3>백엔드 응답 데이터</h3>

              <pre
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: "#f5f5f5",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {JSON.stringify(
                  attendanceData,
                  null,
                  2
                )}
              </pre>
            </div>
          )}
      </section>

      {/* 4. 페이지 이동 */}
      <section>
        <h2>4. 메뉴</h2>

        <p>
          <Link to="/attendance">
            출퇴근 관리로 돌아가기
          </Link>
        </p>

        <p>
          <Link to="/home">
            홈으로 이동
          </Link>
        </p>
      </section>
    </main>
  );
}
