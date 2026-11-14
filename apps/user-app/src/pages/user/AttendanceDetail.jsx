
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAttendanceRecord, updateAttendanceRecord, updateBreakTime } from "../../api/attendance";
import { FeatureBadge, FeatureButton, FeatureHeader, FeatureIcon, FeatureNotice, displayKst, displayMinutes, errorText, unwrap } from "../../components/WorkerFeatureUI";

function hhmm(value) {
  return value ? displayKst(value).replace(/\s/g, "") : "";
}
function asKstIso(workDate, time) {
  return `${workDate}T${time}:00+09:00`;
}
function readPhotos(record) {
  return [
    { title: "출근 인증 사진", src: record.clockInPhotoUrl ?? record.clockIn?.photoUrl ?? record.evidence?.clockInPhotoUrl, status: record.clockInGpsVerified ?? record.clockIn?.gpsVerified },
    { title: "퇴근 인증 사진", src: record.clockOutPhotoUrl ?? record.clockOut?.photoUrl ?? record.evidence?.clockOutPhotoUrl, status: record.clockOutGpsVerified ?? record.clockOut?.gpsVerified },
  ];
}
function isValidTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function toMinute(value) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }

export default function AttendanceDetail() {
  const { recordId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ start: "", end: "", breakMinutes: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = unwrap(await getAttendanceRecord(recordId));
      const item = data?.record ?? data;
      if (!item || typeof item !== "object") throw new Error("근무기록 응답이 비어 있습니다.");
      setRecord(item);
      setForm({ start: hhmm(item.clockInAt), end: hhmm(item.clockOutAt), breakMinutes: item.breakMinutes == null ? "" : String(item.breakMinutes), reason: "" });
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }, [recordId]);

  useEffect(() => { load(); }, [load]);

  const date = record?.workDate ?? (record?.clockInAt && displayKst(record.clockInAt, { year: "numeric", month: "2-digit", day: "2-digit" })) ?? "근무일 미확인";
  const revisions = record?.revisions ?? record?.editHistory ?? record?.modifications ?? [];
  const photos = record ? readPhotos(record) : [];
  const edited = Boolean(record?.edited || record?.isEdited || (Array.isArray(revisions) && revisions.length));
  const breakValue = record?.breakMinutes;
  const actualMinutes = record?.workedMinutes ?? (record?.clockInAt && record?.clockOutAt ? Math.max(0, Math.floor((new Date(record.clockOutAt) - new Date(record.clockInAt)) / 60000) - (Number(breakValue) || 0)) : null);
  const timeChanged = record && (form.start !== hhmm(record.clockInAt) || form.end !== hhmm(record.clockOutAt));
  const breakChanged = record && form.breakMinutes !== (record.breakMinutes == null ? "" : String(record.breakMinutes));
  const breakNumber = Number(form.breakMinutes);
  const validForm = record && (!timeChanged || (isValidTime(form.start) && isValidTime(form.end) && toMinute(form.end) > toMinute(form.start))) && (!breakChanged || (form.breakMinutes.trim() !== "" && Number.isInteger(breakNumber) && breakNumber >= 0)) && (!timeChanged || !breakChanged || breakNumber < toMinute(form.end) - toMinute(form.start)) && form.reason.trim();

  async function save() {
    if (!validForm || saving) return;
    if (timeChanged && (!/^\d{4}-\d{2}-\d{2}$/.test(record.workDate ?? ""))) {
      setError("근무일 원본이 없어 출퇴근 시각을 안전하게 수정할 수 없습니다.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (timeChanged) {
        await updateAttendanceRecord(recordId, {
          clockInAt: asKstIso(record.workDate, form.start),
          clockOutAt: asKstIso(record.workDate, form.end),
          reason: form.reason.trim(),
        });
      }
      if (breakChanged) {
        await updateBreakTime(recordId, { breakMinutes: breakNumber, reason: form.reason.trim() });
      }
      setEditing(false);
      setMessage("수정 요청이 처리되었습니다. 서버에서 최신 원본·수정 이력을 다시 조회했습니다.");
      await load();
    } catch (e) {
      setError(`${errorText(e)}${timeChanged && breakChanged ? " 일부 항목만 수정되었을 수 있으니 새로고침 후 확인해 주세요." : ""}`);
    } finally { setSaving(false); }
  }

  return <div className="ef-page"><FeatureHeader title={`${date} 근무기록`} back="/attendance/history" badge={edited && <FeatureBadge tone="warning">수정됨</FeatureBadge>}/><main className="ef-content">
    {loading && <FeatureNotice>근무기록을 불러오는 중입니다.</FeatureNotice>}
    {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
    {message && <FeatureNotice tone="success">{message}</FeatureNotice>}
    {record && <>
      <section className="ef-card ef-record-summary"><div className="ef-record-date"><span>{date}</span><b>실근무 {displayMinutes(actualMinutes)}</b></div><div className="ef-timeline"><i/><div><span>출근</span><b>{displayKst(record.clockInAt)}</b><small>서버 기록 {displayKst(record.clockInAt, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</small></div><i/><div><span>퇴근</span><b>{displayKst(record.clockOutAt)}</b><small>서버 기록 {displayKst(record.clockOutAt, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</small></div></div><div className="ef-info-row"><span>실제 휴게시간</span><b>{breakValue == null ? "미입력" : `${breakValue}분`}</b></div></section>
      <div className="ef-section-title"><h2>인증 증거</h2></div>
      <div className="ef-evidence-grid">{photos.map((photo) => <div className="ef-card" key={photo.title}><div className="ef-evidence-photo">{photo.src ? <img src={photo.src} alt={photo.title}/> : <FeatureIcon name="camera" size={28}/>}</div><b>{photo.title}</b><small>{photo.status === true ? "GPS 인증 완료" : photo.status === false ? "GPS 인증 미완료" : "GPS 인증 정보 확인 필요"}</small></div>)}</div>
      <section className="ef-card"><div className="ef-detail-list"><div><FeatureIcon name="pin"/><span><b>GPS 인증 정보</b><small>서버 기록에 저장된 인증 상태</small></span><FeatureBadge tone={record.gpsVerified === true ? "success" : "neutral"}>{record.gpsVerified === true ? "인증" : "확인 필요"}</FeatureBadge></div><div><FeatureIcon name="clock"/><span><b>서버 기록 시각</b><small>원본 타임스탬프 확인</small></span><FeatureBadge tone="info">원본</FeatureBadge></div></div></section>
      <div className="ef-section-title"><h2>원본 및 수정 이력</h2><button type="button" onClick={() => setEditing(!editing)}><FeatureIcon name="edit" size={15}/> 기록 수정</button></div>
      <section className="ef-card ef-history-card">{Array.isArray(revisions) && revisions.length ? revisions.map((rev, index) => <div key={rev.id ?? index} className={`ef-history-item ${index === 0 ? "current" : ""}`}><i/><div><b>{rev.title ?? `수정 이력 ${index + 1}`}</b><span>{rev.description ?? rev.reason ?? "변경 내용은 서버 원본에서 확인해 주세요."}</span><small>{displayKst(rev.updatedAt ?? rev.createdAt, { dateStyle: "medium", timeStyle: "short" })}</small></div></div>) : <p className="ef-muted">서버에서 제공된 수정 이력이 없습니다. 기록을 수정하더라도 원본은 서버 정책에 따라 보존되어야 합니다.</p>}{record.originalRecord && <div className="ef-history-item"><i/><div><b>최초 원본 기록</b><span>{displayKst(record.originalRecord.clockInAt)} 출근 · {displayKst(record.originalRecord.clockOutAt)} 퇴근</span><small>최초 저장된 데이터</small></div></div>}</section>
      {editing && <section className="ef-card ef-edit-card"><h3>근무기록 수정</h3><div className="ef-two-fields"><label>출근 시간<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })}/></label><label>퇴근 시간<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })}/></label></div><label>실제 휴게시간 (분)<input type="number" min="0" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}/></label><label>수정 사유 (필수)<textarea rows="3" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}/></label><FeatureNotice>시간 수정은 근무기록 PATCH, 휴게시간 수정은 별도 PUT API로 전송됩니다. 변경 내용과 사유가 기록되는지 서버에서 확인하세요.</FeatureNotice><FeatureButton disabled={!validForm || saving || (!timeChanged && !breakChanged)} onClick={save}>{saving ? "저장 중..." : "수정 내역 저장"}</FeatureButton></section>}
    </>}
    <Link className="ef-text-link" to="/attendance/history">근무기록 목록으로</Link>
  </main></div>;
}
