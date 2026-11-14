
import { useEffect, useState } from "react";

import {
  getAdminStaff,
  assignAdminConsultation,
  triageAdminConsultation,
  updateAdminConsultationStatus,
} from "../services/adminConsultationApi";

import "./AdminCaseActions.css";

const NEXT_STATUSES = {
  RECEIVED: ["REVIEWING"],
  REVIEWING: ["INFO_REQUESTED", "REFERRED"],
  INFO_REQUESTED: ["REVIEWING"],
  REFERRED: ["REVIEWING"],
  CLOSED: [],
};

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "완료",
};

export default function AdminCaseActions({
  detail,
  onUpdated,
}) {
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState("");

  const [selectedStaffId, setSelectedStaffId] = useState(
    detail.assignee?.id || ""
  );

  const [urgency, setUrgency] = useState(
    detail.urgencyLevel || ""
  );
  const [urgencyNote, setUrgencyNote] = useState("");

  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isClosed = detail.status === "CLOSED";
  const allowedStatuses = NEXT_STATUSES[detail.status] || [];

  // 선택 중인 값과 서버 응답 동기화
  useEffect(() => {
    setSelectedStaffId(detail.assignee?.id || "");
    setUrgency(detail.urgencyLevel || "");
    setNextStatus("");
  }, [
    detail.id,
    detail.assignee?.id,
    detail.urgencyLevel,
    detail.status,
  ]);

  // 담당자 목록 조회
  useEffect(() => {
    let active = true;

    async function loadStaff() {
      setStaffLoading(true);
      setStaffError("");

      try {
        const data = await getAdminStaff();

        if (active) {
          setStaff(
            Array.isArray(data?.staff) ? data.staff : []
          );
        }
      } catch (err) {
        if (active) {
          setStaffError(
            err.message || "담당자 목록을 불러올 수 없습니다."
          );
        }
      } finally {
        if (active) setStaffLoading(false);
      }
    }

    loadStaff();

    return () => {
      active = false;
    };
  }, []);

  async function executeAction(action, callback) {
    if (saving) return;

    setSaving(action);
    setError("");
    setSuccess("");

    try {
      await callback();

      setSuccess("변경사항이 저장되었습니다.");

      // 상세 정보를 다시 불러와 화면 갱신
      onUpdated?.();
    } catch (err) {
      if (err.errorCode === "CONSENT_NOT_GRANTED") {
        setError(
          "노동자가 정보 공유 동의를 철회했습니다. 사건에 접근할 수 없습니다."
        );
        onUpdated?.();
      } else {
        setError(
          err.message || "변경사항 저장에 실패했습니다."
        );
      }
    } finally {
      setSaving("");
    }
  }

  const handleAssign = (event) => {
    event.preventDefault();

    if (!selectedStaffId || isClosed) return;

    executeAction("assignee", () =>
      assignAdminConsultation(
        detail.id,
        selectedStaffId
      )
    );
  };

  const handleTriage = (event) => {
    event.preventDefault();

    if (!urgency || isClosed) return;

    executeAction("triage", () =>
      triageAdminConsultation(detail.id, {
        urgencyLevel: urgency,
        note: urgencyNote,
      })
    );
  };

  const handleStatus = (event) => {
    event.preventDefault();

    if (!allowedStatuses.includes(nextStatus)) return;

    executeAction("status", () =>
      updateAdminConsultationStatus(detail.id, {
        status: nextStatus,
        note: statusNote,
      })
    );
  };

  return (
    <section className="admin-actions">
      <div className="admin-actions__heading">
        <div>
          <span>CASE MANAGEMENT</span>
          <h3>사건 처리 관리</h3>
        </div>

        {isClosed && (
          <span className="admin-actions__closed">
            종결된 사건
          </span>
        )}
      </div>

      {error && (
        <p className="admin-actions__error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="admin-actions__success" role="status">
          {success}
        </p>
      )}

      {/* 담당자 배정 */}
      <form
        className="admin-actions__section"
        onSubmit={handleAssign}
      >
        <div className="admin-actions__section-title">
          <h4>담당자 배정</h4>
          <p>상담기관 소속 담당자를 지정하거나 변경합니다.</p>
        </div>

        <label htmlFor="admin-action-staff">
          상담 담당자
        </label>

        <select
          id="admin-action-staff"
          value={selectedStaffId}
          onChange={(e) =>
            setSelectedStaffId(e.target.value)
          }
          disabled={staffLoading || isClosed || Boolean(saving)}
        >
          <option value="">담당자를 선택해 주세요</option>

          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.languages?.length
                ? ` (${person.languages.join(", ")})`
                : ""}
            </option>
          ))}
        </select>

        {staffError && (
          <p className="admin-actions__field-error">
            {staffError}
          </p>
        )}

        <button
          type="submit"
          disabled={
            !selectedStaffId ||
            staffLoading ||
            Boolean(staffError) ||
            isClosed ||
            Boolean(saving)
          }
        >
          {saving === "assignee"
            ? "저장 중..."
            : "담당자 저장"}
        </button>
      </form>

      {/* 긴급도 확정 */}
      <form
        className="admin-actions__section"
        onSubmit={handleTriage}
      >
        <div className="admin-actions__section-title">
          <h4>상담 우선순위 확정</h4>
          <p>
            AI 제안은 참고용이며 최종 우선순위는
            담당자가 검토해 결정합니다.
          </p>
        </div>

        <div className="admin-actions__suggestion">
          AI 제안:
          <strong>
            {detail.aiSuggestedUrgency || "제안 없음"}
          </strong>
        </div>

        <label htmlFor="admin-action-urgency">
          확정 긴급도
        </label>

        <select
          id="admin-action-urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          disabled={isClosed || Boolean(saving)}
        >
          <option value="">긴급도를 선택해 주세요</option>
          <option value="HIGH">높음 (HIGH)</option>
          <option value="MEDIUM">보통 (MEDIUM)</option>
          <option value="LOW">낮음 (LOW)</option>
        </select>

        <label htmlFor="admin-action-urgency-note">
          분류 사유 (선택)
        </label>

        <textarea
          id="admin-action-urgency-note"
          rows={3}
          value={urgencyNote}
          onChange={(e) =>
            setUrgencyNote(e.target.value)
          }
          placeholder="우선순위를 결정한 이유를 입력하세요."
          disabled={isClosed || Boolean(saving)}
        />

        <button
          type="submit"
          disabled={!urgency || isClosed || Boolean(saving)}
        >
          {saving === "triage"
            ? "저장 중..."
            : "긴급도 확정"}
        </button>
      </form>

      {/* 처리 상태 변경 */}
      <form
        className="admin-actions__section"
        onSubmit={handleStatus}
      >
        <div className="admin-actions__section-title">
          <h4>처리 상태 변경</h4>
          <p>
            현재 상태:
            <strong>
              {" "}
              {STATUS_LABELS[detail.status] || detail.status}
            </strong>
          </p>
        </div>

        <label htmlFor="admin-action-status">
          변경할 상태
        </label>

        <select
          id="admin-action-status"
          value={nextStatus}
          onChange={(e) =>
            setNextStatus(e.target.value)
          }
          disabled={
            isClosed ||
            allowedStatuses.length === 0 ||
            Boolean(saving)
          }
        >
          <option value="">상태를 선택해 주세요</option>

          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <label htmlFor="admin-action-status-note">
          처리 메모 (선택)
        </label>

        <textarea
          id="admin-action-status-note"
          rows={3}
          value={statusNote}
          onChange={(e) =>
            setStatusNote(e.target.value)
          }
          placeholder="상태 변경 사유를 기록하세요."
          disabled={isClosed || Boolean(saving)}
        />

        <button
          type="submit"
          disabled={
            !nextStatus ||
            isClosed ||
            Boolean(saving)
          }
        >
          {saving === "status"
            ? "변경 중..."
            : "처리 상태 변경"}
        </button>

        <p className="admin-actions__hint">
          사건 종결은 일반 상태 변경이 아니라
          상담 결과 기록 기능에서 처리합니다.
        </p>
      </form>
    </section>
  );
}
