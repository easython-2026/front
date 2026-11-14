
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

const STATUS_LABELS = {
  RECEIVED: "접수 완료",
  REVIEWING: "상담 검토 중",
  INFO_REQUESTED: "추가 자료 요청",
  REFERRED: "전문기관 연계",
  CLOSED: "상담 종료",
};

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiRequest(
          "consultation",
          "getList",
          { query: { page, size: 20 } }
        );

        if (!active) return;

        const data = response?.data ?? response;

        if (!Array.isArray(data?.consultations)) {
          throw new Error("상담 목록 형식이 올바르지 않습니다.");
        }

        setConsultations(data.consultations);
        setPageInfo(data.pageInfo ?? null);
        setError("");
      } catch (err) {
        if (active) {
          setError(err?.message ?? "상담 목록 조회 실패");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page]);

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <main style={{
      maxWidth: 680,
      padding: 24,
      margin: "0 auto",
    }}>
      <h1>내 상담 내역</h1>

      {loading && <p role="status">상담 목록 조회 중...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && consultations.length === 0 && (
        <p>신청한 상담이 없습니다.</p>
      )}

      {!loading && !error && consultations.map((item) => (
        <section
          key={item.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <h2>{item.agencyName ?? "상담기관"}</h2>
          <p>상태: {STATUS_LABELS[item.status] ?? item.status}</p>
          <p>정보 공유: {item.shared ? "유지 중" : "철회됨"}</p>
          <p>읽지 않은 메시지: {item.unreadMessages ?? 0}개</p>

          {item.createdAt && <p>신청일: {item.createdAt}</p>}

          <Link to={`/consultations/${encodeURIComponent(item.id)}`}>
            상담 상세 보기
          </Link>
        </section>
      ))}

      {pageInfo && (
        <div style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
        }}>
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => changePage(page - 1)}
          >
            이전
          </button>

          <span>
            {page} / {pageInfo.totalPages ?? page}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              page >= (pageInfo.totalPages ?? page)
            }
            onClick={() => changePage(page + 1)}
          >
            다음
          </button>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/salary">급여 비교 화면으로 이동</Link>
      </p>
    </main>
  );
}
