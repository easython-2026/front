
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import { apiRequest } from "../../api/client";

const SCOPE_OPTIONS = [
  { value: "CONTRACT", label: "근로계약서" },
  { value: "ATTENDANCE", label: "출퇴근·근무기록" },
  { value: "PAYSLIP", label: "급여명세서" },
  { value: "COMPLAINT_DRAFT", label: "진정서 초안" },
];

const TYPE_LABELS = {
  LABOR_OFFICE: "노동청",
  SUPPORT_CENTER: "이주민 지원센터",
  NGO: "시민단체",
};

function unwrap(response) {
  return response?.data ?? response;
}

function money(value) {
  if (value == null) return "미제공";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function errorMessage(error) {
  const code =
    error?.errorCode ??
    error?.data?.errorCode ??
    error?.data?.error?.code;

  if (code === "DUPLICATED_CONSULTATION") {
    return "이 기관에 동일한 임금 비교 결과로 진행 중인 상담이 있습니다.";
  }

  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  return error?.message ?? "상담 신청에 실패했습니다.";
}

export default function ConsultationCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const comparisonId = searchParams.get("comparisonId") ?? "";

  const [comparison, setComparison] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [evidences, setEvidences] = useState([]);

  const [agencyId, setAgencyId] = useState("");
  const [scopes, setScopes] = useState(["SUMMARY"]);
  const [evidenceIds, setEvidenceIds] = useState([]);
  const [complaintId, setComplaintId] = useState("");
  const [memo, setMemo] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(Boolean(comparisonId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  if (!comparisonId) return;

  let active = true;

    async function loadData() {
      try {
        const [comparisonResponse, agencyResponse] =
          await Promise.all([
            apiRequest("salary", "getComparison", {
              params: { comparisonId },
            }),
            apiRequest("consultation", "getAgencies"),
          ]);

        if (!active) return;

        const nextComparison = unwrap(comparisonResponse);
        const nextAgencies = unwrap(agencyResponse)?.agencies;

        if (!Array.isArray(nextAgencies)) {
          throw new Error("상담기관 응답 형식이 올바르지 않습니다.");
        }

        setComparison(nextComparison);
        setAgencies(nextAgencies);

        // 증거 목록 전체 조회
        const collected = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await apiRequest(
            "report",
            "getEvidences",
            { query: { page, size: 20 } }
          );

          if (!active) return;

          const data = unwrap(response);

          if (!Array.isArray(data?.evidences)) {
            throw new Error("증거 목록 응답을 확인할 수 없습니다.");
          }

          collected.push(...data.evidences);

          const pages = Number(data.pageInfo?.totalPages ?? 1);

          if (!Number.isSafeInteger(pages) || pages < 1) {
            throw new Error("증거 페이지 정보를 확인할 수 없습니다.");
          }

          totalPages = pages;
          page += 1;
        } while (page <= totalPages);

        if (!active) return;

        setEvidences([
          ...new Map(
            collected
              .filter((item) => item?.id)
              .map((item) => [item.id, item])
          ).values(),
        ]);

        setError("");
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [comparisonId]);

  function toggleScope(value, checked) {
    setScopes((previous) =>
      checked
        ? [...new Set([...previous, value])]
        : previous.filter((scope) => scope !== value)
    );

    if (value === "COMPLAINT_DRAFT" && !checked) {
      setComplaintId("");
    }
  }

  function toggleEvidence(id, checked) {
    setEvidenceIds((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((item) => item !== id)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || submitting) return;

    if (!agencyId) {
      setError("상담기관을 선택해 주세요.");
      return;
    }

    if (!agreed) {
      setError("정보 공유에 동의해야 상담을 신청할 수 있습니다.");
      return;
    }

    if (scopes.includes("COMPLAINT_DRAFT") && !complaintId.trim()) {
      setError("진정서 초안을 공유하려면 진정서 ID를 입력해 주세요.");
      return;
    }

    // 증거 목록을 조회했으나 선택한 증거가 없으면
    // evidenceIds 생략 시 전체 공유로 해석될 수 있으므로 차단
    if (evidenceIds.length === 0) {
      setError("공유할 증거를 최소 1개 선택해 주세요.");
      return;
    }

    if (
      !window.confirm(
        "선택한 상담기관에 지정한 자료와 사건 요약을 공유하고 상담을 신청하시겠습니까?"
      )
    ) {
      return;
    }

    const body = {
      agencyId,
      comparisonId,
      consent: {
        sharedScope: scopes,
        evidenceIds,
        agreedAt: new Date().toISOString(),
      },
    };

    if (scopes.includes("COMPLAINT_DRAFT")) {
      body.complaintId = complaintId.trim();
    }

    if (memo.trim()) {
      body.memo = memo.trim();
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest(
        "consultation",
        "create",
        { body }
      );

      const data = unwrap(response);

      if (!data?.consultationId) {
        throw new Error("상담 신청 결과 ID가 없습니다.");
      }

      navigate(
        `/consultations/${encodeURIComponent(data.consultationId)}`
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!comparisonId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>상담 신청</h1>
        <p>먼저 임금 비교 결과를 선택해 주세요.</p>
        <Link to="/salary">급여 비교로 이동</Link>
      </main>
    );
  }

  return (
    <main style={{
      maxWidth: 680,
      padding: 24,
      margin: "0 auto",
    }}>
      <h1>노동 상담 신청</h1>

      {loading && <p role="status">상담 정보를 불러오는 중...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && comparison && (
        <section>
          <h2>1. 상담할 사건</h2>
          <p>비교 월: {comparison.month ?? "미확인"}</p>
          <p>분석 상태: {comparison.status ?? "미확인"}</p>
          <p>예상 임금: {money(comparison.expectedAmount)}</p>
          <p>실제 지급액: {money(comparison.actualAmount)}</p>
          <p>차이 금액: {money(comparison.differenceAmount)}</p>
          <p>비교 ID: {comparisonId}</p>

          {comparison.explanation?.text && (
            <p>{comparison.explanation.text}</p>
          )}
        </section>
      )}

      {!loading && comparison && (
        <form onSubmit={handleSubmit}>
          <section style={{ marginTop: 28 }}>
            <h2>2. 상담기관 선택</h2>

            <label htmlFor="agency">기관</label>
            <select
              id="agency"
              value={agencyId}
              onChange={(event) => setAgencyId(event.target.value)}
              required
              disabled={submitting}
            >
              <option value="">상담기관 선택</option>

              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>

            {agencies.length === 0 && (
              <p>조회된 상담기관이 없습니다.</p>
            )}

            {agencies
              .filter((item) => item.id === agencyId)
              .map((item) => (
                <div key={item.id}>
                  <p>기관 유형: {TYPE_LABELS[item.type] ?? item.type}</p>
                  {item.address && <p>주소: {item.address}</p>}
                  {item.phone && <p>연락처: {item.phone}</p>}
                  <p>지원 언어: {item.languages?.join(", ") || "미제공"}</p>
                </div>
              ))}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>3. 공유할 정보 선택</h2>

            <label style={{ display: "block", marginBottom: 12 }}>
              <input type="checkbox" checked disabled />
              사건 요약 (필수)
            </label>

            {SCOPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                style={{ display: "block", marginBottom: 12 }}
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(option.value)}
                  disabled={submitting}
                  onChange={(event) =>
                    toggleScope(option.value, event.target.checked)
                  }
                />
                {option.label}
              </label>
            ))}

            {scopes.includes("COMPLAINT_DRAFT") && (
              <div>
                <label htmlFor="complaint-id">
                  공유할 진정서 ID
                </label>
                <input
                  id="complaint-id"
                  value={complaintId}
                  onChange={(event) => setComplaintId(event.target.value)}
                  required
                  disabled={submitting}
                  placeholder="진정서 ID"
                />
                <p>
                  생성한 진정서의 실제 ID를 입력해 주세요.
                </p>
              </div>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>4. 개별 증거 선택</h2>

            <p>
              선택한 증거 ID만 요청에 포함합니다.
              수동 입력 자료는 현장 인증 자료와 구분됩니다.
            </p>

            {evidences.length === 0 && (
              <p>선택 가능한 증거가 없습니다.</p>
            )}

            {evidences.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "block",
                  padding: 12,
                  marginBottom: 8,
                  border: "1px solid #ddd",
                }}
              >
                <input
                  type="checkbox"
                  checked={evidenceIds.includes(item.id)}
                  onChange={(event) =>
                    toggleEvidence(item.id, event.target.checked)
                  }
                  disabled={submitting}
                />

                <strong>{item.title ?? item.type ?? "증거"}</strong>

                {item.occurredAt && <p>{item.occurredAt}</p>}
                {item.type === "MANUAL_RECORD" && (
                  <p>수동 입력 기록 (현장 인증 자료 아님)</p>
                )}
              </label>
            ))}

            <p>선택한 증거: {evidenceIds.length}개</p>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>5. 상담 희망 내용</h2>

            <label htmlFor="consultation-memo">
              상담기관에 전달할 내용 (선택)
            </label>

            <textarea
              id="consultation-memo"
              rows={5}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              disabled={submitting}
              style={{ display: "block", width: "100%" }}
              placeholder="상담받고 싶은 내용을 입력해 주세요."
            />
            <p>
              입력한 내용은 서버에서 한국어로 번역되어
              상담기관에 전달될 수 있습니다.
            </p>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>6. 정보 공유 동의</h2>

            <p>
              선택한 상담기관에 사건 요약과 지정한 자료가
              공유됩니다. 공유 동의 시각도 함께 기록됩니다.
            </p>

            <label>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                disabled={submitting}
              />
              위 자료의 상담 목적 공유에 동의합니다.
            </label>
          </section>

          <button
            type="submit"
            disabled={
              submitting ||
              !agencyId ||
              !agreed ||
              evidenceIds.length === 0
            }
            style={{ marginTop: 24 }}
          >
            {submitting ? "신청 중..." : "상담 신청하기"}
          </button>
        </form>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/salary">급여 비교로 돌아가기</Link>
      </p>
    </main>
  );
}