// 급여명세서 & 급여 비교


import { apiRequest } from "./client";

// 급여명세서 업로드 및 AI 분석
export const uploadSalaryStatement = (formData) =>
  apiRequest("salary", "uploadStatement", {
    body: formData,
  });

// 급여명세서 분석 결과
export const getSalaryStatement = (statementId) =>
  apiRequest("salary", "getStatement", {
    params: { statementId },
  });

// 급여 추출 결과 수정·확정
export const updateSalaryStatement = (
  statementId,
  data
) =>
  apiRequest("salary", "updateStatement", {
    params: { statementId },
    body: data,
  });

// 실제 수령액 직접 입력
export const addManualSalary = (data) =>
  apiRequest("salary", "addManualStatement", {
    body: data,
  });

// 월별 급여 비교 현황
export const getSalaryComparisons = (query = {}, options = {}) =>
  apiRequest("salary", "getComparisons", {
    query,
    ...options,
  });

// GET /payroll/comparisons is a one-month overview, NOT an array.
export async function getSalaryOverviewForMonth(month, options = {}) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("급여 조회 월 형식은 YYYY-MM이어야 합니다.");
  }
  const response = await getSalaryComparisons({ month }, options);
  const data = response?.data ?? response;
  if (!data || data.month !== month ||
      !["NOT_SUBMITTED", "READY", "COMPARED"].includes(data.state)) {
    throw new Error("월별 급여 비교 응답 형식이 올바르지 않습니다.");
  }
  return {
    month: data.month,
    status: data.state,
    state: data.state,
    statementId: data.statementId ?? null,
    payday: data.payday ?? null,
    comparison: data.comparison ? {
      ...data.comparison,
      comparisonId: data.comparison.id,
      month: data.month,
    } : null,
  };
}

// 예상 임금 계산 및 지급액 비교
export const calculateSalaryComparison = (data) =>
  apiRequest("salary", "calculateComparison", {
    body: data,
  });

// 급여 비교 상세
export const getSalaryComparison = (comparisonId) =>
  apiRequest("salary", "getComparison", {
    params: { comparisonId },
  });