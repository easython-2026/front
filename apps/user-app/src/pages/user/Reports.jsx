
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

const STATUS_LABELS = {
  MATCH: "일치",
  MISMATCH: "불일치",
  UNCERTAIN: "확인 필요",
};

function getCurrentMonth() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function moveMonth(value, amount) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function formatMinutes(value) {
  if (value == null) return "미확인";

  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "미확인";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = Math.floor(minutes % 60);

  return `${hours}시간 ${remainder}분`;
}

function formatMoney(value) {
  if (value == null) return "미확인";

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${amount.toLocaleString("ko-KR")}원`
    : "미확인";
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  if (error?.status === 404) {
    return "선택한 월의 리포트를 찾을 수 없습니다.";
  }

  return error instanceof Error
    ? error.message
    : "월별 리포트를 불러오지 못했습니다.";
}

function RecordList({ title, records }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h3>{title}</h3>

      {records.length === 0 ? (
        <p>제공된 기록이 없습니다.</p>
      ) : (
        <ul>
          {records.map((record, index) => (
            <li
              key={record?.id ?? record?.recordId ?? index}
              style={{
                padding: 12,
                marginBottom: 12,
                border: "1px solid #ddd",
              }}
            >
              {record?.date && (
                <p>날짜: {record.date}</p>
              )}

              {record?.workedMinutes != null && (
                <p>
                  실근무시간:{" "}
                  {formatMinutes(record.workedMinutes)}
                </p>
              )}

              {record?.breakMinutes != null && (
                <p>
                  휴게시간:{" "}
                  {formatMinutes(record.breakMinutes)}
                </p>
              )}

              <details>
                <summary>기록 데이터 확인</summary>

                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(record, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Reports() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [reloadKey, setReloadKey] = useState(0);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return;
    }

    let active = true;

    async function loadReport() {
      try {
        const response = await apiRequest(
          "report",
          "getMonthly",
          {
            query: { month },
          }
        );

        if (!active) return;

        const result = response?.data ?? response;

        if (
          !result ||
          typeof result !== "object" ||
          Array.isArray(result)
        ) {
          throw new Error(
            "월별 리포트 응답 형식이 올바르지 않습니다."
          );
        }

        setReport(result);
        setError("");
      } catch (err) {
        if (!active) return;

        setReport(null);
        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();

    return () => {
      active = false;
    };
  }, [month, reloadKey]);

  function changeMonth(nextMonth) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextMonth)) {
      return;
    }

    setMonth(nextMonth);
    setReport(null);
    setError("");
    setLoading(true);
  }

  function refresh() {
    setReport(null);
    setError("");
    setLoading(true);
    setReloadKey((previous) => previous + 1);
  }

  const work = report?.work;
  const wage = report?.wage;

  const days = Array.isArray(work?.days)
    ? work.days
    : [];

  const edits = Array.isArray(work?.edits)
    ? work.edits
    : [];

  const extraChecks = Array.isArray(wage?.extraChecks)
    ? wage.extraChecks
    : [];

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>월별 근무·임금 리포트</h1>

      <p>
        근무기록과 임금 비교 결과를
        한 달 단위로 확인할 수 있습니다.
      </p>

      {/* 1. 월 선택 */}
      <section style={{ marginBottom: 28 }}>
        <h2>1. 조회 기간</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() =>
              changeMonth(moveMonth(month, -1))
            }
          >
            이전 달
          </button>

          <input
            type="month"
            aria-label="리포트 조회 월"
            value={month}
            onChange={(event) =>
              changeMonth(event.target.value)
            }
          />

          <button
            type="button"
            onClick={() =>
              changeMonth(moveMonth(month, 1))
            }
          >
            다음 달
          </button>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          새로고침
        </button>
      </section>

      {loading && (
        <p role="status">
          월별 리포트를 불러오는 중입니다...
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && report && (
        <>
          {/* 2. 근무 요약 */}
          <section style={{ marginBottom: 28 }}>
            <h2>2. 근무 요약</h2>

            <p>
              조회 월: {report.month ?? month}
            </p>

            <p>
              총 근무일수:{" "}
              {work?.workDays != null
                ? `${work.workDays}일`
                : "미확인"}
            </p>

            <p>
              총 실근무시간:{" "}
              {formatMinutes(work?.totalWorkedMinutes)}
            </p>

            <p>
              총 휴게시간:{" "}
              {formatMinutes(work?.totalBreakMinutes)}
            </p>

            {!work && (
              <p>
                이 기간의 근무 요약 데이터가 없습니다.
              </p>
            )}

            <Link to="/attendance/history">
              근무기록 조회 화면으로 이동
            </Link>

            <RecordList
              title="일별 근무 내역"
              records={days}
            />

            <RecordList
              title="근무기록 수정 이력"
              records={edits}
            />
          </section>

          <hr />

          {/* 3. 임금 비교 */}
          <section style={{ marginTop: 28 }}>
            <h2>3. 임금 비교 요약</h2>

            {wage == null ? (
              <>
                <p>
                  아직 이 월의 임금 비교 결과가 없습니다.
                </p>

                <p>
                  근로계약서, 근무기록,
                  급여명세서의 상태를 확인한 후
                  임금 비교를 진행해 주세요.
                </p>

                <Link to="/salary">
                  급여 비교 진행하기
                </Link>
              </>
            ) : (
              <>
                <p>
                  비교 상태:{" "}
                  {STATUS_LABELS[wage.status] ??
                    wage.status ??
                    "미확인"}
                </p>

                <p>
                  예상 임금:{" "}
                  {formatMoney(wage.expectedAmount)}
                </p>

                <p>
                  실제 지급액:{" "}
                  {formatMoney(wage.actualAmount)}
                </p>

                <p>
                  차이 금액:{" "}
                  {formatMoney(wage.differenceAmount)}
                </p>

                {wage.comparisonId ? (
                  <Link
                    to={`/salary/${encodeURIComponent(
                      wage.comparisonId
                    )}`}
                  >
                    임금 비교 상세 보기
                  </Link>
                ) : (
                  <Link to="/salary">
                    급여 관리 화면으로 이동
                  </Link>
                )}

                <section style={{ marginTop: 20 }}>
                  <h3>추가 확인 사항</h3>

                  {extraChecks.length === 0 ? (
                    <p>
                      서버에서 별도의 추가 확인 사항을
                      제공하지 않았습니다.
                    </p>
                  ) : (
                    <ul>
                      {extraChecks.map((item, index) => (
                        <li key={index}>
                          {typeof item === "string"
                            ? item
                            : item?.message ??
                              JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </section>

          <hr />

          {/* 4. 증거 요약 */}
          <section style={{ marginTop: 28 }}>
            <h2>4. 증거 요약</h2>

            <p>
              등록된 증거:{" "}
              {report.evidenceCount != null
                ? `${report.evidenceCount}건`
                : "미확인"}
            </p>

            <Link to="/reports/evidences">
              증거 목록 확인하기
            </Link>
          </section>

          {/* 법률 안내 */}
          {report.disclaimer && (
            <section style={{ marginTop: 28 }}>
              <h2>안내 사항</h2>
              <p>{report.disclaimer}</p>
            </section>
          )}

          <details style={{ marginTop: 28 }}>
            <summary>리포트 원본 응답 확인</summary>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                padding: 12,
                background: "#f5f5f5",
              }}
            >
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/home">홈으로 이동</Link>
      </p>
    </main>
  );
}
