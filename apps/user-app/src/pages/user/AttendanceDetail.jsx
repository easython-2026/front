import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  getAttendanceRecord,
  updateAttendanceRecord,
  updateBreakTime,
} from "../../api/attendance";
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

const emptyForm = {
  start: "",
  end: "",
  nextDay: false,
  breakMinutes: "",
  reason: "",
};

function kstDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const field = (type) => parts.find((v) => v.type === type)?.value;
  return `${field("year")}-${field("month")}-${field("day")}`;
}

function kstTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const field = (type) => parts.find((v) => v.type === type)?.value;
  return `${field("hour")}:${field("minute")}`;
}

function addDays(dateText, offset) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset))
    .toISOString()
    .slice(0, 10);
}

function timestampKst(dateText, timeText, offset = 0) {
  return `${addDays(dateText, offset)}T${timeText}:00+09:00`;
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function minutes(value) {
  const [hour, min] = value.split(":").map(Number);
  return hour * 60 + min;
}

function readPhotos(record) {
  return [
    {
      title: "출근 인증 사진",
      src: record.clockInPhotoUrl ?? record.clockIn?.photoUrl ??
        record.evidence?.clockInPhotoUrl,
      verified: record.clockInGpsVerified ?? record.clockIn?.gpsVerified,
    },
    {
      title: "퇴근 인증 사진",
      src: record.clockOutPhotoUrl ?? record.clockOut?.photoUrl ??
        record.evidence?.clockOutPhotoUrl,
      verified: record.clockOutGpsVerified ?? record.clockOut?.gpsVerified,
    },
  ];
}

function toForm(item) {
  const startDate = kstDate(item.clockInAt);
  const endDate = kstDate(item.clockOutAt);
  return {
    start: kstTime(item.clockInAt),
    end: kstTime(item.clockOutAt),
    nextDay: Boolean(startDate && endDate && endDate > startDate),
    breakMinutes: item.breakMinutes == null ? "" : String(item.breakMinutes),
    reason: "",
  };
}

export default function AttendanceDetail() {
  const { recordId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = unwrap(await getAttendanceRecord(recordId));
      const item = data?.record ?? data;
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error("근무기록 응답이 비어 있습니다.");
      }
      setRecord(item);
      setForm(toForm(item));
    } catch (err) {
      setError(errorText(err));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const original = record ? toForm(record) : emptyForm;
  const workDate = record?.workDate ?? kstDate(record?.clockInAt);
  const dateLabel = workDate || "근무일 미확인";
  const revisions =
    record?.revisions ?? record?.editHistory ?? record?.modifications ?? [];
  const photos = record ? readPhotos(record) : [];
  const edited = Boolean(
    record?.edited || record?.isEdited ||
      (Array.isArray(revisions) && revisions.length)
  );

  const actualMinutes = record?.workedMinutes ?? (
    record?.clockInAt && record?.clockOutAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(record.clockOutAt) - new Date(record.clockInAt)) / 60000
          ) - (Number(record.breakMinutes) || 0)
        )
      : null
  );

  const timeChanged = Boolean(record) && (
    form.start !== original.start ||
    form.end !== original.end ||
    form.nextDay !== original.nextDay
  );
  const breakChanged = Boolean(record) &&
    form.breakMinutes !== original.breakMinutes;
  const breakNumber = Number(form.breakMinutes);
  const validPair = validTime(form.start) && validTime(form.end);
  const duration = validPair
    ? minutes(form.end) - minutes(form.start) + (form.nextDay ? 1440 : 0)
    : 0;
  const validBreak =
    !breakChanged ||
    (form.breakMinutes.trim() !== "" &&
      Number.isSafeInteger(breakNumber) && breakNumber >= 0);
  const validForm = Boolean(
    record &&
      (timeChanged || breakChanged) &&
      (!timeChanged || (validPair && duration > 0 && duration <= 1440)) &&
      validBreak &&
      (!timeChanged || !breakChanged || breakNumber < duration) &&
      form.reason.trim()
  );

  function change(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
    setMessage("");
  }

  async function save() {
    if (!validForm || saving) return;
    if (timeChanged && !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
      setError("근무일 원본이 없어 출퇴근 시각을 안전하게 수정할 수 없습니다.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    let partialUpdate = false;
    try {
      if (timeChanged) {
        await updateAttendanceRecord(recordId, {
          clockInAt: timestampKst(workDate, form.start),
          clockOutAt: timestampKst(workDate, form.end, form.nextDay ? 1 : 0),
          reason: form.reason.trim(),
        });
        partialUpdate = true;
      }
      if (breakChanged) {
        await updateBreakTime(recordId, {
          breakMinutes: breakNumber,
          reason: form.reason.trim(),
        });
      }
      setEditing(false);
      await load();
      setMessage("변경 요청 이후 서버의 최신 근무기록을 다시 조회했습니다.");
    } catch (err) {
      setError(
        `${errorText(err)}${partialUpdate && breakChanged
          ? " 시간만 먼저 저장되었을 수 있습니다. 새로고침 후 확인해 주세요."
          : ""}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ef-page">
      <FeatureHeader
        title={`${dateLabel} 근무기록`}
        back="/attendance/history"
        badge={edited && <FeatureBadge tone="warning">수정됨</FeatureBadge>}
      />
      <main className="ef-content">
        {loading && <FeatureNotice>근무기록을 불러오는 중입니다.</FeatureNotice>}
        {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
        {message && <FeatureNotice tone="success">{message}</FeatureNotice>}

        {record && (
          <>
            <section className="ef-card ef-record-summary">
              <div className="ef-record-date">
                <span>{dateLabel}</span>
                <b>실근무 {displayMinutes(actualMinutes)}</b>
              </div>
              <div className="ef-timeline">
                <i />
                <div>
                  <span>출근</span>
                  <b>{displayKst(record.clockInAt)}</b>
                  <small>서버 기록 {record.clockInAt ?? "미제공"}</small>
                </div>
                <i />
                <div>
                  <span>퇴근</span>
                  <b>{displayKst(record.clockOutAt)}</b>
                  <small>서버 기록 {record.clockOutAt ?? "미제공"}</small>
                </div>
              </div>
              <div className="ef-info-row">
                <span>실제 휴게시간</span>
                <b>{record.breakMinutes == null ? "미입력" : `${record.breakMinutes}분`}</b>
              </div>
            </section>

            <div className="ef-section-title"><h2>인증 증거</h2></div>
            <div className="ef-evidence-grid">
              {photos.map((photo) => (
                <div className="ef-card" key={photo.title}>
                  <div className="ef-evidence-photo">
                    {photo.src
                      ? <img src={photo.src} alt={photo.title} />
                      : <FeatureIcon name="camera" size={28} />}
                  </div>
                  <b>{photo.title}</b>
                  <small>
                    {photo.verified === true ? "GPS 인증 완료" :
                      photo.verified === false ? "GPS 인증 미완료" :
                      "GPS 인증 정보 확인 필요"}
                  </small>
                </div>
              ))}
            </div>

            <section className="ef-card">
              <div className="ef-detail-list">
                <div>
                  <FeatureIcon name="pin" />
                  <span><b>GPS 인증 정보</b><small>서버 기록에 저장된 인증 상태</small></span>
                  <FeatureBadge tone={record.gpsVerified === true ? "success" : "neutral"}>
                    {record.gpsVerified === true ? "인증" : "확인 필요"}
                  </FeatureBadge>
                </div>
                <div>
                  <FeatureIcon name="clock" />
                  <span><b>서버 기록 시각</b><small>원본 타임스탬프 확인</small></span>
                  <FeatureBadge tone="info">원본</FeatureBadge>
                </div>
              </div>
            </section>

            <div className="ef-section-title">
              <h2>원본 및 수정 이력</h2>
              <button type="button" onClick={() => setEditing((v) => !v)}>
                <FeatureIcon name="edit" size={15} /> 기록 수정
              </button>
            </div>
            <section className="ef-card ef-history-card">
              {Array.isArray(revisions) && revisions.length ? (
                revisions.map((revision, index) => (
                  <div className={`ef-history-item ${index === 0 ? "current" : ""}`} key={revision.id ?? index}>
                    <i />
                    <div>
                      <b>{revision.title ?? `수정 이력 ${index + 1}`}</b>
                      <span>{revision.description ?? revision.reason ?? "서버 기록을 확인해 주세요."}</span>
                      <small>{displayKst(revision.updatedAt ?? revision.createdAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ef-muted">서버에서 제공된 수정 이력이 없습니다.</p>
              )}
              {record.originalRecord && (
                <div className="ef-history-item">
                  <i />
                  <div>
                    <b>최초 원본 기록</b>
                    <span>
                      {displayKst(record.originalRecord.clockInAt)} 출근 ·{" "}
                      {displayKst(record.originalRecord.clockOutAt)} 퇴근
                    </span>
                    <small>최초 저장된 데이터</small>
                  </div>
                </div>
              )}
            </section>

            {editing && (
              <section className="ef-card ef-edit-card">
                <h3>근무기록 수정</h3>
                <div className="ef-two-fields">
                  <label>
                    출근 시각
                    <input
                      type="time"
                      value={form.start}
                      onChange={(e) => change("start", e.target.value)}
                    />
                  </label>
                  <label>
                    퇴근 시각
                    <input
                      type="time"
                      value={form.end}
                      onChange={(e) => change("end", e.target.value)}
                    />
                  </label>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.nextDay}
                    onChange={(e) => change("nextDay", e.target.checked)}
                  />
                  다음 날 퇴근 (야간·익일 근무)
                </label>
                {timeChanged && duration <= 0 && (
                  <FeatureNotice tone="warning">
                    퇴근 시간이 출근 시간보다 빠르면 ‘다음 날 퇴근’을 선택해 주세요.
                  </FeatureNotice>
                )}
                <label>
                  실제 휴게시간 (분)
                  <input
                    type="number"
                    min="0"
                    value={form.breakMinutes}
                    onChange={(e) => change("breakMinutes", e.target.value)}
                  />
                </label>
                <label>
                  수정 사유 (필수)
                  <textarea
                    rows="3"
                    required
                    value={form.reason}
                    onChange={(e) => change("reason", e.target.value)}
                  />
                </label>
                <FeatureNotice>
                  시간 수정과 휴게시간 수정은 별도 API로 전송됩니다.
                  원본 보존 및 수정 이력은 서버에서 확인해야 합니다.
                </FeatureNotice>
                <FeatureButton disabled={!validForm || saving} onClick={save}>
                  {saving ? "저장 중..." : "수정 내역 저장"}
                </FeatureButton>
              </section>
            )}
          </>
        )}
        <Link className="ef-text-link" to="/attendance/history">근무기록 목록으로</Link>
      </main>
    </div>
  );
}