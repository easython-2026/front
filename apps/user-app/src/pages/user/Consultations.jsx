import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getConsultations } from "../../api/consultation";
import {
  FeatureBadge,
  FeatureHeader,
  FeatureIcon,
  FeatureNotice,
  displayKst,
  errorText,
  unwrap,
} from "../../components/WorkerFeatureUI";

const STATUS_LABELS = {
  RECEIVED: "접수 완료",
  REVIEWING: "상담 검토 중",
  INFO_REQUESTED: "추가 자료 요청",
  REFERRED: "전문기관 연계",
  CLOSED: "상담 종료",
};

function parseResponse(response) {
  const data = unwrap(response);
  const consultations = Array.isArray(data)
    ? data
    : data?.consultations ?? data?.content;
  if (!Array.isArray(consultations)) {
    throw new Error("상담 목록 응답 형식을 확인할 수 없습니다.");
  }
  return {
    consultations,
    pageInfo: data?.pageInfo ?? null,
  };
}

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getConsultations({ page, size: 20 })
      .then((response) => {
        if (!active) return;
        const result = parseResponse(response);
        setConsultations(result.consultations);
        setPageInfo(result.pageInfo);
      })
      .catch((err) => {
        if (!active) return;
        setConsultations([]);
        setError(errorText(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reload]);

  const totalPages = Number(pageInfo?.totalPages);
  const canNext = Number.isSafeInteger(totalPages)
    ? page < totalPages
    : pageInfo?.hasNext === true;

  return (
    <div className="ef-page">
      <FeatureHeader title="상담 내역" back="/salary" />
      <main className="ef-content">
        <div className="ef-title">
          <p className="ef-eyebrow">MY CONSULTATIONS</p>
          <h1>나의 상담 진행 현황</h1>
          <p>공유 내역과 기관 답변을 확인할 수 있어요.</p>
        </div>

        <div className="ef-section-title">
          <h2>상담 신청 목록</h2>
          <button type="button" disabled={loading} onClick={() => setReload((v) => v + 1)}>
            <FeatureIcon name="refresh" size={15} /> 새로고침
          </button>
        </div>

        {loading && <FeatureNotice>상담 목록을 조회하고 있어요.</FeatureNotice>}
        {error && <FeatureNotice tone="error">{error}</FeatureNotice>}
        {!loading && !error && consultations.length === 0 && (
          <section className="ef-card">
            <p className="ef-muted">이 페이지에 상담 내역이 없어요. 급여 비교 후 상담을 신청할 수 있어요.</p>
          </section>
        )}

        {!loading && !error && consultations.map((item) => (
          <section className="ef-card" key={item.id ?? item.consultationId}>
            <div className="ef-section-title">
              <h2>{item.agencyName ?? "상담기관"}</h2>
              <FeatureBadge tone={item.status === "CLOSED" ? "neutral" : "info"}>
                {STATUS_LABELS[item.status] ?? item.status ?? "상태 미확인"}
              </FeatureBadge>
            </div>
            <div className="ef-detail-list">
              <div><FeatureIcon name="shield" /><span><b>정보 공유</b><small>{item.shared === false ? "철회됨" : item.shared === true ? "동의 유지" : "상태 확인 필요"}</small></span></div>
              <div><FeatureIcon name="file" /><span><b>읽지 않은 메시지</b><small>{item.unreadMessages ?? 0}개</small></span></div>
              {item.createdAt && (
                <div><FeatureIcon name="calendar" /><span><b>신청 시각</b><small>{displayKst(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</small></span></div>
              )}
            </div>
            {(item.id ?? item.consultationId) != null && (
              <Link
                className="ef-button ef-button-secondary"
                to={`/consultations/${encodeURIComponent(item.id ?? item.consultationId)}`}
              >
                상담 상세 및 메시지 보기 <FeatureIcon name="chevron" size={16} />
              </Link>
            )}
          </section>
        ))}

        {pageInfo && (
          <div className="ef-section-title">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((v) => v - 1)}>이전</button>
            <span>{page}{Number.isSafeInteger(totalPages) && totalPages > 0 ? ` / ${totalPages}` : ""}</span>
            <button type="button" disabled={loading || !canNext} onClick={() => setPage((v) => v + 1)}>다음</button>
          </div>
        )}
        <Link className="ef-text-link" to="/salary">급여 비교로 돌아가기</Link>
      </main>
    </div>
  );
}