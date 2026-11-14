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
export const getSalaryComparisons = (query = {}) =>
  apiRequest("salary", "getComparisons", {
    query,
  });

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
