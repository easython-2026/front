
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiRequest } from "../../api/client";
import ContractHighlights from "../../components/ContractHighlights";

const FIELDS = [
  { key: "wageType", label: "급여 유형", type: "select" },
  { key: "wageAmount", label: "급여 금액 (원)", type: "number" },
  { key: "workStartTime", label: "근무 시작 시각", type: "time" },
  { key: "workEndTime", label: "근무 종료 시각", type: "time" },
  { key: "breakMinutesPerDay", label: "하루 휴게시간 (분)", type: "number" },
  { key: "workDays", label: "근무 요일", type: "days" },
  { key: "mealDeduction", label: "월 숙식비 공제액 (원)", type: "number" },
  { key: "payday", label: "급여 지급일", type: "number" },
  { key: "contractStart", label: "계약 시작일", type: "date" },
  { key: "contractEnd", label: "계약 종료일", type: "date" },
  { key: "employerName", label: "사업장명", type: "text" },
  { key: "employerAddress", label: "사업장 주소", type: "text" },
  { key: "ownerName", label: "대표자명", type: "text" },
];

const DAYS = [
  ["MON", "월"],
  ["TUE", "화"],
  ["WED", "수"],
  ["THU", "목"],
  ["FRI", "금"],
  ["SAT", "토"],
  ["SUN", "일"],
];

function unwrap(response) {
  return response?.data ?? response;
}

function makeForm(terms) {
  const form = {};

  for (const field of FIELDS) {
    const value = terms?.[field.key];

    form[field.key] =
      field.type === "days"
        ? Array.isArray(value) ? [...value] : []
        : value == null ? "" : String(value);
  }

  return form;
}

function makeChanges(form, original) {
  const changes = {};

  for (const field of FIELDS) {
    const key = field.key;
    const current = form[key];
    const previous = original[key];

    if (field.type === "days") {
      if (
        [...current].sort().join(",") !==
        [...previous].sort().join(",")
      ) {
        changes[key] = current;
      }

      continue;
    }

    if (current === previous) continue;

    changes[key] =
      field.type === "number"
        ? current === "" ? null : Number(current)
        : current === "" ? null : current;
  }

  return changes;
}

function validateChanges(changes) {
  for (const field of FIELDS) {
    const value = changes[field.key];

    if (value == null) continue;

    if (
      field.type === "number" &&
      (!Number.isSafeInteger(value) || value < 0)
    ) {
      return `${field.label}: 0 이상의 정수를 입력하세요.`;
    }

    if (
      field.type === "time" &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ) {
      return `${field.label}: HH:mm 형식으로 입력하세요.`;
    }

    if (
      field.type === "date" &&
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return `${field.label}: 날짜를 확인해 주세요.`;
    }
  }

  if (
    changes.payday != null &&
    (changes.payday < 1 || changes.payday > 31)
  ) {
    return "급여 지급일은 1~31 사이여야 합니다.";
  }

  return null;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 토큰이 필요합니다. 프론트엔드 인증 우회와 백엔드 인증은 별개입니다.";
  }

  if (error?.status === 404) {
    return "계약서를 찾을 수 없습니다.";
  }

  if (error?.status === 409) {
    return "현재 계약서 상태에서는 요청을 처리할 수 없습니다.";
  }

  return error instanceof Error
    ? error.message
    : "요청에 실패했습니다.";
}

export default function ContractReview() {
  const { contractId } = useParams();

  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({});
  const [originalForm, setOriginalForm] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const [language, setLanguage] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ========================================
  // 계약서 조회 및 분석 상태 폴링
  // ========================================
  useEffect(() => {
    if (!contractId) return;

    let cancelled = false;
    let timer;

    async function loadContract() {
      try {
        const response = await apiRequest(
          "contract",
          "getDetail",
          { params: { contractId } }
        );

        if (cancelled) return;

        const data = unwrap(response);

        if (!data || !data.status) {
          throw new Error(
            "계약서 상세 응답을 확인할 수 없습니다."
          );
        }

        setContract(data);
        setError("");
        setLoading(false);

        if (data.status !== "PROCESSING") {
          const nextForm = makeForm(data.terms);
          setForm(nextForm);
          setOriginalForm(nextForm);
        }

        if (data.status === "PROCESSING") {
          timer = setTimeout(loadContract, 3000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    }

    loadContract();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [contractId, reloadKey]);

  const status = contract?.status;
  const processing = status === "PROCESSING";
  const confirmed = contract?.confirmed === true;

  const busy =
    loading || saving || confirming || reanalyzing;

  const canEdit =
    !busy &&
    !processing &&
    !confirmed &&
    ["DONE", "FAILED"].includes(status);

  const changes =
    Object.keys(form).length > 0
      ? makeChanges(form, originalForm)
      : {};

  const changeCount = Object.keys(changes).length;

  const reviews = Array.isArray(contract?.reviews)
    ? contract.reviews
    : [];

  const clauses = Array.isArray(contract?.clauses)
    ? contract.clauses
    : [];

  // ========================================
  // 입력 관리
  // ========================================
  function updateField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setMessage("");
  }

  function updateDay(code, checked) {
    setForm((previous) => ({
      ...previous,
      workDays: checked
        ? [...new Set([...(previous.workDays ?? []), code])]
        : (previous.workDays ?? []).filter(
            (day) => day !== code
          ),
    }));
    setMessage("");
  }

  function refresh() {
    setError("");
    setReloadKey((value) => value + 1);
  }

  // ========================================
  // 근로조건 수정 API
  // ========================================
  async function saveTerms() {
    if (!canEdit || changeCount === 0) return;

    const validationError = validateChanges(changes);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("contract", "updateTerms", {
        params: { contractId },
        body: changes,
      });

      setMessage(
        "수정한 근로조건이 저장되었습니다."
      );

      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // AI 재분석 API
  // ========================================
  async function reanalyze() {
    if (
      busy ||
      confirmed ||
      !["DONE", "FAILED"].includes(status)
    ) {
      return;
    }

    if (changeCount > 0) {
      setError(
        "저장되지 않은 수정사항이 있습니다. 먼저 저장하거나 변경을 취소해 주세요."
      );
      return;
    }

    if (
      !window.confirm(
        "근로계약서를 AI로 다시 분석하시겠습니까?"
      )
    ) {
      return;
    }

    setReanalyzing(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(
        "contract",
        "reanalyze",
        {
          params: { contractId },
          body: language ? { language } : {},
        }
      );

      const result = unwrap(response);

      if (result?.status !== "PROCESSING") {
        setMessage(
          "재분석 요청이 접수되었습니다. 상태를 다시 조회합니다."
        );
      } else {
        setMessage(
          "AI 재분석이 시작되었습니다."
        );
      }

      // 서버 상태 재조회. PROCESSING이면 자동 폴링.
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReanalyzing(false);
    }
  }

  // ========================================
  // 최종 확정 API
  // ========================================
  async function confirmContract() {
    if (!canEdit || changeCount !== 0) return;

    if (
      !form.wageType ||
      form.wageAmount === "" ||
      Number(form.wageAmount) <= 0
    ) {
      setError(
        "급여 유형과 올바른 급여 금액이 필요합니다."
      );
      return;
    }

    if (
      !window.confirm(
        "계약서 원문과 수정 내용을 모두 확인하고 최종 확정하시겠습니까?"
      )
    ) {
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const response = await apiRequest(
        "contract",
        "confirmTerms",
        { params: { contractId } }
      );

      const result = unwrap(response);

      setMessage(
        result?.businessAutoFilled
          ? "계약서가 확정되었고 사업장 정보가 자동 반영되었습니다."
          : "확정 요청이 처리되었습니다. 확정 상태를 다시 확인합니다."
      );

      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <h1>근로계약서 분석 및 검토</h1>

      <p>계약서 ID: {contractId}</p>

      <button
        type="button"
        disabled={busy}
        onClick={refresh}
      >
        다시 조회
      </button>

      {loading && <p role="status">불러오는 중...</p>}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status">{message}</p>
      )}

      {contract && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>1. 분석 상태</h2>

            <p>상태: {status}</p>
            <p>
              최종 확정:{" "}
              {confirmed ? "완료" : "미확정"}
            </p>

            {processing && (
              <p role="status">
                AI 분석 중입니다. 3초마다 조회합니다.
              </p>
            )}

            {status === "FAILED" && (
              <p>
                분석 실패:{" "}
                {contract.failReason ?? "사유 미제공"}
              </p>
            )}
          </section>

          {/* AI 재분석 */}
          <section style={{ marginTop: 24 }}>
            <h2>2. AI 재분석</h2>

            <p>
              분석이 완료되었거나 실패한 계약서를
              다시 분석할 수 있습니다.
            </p>

            <label htmlFor="reanalyze-language">
              재분석 언어 (선택)
            </label>

            <input
              id="reanalyze-language"
              type="text"
              placeholder={
                contract.translation?.language ??
                "예: vi, en, ko"
              }
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              disabled={
                busy ||
                processing ||
                confirmed ||
                !["DONE", "FAILED"].includes(status)
              }
            />

            <p style={{ fontSize: 12 }}>
              비워 두면 서버의 현재 선택 언어를
              사용합니다.
            </p>

            <button
              type="button"
              onClick={reanalyze}
              disabled={
                busy ||
                confirmed ||
                changeCount > 0 ||
                !["DONE", "FAILED"].includes(status)
              }
            >
              {reanalyzing
                ? "재분석 요청 중..."
                : "AI 재분석"}
            </button>
          </section>

          {/* 원본 이미지 하이라이트 */}
          {status === "DONE" && (
            <section style={{ marginTop: 32 }}>
              <h2>3. 계약서 원본 및 검토 위치</h2>

              <ContractHighlights
                file={contract.file}
                clauses={clauses}
                reviews={reviews}
              />
            </section>
          )}

          {/* 근로조건 수정 */}
          {!processing && (
            <section style={{ marginTop: 32 }}>
              <h2>4. 근로조건 확인 및 수정</h2>

              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  style={{ marginBottom: 16 }}
                >
                  <label
                    htmlFor={`field-${field.key}`}
                    style={{
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <select
                      id={`field-${field.key}`}
                      value={form[field.key] ?? ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        updateField(
                          field.key,
                          event.target.value
                        )
                      }
                    >
                      <option value="">선택</option>
                      <option value="HOURLY">시급</option>
                      <option value="MONTHLY">월급</option>
                    </select>
                  ) : field.type === "days" ? (
                    <div id={`field-${field.key}`}>
                      {DAYS.map(([code, label]) => (
                        <label
                          key={code}
                          style={{ marginRight: 12 }}
                        >
                          <input
                            type="checkbox"
                            checked={(
                              form.workDays ?? []
                            ).includes(code)}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updateDay(
                                code,
                                event.target.checked
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type={field.type}
                      min={
                        field.type === "number"
                          ? 0
                          : undefined
                      }
                      step={
                        field.type === "number"
                          ? 1
                          : undefined
                      }
                      value={form[field.key] ?? ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        updateField(
                          field.key,
                          event.target.value
                        )
                      }
                    />
                  )}
                </div>
              ))}

              <p>
                변경된 항목: {changeCount}개
              </p>

              <button
                type="button"
                onClick={saveTerms}
                disabled={!canEdit || changeCount === 0}
              >
                {saving
                  ? "저장 중..."
                  : "변경사항 저장"}
              </button>

              <button
                type="button"
                disabled={!canEdit || changeCount === 0}
                onClick={() => {
                  setForm(makeForm(contract.terms));
                  setMessage("수정사항을 취소했습니다.");
                }}
                style={{ marginLeft: 8 }}
              >
                변경 취소
              </button>
            </section>
          )}

          {/* 번역 및 검토 항목 */}
          {status === "DONE" && (
            <section style={{ marginTop: 32 }}>
              <h2>5. AI 번역 및 검토 결과</h2>

              <p>
                번역 언어:{" "}
                {contract.translation?.language ??
                  "미제공"}
              </p>

              <p>
                {contract.translation?.summary ??
                  "번역 요약이 없습니다."}
              </p>

              {clauses.map((clause, index) => {
                const related = reviews.filter(
                  (review) =>
                    review.clauseId != null &&
                    review.clauseId === clause.id
                );

                return (
                  <div
                    key={clause.id ?? index}
                    style={{
                      border: "1px solid #ddd",
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <strong>조항 {index + 1}</strong>

                    <p>
                      원문: {clause.originalText}
                    </p>

                    <p>
                      번역: {clause.translatedText}
                    </p>

                    {related.map((review, i) => (
                      <p
                        key={i}
                        style={{
                          color:
                            review.level === "CHECK"
                              ? "#b42318"
                              : "#a15c00",
                        }}
                      >
                        [{review.level}] {review.message}
                      </p>
                    ))}
                  </div>
                );
              })}

              <h3>조항에 연결되지 않은 확인 사항</h3>

              {reviews
                .filter(
                  (review) =>
                    !review.clauseId ||
                    !clauses.some(
                      (clause) =>
                        clause.id === review.clauseId
                    )
                )
                .map((review, index) => (
                  <p key={index}>
                    [{review.level}] {review.message}
                  </p>
                ))}
            </section>
          )}

          {/* 최종 확정 */}
          {!processing && (
            <section style={{ marginTop: 32 }}>
              <h2>6. 근로계약서 최종 확정</h2>

              <p>
                계약서 원문과 수정 내용을 확인하고
                최종 확정해 주세요.
              </p>

              <button
                type="button"
                onClick={confirmContract}
                disabled={
                  !canEdit ||
                  changeCount > 0 ||
                  !form.wageType ||
                  !form.wageAmount
                }
              >
                {confirming
                  ? "확정 중..."
                  : confirmed
                    ? "확정 완료"
                    : "최종 확정"}
              </button>
            </section>
          )}

          {contract.disclaimer && (
            <p style={{ marginTop: 24 }}>
              {contract.disclaimer}
            </p>
          )}
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/contracts">
          계약서 목록으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
