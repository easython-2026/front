
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { apiRequest } from "../../api/client";

// 계약서 목록 응답 구조가 다른 경우를 대비한 변환
function extractContracts(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }

  if (Array.isArray(response?.data?.contracts)) {
    return response.data.contracts;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.contracts)) {
    return response.contracts;
  }

  return null;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 인증이 필요합니다. 백엔드 인증 토큰을 확인해 주세요.";
  }

  return error instanceof Error
    ? error.message
    : "근로계약서 목록을 불러오지 못했습니다.";
}

export default function Contracts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadContracts() {
      try {
        const response = await apiRequest(
          "contract",
          "getList"
        );

        if (!active) return;

        setData(response);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(getErrorMessage(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContracts();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const contracts =
    data === null ? null : extractContracts(data);

  function handleRefresh() {
    setLoading(true);
    setError("");
    setData(null);
    setReloadKey((previous) => previous + 1);
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1>근로계약서 관리</h1>

      <p>
        등록한 근로계약서를 확인하고
        새로운 계약서를 업로드할 수 있습니다.
      </p>

      <section style={{ marginBottom: 24 }}>
        <Link to="/contracts/new">
          + 근로계약서 등록하기
        </Link>
      </section>

      <section>
        <h2>내 근로계약서</h2>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "조회 중..." : "새로고침"}
        </button>

        {loading && (
          <p role="status">
            계약서 목록을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          contracts?.length === 0 && (
            <p>아직 등록된 근로계약서가 없습니다.</p>
          )}

        {!loading &&
          !error &&
          contracts &&
          contracts.length > 0 && (
            <ul>
              {contracts.map((contract, index) => {
                const contractId =
                  contract.id ??
                  contract.contractId;

                return (
                  <li
                    key={contractId ?? index}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      border: "1px solid #ddd",
                    }}
                  >
                    <p>
                      <strong>
                        {contract.title ??
                          contract.fileName ??
                          `근로계약서 ${index + 1}`}
                      </strong>
                    </p>

                    <p>
                      상태:{" "}
                      {contract.status ?? "확인 필요"}
                    </p>

                    {contractId != null && (
                      <Link
                        to={`/contracts/${encodeURIComponent(
                          contractId
                        )}`}
                      >
                        상세 보기
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

        {!loading &&
          !error &&
          data !== null &&
          contracts === null && (
            <p>
              서버 응답의 목록 구조를 확인해야 합니다.
            </p>
          )}

        {!loading && data !== null && (
          <details style={{ marginTop: 24 }}>
            <summary>서버 원본 응답 확인</summary>

            <pre
              style={{
                padding: 12,
                background: "#f5f5f5",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </section>

      <p style={{ marginTop: 32 }}>
        <Link to="/home">홈으로 이동</Link>
      </p>
    </main>
  );
}
