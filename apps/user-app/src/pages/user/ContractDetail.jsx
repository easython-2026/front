
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiRequest } from "../../api/client";

export default function ContractDetail() {
  const { contractId } = useParams();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!contractId) return;

    let active = true;

    async function loadContract() {
      try {
        const response = await apiRequest(
          "contract",
          "getDetail",
          {
            params: {
              contractId,
            },
          }
        );

        if (!active) return;

        setContract(response);
        setError("");
      } catch (err) {
        if (!active) return;

        if (err?.status === 401) {
          setError(
            "로그인 인증이 필요합니다."
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "계약서 상세 조회에 실패했습니다."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContract();

    return () => {
      active = false;
    };
  }, [contractId, reloadKey]);

  function handleRefresh() {
    setLoading(true);
    setContract(null);
    setError("");
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
      <h1>근로계약서 상세</h1>

      <p>계약서 ID: {contractId}</p>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? "조회 중..." : "새로고침"}
      </button>

      {loading && (
        <p role="status">
          계약서 정보를 불러오는 중입니다...
        </p>
      )}

      {!loading && error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && contract !== null && (
        <section style={{ marginTop: 24 }}>
          <h2>계약서 및 AI 분석 결과</h2>

          <p>
            서버가 반환한 계약 정보와 OCR 분석
            결과를 확인하는 영역입니다.
          </p>

          <pre
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#f5f5f5",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {JSON.stringify(contract, null, 2)}
          </pre>
        </section>
      )}

      {!loading && !error && contract === null && (
        <p>조회된 계약서 데이터가 없습니다.</p>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/contracts">
          계약서 목록으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
