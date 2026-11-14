import { useEffect, useState } from "react";
import { Link } from "react-router";
import useGeolocation from "../../hooks/useGeolocation";
import { getTodayAttendance } from "../../api/attendance";
import {
  FeatureBadge,
  FeatureButton,
  FeatureHeader,
  FeatureIcon,
  FeatureNotice,
  displayKst,
  displayMinutes,
  errorText,
  unwrap,
} from "../../components/WorkerFeatureUI";

const statusText = {
  NOT_STARTED: "미출근",
  WORKING: "근무 중",
  FINISHED: "퇴근 완료",
};

export default function Attendance() {
  const {
    location,
    loading: gpsLoading,
    error: gpsError,
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getTodayAttendance()
      .then((response) => {
        if (!active) return;
        setToday(unwrap(response));
      })
      .catch((err) => {
        if (!active) return;
        setToday(null);
        setError(errorText(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const status = today?.workStatus;
  const canClockIn =
    today?.hasWorkplace === true &&
    status === "NOT_STARTED" &&
    today?.nextAction === "CLOCK_IN";
  const canClockOut =
    status === "WORKING" && today?.nextAction === "CLOCK_OUT";

  async function checkGps() {
    try {
      await getCurrentLocation();
    } catch {
      // useGeolocation 오류 상태에 표시된다.
    }
  }

  return (
    <div className="ef-page">
      <FeatureHeader title="출퇴근 관리" back="/home" />
      <main className="ef-content">
        <div className="ef-title">
          <p className="ef-eyebrow">ATTENDANCE</p>
          <h1>오늘의 근무를 기록해요</h1>
          <p>현재 근무 상태와 GPS 위치를 확인한 후 출퇴근을 기록할 수 있어요.</p>
        </div>

        {loading && <FeatureNotice>근무 현황을 불러오는 중입니다.</FeatureNotice>}
        {error && <FeatureNotice tone="error">{error}</FeatureNotice>}

        <section className="ef-card">
          <div className="ef-section-title">
            <h2>오늘의 근무 상태</h2>
            <FeatureBadge tone={status === "FINISHED" ? "success" : status === "WORKING" ? "info" : "neutral"}>
              {statusText[status] ?? "상태 확인 필요"}
            </FeatureBadge>
          </div>
          <div className="ef-detail-list">
            <div>
              <FeatureIcon name="calendar" />
              <span><b>기록 날짜</b><small>{today?.workDate ?? "날짜 미제공"}</small></span>
            </div>
            <div>
              <FeatureIcon name="clock" />
              <span>
                <b>출근 · 퇴근</b>
                <small>{displayKst(today?.record?.clockInAt)} · {displayKst(today?.record?.clockOutAt)}</small>
              </span>
            </div>
            <div>
              <FeatureIcon name="check" />
              <span>
                <b>실근무 시간</b>
                <small>{displayMinutes(today?.record?.workedMinutes)}</small>
              </span>
            </div>
          </div>
          <FeatureButton disabled={loading} variant="secondary" onClick={() => setReload((v) => v + 1)}>
            <FeatureIcon name="refresh" size={17} /> 현황 다시 불러오기
          </FeatureButton>
        </section>

        <section className="ef-card">
          <div className="ef-section-title"><h2>출퇴근 인증</h2></div>
          {today?.hasWorkplace === false ? (
            <Link className="ef-button ef-button-primary" to="/workplace">
              근무장소 먼저 등록하기
            </Link>
          ) : canClockIn ? (
            <Link className="ef-button ef-button-primary" to="/attendance/capture/clock-in">
              <FeatureIcon name="camera" /> 출근 기록하기
            </Link>
          ) : canClockOut ? (
            <Link className="ef-button ef-button-primary" to="/attendance/capture/clock-out">
              <FeatureIcon name="camera" /> 퇴근 기록하기
            </Link>
          ) : status === "FINISHED" ? (
            <FeatureNotice tone="success">오늘의 출퇴근 기록을 마쳤어요.</FeatureNotice>
          ) : (
            <FeatureNotice>
              서버의 다음 출퇴근 동작을 확인할 수 없어요. 현황을 새로고침해 주세요.
            </FeatureNotice>
          )}
          <p className="ef-muted">
            GPS 인증과 사진 업로드는 다음 촬영 화면에서 서버 기준으로 검증됩니다.
          </p>
        </section>

        <section className="ef-card">
          <div className="ef-section-title"><h2>현재 GPS 확인</h2></div>
          <p className="ef-muted">
            기기의 현재 위치만 확인해요. 현재 위치를 가져온 것만으로
            사업장 출퇴근 인증이 완료되지는 않아요.
          </p>
          {gpsError && <FeatureNotice tone="error">{gpsError}</FeatureNotice>}
          {location && (
            <div className="ef-detail-list">
              <div><FeatureIcon name="pin"/><span><b>위도 / 경도</b><small>{location.latitude}, {location.longitude}</small></span></div>
              <div><FeatureIcon name="check"/><span><b>측정 정확도</b><small>약 {Number.isFinite(location.accuracy) ? Math.round(location.accuracy) : "미확인"}m</small></span></div>
              <div><FeatureIcon name="clock"/><span><b>측정 시각</b><small>{location.timestamp ? displayKst(location.timestamp, { dateStyle: "medium", timeStyle: "short" }) : "미제공"}</small></span></div>
            </div>
          )}
          <FeatureButton disabled={gpsLoading} variant="secondary" onClick={checkGps}>
            <FeatureIcon name="pin" size={17} /> {gpsLoading ? "위치 확인 중..." : "현재 위치 확인"}
          </FeatureButton>
          {location && (
            <FeatureButton disabled={gpsLoading} variant="secondary" onClick={resetLocation}>
              위치 초기화
            </FeatureButton>
          )}
        </section>

        <Link className="ef-list-row" to="/attendance/history">
          <FeatureIcon name="calendar" />
          <div><b>근무기록 목록</b><small>지난 근무·수정 이력 보기</small></div>
          <FeatureIcon name="chevron" size={16} />
        </Link>
      </main>
    </div>
  );
}