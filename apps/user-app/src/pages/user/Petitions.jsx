
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

const STATUS_LABELS = {
  PROCESSING: "생성 중",
  DONE: "생성 완료",
  FAILED: "생성 실패",
};

function formatMoney(value) {
  if (value == null) return "미확인";

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${amount.toLocaleString("ko-KR")}원`
    : "미확인";
}

export default function Petitions() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPetitions() {
      try {
        const response = await apiRequest(
          "report",
          "getComplaints"
        );

        if (!active) return;

        const data = response?.data ?? response;

        const list = Array.isArray(data)
          ? data
          : data?.complaints;

        if (!Array.isArray(list)) {
          throw new Error(
            "진정서 목록 응답 구조를 확인해 주세요."
          );
        }

        setPetitions(list);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err?.status === 401
            ? "로그인 인증이 필요합니다."
            : err instanceof Error
              ? err.message
              : "진정서 목록을 불러오지 못했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPetitions();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setError("");
    setReloadKey((value) => value + 1);
  }

  return (
    <main style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: 24,
    }}>
      <h1>진정서 목록</h1>

      <p>
        생성된 진정서의 진행 상태와
        검토 여부를 확인할 수 있습니다.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={refresh}
      >
        새로고침
      </button>

      {loading && (
        <p role="status">진정서 목록 조회 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && petitions.length === 0 && (
        <p>현재 생성된 진정서가 없습니다.</p>
      )}

      {!loading && !error && petitions.length > 0 && (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {petitions.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #ddd",
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
              }}
            >
              <h2 style={{ fontSize: 18 }}>
                진정서
              </h2>

              <p>
                생성 상태:{" "}
                {STATUS_LABELS[item.status] ??
                  item.status ??
                  "미확인"}
              </p>

              <p>
                사용자 검토:{" "}
                {item.reviewed
                  ? "검토 완료"
                  : "검토 필요"}
              </p>

              <p>
                대상 기간:{" "}
                {item.periodStart ?? "미확인"} ~{" "}
                {item.periodEnd ?? "미확인"}
              </p>

              <p>
                차이 금액:{" "}
                {formatMoney(item.unpaidAmount)}
              </p>

              {item.createdAt && (
                <p>생성 시각: {item.createdAt}</p>
              )}

              {item.id && (
                <Link
                  to={`/petitions/${encodeURIComponent(item.id)}`}
                >
                  진정서 상세 보기
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/salary">
          급여 비교 화면으로 이동
        </Link>
      </p>
    </main>
  );
}
