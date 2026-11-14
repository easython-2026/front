
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  UserRound,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  FileText,
  Clock3,
  Wallet,
  FolderOpen,
  UserCheck,
  Network,
  MessageCircle,
  FileCheck2,
  BriefcaseBusiness,
  LayoutDashboard,
  Files,
  SlidersHorizontal,
  ListChecks,
  Handshake,
  ChevronRight,
  History,
  CheckCircle2,
} from "lucide-react";

import {
  getAdminConsultationDetail,
} from "../services/adminConsultationApi";

import AdminCaseActions from "../components/AdminCaseActions";
import AdminInfoRequests from "../components/AdminInfoRequests";
import AdminReferrals from "../components/AdminReferrals";

import "./AdminCaseDetail.css";

const STATUS_LABELS = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  INFO_REQUESTED: "자료 요청",
  REFERRED: "전문가 연계",
  CLOSED: "종결",
};

const URGENCY_LABELS = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const SCOPE_LABELS = {
  SUMMARY: "사건 요약",
  ATTENDANCE: "근무기록",
  WAGE: "임금 비교",
  PAYSLIP: "급여명세서",
  CONTRACT: "근로계약서",
  COMPLAINT_DRAFT: "진정서 초안",
  EVIDENCE: "증거 자료",
};

const FLAG_LABELS = {
  NO_BREAK: "휴게시간 미입력",
  EDITED: "수정 이력 있음",
  MISSING_CLOCK_OUT: "퇴근 기록 누락",
};

const TABS = [
  {
    id: "overview",
    label: "사건 개요",
    icon: LayoutDashboard,
  },
  {
    id: "evidence",
    label: "근무·증빙 자료",
    icon: Files,
  },
  {
    id: "work",
    label: "상담 업무 처리",
    icon: BriefcaseBusiness,
  },
];

const WORK_MENUS = [
  {
    id: "manage",
    label: "사건 처리 관리",
    description: "담당자 · 긴급도 · 상태",
    icon: SlidersHorizontal,
  },
  {
    id: "requests",
    label: "추가 자료 요청",
    description: "부족한 증빙 자료 요청",
    icon: ListChecks,
    countKey: "infoRequests",
  },
  {
    id: "referrals",
    label: "전문가 연계",
    description: "노무사 · 통역사 연계",
    icon: Handshake,
    countKey: "referrals",
  },
  {
    id: "messages",
    label: "상담 메시지",
    description: "노동자와 상담 대화",
    icon: MessageCircle,
  },
  {
    id: "close",
    label: "상담 결과 및 종결",
    description: "최종 상담 결과 기록",
    icon: FileCheck2,
  },
  {
    id: "history",
    label: "상담 처리 기록",
    description: "요청 · 연계 · 종결 이력",
    icon: History,
  },
];

const WORK_DETAILS = {
  manage: {
    eyebrow: "CASE MANAGEMENT",
    title: "사건 처리 관리",
    description:
      "상담 담당자 배정, 긴급도 확정 및 처리 상태를 관리합니다.",
    icon: SlidersHorizontal,
  },
  requests: {
    eyebrow: "INFORMATION REQUEST",
    title: "추가 자료 요청",
    description:
      "노동자에게 필요한 증빙 자료를 요청하고 요청 내역을 확인합니다.",
    icon: ListChecks,
  },
  referrals: {
    eyebrow: "EXPERT REFERRAL",
    title: "전문가 연계",
    description:
      "노무사 또는 통역사를 연계하고 관련 내용을 기록합니다.",
    icon: Handshake,
  },
  messages: {
    eyebrow: "CONSULTATION MESSAGE",
    title: "상담 메시지",
    description:
      "노동자와 주고받은 메시지를 조회하고 한국어로 답변합니다.",
    icon: MessageCircle,
  },
  close: {
    eyebrow: "CONSULTATION RESULT",
    title: "상담 결과 및 종결",
    description:
      "상담 내용, 조치 결과, 종결 사유를 기록하여 사건을 마무리합니다.",
    icon: FileCheck2,
  },
  history: {
    eyebrow: "CONSULTATION HISTORY",
    title: "상담 처리 기록",
    description:
      "추가 자료 요청, 전문가 연계 및 최종 상담 결과를 조회합니다.",
    icon: History,
  },
};

function formatMoney(value) {
  if (
    value == null ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "확인 필요";
  }

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function formatDate(value, withTime = false) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : {}),
  }).format(date);
}

function formatTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMinutes(value) {
  if (value == null) return "확인 필요";

  return `${Math.floor(value / 60)}시간 ${
    value % 60
  }분`;
}

function DetailSectionTitle({
  icon: Icon,
  eyebrow,
  title,
}) {
  return (
    <div className="admin-detail__card-header">
      <span>{eyebrow}</span>

      <h3>
        <Icon size={19} strokeWidth={1.8} />
        {title}
      </h3>
    </div>
  );
}

function WorkLinkPanel({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  disabled = false,
  note,
}) {
  return (
    <div className="admin-detail__work-link-panel">
      <div className="admin-detail__work-link-icon">
        <Icon size={32} strokeWidth={1.6} />
      </div>

      <h4>{title}</h4>

      <p>{description}</p>

      {note && (
        <div className="admin-detail__work-link-note">
          <ShieldCheck size={15} />
          {note}
        </div>
      )}

      <button
        type="button"
        className="admin-detail__primary admin-detail__work-link-button"
        onClick={onClick}
        disabled={disabled}
      >
        <Icon size={17} />

        {buttonText}

        {!disabled && <ArrowRight size={17} />}
      </button>
    </div>
  );
}

export default function AdminCaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");

  // 상담 업무 처리 하위 메뉴
  const [activeWork, setActiveWork] =
    useState("manage");

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] =
    useState("");
  const [reloadKey, setReloadKey] = useState(0);

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  // 다른 사건으로 이동할 때 탭 초기화
  useEffect(() => {
    setTab("overview");
    setActiveWork("manage");
  }, [caseId]);

  // Mock / 실제 API 공통 상세 조회
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setErrorCode("");
      setDetail(null);

      try {
        const data =
          await getAdminConsultationDetail(caseId);

        if (active) {
          setDetail(data);
        }
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            "사건 상세 조회에 실패했습니다."
        );

        setErrorCode(err.errorCode || "");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [caseId, reloadKey]);

  // 로딩
  if (loading) {
    return (
      <div className="admin-detail">
        <div className="admin-detail__feedback">
          <RefreshCw
            size={20}
            className="admin-detail__spin"
          />

          상담 사건 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  // 오류
  if (error || !detail) {
    const denied = [
      "FORBIDDEN",
      "CONSENT_NOT_GRANTED",
    ].includes(errorCode);

    return (
      <div className="admin-detail">
        <button
          type="button"
          className="admin-detail__back"
          onClick={() => navigate("/cases")}
        >
          <ArrowLeft size={16} />
          사건 목록
        </button>

        <div
          className="admin-detail__feedback"
          role="alert"
        >
          <AlertTriangle size={20} />

          <strong>
            {denied
              ? "사건 정보를 열람할 수 없습니다."
              : "사건 정보를 불러오지 못했습니다."}
          </strong>

          <p>
            {error || "사건 정보가 없습니다."}
          </p>

          {!denied && (
            <button
              type="button"
              className="admin-detail__primary"
              onClick={refresh}
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  const urgency =
    detail.urgencyLevel ||
    detail.aiSuggestedUrgency;

  const sharedScope = Array.isArray(
    detail.consent?.sharedScope
  )
    ? detail.consent.sharedScope
    : [];

  const isClosed = detail.status === "CLOSED";

  const isRevoked = Boolean(
    detail.consent?.revokedAt
  );

  const timeline = Array.isArray(detail.timeline)
    ? detail.timeline
    : [];

  const evidences = Array.isArray(
    detail.evidences
  )
    ? detail.evidences
    : [];

  const selectedWork =
    WORK_DETAILS[activeWork] ||
    WORK_DETAILS.manage;

  const SelectedWorkIcon = selectedWork.icon;

  return (
    <div className="admin-detail admin-detail--v3">
      {/* ====================================
          사건 상단 헤더
      ==================================== */}

      <header className="admin-detail__top">
        <div>
          <button
            type="button"
            className="admin-detail__back"
            onClick={() => navigate("/cases")}
          >
            <ArrowLeft size={16} />
            사건 목록으로
          </button>

          <p className="admin-detail__eyebrow">
            CONSULTATION DETAIL
          </p>

          <h2>{detail.id}</h2>
        </div>

        <div className="admin-detail__top-actions">
          <span
            className={`admin-detail__status status-${(
              detail.status || ""
            ).toLowerCase()}`}
          >
            {STATUS_LABELS[detail.status] ||
              detail.status ||
              "상태 미확인"}
          </span>

          <button
            type="button"
            className="admin-detail__refresh"
            onClick={refresh}
          >
            <RefreshCw size={15} />
            새로고침
          </button>
        </div>
      </header>

      {/* ====================================
          사건 기본 정보
      ==================================== */}

      <section
        className="admin-detail__overview"
        aria-label="상담 사건 기본 정보"
      >
        <div>
          <span>노동자</span>

          <strong>
            <UserRound size={19} />
            {detail.worker?.name || "확인 필요"}
          </strong>

          <small>
            언어: {detail.worker?.language || "-"}
          </small>
        </div>

        <div>
          <span>상담 우선순위</span>

          <strong>
            <ShieldCheck size={19} />

            {URGENCY_LABELS[urgency] ||
              "미분류"}

            {!detail.urgencyLevel &&
              detail.aiSuggestedUrgency && (
                <small className="admin-detail__ai">
                  AI 제안
                </small>
              )}
          </strong>

          <small>
            담당자 검토 후 최종 확정됩니다.
          </small>
        </div>

        <div>
          <span>담당자</span>

          <strong>
            <UserCheck size={19} />

            {detail.assignee?.name ||
              "미배정"}
          </strong>

          <small>상담기관 담당자</small>
        </div>
      </section>

      {/* ====================================
          최상위 탭
      ==================================== */}

      <nav
        className="admin-detail__tabs"
        aria-label="사건 상세 메뉴"
      >
        {TABS.map(
          ({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-detail__tab ${
                tab === id ? "is-active" : ""
              }`}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          )
        )}
      </nav>

      {/* ====================================
          탭 1. 사건 개요
      ==================================== */}

      {tab === "overview" && (
        <div className="admin-detail__content-grid">
          {/* AI 사건 요약 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={ClipboardList}
              eyebrow="AI SUMMARY"
              title="사건 요약"
            />

            {detail.summary?.ko ? (
              <p className="admin-detail__summary">
                {detail.summary.ko}
              </p>
            ) : (
              <p className="admin-detail__empty">
                공유된 사건 요약이 없습니다.
              </p>
            )}
          </section>

          {/* 정보 공유 동의 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={ShieldCheck}
              eyebrow="SHARING CONSENT"
              title="정보 공유 동의"
            />

            <div className="admin-detail__consent">
              <span>동의 일시</span>

              <strong>
                {formatDate(
                  detail.consent?.agreedAt,
                  true
                )}
              </strong>

              <span>공유 범위</span>

              <div className="admin-detail__scopes">
                {sharedScope.length ? (
                  sharedScope.map((scope) => (
                    <span key={scope}>
                      {SCOPE_LABELS[scope] ||
                        scope}
                    </span>
                  ))
                ) : (
                  <p>공유 범위 정보 없음</p>
                )}
              </div>
            </div>
          </section>

          {/* 임금 비교 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={Wallet}
              eyebrow="WAGE COMPARISON"
              title="임금 비교"
            />

            {detail.wageComparison ? (
              <>
                <div className="admin-detail__wages">
                  <div>
                    <span>예상 임금</span>

                    <strong>
                      {formatMoney(
                        detail.wageComparison
                          .expectedAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>실제 지급액</span>

                    <strong>
                      {formatMoney(
                        detail.wageComparison
                          .actualAmount
                      )}
                    </strong>
                  </div>

                  <div className="admin-detail__wage-difference">
                    <span>확인 필요 차이</span>

                    <strong>
                      {formatMoney(
                        detail.wageComparison
                          .differenceAmount
                      )}
                    </strong>
                  </div>
                </div>

                {Array.isArray(
                  detail.wageComparison.uncertainties
                ) &&
                  detail.wageComparison.uncertainties.map(
                    (item, index) => (
                      <p
                        className="admin-detail__warning"
                        key={`${item.code}-${index}`}
                      >
                        <AlertTriangle size={15} />

                        확인 필요: {item.message}
                      </p>
                    )
                  )}
              </>
            ) : (
              <p className="admin-detail__empty">
                공유된 임금 비교 자료가 없습니다.
              </p>
            )}
          </section>

          {/* 처리 현황 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={Network}
              eyebrow="PROCESSING"
              title="처리 현황"
            />

            <div className="admin-detail__processing">
              <div>
                <span>현재 상태</span>

                <strong>
                  {STATUS_LABELS[
                    detail.status
                  ] ||
                    detail.status ||
                    "확인 필요"}
                </strong>
              </div>

              <div>
                <span>담당자</span>

                <strong>
                  {detail.assignee?.name ||
                    "미배정"}
                </strong>
              </div>

              <div>
                <span>추가 자료 요청</span>

                <strong>
                  {detail.infoRequests
                    ?.length ?? 0}
                  건
                </strong>
              </div>

              <div>
                <span>전문가 연계</span>

                <strong>
                  {detail.referrals
                    ?.length ?? 0}
                  건
                </strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ====================================
          탭 2. 근무 및 증빙 자료
      ==================================== */}

      {tab === "evidence" && (
        <div className="admin-detail__content-grid">
          {/* 근무 타임라인 */}
          <section className="admin-detail__card admin-detail__span-full">
            <DetailSectionTitle
              icon={Clock3}
              eyebrow="ATTENDANCE TIMELINE"
              title="근무 타임라인"
            />

            {timeline.length ? (
              <div className="admin-detail__table-wrap">
                <table className="admin-detail__table">
                  <thead>
                    <tr>
                      <th>근무일</th>
                      <th>출근</th>
                      <th>퇴근</th>
                      <th>휴게</th>
                      <th>실근무시간</th>
                      <th>확인 사항</th>
                    </tr>
                  </thead>

                  <tbody>
                    {timeline.map(
                      (record, index) => (
                        <tr
                          key={`${record.date}-${index}`}
                        >
                          <td>
                            {record.date || "-"}
                          </td>

                          <td>
                            {formatTime(
                              record.clockInAt
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.clockOutAt
                            )}
                          </td>

                          <td>
                            {record.breakMinutes ==
                            null
                              ? "미입력"
                              : `${record.breakMinutes}분`}
                          </td>

                          <td>
                            {formatMinutes(
                              record.workedMinutes
                            )}
                          </td>

                          <td>
                            {(record.flags || [])
                              .map(
                                (flag) =>
                                  FLAG_LABELS[
                                    flag
                                  ] || flag
                              )
                              .join(", ") ||
                              "정상"}

                            {(record.edits || [])
                              .length > 0 && (
                              <details>
                                <summary>
                                  수정 이력
                                </summary>

                                {record.edits.map(
                                  (edit, i) => (
                                    <p key={i}>
                                      {edit.field}:{" "}
                                      {String(
                                        edit.before ??
                                          "-"
                                      )}
                                      {" → "}
                                      {String(
                                        edit.after ??
                                          "-"
                                      )}
                                      {" / "}
                                      {edit.reason}
                                    </p>
                                  )
                                )}
                              </details>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-detail__empty">
                공유된 근무기록이 없습니다.
              </p>
            )}
          </section>

          {/* 근로계약서 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={FileText}
              eyebrow="CONTRACT"
              title="근로계약서 검토"
            />

            {detail.contract ? (
              <div className="admin-detail__contract">
                {detail.contract.terms &&
                  Object.entries(
                    detail.contract.terms
                  ).map(([key, value]) => (
                    <div key={key}>
                      <span>{key}</span>

                      <strong>
                        {value == null
                          ? "-"
                          : typeof value ===
                              "object"
                            ? JSON.stringify(
                                value
                              )
                            : String(value)}
                      </strong>
                    </div>
                  ))}

                {(
                  detail.contract.reviews ||
                  []
                ).map((review, index) => (
                  <p
                    className="admin-detail__warning"
                    key={index}
                  >
                    <AlertTriangle size={15} />

                    {review.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="admin-detail__empty">
                계약서가 공유되지 않았습니다.
              </p>
            )}
          </section>

          {/* 공유 증거 */}
          <section className="admin-detail__card">
            <DetailSectionTitle
              icon={FolderOpen}
              eyebrow="SHARED EVIDENCE"
              title="공유된 증거"
            />

            {evidences.length ? (
              <div className="admin-detail__evidences">
                {evidences.map(
                  (evidence, index) => (
                    <div
                      key={
                        evidence.id || index
                      }
                    >
                      <div>
                        <strong>
                          {evidence.title}
                        </strong>

                        <span>
                          {evidence.type} ·{" "}
                          {formatDate(
                            evidence.occurredAt,
                            true
                          )}
                        </span>
                      </div>

                      {evidence.fileUrl && (
                        <a
                          href={evidence.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          파일 열기
                        </a>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="admin-detail__empty">
                공유된 증거 파일이 없습니다.
              </p>
            )}
          </section>
        </div>
      )}

      {/* ====================================
          탭 3. 상담 업무 처리
          왼쪽 메뉴 / 오른쪽 패널
      ==================================== */}

      {tab === "work" && (
        <section className="admin-detail__workspace">
          <div className="admin-detail__workspace-header">
            <div className="admin-detail__workspace-heading">
              <div className="admin-detail__workspace-heading-icon">
                <BriefcaseBusiness size={23} />
              </div>

              <div>
                <span>CASE MANAGEMENT</span>

                <h2>상담 업무 처리</h2>

                <p>
                  필요한 업무를 선택하여 상담
                  사건을 관리하세요.
                </p>
              </div>
            </div>

            <span
              className={`admin-detail__workspace-status ${
                isClosed ? "is-closed" : ""
              }`}
            >
              {isClosed ? (
                <CheckCircle2 size={15} />
              ) : (
                <Clock3 size={15} />
              )}

              {STATUS_LABELS[
                detail.status
              ] ||
                detail.status ||
                "상태 미확인"}
            </span>
          </div>

          <div className="admin-detail__workspace-layout">
            {/* 왼쪽 업무 메뉴 */}
            <nav
              className="admin-detail__work-menu"
              aria-label="상담 업무 메뉴"
            >
              <div className="admin-detail__work-menu-heading">
                <strong>업무 메뉴</strong>

                <span>WORKSPACE</span>
              </div>

              {WORK_MENUS.map((item) => {
                const Icon = item.icon;

                const selected =
                  activeWork === item.id;

                const count = item.countKey
                  ? detail[item.countKey]
                      ?.length ?? 0
                  : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-detail__work-menu-item ${
                      selected
                        ? "is-selected"
                        : ""
                    }`}
                    aria-pressed={selected}
                    onClick={() =>
                      setActiveWork(item.id)
                    }
                  >
                    <span className="admin-detail__work-menu-icon">
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                      />
                    </span>

                    <span className="admin-detail__work-menu-text">
                      <strong>
                        {item.label}
                      </strong>

                      <small>
                        {item.description}
                      </small>
                    </span>

                    {count !== null && (
                      <span className="admin-detail__work-count">
                        {count}
                      </span>
                    )}

                    <ChevronRight
                      className="admin-detail__work-menu-arrow"
                      size={16}
                    />
                  </button>
                );
              })}

              <div className="admin-detail__work-menu-footer">
                <ShieldCheck size={17} />

                <span>
                  변경사항은 현재 상담 사건에
                  적용됩니다.
                </span>
              </div>
            </nav>

            {/* 오른쪽 작업 영역 */}
            <div className="admin-detail__work-content">
              <div className="admin-detail__work-panel-header">
                <div>
                  <span>
                    {selectedWork.eyebrow}
                  </span>

                  <h3>
                    <SelectedWorkIcon
                      size={22}
                    />
                    {selectedWork.title}
                  </h3>

                  <p>
                    {
                      selectedWork.description
                    }
                  </p>
                </div>
              </div>

              {/* 사건 처리 관리 */}
              {activeWork === "manage" && (
                <div className="admin-detail__embedded-component">
                  <AdminCaseActions
                    detail={detail}
                    onUpdated={refresh}
                  />
                </div>
              )}

              {/* 추가 자료 요청 */}
              {activeWork === "requests" && (
                <div className="admin-detail__embedded-component">
                  <AdminInfoRequests
                    detail={detail}
                    onUpdated={refresh}
                  />
                </div>
              )}

              {/* 전문가 연계 */}
              {activeWork === "referrals" && (
                <div className="admin-detail__embedded-component">
                  <AdminReferrals
                    detail={detail}
                    onUpdated={refresh}
                  />
                </div>
              )}

              {/* 상담 메시지 */}
              {activeWork === "messages" && (
                <WorkLinkPanel
                  icon={MessageCircle}
                  title="노동자와 상담을 이어가세요"
                  description="상담 메시지 화면에서 한국어 메시지를 보내고, 서버에서 번역한 노동자 언어 메시지를 확인할 수 있습니다."
                  buttonText="상담 메시지 화면 열기"
                  onClick={() =>
                    navigate(
                      `/cases/${caseId}/messages`
                    )
                  }
                  note="번역 결과는 메시지 전송 후 확인할 수 있습니다."
                />
              )}

              {/* 사건 종결 */}
              {activeWork === "close" && (
                <WorkLinkPanel
                  icon={FileCheck2}
                  title={
                    isClosed
                      ? "종결된 상담입니다"
                      : "상담 결과를 기록하세요"
                  }
                  description={
                    isClosed
                      ? "이미 종결된 사건입니다. 상담 처리 기록에서 최종 결과를 확인할 수 있습니다."
                      : "상담 내용, 조치 결과, 종결 사유를 작성한 뒤 사건을 완료할 수 있습니다."
                  }
                  buttonText={
                    isClosed
                      ? "이미 종결된 상담"
                      : isRevoked
                        ? "정보 공유 동의 철회"
                        : "상담 결과 기록하기"
                  }
                  disabled={
                    isClosed || isRevoked
                  }
                  onClick={() =>
                    navigate(
                      `/cases/${caseId}/close`
                    )
                  }
                />
              )}

              {/* 처리 기록 */}
              {activeWork === "history" && (
                <WorkLinkPanel
                  icon={History}
                  title="상담 처리 기록 확인"
                  description="추가 자료 요청, 전문가 연계 및 최종 상담 결과를 별도 화면에서 확인할 수 있습니다."
                  buttonText="상담 처리 기록 보기"
                  onClick={() =>
                    navigate(
                      `/cases/${caseId}/history`
                    )
                  }
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ====================================
          하단 안내
      ==================================== */}

      <div className="admin-detail__disclaimer">
        <AlertTriangle size={16} />

        {detail.disclaimer ||
          "참고용 자료이며 최종 법적 판단은 전문가 확인이 필요합니다."}
      </div>
    </div>
  );
}
