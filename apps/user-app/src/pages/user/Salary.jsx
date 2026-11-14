
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiRequest } from "../../api/client";

function currentMonth() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function money(value) {
  if (value == null) return "미제공";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function errorMessage(error) {
  const code = error?.data?.errorCode;

  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  if (code === "CONTRACT_NOT_CONFIRMED") {
    return "근로계약서를 먼저 확정해 주세요.";
  }

  if (code === "NO_ATTENDANCE_DATA") {
    return "해당 월의 근무기록이 없습니다.";
  }

  if (code === "STATEMENT_NOT_CONFIRMED") {
    return "급여명세서를 먼저 확정해 주세요.";
  }

  return error instanceof Error
    ? error.message
    : "요청 처리에 실패했습니다.";
}

export default function Salary() {
  const navigate = useNavigate();

  const [month, setMonth] = useState(currentMonth);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [receivedAmount, setReceivedAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const response = await apiRequest(
          "salary",
          "getOverview",
          { query: { month } }
        );

        if (!active) return;

        setOverview(response?.data ?? response);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(errorMessage(err));
        setOverview(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [month, refreshKey]);

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshKey((prev) => prev + 1);
  }

  async function saveManualPayment(event) {
    event.preventDefault();

    if (submitting) return;

    const amount = Number(receivedAmount);

    if (
      receivedAmount.trim() === "" ||
      !Number.isSafeInteger(amount) ||
      amount < 0
    ) {
      setError("실제 수령액은 0 이상의 정수로 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const body = {
        month,
        receivedAmount: amount,
      };

      if (paidAt) body.paidAt = paidAt;

      const response = await apiRequest(
        "salary",
        "addManualStatement",
        { body }
      );

      const data = response?.data ?? response;

      setMessage("실제 수령액이 등록되었습니다.");
      setReceivedAmount("");
      setPaidAt("");

      if (data?.statementId) {
        navigate(
          `/salary/statements/${encodeURIComponent(data.statementId)}`
        );
      } else {
        refresh();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function runComparison() {
    const statementId = overview?.statementId;

    if (!statementId || comparing) return;

    setComparing(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(
        "salary",
        "calculateComparison",
        {
          body: { month, statementId },
        }
      );

      const data = response?.data ?? response;

      if (!data?.id) {
        throw new Error("급여 비교 결과 ID가 없습니다.");
      }

      navigate(`/salary/${encodeURIComponent(data.id)}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setComparing(false);
    }
  }

  const status = overview?.status;
  const comparison = overview?.comparison;

  return (
    <main style={{
      maxWidth: 680,
      padding: 24,
      margin: "0 auto",
    }}>
      <h1>급여 관리</h1>

      <section style={{ marginBottom: 28 }}>
        <h2>1. 조회 월 선택</h2>

        <label htmlFor="salary-month">급여 귀속 월</label>
        <input
          id="salary-month"
          type="month"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
            setLoading(true);
            setError("");
            setMessage("");
            setOverview(null);
          }}
        />

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{ marginLeft: 8 }}
        >
          새로고침
        </button>
      </section>

      {loading && (
        <p role="status">급여 정보를 불러오는 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!loading && overview && (
        <section style={{ marginBottom: 28 }}>
          <h2>2. 급여 비교 상태</h2>

          <p>상태: {status ?? "미확인"}</p>

          {status === "NOT_SUBMITTED" && (
            <p>
              급여명세서 또는 실제 수령액이
              아직 등록되지 않았습니다.
            </p>
          )}

          {status === "READY" && (
            <p>
              급여정보가 준비되었습니다.
              임금 비교를 실행할 수 있습니다.
            </p>
          )}

          {status === "COMPARED" && (
            <div>
              <p>예상 임금: {money(comparison?.expectedAmount)}</p>
              <p>실제 지급액: {money(comparison?.actualAmount)}</p>
              <p>차이 금액: {money(comparison?.differenceAmount)}</p>

              {comparison?.id && (
                <Link to={`/salary/${encodeURIComponent(comparison.id)}`}>
                  비교 결과 상세 보기
                </Link>
              )}
            </div>
          )}

          {overview.statementId && (
            <p>
              <Link
                to={`/salary/statements/${encodeURIComponent(
                  overview.statementId
                )}`}
              >
                등록된 급여명세서 확인
              </Link>
            </p>
          )}

          {status === "READY" && (
            <button
              type="button"
              onClick={runComparison}
              disabled={!overview.statementId || comparing}
            >
              {comparing
                ? "비교 중..."
                : "예상 임금과 실제 지급액 비교"}
            </button>
          )}
        </section>
      )}

      <section style={{ marginBottom: 28 }}>
        <h2>3. 급여명세서 업로드</h2>
        <p>
          급여명세서 사진이나 PDF가 있으면
          AI 분석 기능을 이용할 수 있습니다.
        </p>
        <Link to="/salary/upload">
          급여명세서 업로드하기
        </Link>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2>4. 실제 수령액 직접 입력</h2>

        <p>
          급여명세서가 없다면 실제 입금받은
          금액만 등록할 수 있습니다.
          이 경우 항목별 비교가 아닌 총액 비교를 진행합니다.
        </p>

        <form onSubmit={saveManualPayment}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="received-amount">
              실제 수령액 (원)
            </label>
            <input
              id="received-amount"
              type="number"
              min="0"
              step="1"
              value={receivedAmount}
              onChange={(event) =>
                setReceivedAmount(event.target.value)
              }
              disabled={submitting}
              required
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="paid-at">
              입금일 (선택)
            </label>
            <input
              id="paid-at"
              type="date"
              value={paidAt}
              onChange={(event) =>
                setPaidAt(event.target.value)
              }
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !month}
          >
            {submitting
              ? "저장 중..."
              : "실제 수령액 등록"}
          </button>
        </form>
      </section>

      <p>
        <Link to="/contracts">
          근로계약서 확인하기
        </Link>
      </p>

      <p>
        <Link to="/attendance/history">
          근무기록 확인하기
        </Link>
      </p>

      <p>
        <Link to="/home">홈으로 이동</Link>
      </p>
    </main>
  );
}
