
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getContracts } from "../../api/contract";
import { FeatureBadge, FeatureHeader, FeatureIcon, FeatureNotice, errorText, unwrap } from "../../components/WorkerFeatureUI";

function asList(response) {
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  return data?.contracts ?? data?.content ?? data?.items ?? null;
}
export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getContracts({ page: 1, size: 20 }).then((response) => {
      if (!active) return;
      const list = asList(response);
      if (!Array.isArray(list)) throw new Error("계약서 목록 응답 형식이 예상과 다릅니다.");
      setContracts(list);
    }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  return <div className="ef-page"><FeatureHeader title="근로계약서 확인"/><main className="ef-content">
    <div className="ef-title"><p className="ef-eyebrow">CONTRACT CHECK</p><h1>계약서를 확인해 주세요</h1><p>계약 조건을 내 언어로 확인하고, 필요한 조항을 살펴볼 수 있어요.</p></div>
    <Link className="ef-option" to="/contracts/new"><span className="ef-option-icon"><FeatureIcon name="camera"/></span><span><b>새 계약서 등록</b><small>카메라 촬영 또는 이미지·PDF 업로드</small></span><FeatureIcon name="chevron"/></Link>
    <div className="ef-section-title"><h2>등록한 계약서</h2><button onClick={() => setReload((n) => n + 1)}><FeatureIcon name="refresh" size={15}/> 새로고침</button></div>
    {loading && <FeatureNotice>등록한 계약서를 불러오는 중...</FeatureNotice>}
    {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
    {!loading && !error && contracts.length === 0 && <section className="ef-card"><p className="ef-muted">아직 등록한 계약서가 없습니다.</p></section>}
    {!loading && !error && contracts.map((item, index) => { const id = item.id ?? item.contractId; const content = <><div><b>{item.title ?? item.fileName ?? `근로계약서 ${index + 1}`}</b><small>{item.employerName ?? "계약 조건 확인"}</small></div><FeatureBadge tone={item.status === "DONE" ? "success" : item.status === "FAILED" ? "error" : "warning"}>{item.confirmed ? "확정 완료" : item.status === "PROCESSING" ? "분석 중" : item.status === "DONE" ? "검토 가능" : item.status ?? "확인 필요"}</FeatureBadge>{id && <FeatureIcon name="chevron" size={15}/>}</>; return id ? <Link className="ef-list-row" key={id} to={`/contracts/${encodeURIComponent(id)}/review`}>{content}</Link> : <div className="ef-list-row" key={index}>{content}</div>; })}
  </main></div>;
}
