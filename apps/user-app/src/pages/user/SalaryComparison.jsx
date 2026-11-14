import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getSalaryComparison } from "../../api/salary";
import {
  FeatureBadge,
  FeatureHeader,
  FeatureIcon,
  FeatureNotice,
  errorText,
  unwrap,
} from "../../components/WorkerFeatureUI";
import "../../styles/figma-salary-detail.css";

const STATUS_LABELS = {
  MATCH: "일치",
  MISMATCH: "불일치",
  UNCERTAIN: "추가 확인 필요",
};

function money(value) {
  if (value == null || !Number.isFinite(Number(value))) return "미제공";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function asText(value) {
  if (value == null || value === "") return "미제공";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function InfoLine({ label, value, emphasis = false }) {
  return (
    <div className={`sd-info-line${emphasis ? " sd-emphasis" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function SalaryComparison() {
  const { comparisonId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    setError("");
    getSalaryComparison(comparisonId)
      .then((response) => {
        if (!active) return;
        const result = unwrap(response);
        if (!result || typeof result !== "object" || Array.isArray(result)) {
          throw new Error("비교 결과 응답 형식을 확인해 주세요.");
        }
        setData(result);
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [comparisonId, reloadKey]);

  const items = Array.isArray(data?.items) ? data.items : [];
  const uncertainties = Array.isArray(data?.uncertainties)
    ? data.uncertainties : [];
  const unsupportedRules = Array.isArray(data?.appliedConditions?.unsupportedRules)
    ? data.appliedConditions.unsupportedRules : [];
  const actions = Array.isArray(data?.actions) ? data.actions : [];
  const rules = Array.isArray(data?.appliedConditions?.appliedRules)
    ? data.appliedConditions.appliedRules : [];
  const status = data?.status;

  return (
    <div className="sd-page ef-page">
      <FeatureHeader title="급여 비교 결과" back="/salary" />
      <main className="ef-content sd-content">
        <div className="ef-title">
          <p className="ef-eyebrow">PAYROLL COMPARISON</p>
          <h1>일한 만큼 받았는지 확인해요</h1>
          <p>{data?.month ?? "급여 월 미확인"} · 비교 결과 상세</p>
        </div>

        <button
          className="sd-refresh"
          type="button"
          disabled={loading}
          onClick={() => setReloadKey((v) => v + 1)}
        >
          <FeatureIcon name="refresh" size={17} /> 다시 조회
        </button>

        {loading && <FeatureNotice>비교 결과를 불러오는 중입니다.</FeatureNotice>}
        {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
        {!loading && !error && data && (
          <>
            <section className="ef-card sd-summary">
              <div className="sd-summary-head">
                <h2>임금 비교 요약</h2>
                <FeatureBadge tone={status === "MATCH" ? "success" : status === "MISMATCH" ? "warning" : "neutral"}>
                  {STATUS_LABELS[status] ?? status ?? "미확인"}
                </FeatureBadge>
              </div>
              <InfoLine label="예상 임금" value={money(data.expectedAmount)} />
              <InfoLine label="실제 지급액" value={money(data.actualAmount)} />
              <InfoLine label="차이 금액" value={money(data.differenceAmount)} emphasis />
              <p className="sd-muted">
                차이 금액은 서버의 계산 결과예요. 양수라고 해서 법적 체불액이 확정되는 것은 아닙니다.
              </p>
            </section>

            <section className="ef-card sd-section">
              <h2>적용된 근로조건</h2>
              {data.appliedConditions ? (
                <>
                  <InfoLine label="급여 유형" value={asText(data.appliedConditions.wageType)} />
                  <InfoLine label="계약상 급여" value={money(data.appliedConditions.wageAmount)} />
                  <InfoLine label="근무시간" value={data.appliedConditions.workedMinutes == null ? "미제공" : `${data.appliedConditions.workedMinutes}분`} />
                  <InfoLine label="근무일수" value={data.appliedConditions.workDays == null ? "미제공" : `${data.appliedConditions.workDays}일`} />
                  {rules.length > 0 && (
                    <>
                      <h3>적용된 계산 규칙</h3>
                      <ul>{rules.map((rule, index) => <li key={rule.code ?? index}>{rule.label ?? rule.code ?? "계산 규칙"}</li>)}</ul>
                    </>
                  )}
                </>
              ) : <p className="sd-muted">적용 조건 정보가 없습니다.</p>}
            </section>

            <section className="ef-card sd-section">
              <h2>항목별 비교</h2>
              {items.length === 0 ? (
                <p className="sd-muted">총액 비교만 제공되는 자료입니다.</p>
              ) : (
                <div className="sd-items">
                  {items.map((item, index) => (
                    <article className="sd-item" key={`${item.type ?? "item"}-${index}`}>
                      <strong>{item.label ?? item.type ?? `항목 ${index + 1}`}</strong>
                      <InfoLine label="예상" value={money(item.expected)} />
                      <InfoLine label="실제" value={money(item.actual)} />
                      <InfoLine label="차이" value={money(item.difference)} />
                      {item.basis && <p className="sd-muted">계산 근거: {asText(item.basis)}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="ef-card sd-section">
              <h2>추가 확인 사항</h2>
              {uncertainties.length === 0 && unsupportedRules.length === 0 && (
                <p className="sd-muted">서버에서 별도 확인 사항을 제공하지 않았습니다.</p>
              )}
              {uncertainties.map((item, index) => (
                <FeatureNotice key={`unc-${index}`} tone="warning">
                  {item.message ?? item.code ?? "확인할 조건이 있어요."}
                </FeatureNotice>
              ))}
              {unsupportedRules.map((rule, index) => (
                <p className="sd-muted" key={`rule-${index}`}>
                  계산 미반영 조건: {asText(rule)}
                </p>
              ))}
            </section>

            {data.explanation?.text && (
              <section className="ef-card sd-section">
                <h2>비교 결과 설명</h2>
                <p className="sd-muted">{data.explanation.text}</p>
              </section>
            )}

            <section className="ef-card sd-section sd-actions">
              <h2>다음 단계</h2>
              {status === "MISMATCH" && actions.includes("CREATE_COMPLAINT") && (
                <Link className="sd-primary" to={`/petitions/new?comparisonId=${encodeURIComponent(comparisonId)}`}>
                  <FeatureIcon name="file" /> 불일치 결과로 진정서 작성
                </Link>
              )}
              {actions.includes("REQUEST_CONSULTATION") && (
                <Link className="sd-secondary" to={`/consultations/new?comparisonId=${encodeURIComponent(comparisonId)}`}>
                  상담기관에 문의하기
                </Link>
              )}
              {!actions.length && (
                <p className="sd-muted">서버가 허용한 후속 조치가 없습니다.</p>
              )}
            </section>

            <FeatureNotice tone="warning">
              {data.disclaimer ?? "참고용 결과입니다. 법적 판단이 필요하면 노무사·관할기관에 확인하세요."}
            </FeatureNotice>
          </>
        )}
        <Link to="/salary" className="ef-text-link">급여비교로 돌아가기</Link>
      </main>
    </div>
  );
}