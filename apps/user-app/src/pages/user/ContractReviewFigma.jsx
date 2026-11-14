
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getContract, updateContractTerms, confirmContractTerms, reanalyzeContract } from "../../api/contract";
import ContractHighlights from "../../components/ContractHighlights";
import { FeatureBadge, FeatureButton, FeatureHeader, FeatureIcon, FeatureNotice, errorText, unwrap } from "../../components/WorkerFeatureUI";

const fields = [
  ["wageType", "급여 유형", "select"],
  ["wageAmount", "급여 금액 (원)", "number"],
  ["workStartTime", "근무 시작 시각", "time"],
  ["workEndTime", "근무 종료 시각", "time"],
  ["breakMinutesPerDay", "하루 휴게시간 (분)", "number"],
  ["mealDeduction", "월 숙식비 공제액 (원)", "number"],
  ["payday", "급여 지급일", "number"],
  ["contractStart", "계약 시작일", "date"],
  ["contractEnd", "계약 종료일", "date"],
  ["employerName", "사업장명", "text"],
  ["employerAddress", "사업장 주소", "text"],
  ["ownerName", "대표자명", "text"],
];
const weekdays = [["MON", "월"], ["TUE", "화"], ["WED", "수"], ["THU", "목"], ["FRI", "금"], ["SAT", "토"], ["SUN", "일"]];
function toForm(terms = {}) {
  const result = {};
  fields.forEach(([key]) => { result[key] = terms[key] == null ? "" : String(terms[key]); });
  result.workDays = Array.isArray(terms.workDays) ? [...terms.workDays] : [];
  return result;
}
function changedFields(now, original) {
  const data = {};
  fields.forEach(([key, , type]) => {
    if (now[key] === original[key]) return;
    data[key] = now[key] === "" ? null : type === "number" ? Number(now[key]) : now[key];
  });
  if ([...now.workDays].sort().join(",") !== [...original.workDays].sort().join(",")) data.workDays = now.workDays;
  return data;
}
function validateChanges(changes) {
  for (const [key, label, type] of fields) {
    const val = changes[key];
    if (val == null) continue;
    if (type === "number" && (!Number.isSafeInteger(val) || val < 0)) return `${label}: 0 이상의 정수를 입력해 주세요.`;
    if (type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(val)) return `${label}: 시간 형식을 확인해 주세요.`;
  }
  if (changes.payday != null && (changes.payday < 1 || changes.payday > 31)) return "급여 지급일은 1~31이어야 합니다.";
  return "";
}

export default function ContractReviewFigma() {
  const { contractId } = useParams();
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({});
  const [original, setOriginal] = useState({});
  const [tab, setTab] = useState("fields");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("");
  const [revision, setRevision] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = unwrap(await getContract(contractId));
      if (!result?.status) throw new Error("계약서 상세 응답에 분석 상태가 없습니다.");
      setContract(result);
      if (result.status !== "PROCESSING") {
        const next = toForm(result.terms);
        setForm(next);
        setOriginal(next);
      }
      return result;
    } catch (e) { setError(errorText(e)); return null; }
    finally { setLoading(false); }
  }, [contractId]);
  useEffect(() => {
    let active = true;
    let timer;
    setLoading(true);
    async function poll() {
      const result = await load();
      if (active && result?.status === "PROCESSING") timer = setTimeout(poll, 3000);
    }
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [load, revision]);

  const status = contract?.status;
  const confirmed = contract?.confirmed === true;
  const processing = status === "PROCESSING";
  const editable = !loading && !busy && !processing && !confirmed && ["DONE", "FAILED"].includes(status);
  const changes = Object.keys(form).length && Object.keys(original).length ? changedFields(form, original) : {};
  const changed = Object.keys(changes).length;
  const clauses = Array.isArray(contract?.clauses) ? contract.clauses : [];
  const reviews = Array.isArray(contract?.reviews) ? contract.reviews : [];

  function change(key, value) { setForm((prev) => ({ ...prev, [key]: value })); setMessage(""); }
  async function save() {
    if (!editable || !changed) return;
    const problem = validateChanges(changes);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try { await updateContractTerms(contractId, changes); setMessage("근로조건 변경 사항이 서버에 저장되었습니다."); setRevision((n) => n + 1); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!editable || changed) return;
    if (!form.wageType || Number(form.wageAmount) <= 0) { setError("급여 유형과 올바른 급여 금액을 확인해 주세요."); return; }
    if (!window.confirm("계약서 원문과 수정 내용을 확인하고 최종 확정하시겠습니까?")) return;
    setBusy(true); setError("");
    try { await confirmContractTerms(contractId); setMessage("계약 조건 확정 요청이 완료되었습니다."); setRevision((n) => n + 1); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function reanalyze() {
    if (!editable || changed) return;
    setBusy(true); setError("");
    try { await reanalyzeContract(contractId, { body: language ? { language } : {} }); setMessage("AI 재분석을 요청했습니다."); setRevision((n) => n + 1); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  return <div className="ef-page"><FeatureHeader title="근로계약서 확인" back="/contracts"/><main className="ef-content">
    {loading && <section className="ef-card ef-loading"><span className="ef-spinner"/><h2>AI가 계약서를 읽고 있어요</h2><p>임금, 휴게, 공제 조건을 확인하는 중입니다.</p></section>}
    {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
    {message && <FeatureNotice tone="success">{message}</FeatureNotice>}
    {contract && processing && <section className="ef-card ef-loading"><span className="ef-spinner"/><h2>AI가 계약서를 읽고 있어요</h2><p>OCR 원문 추출 · 근로조건 확인 · 번역 처리 중</p><small>3초마다 분석 상태를 자동 확인합니다.</small></section>}
    {contract && !processing && <>
      <div className="ef-review-head"><div><p className="ef-eyebrow">AI 분석 결과</p><h1>계약 조건을 확인해 주세요</h1></div><FeatureBadge tone={confirmed ? "success" : "warning"}>{confirmed ? "확정 완료" : `${reviews.length}개 확인 필요`}</FeatureBadge></div>
      <FeatureNotice tone="info">참고용 분석 결과입니다. 법적 위반 여부를 확정하지 않으며 원문을 확인하고 수정할 수 있습니다.</FeatureNotice>
      {status === "FAILED" && <FeatureNotice tone="error">분석에 실패했습니다. {contract.failReason ?? "재분석을 시도해 주세요."}</FeatureNotice>}
      <section className="ef-card"><div className="ef-document-tabs"><button className={tab === "fields" ? "active" : ""} onClick={() => setTab("fields")}>추출 조건</button><button className={tab === "original" ? "active" : ""} onClick={() => setTab("original")}>원본 계약서</button><button className={tab === "translation" ? "active" : ""} onClick={() => setTab("translation")}>번역 대조</button></div>
        {tab === "fields" && <div className="ef-contract-fields">{fields.map(([key, label, type]) => <label key={key}>{label}{type === "select" ? <select value={form[key] ?? ""} disabled={!editable} onChange={(e) => change(key, e.target.value)}><option value="">선택</option><option value="HOURLY">시급</option><option value="MONTHLY">월급</option></select> : <input type={type} value={form[key] ?? ""} disabled={!editable} min={type === "number" ? "0" : undefined} onChange={(e) => change(key, e.target.value)}/>}</label>)}<fieldset disabled={!editable}><legend>근무 요일</legend><div className="ef-days">{weekdays.map(([code, name]) => <label key={code}><input type="checkbox" checked={(form.workDays ?? []).includes(code)} onChange={(e) => change("workDays", e.target.checked ? [...new Set([...(form.workDays ?? []), code])] : form.workDays.filter((day) => day !== code))}/>{name}</label>)}</div></fieldset><p className="ef-muted">변경된 항목: {changed}개</p><FeatureButton disabled={!editable || !changed} onClick={save}>{busy ? "저장 중..." : "변경사항 저장"}</FeatureButton><FeatureButton variant="secondary" disabled={!editable || !changed} onClick={() => setForm({ ...original, workDays: [...(original.workDays ?? [])] })}>변경 취소</FeatureButton></div>}
        {tab === "original" && <div className="ef-original"><ContractHighlights file={contract.file} clauses={clauses} reviews={reviews}/></div>}
        {tab === "translation" && <div className="ef-contract-translation"><p className="ef-muted">번역 언어: {contract.translation?.language ?? "미제공"}</p>{contract.translation?.summary && <p>{contract.translation.summary}</p>}{clauses.length ? clauses.map((clause, i) => <article key={clause.id ?? i}><b>조항 {i + 1}</b><small>한국어 원문</small><p>{clause.originalText ?? "원문 미제공"}</p><small>선택 언어 번역</small><p>{clause.translatedText ?? "번역 정보 미제공"}</p></article>) : <p className="ef-muted">서버에서 제공된 번역 조항이 없습니다.</p>}</div>}
      </section>
      {reviews.map((review, i) => <section key={review.id ?? i} className="ef-card ef-clause-card"><div><FeatureBadge tone="warning">확인 필요</FeatureBadge><b>{review.title ?? review.message ?? `검토 항목 ${i + 1}`}</b></div><p>{clauses.find((clause) => clause.id === review.clauseId)?.originalText ?? "연결된 원문 조항이 없습니다. 원본 계약서 탭에서 확인해 주세요."}</p><div><small>선택 언어 번역</small><p>{clauses.find((clause) => clause.id === review.clauseId)?.translatedText ?? "번역 정보 미제공"}</p></div><button type="button" className="ef-text-link" onClick={() => setTab("original")}>원문 확인하기</button></section>)}
      {confirmed ? <FeatureNotice tone="success">계약 조건이 확정되었습니다.</FeatureNotice> : <FeatureButton disabled={!editable || Boolean(changed) || !form.wageType || Number(form.wageAmount) <= 0} onClick={confirm}>확정하고 저장</FeatureButton>}
      {!confirmed && <section className="ef-card ef-reanalyze"><label>재분석 언어 (선택)<input value={language} placeholder={contract.translation?.language ?? "예: ko, en, vi"} onChange={(e) => setLanguage(e.target.value)}/></label><FeatureButton variant="secondary" disabled={!editable || Boolean(changed)} onClick={reanalyze}><FeatureIcon name="refresh" size={17}/> AI 재분석</FeatureButton></section>}
      <FeatureNotice tone="warning">참고용 초안이며 최종 판단은 노무사·노동청 확인이 필요합니다.</FeatureNotice>
    </>}
    <Link className="ef-text-link" to="/contracts">계약서 목록으로 돌아가기</Link>
  </main></div>;
}
