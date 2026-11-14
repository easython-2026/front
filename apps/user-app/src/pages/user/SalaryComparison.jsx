
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiRequest } from "../../api/client";

const STATUS_LABELS = {
  MATCH: "일치",
  MISMATCH: "불일치",
  UNCERTAIN: "확인 필요",
};

function money(value) {
  if (value == null) return "미제공";

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export default function SalaryComparison() {
  const { comparisonId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadComparison() {
      try {
        const response = await apiRequest(
          "salary",
          "getComparison",
          { params: { comparisonId } }
        );

        if (!active) return;

        setData(response?.data ?? response);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err?.status === 401
            ? "로그인 인증이 필요합니다."
            : err instanceof Error
              ? err.message
              : "임금 비교 결과를 불러오지 못했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadComparison();

    return () => {
      active = false;
    };
  }, [comparisonId, reloadKey]);

  function refresh() {
    setLoading(true);
    setError("");
    setReloadKey((previous) => previous + 1);
  }

  const items = Array.isArray(data?.items)
    ? data.items
    : [];

  const uncertainties = Array.isArray(data?.uncertainties)
    ? data.uncertainties
    : [];

  const unsupportedRules = Array.isArray(
    data?.appliedConditions?.unsupportedRules
  )
    ? data.appliedConditions.unsupportedRules
    : [];

  const actions = Array.isArray(data?.actions)
    ? data.actions
    : [];

  return (
    <main style={{
      maxWidth: 720,
      padding: 24,
      margin: "0 auto",
    }}>
      <h1>임금 비교 결과</h1>

      <p>비교 ID: {comparisonId}</p>

      <button
        type="button"
        onClick={refresh}
        disabled={loading}
      >
        다시 조회
      </button>

      {loading && (
        <p role="status">비교 결과 조회 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && data && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>1. 임금 비교 요약</h2>

            <p>비교 월: {data.month ?? "미제공"}</p>
            <p>
              결과:{" "}
              {STATUS_LABELS[data.status] ??
                data.status ??
                "미확인"}
            </p>

            <p>
              예상 임금: {money(data.expectedAmount)}
            </p>

            <p>
              실제 지급액: {money(data.actualAmount)}
            </p>

            <p>
              차이 금액: {money(data.differenceAmount)}
            </p>

            <p>
              차이 금액은 서버가 계산한 값입니다.
              양수여도 자동으로 법적 체불액이
              확정되는 것은 아닙니다.
            </p>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>2. 적용된 근로조건</h2>

            {data.appliedConditions ? (
              <>
                <p>
                  급여 유형:{" "}
                  {data.appliedConditions.wageType ?? "미제공"}
                </p>

                <p>
                  급여 금액:{" "}
                  {money(data.appliedConditions.wageAmount)}
                </p>

                <p>
                  근무시간:{" "}
                  {data.appliedConditions.workedMinutes ??
                    "미제공"}분
                </p>

                <p>
                  근무일수:{" "}
                  {data.appliedConditions.workDays ??
                    "미제공"}일
                </p>

                {Array.isArray(
                  data.appliedConditions.appliedRules
                ) && (
                  <>
                    <h3>적용된 계산 규칙</h3>

                    {data.appliedConditions.appliedRules.map(
                      (rule, index) => (
                        <p key={`${rule.code}-${index}`}>
                          {rule.label ?? rule.code}
                        </p>
                      )
                    )}
                  </>
                )}
              </>
            ) : (
              <p>적용 조건 정보가 없습니다.</p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>3. 항목별 비교</h2>

            {items.length === 0 ? (
              <p>
                항목별 비교 데이터가 없습니다.
                실제 수령액만 등록한 경우
                총액 비교만 제공될 수 있습니다.
              </p>
            ) : (
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
              }}>
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>예상</th>
                    <th>실제</th>
                    <th>차이</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.type}-${index}`}>
                      <td>
                        {item.label ?? item.type}
                      </td>
                      <td>{money(item.expected)}</td>
                      <td>{money(item.actual)}</td>
                      <td>{money(item.difference)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {items.map((item, index) =>
              item.basis ? (
                <p key={`basis-${index}`}>
                  {item.label ?? item.type}:{" "}
                  {item.basis}
                </p>
              ) : null
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>4. 추가 확인 사항</h2>

            {uncertainties.length === 0 &&
              unsupportedRules.length === 0 && (
                <p>서버에서 별도 확인 사항을 제공하지 않았습니다.</p>
              )}

            {uncertainties.map((item, index) => (
              <p key={`uncertainty-${index}`}>
                확인 필요: {item.message ?? item.code}
              </p>
            ))}

            {unsupportedRules.map((rule, index) => (
              <p key={`unsupported-${index}`}>
                계산 미반영 조건: {rule}
              </p>
            ))}
          </section>

          {data.explanation?.text && (
            <section style={{ marginTop: 24 }}>
              <h2>5. 비교 결과 설명</h2>
              <p>{data.explanation.text}</p>
            </section>
          )}

          {data.status === "MISMATCH" &&
            actions.length > 0 && (
              <section style={{ marginTop: 24 }}>
                <h2>6. 가능한 후속 조치</h2>

                {actions.includes("CREATE_COMPLAINT") && (
                  <p>
                    <Link
                        to={`/petitions/new?comparisonId=${encodeURIComponent(comparisonId)}`}
                    >
                    진정서 초안 생성
                    </Link>
                  </p>
                )}

                {actions.includes(
                  "REQUEST_CONSULTATION"
                ) && (
                  <p>
                    <Link to="/consultations/new">
                      상담 신청 화면으로 이동
                    </Link>
                  </p>
                )}
              </section>
            )}

          {data.disclaimer && (
            <p style={{ marginTop: 24 }}>
              {data.disclaimer}
            </p>
          )}
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/salary">
          급여 관리로 돌아가기
        </Link>
      </p>
    </main>
  );
}
