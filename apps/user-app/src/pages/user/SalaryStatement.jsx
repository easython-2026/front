
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiRequest } from "../../api/client";

// API 명세에 정의된 급여 항목 이름
const ITEM_LABELS = {
  BASE_PAY: "기본급",
  OVERTIME_PAY: "연장근로수당",
  NIGHT_PAY: "야간근로수당",
  HOLIDAY_PAY: "휴일근로수당",
  WEEKLY_HOLIDAY_PAY: "주휴수당",
  ALLOWANCE: "기타 수당",
  MEAL_DEDUCTION: "숙식비 공제",
  LODGING_DEDUCTION: "숙박비 공제",
  TAX_INSURANCE: "세금·보험 공제",
  OTHER_DEDUCTION: "기타 공제",
};

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
    return "급여명세서를 찾을 수 없습니다.";
  }

  return error instanceof Error
    ? error.message
    : "급여명세서 조회에 실패했습니다.";
}

export default function SalaryStatement() {
  const { statementId } = useParams();

  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!statementId) return;

    let active = true;
    let timer = null;

    async function loadStatement() {
      try {
        const response = await apiRequest(
          "salary",
          "getStatement",
          {
            params: { statementId },
          }
        );

        if (!active) return;

        const result = response?.data ?? response;

        if (!result || typeof result !== "object") {
          throw new Error(
            "급여명세서 응답 형식이 올바르지 않습니다."
          );
        }

        setStatement(result);
        setError("");
        setLoading(false);

        if (result.status === "PROCESSING") {
          timer = setTimeout(loadStatement, 3000);
        }
      } catch (err) {
        if (!active) return;

        setError(getErrorMessage(err));
        setLoading(false);
      }
    }

    loadStatement();

    return () => {
      active = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [statementId, reloadKey]);

  function handleRefresh() {
    setLoading(true);
    setError("");
    setReloadKey((previous) => previous + 1);
  }

  const status = statement?.status;
  const processing = status === "PROCESSING";
  const failed = status === "FAILED";
  const done = status === "DONE";

  const items = Array.isArray(statement?.items)
    ? statement.items
    : [];

  return (
    <main
      style={{
        maxWidth: 680,
        padding: 24,
        margin: "0 auto",
      }}
    >
      <h1>급여명세서 AI 분석 결과</h1>

      <p>명세서 ID: {statementId}</p>

      <button
        type="button"
        disabled={loading}
        onClick={handleRefresh}
      >
        다시 조회
      </button>

      {loading && (
        <p role="status">
          급여명세서를 불러오는 중...
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {statement && !error && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>1. 분석 상태</h2>

            <p>상태: {status ?? "미확인"}</p>

            <p>
              입력 방식:{" "}
              {statement.source ?? "미확인"}
            </p>

            <p>
              확정 여부:{" "}
              {statement.confirmed
                ? "확정 완료"
                : "미확정"}
            </p>

            {processing && (
              <p role="status">
                AI가 급여명세서를 분석 중입니다.
                3초마다 다시 확인합니다.
              </p>
            )}

            {failed && (
              <p role="alert">
                분석 실패:{" "}
                {statement.failReason ??
                  "실패 사유가 제공되지 않았습니다."}
              </p>
            )}
          </section>

          {done && (
            <>
              <section style={{ marginTop: 24 }}>
                <h2>2. 급여 정보</h2>

                <p>
                  귀속 월:{" "}
                  {statement.month ?? "미확인"}
                </p>

                <p>
                  지급 총액:{" "}
                  {formatMoney(statement.grossAmount)}
                </p>

                <p>
                  공제 총액:{" "}
                  {formatMoney(statement.deductionTotal)}
                </p>

                <p>
                  차감 후 금액:{" "}
                  {formatMoney(statement.netAmount)}
                </p>

                <p>
                  실제 수령액:{" "}
                  {formatMoney(statement.receivedAmount)}
                </p>
              </section>

              <section style={{ marginTop: 24 }}>
                <h2>3. 급여 항목</h2>

                {items.length === 0 && (
                  <p>
                    추출된 급여 항목이 없습니다.
                  </p>
                )}

                {items.length > 0 && (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th>금액</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={item.id ?? index}
                        >
                          <td>
                            {ITEM_LABELS[item.type] ??
                              item.type ??
                              "미분류"}
                          </td>

                          <td>
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {statement.disclaimer && (
            <p style={{ marginTop: 24 }}>
              {statement.disclaimer}
            </p>
          )}

          <details style={{ marginTop: 24 }}>
            <summary>서버 원본 응답 보기</summary>

            <pre
              style={{
                padding: 12,
                background: "#f5f5f5",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {JSON.stringify(statement, null, 2)}
            </pre>
          </details>
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/salary/upload">
          다른 급여명세서 등록하기
        </Link>
      </p>

      <p>
        <Link to="/salary">
          급여 관리로 돌아가기
        </Link>
      </p>
    </main>
  );
}
