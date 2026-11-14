
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import { apiRequest } from "../../api/client";

function isValidDate(value) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

function getErrorMessage(error) {
  const code =
    error?.errorCode ??
    error?.data?.errorCode ??
    error?.code;

  if (code === "NOT_MISMATCH") {
    return "금액 불일치 결과에서만 진정서를 생성할 수 있습니다.";
  }

  if (code === "BUSINESS_INFO_REQUIRED") {
    return "사업장 정보가 필요합니다. 내 정보에서 먼저 등록해 주세요.";
  }

  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  return error instanceof Error
    ? error.message
    : "진정서 생성에 실패했습니다.";
}

export default function PetitionCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const comparisonId =
    searchParams.get("comparisonId") ?? "";

  const [comparison, setComparison] = useState(null);
  const [checking, setChecking] = useState(true);

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // 서버에서 비교 상태를 다시 검증
  useEffect(() => {
    if (!comparisonId) return;

    let active = true;

    async function loadComparison() {
      try {
        const response = await apiRequest(
          "salary",
          "getComparison",
          {
            params: { comparisonId },
          }
        );

        if (!active) return;

        setComparison(response?.data ?? response);
        setError("");
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setChecking(false);
      }
    }

    loadComparison();

    return () => {
      active = false;
    };
  }, [comparisonId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (creating || comparison?.status !== "MISMATCH") {
      return;
    }

    if (
      (periodStart && !isValidDate(periodStart)) ||
      (periodEnd && !isValidDate(periodEnd))
    ) {
      setError("대상 기간의 날짜 형식을 확인해 주세요.");
      return;
    }

    if (periodStart && periodEnd && periodStart > periodEnd) {
      setError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    if (
      !window.confirm(
        "임금 비교 결과를 바탕으로 진정서 초안을 생성하시겠습니까?"
      )
    ) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const body = { comparisonId };

      if (periodStart) body.periodStart = periodStart;
      if (periodEnd) body.periodEnd = periodEnd;

      const response = await apiRequest(
        "report",
        "createComplaint",
        { body }
      );

      const data = response?.data ?? response;

      if (!data?.complaintId) {
        throw new Error(
          "생성 응답에 complaintId가 없습니다."
        );
      }

      // 202 Accepted는 완료가 아닌 접수 상태
      navigate(
        `/petitions/${encodeURIComponent(data.complaintId)}`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  if (!comparisonId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>진정서 생성</h1>
        <p>
          임금 비교 결과를 먼저 선택해 주세요.
        </p>
        <Link to="/salary">
          급여 비교로 이동
        </Link>
      </main>
    );
  }

  return (
    <main style={{
      maxWidth: 680,
      padding: 24,
      margin: "0 auto",
    }}>
      <h1>진정서 생성</h1>

      <p>기준 비교 ID: {comparisonId}</p>

      {checking && (
        <p role="status">임금 비교 결과 확인 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {comparison && (
        <section>
          <h2>1. 임금 비교 결과</h2>

          <p>
            비교 월: {comparison.month ?? "미확인"}
          </p>

          <p>결과: {comparison.status}</p>

          {comparison.status !== "MISMATCH" && (
            <p>
              현재 비교 결과에서는 진정서를
              생성할 수 없습니다.
            </p>
          )}

          {comparison.status === "MISMATCH" && (
            <form onSubmit={handleSubmit}>
              <h2>2. 대상 기간</h2>

              <p>
                기간은 선택 항목입니다.
                비워두면 서버가 비교 월을 기준으로 결정합니다.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="period-start">
                  시작일
                </label>

                <input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(event) =>
                    setPeriodStart(event.target.value)
                  }
                  disabled={creating}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="period-end">
                  종료일
                </label>

                <input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(event) =>
                    setPeriodEnd(event.target.value)
                  }
                  disabled={creating}
                />
              </div>

              <p>
                서버는 비교 결과와 근무기록을 기준으로
                한국어 진정서 초안을 생성하고,
                AI 번역을 처리합니다.
              </p>

              <button
                type="submit"
                disabled={creating || checking}
              >
                {creating
                  ? "생성 요청 중..."
                  : "진정서 초안 생성"}
              </button>
            </form>
          )}
        </section>
      )}

      <p style={{ marginTop: 28 }}>
        <Link to="/petitions">
          진정서 목록으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
