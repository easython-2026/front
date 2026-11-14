
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../../api/client";

function extractEvidences(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.evidences)) {
    return data.evidences;
  }
  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return null;
}

export default function Evidences() {
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvidences() {
      try {
        const response = await apiRequest(
          "report",
          "getEvidences"
        );

        if (!active) return;

        setResponseData(response);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err?.status === 401
            ? "로그인 인증이 필요합니다."
            : err instanceof Error
              ? err.message
              : "증거 목록을 불러오지 못했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvidences();

    return () => {
      active = false;
    };
  }, []);

  const evidences = responseData
    ? extractEvidences(responseData)
    : null;

  return (
    <main style={{
      maxWidth: 680,
      margin: "0 auto",
      padding: 24,
    }}>
      <h1>증거 목록</h1>

      {loading && (
        <p role="status">증거 목록 조회 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && evidences?.length === 0 && (
        <p>등록된 증거가 없습니다.</p>
      )}

      {!loading && !error && evidences === null && (
        <p>증거 목록의 응답 구조를 확인해야 합니다.</p>
      )}

      {!loading && !error && evidences?.length > 0 && (
        <ul>
          {evidences.map((item, index) => (
            <li
              key={item.id ?? index}
              style={{
                padding: 12,
                marginBottom: 12,
                border: "1px solid #ddd",
              }}
            >
              <strong>
                {item.title ??
                  item.type ??
                  `증거 ${index + 1}`}
              </strong>

              {item.occurredAt && (
                <p>발생 시각: {item.occurredAt}</p>
              )}

              <details>
                <summary>증거 정보 확인</summary>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {JSON.stringify(item, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}

      {responseData && (
        <details style={{ marginTop: 20 }}>
          <summary>전체 서버 응답</summary>
          <pre style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}>
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </details>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/reports">
          월별 리포트로 돌아가기
        </Link>
      </p>
    </main>
  );
}
