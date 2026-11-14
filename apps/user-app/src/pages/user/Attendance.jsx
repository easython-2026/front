
import { useEffect, useState } from "react";
import { Link } from "react-router";

import useGeolocation from "../../hooks/useGeolocation";
import { getTodayAttendance } from "../../api/attendance";

export default function Attendance() {
  // ========================================
  // GPS 위치 관리
  // ========================================
  const {
    location,
    loading: gpsLoading,
    error: gpsError,
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  // ========================================
  // 오늘 근무 현황 상태
  // ========================================
  const [todayData, setTodayData] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState("");

  // ========================================
  // 최초 접속 시 오늘 근무 현황 조회
  // ========================================
  useEffect(() => {
    let active = true;

    async function loadInitialToday() {
      try {
        const response = await getTodayAttendance();

        if (active) {
          setTodayData(response);
          setTodayError("");
        }
      } catch (err) {
        if (active) {
          setTodayError(
            err instanceof Error
              ? err.message
              : "오늘 근무 현황을 불러오지 못했습니다."
          );
        }
      } finally {
        if (active) {
          setTodayLoading(false);
        }
      }
    }

    loadInitialToday();

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // 근무 현황 새로고침
  // ========================================
  async function handleRefreshToday() {
    if (todayLoading) return;

    setTodayLoading(true);
    setTodayError("");

    try {
      const response = await getTodayAttendance();

      setTodayData(response);
    } catch (err) {
      setTodayError(
        err instanceof Error
          ? err.message
          : "오늘 근무 현황을 불러오지 못했습니다."
      );
    } finally {
      setTodayLoading(false);
    }
  }

  // ========================================
  // GPS 위치 확인
  // ========================================
  async function handleGpsCheck() {
    try {
      await getCurrentLocation();
    } catch {
      // 오류 메시지는 useGeolocation에서 관리
    }
  }

  // ========================================
  // 화면
  // ========================================
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h1>출퇴근 관리</h1>

      <p>
        오늘의 근무 현황을 조회하고,
        GPS 위치를 확인할 수 있습니다.
      </p>

      {/* =====================================
          1. 오늘 근무 현황
      ===================================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>1. 오늘 근무 현황</h2>

        <button
          type="button"
          onClick={handleRefreshToday}
          disabled={todayLoading}
        >
          {todayLoading
            ? "근무 현황 조회 중..."
            : "근무 현황 새로고침"}
        </button>

        {todayError && (
          <p role="alert" style={{ color: "red" }}>
            {todayError}
          </p>
        )}

        {todayData !== null && (
          <div style={{ marginTop: 16 }}>
            <h3>서버 응답 데이터</h3>

            <pre
              style={{
                padding: 12,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {JSON.stringify(todayData, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* =====================================
          2. GPS 현재 위치 확인
      ===================================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>2. GPS 위치 확인</h2>

        <p>
          브라우저에서 현재 위치를 가져옵니다.
          실제 사업장 위치 인증은
          백엔드 API에서 처리합니다.
        </p>

        <button
          type="button"
          onClick={handleGpsCheck}
          disabled={gpsLoading}
        >
          {gpsLoading
            ? "현재 위치 확인 중..."
            : "현재 위치 확인"}
        </button>

        <button
          type="button"
          onClick={resetLocation}
          disabled={gpsLoading}
          style={{ marginLeft: 8 }}
        >
          위치 초기화
        </button>

        {gpsError && (
          <p role="alert" style={{ color: "red" }}>
            {gpsError}
          </p>
        )}

        {location && (
          <div style={{ marginTop: 16 }}>
            <h3>GPS 좌표 획득 성공</h3>

            <p>
              <strong>위도:</strong>{" "}
              {location.latitude}
            </p>

            <p>
              <strong>경도:</strong>{" "}
              {location.longitude}
            </p>

            <p>
              <strong>정확도:</strong>{" "}
              약 {Math.round(location.accuracy)}m
            </p>

            <p>
              <strong>측정 시각:</strong>{" "}
              {new Date(
                location.timestamp
              ).toLocaleString()}
            </p>

            <p>
              현재 위치를 가져왔습니다.
              아직 사업장 GPS 인증이 완료된 것은 아닙니다.
            </p>
          </div>
        )}
      </section>

      {/* =====================================
          3. 출퇴근 기록 및 사진 촬영 이동
      ===================================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>3. 출퇴근 기록</h2>

        <p>
          출근 또는 퇴근을 선택하면
          GPS 확인 및 현장 사진 촬영 페이지로 이동합니다.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
          }}
        >
          <Link to="/attendance/capture/clock-in">
            출근하기
          </Link>

          <Link to="/attendance/capture/clock-out">
            퇴근하기
          </Link>
        </div>

        <p style={{ marginTop: 16 }}>
          ※ 실제 출퇴근 기록 API는
          GPS 인증 및 사진 업로드 명세 확인 후 연결합니다.
        </p>
      </section>

      {/* =====================================
          4. 이동 메뉴
      ===================================== */}
      <section>
        <h2>4. 근무기록 관리</h2>

        <p>
          <Link to="/attendance/history">
            월간 근무기록 조회
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
