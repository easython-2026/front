
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiRequest } from "../../api/client";

const ITEM_LABELS = {
  BASE_PAY: "기본급",
  OVERTIME_PAY: "연장근로수당",
  NIGHT_PAY: "야간근로수당",
  HOLIDAY_PAY: "휴일근로수당",
  WEEKLY_HOLIDAY_PAY: "주휴수당",
  ALLOWANCE: "기타 수당",
  MEAL_DEDUCTION: "식비 공제",
  LODGING_DEDUCTION: "숙박비 공제",
  TAX_INSURANCE: "세금·보험 공제",
  OTHER_DEDUCTION: "기타 공제",
};

function unwrap(response) {
  return response?.data ?? response;
}

function formatMoney(value) {
  if (value === null || value === undefined) {
    return "미확인";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toLocaleString("ko-KR")}원`
    : "미확인";
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  if (error?.status === 404) {
    return "급여명세서를 찾을 수 없습니다.";
  }

  if (error?.status === 409) {
    return "현재 급여명세서 상태에서는 수정하거나 확정할 수 없습니다.";
  }

  if (error?.status === 400) {
    return error.message || "입력값을 확인해 주세요.";
  }

  return error instanceof Error
    ? error.message
    : "요청 처리에 실패했습니다.";
}

function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function parseAmount(value) {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const amount = Number(value);

  return Number.isSafeInteger(amount)
    ? amount
    : null;
}

export default function SalaryStatement() {
  const { statementId } = useParams();

  const [statement, setStatement] = useState(null);

  const [month, setMonth] = useState("");
  const [netAmount, setNetAmount] = useState("");

  const [originalMonth, setOriginalMonth] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  // =====================================
  // 1. 급여명세서 상세 조회
  // =====================================
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

        const data = unwrap(response);

        if (!data || typeof data !== "object") {
          throw new Error(
            "급여명세서 응답 형식이 올바르지 않습니다."
          );
        }

        setStatement(data);
        setError("");
        setLoading(false);

        // AI 분석이 끝나면 입력 폼에 반영
        if (data.status !== "PROCESSING") {
          const loadedMonth = data.month ?? "";
          const loadedAmount =
            data.netAmount == null
              ? ""
              : String(data.netAmount);

          setMonth(loadedMonth);
          setNetAmount(loadedAmount);

          setOriginalMonth(loadedMonth);
          setOriginalAmount(loadedAmount);
        }

        // 분석 중에는 자동 재조회
        if (data.status === "PROCESSING") {
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

  // =====================================
  // 2. 상태 및 수정 가능 여부
  // =====================================
  const processing = statement?.status === "PROCESSING";
  const failed = statement?.status === "FAILED";
  const done = statement?.status === "DONE";
  const confirmed = statement?.confirmed === true;

  const busy = loading || saving || confirming;

  const canEdit =
    !busy &&
    !confirmed &&
    (done || failed);

  const monthChanged = month !== originalMonth;
  const amountChanged = netAmount !== originalAmount;

  const hasChanges = monthChanged || amountChanged;

  const items = Array.isArray(statement?.items)
    ? statement.items
    : [];

  // =====================================
  // 3. 입력값 검사
  // =====================================
  function validateForm() {
    if (!isValidMonth(month)) {
      return "귀속 월을 YYYY-MM 형식으로 입력해 주세요.";
    }

    if (parseAmount(netAmount) === null) {
      return "지급 금액은 0 이상의 정수로 입력해 주세요.";
    }

    return null;
  }

  // =====================================
  // 4. 수정한 값만 서버에 저장
  // =====================================
  async function handleSave() {
    if (!canEdit || !hasChanges) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const body = {};

    if (monthChanged) {
      body.month = month;
    }

    if (amountChanged) {
      body.netAmount = parseAmount(netAmount);
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "salary",
        "updateStatement",
        {
          params: { statementId },
          body,
        }
      );

      setMessage(
        "급여명세서 수정 내용이 저장되었습니다."
      );

      // 저장 결과를 서버에서 다시 확인
      setLoading(true);
      setReloadKey((previous) => previous + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // 5. 최종 확정
  // =====================================
  async function handleConfirm() {
    if (!canEdit || hasChanges) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      !window.confirm(
        "급여명세서의 귀속 월과 지급 금액을 모두 확인했습니까? 최종 확정하시겠습니까?"
      )
    ) {
      return;
    }

    setConfirming(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "salary",
        "updateStatement",
        {
          params: { statementId },
          body: {
            month,
            netAmount: parseAmount(netAmount),
            confirm: true,
          },
        }
      );

      setMessage(
        "최종 확정 요청이 처리되었습니다. 서버 확정 상태를 확인합니다."
      );

      setLoading(true);
      setReloadKey((previous) => previous + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  }

  function handleRefresh() {
    if (hasChanges) {
      const proceed = window.confirm(
        "저장되지 않은 변경사항이 사라집니다. 다시 조회할까요?"
      );

      if (!proceed) return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setReloadKey((previous) => previous + 1);
  }

  // =====================================
  // 6. 화면
  // =====================================
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>급여명세서 검토 및 확정</h1>

      <p>명세서 ID: {statementId}</p>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={busy}
      >
        다시 조회
      </button>

      {loading && (
        <p role="status">
          급여명세서를 불러오는 중입니다...
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status">{message}</p>
      )}

      {statement && !loading && (
        <>
          {/* 분석 상태 */}
          <section style={{ marginTop: 24 }}>
            <h2>1. 분석 상태</h2>

            <p>
              분석 결과: {statement.status ?? "미확인"}
            </p>

            <p>
              입력 방식: {statement.source ?? "미확인"}
            </p>

            <p>
              확정 여부:{" "}
              {confirmed ? "확정 완료" : "미확정"}
            </p>

            {processing && (
              <p role="status">
                AI가 분석 중입니다.
                3초마다 결과를 다시 확인합니다.
              </p>
            )}

            {failed && (
              <p role="alert">
                분석 실패:{" "}
                {statement.failReason ?? "사유 미제공"}
                . 귀속 월과 지급 금액을 직접
                입력할 수 있습니다.
              </p>
            )}
          </section>

          {/* 금액 수정 */}
          {!processing && (
            <section style={{ marginTop: 28 }}>
              <h2>2. 추출된 급여 정보 검토</h2>

              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="statement-month"
                  style={{ display: "block" }}
                >
                  급여 귀속 월
                </label>

                <input
                  id="statement-month"
                  type="month"
                  value={month}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="statement-amount"
                  style={{ display: "block" }}
                >
                  차감 후 지급 금액 (원)
                </label>

                <input
                  id="statement-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={netAmount}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setNetAmount(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <p>
                지급 총액:{" "}
                {formatMoney(statement.grossAmount)}
              </p>

              <p>
                공제 총액:{" "}
                {formatMoney(statement.deductionTotal)}
              </p>

              <p>
                서버의 실제 수령액 기록:{" "}
                {formatMoney(statement.receivedAmount)}
              </p>

              <p>변경사항: {hasChanges ? "있음" : "없음"}</p>

              <button
                type="button"
                onClick={handleSave}
                disabled={!canEdit || !hasChanges}
              >
                {saving
                  ? "저장 중..."
                  : "수정 내용 저장"}
              </button>

              <button
                type="button"
                disabled={!canEdit || !hasChanges}
                onClick={() => {
                  setMonth(originalMonth);
                  setNetAmount(originalAmount);
                  setMessage("변경사항을 취소했습니다.");
                }}
                style={{ marginLeft: 8 }}
              >
                수정 취소
              </button>
            </section>
          )}

          {/* OCR 추출 급여 항목 */}
          {done && (
            <section style={{ marginTop: 28 }}>
              <h2>3. AI가 추출한 급여 항목</h2>

              {items.length === 0 ? (
                <p>
                  추출된 급여 항목이 없습니다.
                </p>
              ) : (
                <ul>
                  {items.map((item, index) => (
                    <li
                      key={item.id ?? index}
                      style={{ marginBottom: 12 }}
                    >
                      <strong>
                        {ITEM_LABELS[item.type] ??
                          item.type ??
                          "기타 항목"}
                      </strong>

                      <p>
                        금액: {formatMoney(item.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <p style={{ fontSize: 13 }}>
                항목별 수정은 API의 items 요청 객체
                구조를 확인한 뒤 추가합니다.
                현재 원본 항목은 변경하지 않습니다.
              </p>
            </section>
          )}

          {/* 최종 확정 */}
          {!processing && (
            <section style={{ marginTop: 28 }}>
              <h2>4. 최종 확정</h2>

              <p>
                수정 내용이 있으면 먼저 저장한 뒤
                확정해 주세요.
              </p>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !canEdit ||
                  hasChanges ||
                  !isValidMonth(month) ||
                  parseAmount(netAmount) === null
                }
              >
                {confirming
                  ? "확정 중..."
                  : confirmed
                    ? "확정 완료"
                    : "급여명세서 최종 확정"}
              </button>

              {confirmed && (
                <p>
                  급여명세서가 확정되었습니다.
                  이제 해당 월의 임금 비교를
                  진행할 수 있습니다.
                </p>
              )}
            </section>
          )}

          {statement.disclaimer && (
            <p style={{ marginTop: 24 }}>
              {statement.disclaimer}
            </p>
          )}

          <details style={{ marginTop: 24 }}>
            <summary>서버 원본 데이터 보기</summary>

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
        <Link to="/salary">
          급여 관리 및 임금 비교로 이동
        </Link>
      </p>

      <p>
        <Link to="/salary/upload">
          다른 급여명세서 업로드
        </Link>
      </p>
    </main>
  );
}
