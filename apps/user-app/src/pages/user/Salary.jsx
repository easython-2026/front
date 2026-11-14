
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import {
  getSalaryComparison,
  addManualSalary,
  uploadSalaryStatement,
  calculateSalaryComparison,
} from "../../api/salary";

import { apiRequest } from "../../api/client";

import {
  getMyProfile,
  updateSettings,
} from "../../api/user";

import {
  FeatureBadge,
  FeatureIcon,
  FeatureNotice,
  errorText,
  unwrap,
} from "../../components/WorkerFeatureUI";

import "../../styles/figma-finance.css";

// 한국 시간 기준 현재 월
function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  return `${year}-${month}`;
}

function money(value) {
  if (
    value == null ||
    !Number.isFinite(Number(value))
  ) {
    return "미제공";
  }

  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function parseAmount(value) {
  if (!/^\d+$/.test(String(value))) {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number)
    ? number
    : null;
}

const itemLabels = {
  BASE_PAY: "기본급",
  OVERTIME_PAY: "연장근무 수당",
  NIGHT_PAY: "야간근무 수당",
  HOLIDAY_PAY: "휴일근무 수당",
  WEEKLY_HOLIDAY_PAY: "주휴수당",
  ALLOWANCE: "기타 수당",
  MEAL_DEDUCTION: "식비 공제",
  LODGING_DEDUCTION: "숙식비 공제",
  TAX_INSURANCE: "세금·보험 공제",
  OTHER_DEDUCTION: "기타 공제",
};

export default function Salary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMonth = searchParams.get("month");
  const validMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "");

  // 월 및 서버 데이터
  const [month, setMonth] = useState(() =>
    validMonth(queryMonth) ? queryMonth : currentMonth()
  );

  useEffect(() => {
    if (validMonth(queryMonth) && queryMonth !== month) {
      setMonth(queryMonth);
    }
  }, [queryMonth]);
  const [overview, setOverview] = useState(null);
  const [detail, setDetail] = useState(null);
  const [profile, setProfile] = useState(null);

  // 비동기 상태
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Figma 하단 시트
  const [sheet, setSheet] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRules, setShowRules] = useState(false);

  // 급여 입력
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");

  // 월급날 설정
  const [day, setDay] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);

  // =====================================
  // 사용자 월급날 설정 조회
  // =====================================

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((response) => {
        if (!active) return;

        const data = unwrap(response);

        setProfile(data);

        if (data?.payday != null) {
          setDay(Number(data.payday));
        }

        if (
          typeof data?.paydayAlertEnabled === "boolean"
        ) {
          setAlertEnabled(data.paydayAlertEnabled);
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorText(err));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // =====================================
  // 월별 급여 조회 및 비교 상세
  // =====================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setOverview(null);
    setDetail(null);

    async function loadSalary() {
      try {
        const response = await apiRequest(
          "salary",
          "getOverview",
          {
            query: { month },
          }
        );

        if (!active) return;

        const result = unwrap(response);
        setOverview(result);

        // 비교 결과가 있으면 항목별 상세 조회
        if (result?.comparison?.id) {
          try {
            const detailed = unwrap(
              await getSalaryComparison(
                result.comparison.id
              )
            );

            if (active) {
              setDetail(detailed);
            }
          } catch (err) {
            if (active) {
              setError(
                `상세 비교 결과: ${errorText(err)}`
              );
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(errorText(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSalary();

    return () => {
      active = false;
    };
  }, [month, reload]);

  function refresh() {
    setMessage("");
    setReload((value) => value + 1);
  }

  function changeMonth(nextMonth) {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(nextMonth)
    ) {
      return;
    }

    setMonth(nextMonth);
    setSearchParams({ month: nextMonth }, { replace: true });
    setError("");
    setMessage("");
  }

  // =====================================
  // 실제 수령액 직접 입력
  // =====================================

  async function submitManual(event) {
    event.preventDefault();

    if (busy) return;

    const receivedAmount = parseAmount(amount);

    if (receivedAmount === null) {
      setError(
        "수령액을 0 이상의 정수로 입력해 주세요."
      );
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const body = {
        month,
        receivedAmount,
      };

      if (paidAt) {
        body.paidAt = paidAt;
      }

      const result = unwrap(
        await addManualSalary(body)
      );

      setSheet(null);
      setAmount("");
      setPaidAt("");

      if (result?.statementId) {
        navigate(
          `/salary/statements/${encodeURIComponent(
            result.statementId
          )}`
        );
      } else {
        setMessage(
          "실제 수령액이 저장되었습니다."
        );
        refresh();
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // =====================================
  // 급여명세서 업로드
  // =====================================

  async function submitFile(event) {
    event.preventDefault();

    if (!file || busy) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData();

      form.append("file", file);
      form.append("month", month);

      const result = unwrap(
        await uploadSalaryStatement(form)
      );

      if (!result?.statementId) {
        throw new Error(
          "서버에서 statementId를 반환하지 않았습니다."
        );
      }

      setFile(null);
      setSheet(null);

      // 기존 AI 분석·명세서 확인 화면
      navigate(
        `/salary/statements/${encodeURIComponent(
          result.statementId
        )}`
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // =====================================
  // 급여 비교 실행
  // =====================================

  async function startComparison() {
    if (
      !overview?.statementId ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = unwrap(
        await calculateSalaryComparison({
          month,
          statementId: overview.statementId,
        })
      );

      const id =
        result?.id ??
        result?.comparisonId;

      if (!id) {
        throw new Error(
          "급여 비교 결과 ID를 받지 못했습니다."
        );
      }

      navigate(
        `/salary/${encodeURIComponent(id)}`
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // =====================================
  // 월급날 변경
  // =====================================

  async function savePayday(event) {
    event.preventDefault();

    const nextDay = Number(day);

    if (
      !Number.isInteger(nextDay) ||
      nextDay < 1 ||
      nextDay > 31
    ) {
      setError(
        "월급날은 1일부터 31일까지 선택해 주세요."
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      await updateSettings({
        payday: nextDay,
        paydayAlertEnabled: alertEnabled,
      });

      // 실제 서버에 저장된 상태 재조회
      const updated = unwrap(
        await getMyProfile()
      );

      setProfile(updated);
      setDay(updated?.payday ?? nextDay);

      setAlertEnabled(
        updated?.paydayAlertEnabled ??
          alertEnabled
      );

      setSheet(null);
      setMessage(
        "월급날 및 알림 설정을 저장했습니다."
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // =====================================
  // 월급날 알림 ON/OFF
  // =====================================

  async function toggleAlert() {
    if (busy || !profile) return;

    const nextValue = !alertEnabled;

    setBusy(true);
    setError("");

    try {
      await updateSettings({
        paydayAlertEnabled: nextValue,
      });

      const updated = unwrap(
        await getMyProfile()
      );

      setProfile(updated);

      setAlertEnabled(
        updated?.paydayAlertEnabled ??
          nextValue
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // =====================================
  // 화면 데이터
  // =====================================

  const comparison =
    detail ?? overview?.comparison;

  const items = Array.isArray(detail?.items)
    ? detail.items
    : [];

  const isCompared =
    overview?.status === "COMPARED" &&
    Boolean(comparison);

  const difference =
    comparison?.differenceAmount;

  const hasDifference =
    difference != null &&
    Number(difference) !== 0;

  const comparisonId = comparison?.comparisonId ?? comparison?.id;
  const verifiedMismatch =
    isCompared && comparison?.status === "MISMATCH" &&
    comparisonId != null && String(comparisonId) !== "";

  const uncertainCount = items.filter(
    (item) =>
      item.status === "UNCERTAIN" ||
      item.status === "MISMATCH" ||
      (
        item.difference != null &&
        Number(item.difference) !== 0
      )
  ).length;

  const appliedConditions =
    detail?.appliedConditions;

  return (
    <div className="efin-page">

      {/* Figma 상단바 */}
      <header className="efin-header">
        <strong>급여비교</strong>

        <input
          type="month"
          aria-label="급여 귀속 월"
          value={month}
          onChange={(event) =>
            changeMonth(event.target.value)
          }
        />
      </header>

      <main className="efin-content">

        {loading && (
          <FeatureNotice>
            급여 정보를 불러오는 중입니다.
          </FeatureNotice>
        )}

        {error && (
          <FeatureNotice tone="error">
            {error}
          </FeatureNotice>
        )}

        {message && (
          <FeatureNotice tone="success">
            {message}
          </FeatureNotice>
        )}

        {/* =================================
            1. 급여 비교 요약 카드
        ================================= */}

        <section className="efin-pay-hero">
          <div className="efin-pay-status">
            <span>{month.slice(5)}월 급여 비교</span>

            <FeatureBadge
              tone={
                isCompared && !hasDifference
                  ? "success"
                  : "warning"
              }
            >
              {!isCompared
                ? "입력 필요"
                : hasDifference
                ? "확인 필요"
                : "비교 완료"}
            </FeatureBadge>
          </div>

          <p>
            예상 임금과 실제 지급액의 차이
          </p>

          <h1>
            {isCompared
              ? money(difference)
              : "비교 전"}
          </h1>

          <span>
            {!isCompared
              ? "급여명세서나 실제 수령액을 등록해 주세요"
              : hasDifference
              ? "차이가 있어 항목별 확인이 필요해요"
              : "예상액과 실제 지급액을 비교했어요"}
          </span>

          <div className="efin-pay-pair">
            <div>
              <span>예상 임금</span>

              <b>
                {isCompared
                  ? money(comparison?.expectedAmount)
                  : "미제공"}
              </b>
            </div>

            <div>
              <span>실제 지급액</span>

              <b>
                {isCompared
                  ? money(comparison?.actualAmount)
                  : "미제공"}
              </b>
            </div>
          </div>
        </section>

        <FeatureNotice tone="warning">
          금액 차이는 법적 체불 확정을 의미하지 않습니다.
          확인되지 않은 조건은 전문가 상담이 필요할 수 있어요.
        </FeatureNotice>

        {/* =================================
            2. 항목별 비교
        ================================= */}

        <div className="efin-section-title">
          <h2>항목별 비교</h2>

          {isCompared && (
            <FeatureBadge tone="warning">
              {uncertainCount}개 확인 필요
            </FeatureBadge>
          )}
        </div>

        <section className="efin-card efin-comparison-list">
          {items.length === 0 ? (
            <p className="efin-muted">
              {isCompared
                ? "서버에서 항목별 비교 내역을 제공하지 않았어요. 총액 비교만 확인할 수 있습니다."
                : "급여 비교가 완료되면 항목별 내역이 표시됩니다."}
            </p>
          ) : (
            items.map((item, index) => (
              <button
                key={`${item.type ?? item.label}-${index}`}
                type="button"
                onClick={() =>
                  setSelectedItem(item)
                }
              >
                <span>
                  {item.label ??
                    itemLabels[item.type] ??
                    item.type ??
                    "급여 항목"}
                </span>

                <small>
                  {money(item.expected)} /{" "}
                  {money(item.actual)}
                </small>

                <FeatureBadge
                  tone={
                    item.status === "MATCH" ||
                    (
                      item.difference != null &&
                      Number(item.difference) === 0
                    )
                      ? "success"
                      : "warning"
                  }
                >
                  {item.status === "MATCH"
                    ? "일치"
                    : item.status === "UNCERTAIN"
                    ? "확인 필요"
                    : item.difference != null
                    ? money(item.difference)
                    : "확인 필요"}
                </FeatureBadge>
              </button>
            ))
          )}
        </section>

        {/* 예상 임금 계산 조건 */}
        <section className="efin-card efin-calc">
          <div className="efin-icon">
            <FeatureIcon name="file" />
          </div>

          <div>
            <b>예상 임금 계산 조건</b>
            <p>
              저장된 근로계약 및 실제 근무기록에 기반해 계산합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowRules((value) => !value)
            }
          >
            조건 보기
          </button>
        </section>

        {showRules && (
          <section className="efin-card efin-rules">
            <b>적용된 계산 조건</b>

            {appliedConditions ? (
              <>
                <p>
                  급여 유형:{" "}
                  {appliedConditions.wageType ??
                    "미제공"}
                </p>

                <p>
                  급여 금액:{" "}
                  {money(appliedConditions.wageAmount)}
                </p>

                <p>
                  실근무:{" "}
                  {appliedConditions.workedMinutes ??
                    "미제공"}
                  분
                </p>

                <p>
                  근무일수:{" "}
                  {appliedConditions.workDays ??
                    "미제공"}
                  일
                </p>

                {Array.isArray(
                  appliedConditions.appliedRules
                ) &&
                  appliedConditions.appliedRules.map(
                    (rule, index) => (
                      <p key={index}>
                        {rule.label ?? rule.code}
                      </p>
                    )
                  )}

                {Array.isArray(
                  appliedConditions.unsupportedRules
                ) &&
                  appliedConditions.unsupportedRules.length >
                    0 && (
                    <p>
                      미지원 규칙:{" "}
                      {appliedConditions.unsupportedRules
                        .map(
                          (rule) =>
                            rule.label ??
                            rule.code ??
                            String(rule)
                        )
                        .join(", ")}
                    </p>
                  )}
              </>
            ) : (
              <p>
                서버의 상세 비교 결과에 계산 조건이 제공되지 않았습니다.
              </p>
            )}
          </section>
        )}

        {/* =================================
            3. 급여 정보 입력
        ================================= */}

        <div className="efin-section-title">
          <h2>급여 정보 입력</h2>
        </div>

        <div className="efin-action-grid">
          <button
            type="button"
            onClick={() => {
              setError("");
              setSheet("file");
            }}
          >
            <FeatureIcon name="camera" />

            <b>명세서 촬영·업로드</b>
            <span>OCR로 항목 추출</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSheet("manual");
            }}
          >
            <FeatureIcon name="edit" />

            <b>실제 수령액 입력</b>
            <span>명세서가 없어도 가능</span>
          </button>
        </div>

        {overview?.statementId && (
          <Link
            className="efin-text-link"
            to={`/salary/statements/${encodeURIComponent(
              overview.statementId
            )}`}
          >
            등록한 급여명세서 검토·확정
          </Link>
        )}

        {overview?.status === "READY" && (
          <button
            type="button"
            className="efin-main-button"
            disabled={
              busy || !overview.statementId
            }
            onClick={startComparison}
          >
            {busy
              ? "비교 중..."
              : "예상 임금과 실제 지급액 비교"}
          </button>
        )}

        {comparison?.id && (
          <Link
            className="efin-text-link"
            to={`/salary/${encodeURIComponent(
              comparison.id
            )}`}
          >
            상세 비교 결과 확인
          </Link>
        )}

        {/* =================================
            4. 월급날 및 알림
        ================================= */}

        <section className="efin-card efin-settings">
          <div className="efin-setting-row">
            <FeatureIcon name="calendar" />

            <span>
              <b>월급날</b>

              <small>
                {profile?.payday != null
                  ? `매월 ${profile.payday}일 · 웹앱 접속 시 안내`
                  : "설정되지 않음"}
              </small>
            </span>

            <button
              type="button"
              onClick={() =>
                setSheet("payday")
              }
            >
              변경
            </button>
          </div>

          <button
            className="efin-toggle-row"
            type="button"
            onClick={toggleAlert}
            disabled={busy || !profile}
          >
            <span>급여일 안내 팝업</span>

            <span
              className={`efin-switch ${
                alertEnabled ? "on" : ""
              }`}
              aria-label={
                alertEnabled
                  ? "알림 켜짐"
                  : "알림 꺼짐"
              }
            >
              <i />
            </span>
          </button>
        </section>

        {/* =================================
            5. 후속 조치
        ================================= */}

        <section className="efin-followup">
          <p className="efin-eyebrow">
            다음 단계
          </p>

          <h2>
            차이를 더 확인하고 싶나요?
          </h2>

          <p>
            증거를 정리한 초안을 만들거나
            상담기관에 도움을 요청할 수 있어요.
          </p>

          {verifiedMismatch ? (
            <Link
              className="efin-main-button"
              to={`/petitions/new?comparisonId=${encodeURIComponent(comparisonId)}`}
            >
              <FeatureIcon name="file" />
              불일치 결과로 진정서 만들기
            </Link>
          ) : (
            <FeatureNotice tone="info">
              진정서 생성은 서버가 불일치(MISMATCH)로 판단한
              급여 비교 결과에서만 가능합니다.
            </FeatureNotice>
          )}

          {isCompared && comparisonId != null ? (
            <Link
              className="efin-outline-button"
              to={`/consultations/new?comparisonId=${encodeURIComponent(comparisonId)}`}
            >
              <FeatureIcon name="file" />
              이 비교 결과로 상담 연결
            </Link>
          ) : (
            <p className="efin-muted">
              상담 신청은 먼저 급여 비교 결과를 만든 뒤 이용할 수 있어요.
            </p>
          )}
        </section>
      </main>

      {/* =====================================
          항목별 비교 근거 하단 시트
      ===================================== */}

      {selectedItem && (
        <div
          className="efin-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="급여 항목 상세"
            className="efin-sheet"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="efin-handle" />

            <div className="efin-sheet-title">
              <h2>
                {selectedItem.label ??
                  itemLabels[selectedItem.type] ??
                  "급여 항목"}
                {" "}비교 근거
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
              >
                닫기
              </button>
            </div>

            <p>
              예상: {money(selectedItem.expected)}
            </p>

            <p>
              실제: {money(selectedItem.actual)}
            </p>

            <p>
              차이: {money(selectedItem.difference)}
            </p>

            <p className="efin-muted">
              {selectedItem.explanation ??
                selectedItem.reason ??
                "자세한 적용 조건은 계산 조건과 근로계약·근무기록을 대조해 주세요."}
            </p>
          </section>
        </div>
      )}

      {/* =====================================
          Figma 급여 정보 입력 하단 시트
      ===================================== */}

      {sheet && (
        <div
          className="efin-overlay"
          onClick={() => {
            if (!busy) {
              setSheet(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="급여 정보 입력"
            className="efin-sheet"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="efin-handle" />

            <div className="efin-sheet-title">
              <div>
                <p className="efin-eyebrow">
                  {month} 급여 입력
                </p>

                <h2>
                  {sheet === "payday"
                    ? "월급날 설정"
                    : "실제 수령액을 확인해 주세요"}
                </h2>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setSheet(null)
                }
              >
                닫기
              </button>
            </div>

            {/* 급여명세서 업로드 */}
            {sheet === "file" && (
              <form
                className="efin-sheet-form"
                onSubmit={submitFile}
              >
                <label className="efin-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                    onChange={(event) => {
                      const selected =
                        event.target.files?.[0];

                      event.target.value = "";

                      if (!selected) return;

                      if (
                        ![
                          "image/jpeg",
                          "image/png",
                          "application/pdf",
                        ].includes(selected.type) ||
                        selected.size >
                          10 * 1024 * 1024
                      ) {
                        setFile(null);
                        setError(
                          "JPG, PNG, PDF 형식의 10MB 이하 파일만 선택할 수 있습니다."
                        );
                        return;
                      }

                      setFile(selected);
                      setError("");
                    }}
                  />

                  <FeatureIcon name="upload" />

                  <span>
                    <b>급여명세서 업로드</b>

                    <small>
                      {file
                        ? file.name
                        : "기본급·수당·공제·실지급액을 분석해요"}
                    </small>
                  </span>
                </label>

                <p className="efin-muted">
                  서버에 업로드한 뒤 AI 추출값을
                  검토·수정하는 화면으로 이동합니다.
                </p>

                <button
                  type="submit"
                  className="efin-main-button"
                  disabled={!file || busy}
                >
                  {busy
                    ? "업로드 중..."
                    : "업로드하고 분석하기"}
                </button>
              </form>
            )}

            {/* 실제 수령액 직접 입력 */}
            {sheet === "manual" && (
              <form
                className="efin-sheet-form"
                onSubmit={submitManual}
              >
                <label>
                  실제 수령액 (원)

                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={amount}
                    placeholder="실제 입금액"
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                  />
                </label>

                <label>
                  급여 귀속 월

                  <input
                    type="month"
                    value={month}
                    onChange={(event) =>
                      changeMonth(event.target.value)
                    }
                  />
                </label>

                <label>
                  입금일 (선택)

                  <input
                    type="date"
                    value={paidAt}
                    onChange={(event) =>
                      setPaidAt(event.target.value)
                    }
                  />
                </label>

                <FeatureNotice>
                  명세서가 없으면 총액 비교만
                  가능할 수 있습니다.
                </FeatureNotice>

                <button
                  className="efin-main-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "저장 중..."
                    : "확인하고 비교하기"}
                </button>
              </form>
            )}

            {/* 월급날 설정 */}
            {sheet === "payday" && (
              <form
                className="efin-sheet-form"
                onSubmit={savePayday}
              >
                <label>
                  급여 지급일 (1~31일)

                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={day}
                    onChange={(event) =>
                      setDay(event.target.value)
                    }
                  />
                </label>

                <label className="efin-check">
                  <input
                    type="checkbox"
                    checked={alertEnabled}
                    onChange={(event) =>
                      setAlertEnabled(
                        event.target.checked
                      )
                    }
                  />

                  급여일 안내 팝업 사용
                </label>

                <button
                  className="efin-main-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "저장 중..."
                    : "설정 저장"}
                </button>
              </form>
            )}

            {error && (
              <FeatureNotice tone="error">
                {error}
              </FeatureNotice>
            )}
          </section>
        </div>
      )}
    </div>
  );
}