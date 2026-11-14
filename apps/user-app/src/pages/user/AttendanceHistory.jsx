
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMonthlyAttendance, getWeeklyAttendance } from "../../api/attendance";
import { FeatureBadge, FeatureHeader, FeatureIcon, FeatureNotice, displayMinutes, errorText, unwrap } from "../../components/WorkerFeatureUI";

function localMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((v) => v.type === "year").value}-${parts.find((v) => v.type === "month").value}`;
}
function shiftMonth(value, direction) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + direction, 1)).toISOString().slice(0, 7);
}
function extractRecords(response) {
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.content)) return data.content;
  return null;
}
export default function AttendanceHistory() {
  const [month, setMonth] = useState(localMonth);
  const [mode, setMode] = useState("month");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const [year, monthNumber] = month.split("-").map(Number);
    const query = mode === "month" ? { month, year, page: 1, size: 40 } : { year, month: monthNumber };
    const fn = mode === "month" ? getMonthlyAttendance : getWeeklyAttendance;
    fn(query).then((response) => {
      if (!active) return;
      const found = extractRecords(response);
      if (!found) throw new Error("서버 근무기록 배열 형식을 확인해 주세요.");
      setRows(found);
    }).catch((e) => { if (active) { setRows([]); setError(errorText(e)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, mode, reload]);

  const [year, mm] = month.split("-").map(Number);
  const days = new Date(year, mm, 0).getDate();
  const offset = new Date(year, mm - 1, 1).getDay();
  const byDate = new Map(rows.map((row) => [row.workDate ?? row.date, row]));
  const statusText = { EDITED: "수정됨", ISSUE: "확인 필요", MISSING: "기록 누락", NORMAL: "정상", FINISHED: "완료" };
  return <div className="ef-page"><FeatureHeader title="기록된 시간" back="/home"/><main className="ef-content">
    <div className="ef-title"><p className="ef-eyebrow">WORK HISTORY</p><h1>나의 근무기록</h1><p>날짜를 선택해 출퇴근 시각과 인증 증거를 확인해요.</p></div>
    <div className="ef-segment"><button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>월별 기록</button><button className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>주간 기록</button></div>
    <section className="ef-card"><div className="ef-month-head"><button aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button><strong>{year}년 {mm}월</strong><button aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>›</button></div>{mode === "month" && <div className="ef-calendar"><div className="ef-weekdays">{["일", "월", "화", "수", "목", "금", "토"].map((d) => <span key={d}>{d}</span>)}</div><div className="ef-day-grid">{Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`}/>)}{Array.from({ length: days }, (_, i) => { const day = i + 1; const key = `${month}-${String(day).padStart(2, "0")}`; const row = byDate.get(key); const id = row?.recordId ?? row?.id; return id ? <Link key={key} className="has-record" to={`/attendance/${encodeURIComponent(id)}`}>{day}<i/></Link> : <span key={key}>{day}{row && <i className="ef-empty-dot"/>}</span>; })}</div></div>}</section>
    <div className="ef-section-title"><h2>{mode === "month" ? "이번 달 근무 내역" : "주간 근무 내역"}</h2><button type="button" onClick={() => setReload((n) => n + 1)}><FeatureIcon name="refresh" size={15}/> 새로고침</button></div>
    {loading && <FeatureNotice>근무기록을 조회하고 있습니다.</FeatureNotice>}
    {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
    {!loading && !error && rows.length === 0 && <div className="ef-card"><p className="ef-muted">해당 기간에 조회된 근무기록이 없습니다.</p></div>}
    {!loading && !error && rows.map((row, index) => { const id = row.recordId ?? row.id; const content = <><div><b>{row.workDate ?? row.date ?? "날짜 미확인"}</b><small>실근무 {displayMinutes(row.workedMinutes)}</small></div><FeatureBadge tone={row.status === "EDITED" || row.status === "ISSUE" || row.status === "MISSING" ? "warning" : "neutral"}>{statusText[row.status] ?? row.status ?? "기록"}</FeatureBadge>{id && <FeatureIcon name="chevron" size={16}/>}</>; return id ? <Link key={id} className="ef-list-row" to={`/attendance/${encodeURIComponent(id)}`}>{content}</Link> : <div key={`${row.date}-${index}`} className="ef-list-row">{content}</div>; })}
  </main></div>;
}
