
import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";

import { apiRequest } from "../../api/client";

import "../../styles/figma-petition.css";

/* ============================================
   공통 함수
============================================ */

const unwrap = (response) =>
  response?.data ?? response;

// 서버 오류 메시지
function humanError(error) {
  if (error?.errorCode === "NOT_MISMATCH") {
    return "임금 비교 결과가 불일치인 경우에만 진정서를 생성할 수 있어요.";
  }

  if (
    error?.errorCode ===
    "BUSINESS_INFO_REQUIRED"
  ) {
    return "사업장 정보가 필요해요. 내 정보에서 사업장을 등록해 주세요.";
  }

  if (error?.status === 401) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }

  if (error?.status === 403) {
    return "해당 자료에 접근할 권한이 없습니다.";
  }

  if (error?.status === 404) {
    return "선택한 급여 비교 결과를 찾을 수 없습니다.";
  }

  if (error?.status === 400) {
    return (
      error?.message ??
      "서버에서 요청값을 올바르지 않다고 판단했습니다."
    );
  }

  return (
    error?.message ??
    "정보를 불러오지 못했습니다."
  );
}

// 서버 목록 응답 정규화
function listOf(response, key) {
  const data = unwrap(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

// Monthly comparison endpoint returns ONE overview, not a comparisons array.
function mismatchOption(response) {
  const data = unwrap(response);
  if (data?.state !== "COMPARED" ||
      data.comparison?.status !== "MISMATCH" ||
      !data.comparison?.id) return [];
  return [{ ...data.comparison, month: data.month }];
}
function localMonth() {
  const fields = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const value = (key) => fields.find((f) => f.type === key)?.value;
  return `${value("year")}-${value("month")}`;
}

// 실제 비교 ID 확인
function getComparisonId(item) {
  const id =
    item?.comparisonId ??
    item?.id;

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {
    return null;
  }

  return String(id);
}

// 불일치 비교 결과인지 확인
function isMismatch(item) {
  const status =
    item?.status ??
    item?.comparisonStatus ??
    item?.resultStatus;

  return (
    String(status ?? "").toUpperCase() ===
    "MISMATCH"
  );
}

// 날짜 형식 검사
function dateValid(value) {
  return (
    !value ||
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(
      value
    )
  );
}

// 금액 표시
function money(value) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    return "미확인";
  }

  return `${Number(value).toLocaleString(
    "ko-KR"
  )}원`;
}

/* ============================================
   Figma 진행 단계
============================================ */

function StepBar() {
  const steps = [
    "정보 불러오기",
    "대조본 검토",
    "증거·PDF",
  ];

  return (
    <div
      className="pf-stepper"
      aria-label="진정서 진행 단계"
    >
      {steps.map((label, index) => (
        <div
          key={label}
          className={
            index === 0 ? "active" : ""
          }
        >
          <i>{index + 1}</i>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   Figma 정보 조회 행
============================================ */

function InformationRow({
  label,
  ok,
  detail,
  loading,
}) {
  return (
    <div>
      <span
        className={`pf-check ${
          ok ? "ok" : ""
        }`}
      >
        {ok ? "✓" : "!"}
      </span>

      <span className="pf-load-text">
        <b>{label}</b>

        <small>
          {loading
            ? "확인 중..."
            : detail}
        </small>
      </span>

      <em
        className={`pf-pill ${
          ok ? "pf-good" : "pf-warn"
        }`}
      >
        {loading
          ? "확인 중"
          : ok
          ? "불러옴"
          : "확인 필요"}
      </em>
    </div>
  );
}

/* ============================================
   진정서 정보 불러오기 메인
============================================ */

export default function PetitionCreate() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  // 급여 비교 화면에서 직접 전달한 ID
  const fromUrl =
    searchParams.get("comparisonId") ?? "";
  const [month, setMonth] = useState(() => searchParams.get("month") || localMonth());

  /* ==========================================
     상태 관리
  ========================================== */

  // 급여 비교 목록
  const [
    candidateList,
    setCandidateList,
  ] = useState([]);

  // 현재 선택한 급여 비교 ID
  const [
    selected,
    setSelected,
  ] = useState(fromUrl);

  // 선택한 비교 상세
  const [
    comparison,
    setComparison,
  ] = useState(null);

  // 계약서, 근무기록, 증거, 사업장
  const [
    source,
    setSource,
  ] = useState(null);

  // 근무기간
  const [
    periodStart,
    setPeriodStart,
  ] = useState("");

  const [
    periodEnd,
    setPeriodEnd,
  ] = useState("");

  // 로딩
  const [
    listLoading,
    setListLoading,
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    creating,
    setCreating,
  ] = useState(false);

  // API 오류
  const [
    listError,
    setListError,
  ] = useState("");

  const [
    detailError,
    setDetailError,
  ] = useState("");

  const [
    createError,
    setCreateError,
  ] = useState("");

  // 급여 비교 목록 다시 조회
  const [
    listReload,
    setListReload,
  ] = useState(0);

  const loading =
    listLoading || detailLoading;

  /* ==========================================
     URL에서 전달받은 비교 ID 반영
  ========================================== */

  useEffect(() => {
    if (fromUrl) {
      setSelected(fromUrl);
    }
  }, [fromUrl]);

  /* ==========================================
     GET /payroll/comparisons?month=YYYY-MM
     Backend returns an overview object, never a list.
  ========================================== */
  useEffect(() => {
    let active = true;
    async function loadComparisons() {
      setListLoading(true);
      setListError("");
      try {
        const response = await apiRequest("salary", "getComparisons", {
          query: { month },
        });
        if (!active) return;
        const overview = unwrap(response);
        if (overview?.month !== month || !overview?.state) {
          throw new Error("월별 급여 비교 응답 구조가 올바르지 않습니다.");
        }
        const options = mismatchOption(response);
        setCandidateList(options);
        setSelected((previous) => {
          if (options.some((item) => getComparisonId(item) === previous)) return previous;
          // Preserve a deep-linked comparison until its detailed response arrives.
          if (fromUrl && previous === fromUrl) return previous;
          return options.length === 1 ? getComparisonId(options[0]) : "";
        });
      } catch (error) {
        if (!active) return;
        setCandidateList([]);
        setListError(humanError(error));
      } finally {
        if (active) setListLoading(false);
      }
    }
    loadComparisons();
    return () => { active = false; };
  }, [month, fromUrl, listReload]);

  /* ==========================================
     2. 선택한 급여 비교 상세 조회
  ========================================== */

  useEffect(() => {
    if (!selected) {
      setComparison(null);
      setSource(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }

    let active = true;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError("");

      setComparison(null);
      setSource(null);

      try {
        // 실제 급여 비교 상세 API
        const response = await apiRequest(
          "salary",
          "getComparison",
          {
            params: {
              comparisonId: selected,
            },
          }
        );

        if (!active) return;

        const comp = unwrap(response);

        if (
          !comp ||
          typeof comp !== "object" ||
          Array.isArray(comp)
        ) {
          throw new Error(
            "선택한 급여 비교 결과의 상세 정보를 확인할 수 없습니다."
          );
        }

        setComparison(comp);
        if (fromUrl && selected === fromUrl &&
            comp.month && comp.month !== month) {
          setMonth(comp.month);
        }

        const comparisonMonth = comp?.month;

        /* =================================
           3. 관련 자료 병렬 조회

           각 API 실패를 개별 처리
           하나가 실패해도 다른 자료 표시
        ================================= */

        const operations = [
          // 근로계약서 목록
          apiRequest(
            "contract",
            "getList"
          ),

          // 월별 근무기록
          comparisonMonth
            ? apiRequest(
                "report",
                "getMonthly",
                {
                  query: { month: comparisonMonth },
                }
              )
            : Promise.reject(
                new Error(
                  "비교 대상 월이 없습니다."
                )
              ),

          // 저장된 증거 목록
          apiRequest(
            "report",
            "getEvidences"
          ),

          // 사업장 정보
          apiRequest(
            "accountSettings",
            "getWorkplace"
          ),
        ];

        const results =
          await Promise.allSettled(
            operations
          );

        if (!active) return;

        const values = results.map(
          (result) =>
            result.status === "fulfilled"
              ? unwrap(result.value)
              : null
        );

        setSource({
          contracts: values[0],
          monthly: values[1],
          evidences: values[2],
          workplace: values[3],

          // 각 자료의 서버 조회 성공 여부
          loaded: {
            contracts:
              results[0].status ===
              "fulfilled",

            monthly:
              results[1].status ===
              "fulfilled",

            evidences:
              results[2].status ===
              "fulfilled",

            workplace:
              results[3].status ===
              "fulfilled",
          },
        });
      } catch (error) {
        if (active) {
          setDetailError(
            humanError(error)
          );
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selected, fromUrl, month]);

  /* ==========================================
     4. 화면에 표시할 데이터
  ========================================== */

  const contracts = listOf(
    source?.contracts,
    "contracts"
  );

  const evidenceList = listOf(
    source?.evidences,
    "evidences"
  );

  const workplaceData =
    source?.workplace;

  const employer =
    workplaceData?.business ??
    workplaceData?.workplace?.business ??
    null;

  const workData =
    source?.monthly?.work;

  // 서버에서 불일치 상태인지 확인
  const ready =
    comparison !== null &&
    isMismatch(comparison);

  const informationRows = [
    {
      label: "근무기간 및 계약조건",

      ok:
        contracts.length > 0 &&
        Boolean(workData),

      detail:
        contracts.length > 0 &&
        workData
          ? "계약서와 월별 근무기록 조회됨"
          : "계약서 또는 근무기록 확인 필요",
    },

    {
      label: "임금 비교 결과",

      ok: ready,

      detail: ready
        ? `확인 필요 차이 ${money(
            comparison?.differenceAmount
          )}`
        : comparison
        ? "현재 결과는 불일치 상태가 아닙니다."
        : "불일치 비교 결과를 선택해 주세요.",
    },

    {
      label: "관련 증거",

      ok:
        source?.loaded?.evidences ===
          true &&
        evidenceList.length > 0,

      detail:
        evidenceList.length > 0
          ? `조회된 증거 ${evidenceList.length}개`
          : "저장된 증거 확인 필요",
    },

    {
      label: "사업장 정보",

      ok: Boolean(
        employer?.name &&
        employer?.address &&
        employer?.ownerName
      ),

      detail:
        employer?.name ||
        "사업장명·주소·대표자명 확인 필요",
    },
  ];

  /* ==========================================
     5. 진정서 초안 생성 API
  ========================================== */

  async function create(event) {
    event.preventDefault();

    if (
      creating ||
      loading ||
      !ready ||
      !selected
    ) {
      return;
    }

    setCreateError("");

    // 기간 유효성 검사
    if (
      !dateValid(periodStart) ||
      !dateValid(periodEnd) ||
      (
        periodStart &&
        periodEnd &&
        periodStart > periodEnd
      )
    ) {
      setCreateError(
        "근무기간 시작일과 종료일을 확인해 주세요."
      );
      return;
    }

    setCreating(true);

    try {
      const body = {
        comparisonId: selected,
      };

      if (periodStart) {
        body.periodStart =
          periodStart;
      }

      if (periodEnd) {
        body.periodEnd =
          periodEnd;
      }

      // 기존 진정서 생성 API 호출
      const response = await apiRequest(
        "report",
        "createComplaint",
        {
          body,
        }
      );

      const result = unwrap(
        response
      );

      const complaintId =
        result?.complaintId ??
        result?.id;

      if (!complaintId) {
        throw new Error(
          "진정서 생성 요청 응답에서 ID를 받지 못했습니다. 진정서 목록에서 접수 여부를 확인해 주세요."
        );
      }

      // 생성은 비동기로 처리될 수 있음
      // 상세 화면에서 상태 확인
      navigate(
        `/petitions/${encodeURIComponent(
          complaintId
        )}?step=review`,
        {
          replace: true,
        }
      );
    } catch (error) {
      setCreateError(
        humanError(error)
      );
    } finally {
      setCreating(false);
    }
  }

  /* ============================================
     6. Figma UI
  ============================================ */

  return (
    <div className="pf-screen">

      {/* 상단 헤더 */}
      <header className="pf-header">
        <Link
          to="/petitions"
          aria-label="진정서 목록으로 돌아가기"
        >
          ‹
        </Link>

        <strong>
          진정서 초안
        </strong>

        <span />
      </header>

      <main className="pf-content">

        {/* 진행 단계 */}
        <StepBar />

        {/* 제목 */}
        <div className="pf-heading">
          <p className="pf-eyebrow">
            AI DRAFT
          </p>

          <h1>
            확인된 정보만으로
            <br />
            초안을 만들어요
          </h1>

          <p>
            확인되지 않은 사실은
            임의로 작성하지 않습니다.
          </p>
        </div>

        {/* ====================================
            급여 비교 결과 선택 카드
        ==================================== */}

        <section className="pf-card pf-field">
            <label htmlFor="pf-comparison-month">급여 비교 조회 월</label>
            <input
              id="pf-comparison-month"
              type="month"
              value={month}
              disabled={listLoading || creating}
              onChange={(event) => {
                if (!event.target.value) return;
                setSelected("");
                setComparison(null);
                setMonth(event.target.value);
                setDetailError("");
                setCreateError("");
              }}
            />
            <label htmlFor="pf-choose-comparison">
              진정서 기준 임금 비교
            </label>

            <select
              id="pf-choose-comparison"
              value={selected}
              disabled={listLoading}
              onChange={(event) => {
                setSelected(
                  event.target.value
                );

                setDetailError("");
                setCreateError("");
              }}
            >
              <option value="">
                {listLoading
                  ? "비교 결과 불러오는 중..."
                  : "불일치 비교 결과 선택"}
              </option>

              {selected && !candidateList.some((item) => getComparisonId(item) === selected) &&
                comparison?.status === "MISMATCH" && (
                  <option value={selected}>
                    {comparison.month ?? "월 미확인"} · 차이 {money(comparison.differenceAmount)}
                  </option>
                )}

              {candidateList.map(
                (item) => {
                  const id =
                    getComparisonId(item);

                  return (
                    <option
                      key={id}
                      value={id}
                    >
                      {item.month ??
                        "월 미확인"}
                      {" · 차이 "}
                      {money(
                        item.differenceAmount
                      )}
                    </option>
                  );
                }
              )}
            </select>

            {/* 급여 비교 목록 조회 오류 */}
            {listError && (
              <div
                className="pf-notice pf-error"
                role="alert"
              >
                {listError}
              </div>
            )}

            {/* 데이터가 없을 때 */}
            {!listLoading &&
              !listError &&
              candidateList.length === 0 && (
                <p className="pf-muted">
                  해당 월에 진정서에 사용할 불일치 임금 비교 결과가
                  없습니다.{" "}

                  <Link to="/salary">
                    급여 비교하기
                  </Link>
                </p>
              )}

            {/* 비교 결과 목록 다시 불러오기 */}
            <button
              type="button"
              className="pf-secondary"
              disabled={listLoading}
              onClick={() =>
                setListReload(
                  (value) => value + 1
                )
              }
            >
              {listLoading
                ? "불러오는 중..."
                : "급여 비교 결과 다시 불러오기"}
            </button>
          </section>

        {/* 비교 상세 조회 로딩 */}
        {detailLoading && (
          <div
            className="pf-notice"
            role="status"
          >
            선택한 급여 비교 결과와
            관련 자료를 불러오고 있어요.
          </div>
        )}

        {/* 비교 상세 API 오류 */}
        {detailError && (
          <div
            className="pf-notice pf-error"
            role="alert"
          >
            {detailError}
          </div>
        )}

        {/* ====================================
            자동으로 불러오는 정보
        ==================================== */}

        <section className="pf-card pf-load-list">

          <h2>
            자동으로 불러오는 정보
          </h2>

          {informationRows.map(
            (item) => (
              <InformationRow
                key={item.label}
                label={item.label}
                ok={item.ok}
                detail={item.detail}
                loading={detailLoading}
              />
            )
          )}
        </section>

        {/* ====================================
            AI 사건 요약
        ==================================== */}

        <section className="pf-card pf-summary">

          <span className="pf-pill pf-info">
            AI 사건 요약 준비
          </span>

          <p>
            {ready
              ? `${
                  comparison?.month ??
                  "대상 월 미확인"
                } 임금 비교 결과에서 확인이 필요한 차이(${money(
                  comparison?.differenceAmount
                )})가 보고되었습니다. 서버가 계약서, 근무기록, 증거 자료를 바탕으로 진정서 초안을 생성합니다.`
              : "급여 비교 결과를 선택하면 서버에서 사건 정보와 근거 자료를 확인합니다."}
          </p>

          <p className="pf-muted">
            실제 한국어·선택 언어
            초안은 생성 API 처리 후
            확인할 수 있습니다.
          </p>
        </section>

        {/* ====================================
            진정 대상 기간
        ==================================== */}

        <form
          className="pf-form"
          onSubmit={create}
        >

          <h2>
            진정 대상 기간{" "}
            <small>
              (선택)
            </small>
          </h2>

          <p className="pf-muted">
            입력하지 않으면 서버가 임금
            비교 월을 기준으로 결정합니다.
          </p>

          <div className="pf-date-fields">

            {/* 시작일 */}
            <label>
              시작일

              <input
                type="date"
                value={periodStart}
                disabled={creating}
                onChange={(event) =>
                  setPeriodStart(
                    event.target.value
                  )
                }
              />
            </label>

            {/* 종료일 */}
            <label>
              종료일

              <input
                type="date"
                value={periodEnd}
                disabled={creating}
                onChange={(event) =>
                  setPeriodEnd(
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          {/* 오류 */}
          {createError && (
            <div
              className="pf-notice pf-error"
              role="alert"
            >
              {createError}
            </div>
          )}

          {/* 안내 */}
          <div className="pf-notice pf-warn-box">
            참고용 초안이며 최종 판단은
            노무사·노동청 확인이 필요합니다.
          </div>

          {/* 다음 단계 */}
          <button
            className="pf-primary"
            type="submit"
            disabled={
              !ready ||
              loading ||
              creating
            }
          >
            {creating
              ? "진정서 생성 요청 중..."
              : "한국어·선택 언어 대조본 보기"}
          </button>
        </form>

      </main>
    </div>
  );
}