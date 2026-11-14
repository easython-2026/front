
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import {
  getMonthlyReport,
  getEvidences,
} from "../../api/report";

import {
  FeatureBadge,
  FeatureIcon,
  FeatureNotice,
  displayKst,
  displayMinutes,
  errorText,
  unwrap,
} from "../../components/WorkerFeatureUI";

import "../../styles/figma-finance.css";

// 한국 시간 기준 현재 월
function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (item) => item.type === "year"
  )?.value;

  const month = parts.find(
    (item) => item.type === "month"
  )?.value;

  return `${year}-${month}`;
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

function dateLabel(value) {
  if (!value) return "날짜 미확인";

  const match = String(value).match(
    /\d{4}-(\d{2})-(\d{2})/
  );

  if (match) {
    return `${Number(match[1])}월 ${Number(match[2])}일`;
  }

  return String(value);
}

function extractEvidences(response) {
  const data = unwrap(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.evidences)) {
    return data.evidences;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return null;
}

const statusLabels = {
  MATCH: "일치",
  MISMATCH: "불일치",
  UNCERTAIN: "확인 필요",
  NORMAL: "완료",
  FINISHED: "완료",
  EDITED: "수정됨",
  MISSING: "누락",
};

const evidenceLabels = {
  CONTRACT: "근로계약서",
  CLOCK_IN_PHOTO: "출근 인증 사진",
  CLOCK_OUT_PHOTO: "퇴근 인증 사진",
  GPS: "GPS 기록",
  TIMESTAMP: "서버 타임스탬프",
  SALARY_STATEMENT: "급여명세서",
};

export default function Reports() {
  // =====================================
  // 탭 및 조회 월
  // =====================================

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMonth = searchParams.get("month");
  const validMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "");

  const [tab, setTab] = useState("work");
  const [month, setMonth] = useState(() =>
    validMonth(requestedMonth) ? requestedMonth : currentMonth()
  );

  useEffect(() => {
    if (validMonth(requestedMonth) && requestedMonth !== month) {
      setMonth(requestedMonth);
      setSelectedEvidence(null);
    }
  }, [requestedMonth]);

  const [report, setReport] = useState(null);
  const [evidences, setEvidences] = useState([]);

  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [evidenceError, setEvidenceError] =
    useState("");

  const [reload, setReload] = useState(0);

  const [
    selectedEvidence,
    setSelectedEvidence,
  ] = useState(null);

  // =====================================
  // 월별 근무·임금 리포트 API
  // =====================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setReport(null);
    setError("");

    getMonthlyReport({ month })
      .then((response) => {
        if (!active) return;

        const data = unwrap(response);

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data)
        ) {
          throw new Error(
            "월별 리포트 응답 형식이 올바르지 않습니다."
          );
        }

        setReport(data);
      })
      .catch((err) => {
        if (active) {
          setError(errorText(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [month, reload]);

  // =====================================
  // 증거 목록 API
  // =====================================

  useEffect(() => {
    if (tab !== "evidence") return;

    let active = true;

    setEvidenceLoading(true);
    setEvidenceError("");

    async function loadEvidencePages() {
      try {
        const collected = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await getEvidences({ month, page, size: 20 });
          if (!active) return;

          const list = extractEvidences(response);
          if (!list) {
            throw new Error("증거 목록 응답 배열을 확인해 주세요.");
          }
          collected.push(...list);

          const payload = unwrap(response);
          const pages = Number(payload?.pageInfo?.totalPages ?? 1);
          if (!Number.isSafeInteger(pages) || pages < 1) {
            throw new Error("증거 목록 페이지 정보를 확인할 수 없습니다.");
          }
          totalPages = pages;
          page += 1;
        } while (page <= totalPages && active);

        if (active) setEvidences(collected);
      } catch (err) {
        if (active) {
          setEvidenceError(errorText(err));
          setEvidences([]);
        }
      } finally {
        if (active) setEvidenceLoading(false);
      }
    }

    loadEvidencePages();

    return () => {
      active = false;
    };
  }, [month, tab, reload]);

  // =====================================
  // 서버 응답 구조
  // =====================================

  const work = report?.work;
  const wage = report?.wage;

  const days = Array.isArray(work?.days)
    ? work.days
    : [];

  const edits = Array.isArray(work?.edits)
    ? work.edits
    : [];

  const extraChecks = Array.isArray(
    wage?.extraChecks
  )
    ? wage.extraChecks
    : [];

  // 서버가 날짜를 제공한 증거는
  // 선택 월에 맞춰 표시
  const monthlyEvidence = evidences.filter(
    (item) => {
      const stamp =
        item?.occurredAt ??
        item?.createdAt ??
        item?.workDate ??
        item?.month;

      return (
        !stamp ||
        String(stamp).startsWith(month)
      );
    }
  );

  // 증거 유형별 그룹화
  const grouped = monthlyEvidence.reduce(
    (map, item) => {
      const type =
        item.type ??
        item.evidenceType ??
        "OTHER";

      if (!map.has(type)) {
        map.set(type, []);
      }

      map.get(type).push(item);

      return map;
    },
    new Map()
  );

  function handleMonthChange(value) {
    if (
      /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ) {
      setMonth(value);
      setSearchParams({ month: value }, { replace: true });
      setSelectedEvidence(null);
    }
  }

  return (
    <div className="efin-page">

      {/* 상단바 */}
      <header className="efin-header">
        <strong>월별 리포트</strong>

        <input
          type="month"
          aria-label="리포트 조회 월"
          value={month}
          onChange={(event) =>
            handleMonthChange(
              event.target.value
            )
          }
        />
      </header>

      <main className="efin-content">

        {/* =================================
            Figma 3개 탭
        ================================= */}

        <div className="efin-segment">
          {[
            ["work", "근무"],
            ["pay", "임금 비교"],
            ["evidence", "증거 목록"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={
                tab === key ? "active" : ""
              }
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <FeatureNotice>
            선택한 월의 리포트를 불러오는 중입니다.
          </FeatureNotice>
        )}

        {error && (
          <FeatureNotice tone="error">
            {error}
          </FeatureNotice>
        )}

        {/* =================================
            1. 근무 탭
        ================================= */}

        {tab === "work" && !loading && (
          <>
            <section className="efin-card efin-report-total">
              <span>
                {Number(month.slice(5))}월 총 실근무시간
              </span>

              <h1>
                {displayMinutes(
                  work?.totalWorkedMinutes
                )}
              </h1>

              <div>
                <span>
                  휴게시간

                  <b>
                    {displayMinutes(
                      work?.totalBreakMinutes
                    )}
                  </b>
                </span>

                <span>
                  수정 이력
                  <b>{edits.length}건</b>
                </span>
              </div>
            </section>

            {/* 날짜별 근무기록 */}
            {days.length > 0 ? (
              days.map((item, index) => {
                const id =
                  item.recordId ??
                  item.id;

                const date =
                  item.workDate ??
                  item.date;

                const content = (
                  <>
                    <span className="efin-daybox">
                      {String(
                        date ?? ""
                      ).slice(-2) || "-"}
                    </span>

                    <span className="efin-row-text">
                      <b>{dateLabel(date)}</b>

                      <small>
                        {item.clockInAt
                          ? displayKst(item.clockInAt)
                          : "출근 미기록"}

                        {" · "}

                        {item.clockOutAt
                          ? displayKst(item.clockOutAt)
                          : "퇴근 누락"}

                        {" · 휴게 "}

                        {displayMinutes(
                          item.breakMinutes
                        )}
                      </small>
                    </span>

                    <FeatureBadge
                      tone={
                        item.status === "MISSING" ||
                        item.status === "ISSUE"
                          ? "warning"
                          : "success"
                      }
                    >
                      {statusLabels[item.status] ??
                        (item.clockOutAt
                          ? "완료"
                          : "확인 필요")}
                    </FeatureBadge>
                  </>
                );

                // ID가 있어야 상세 이동 가능
                return id ? (
                  <Link
                    className="efin-report-row"
                    key={id}
                    to={`/attendance/${encodeURIComponent(
                      id
                    )}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    className="efin-report-row"
                    key={`${date}-${index}`}
                  >
                    {content}
                  </div>
                );
              })
            ) : (
              <section className="efin-card">
                <p className="efin-muted">
                  해당 월의 일별 근무기록이 제공되지 않았습니다.
                </p>
              </section>
            )}

            {/* 근무기록 수정 이력 */}
            {edits.length > 0 && (
              <section className="efin-card">
                <h3>근무기록 수정 이력</h3>

                {edits.map((item, index) => (
                  <p
                    className="efin-edit-line"
                    key={item.id ?? index}
                  >
                    {dateLabel(
                      item.workDate ??
                        item.date
                    )}

                    {" · "}

                    {item.reason ??
                      item.description ??
                      "수정 내역 확인 필요"}
                  </p>
                ))}
              </section>
            )}

            <Link
              className="efin-text-link"
              to="/attendance/history"
            >
              전체 근무기록 확인
            </Link>
          </>
        )}

        {/* =================================
            2. 임금 비교 탭
        ================================= */}

        {tab === "pay" && !loading && (
          <>
            <section className="efin-card efin-report-total efin-warning-total">
              <span>
                예상·실제 임금 차이
              </span>

              <h1>
                {money(
                  wage?.differenceAmount
                )}
              </h1>

              <div>
                <span>
                  예상

                  <b>
                    {money(
                      wage?.expectedAmount
                    )}
                  </b>
                </span>

                <span>
                  실제

                  <b>
                    {money(
                      wage?.actualAmount
                    )}
                  </b>
                </span>
              </div>
            </section>

            <section className="efin-card">
              <h3>
                추가 확인이 필요한 항목
              </h3>

              {extraChecks.length > 0 ? (
                <div className="efin-check-list">
                  {extraChecks.map(
                    (item, index) => (
                      <span key={index}>
                        <FeatureIcon
                          name="alert"
                          size={16}
                        />

                        {typeof item === "string"
                          ? item
                          : item?.message ??
                            item?.title ??
                            "확인 필요"}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="efin-muted">
                  {wage
                    ? "서버에서 별도의 추가 확인 사항을 제공하지 않았습니다."
                    : "아직 해당 월의 임금 비교 내역이 없습니다."}
                </p>
              )}

              {wage?.status && (
                <p className="efin-muted">
                  비교 상태:{" "}
                  {statusLabels[wage.status] ??
                    wage.status}
                </p>
              )}
            </section>

            <FeatureNotice tone="warning">
              임금 차이는 법적 체불이 확정되었다는 뜻이 아닙니다.
              최종 판단은 전문가 또는 노동청 확인이 필요합니다.
            </FeatureNotice>

            <Link
              className="efin-main-button"
              to={
                wage?.comparisonId
                  ? `/salary/${encodeURIComponent(
                      wage.comparisonId
                    )}`
                  : "/salary"
              }
            >
              급여 비교 상세 보기
            </Link>

            <Link
              className="efin-outline-button"
              to="/petitions/new"
            >
              진정서 초안 만들기
            </Link>
          </>
        )}

        {/* =================================
            3. 증거 목록 탭
        ================================= */}

        {tab === "evidence" && (
          <>
            {evidenceLoading && (
              <FeatureNotice>
                서버에 저장된 증거를 조회 중입니다.
              </FeatureNotice>
            )}

            {evidenceError && (
              <FeatureNotice tone="error">
                {evidenceError}
              </FeatureNotice>
            )}

            {!evidenceLoading &&
              !evidenceError &&
              grouped.size === 0 && (
                <section className="efin-card">
                  <p className="efin-muted">
                    해당 기간에 조회된 증거가 없습니다.
                  </p>
                </section>
              )}

            <div className="efin-evidence-list">
              {[...grouped].map(
                ([type, list]) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() =>
                      setSelectedEvidence({
                        type,
                        list,
                      })
                    }
                  >
                    <span className="efin-icon">
                      <FeatureIcon
                        name={
                          type.includes("PHOTO")
                            ? "camera"
                            : type === "GPS"
                            ? "pin"
                            : type === "TIMESTAMP"
                            ? "clock"
                            : "file"
                        }
                      />
                    </span>

                    <span>
                      <b>
                        {evidenceLabels[type] ??
                          type}
                      </b>

                      <small>
                        {list.length}개 증거
                      </small>
                    </span>

                    <FeatureIcon
                      name="chevron"
                      size={17}
                    />
                  </button>
                )
              )}
            </div>

            <Link
              className="efin-text-link"
              to="/reports/evidences"
            >
              전체 증거 목록 확인
            </Link>
          </>
        )}

        {/* 새로고침 */}
        <button
          type="button"
          className="efin-refresh"
          onClick={() =>
            setReload((value) => value + 1)
          }
        >
          <FeatureIcon
            name="refresh"
            size={16}
          />

          리포트 새로고침
        </button>
      </main>

      {/* 증거 목록 하단 상세 시트 */}
      {selectedEvidence && (
        <div
          className="efin-overlay"
          onClick={() =>
            setSelectedEvidence(null)
          }
        >
          <section
            className="efin-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="증거 상세"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="efin-handle" />

            <div className="efin-sheet-title">
              <h2>
                {evidenceLabels[
                  selectedEvidence.type
                ] ??
                  selectedEvidence.type}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedEvidence(null)
                }
              >
                닫기
              </button>
            </div>

            <div className="efin-evidence-items">
              {selectedEvidence.list.map(
                (item, index) => (
                  <div
                    key={item.id ?? index}
                  >
                    <b>
                      {item.title ??
                        evidenceLabels[
                          item.type
                        ] ??
                        `증거 ${index + 1}`}
                    </b>

                    <small>
                      {item.occurredAt ??
                        item.createdAt ??
                        "저장 시각 미제공"}
                    </small>

                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        증거 파일 보기
                      </a>
                    )}

                    {item.recordId && (
                      <Link
                        to={`/attendance/${encodeURIComponent(
                          item.recordId
                        )}`}
                      >
                        근무기록 상세 보기
                      </Link>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}