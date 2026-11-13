// 계약서 업로드 & AI 분석


import { apiRequest } from "./client";

// 계약서 목록 조회
export const getContracts = (query = {}) =>
  apiRequest("contract", "getList", {
    query,
  });

// 계약서 업로드 및 AI 분석 시작
// FormData 전달
export const uploadContract = (formData) =>
  apiRequest("contract", "upload", {
    body: formData,
  });

// 계약서 분석 상세 조회
export const getContract = (contractId) =>
  apiRequest("contract", "getDetail", {
    params: { contractId },
  });

// 계약 조건 수정
export const updateContractTerms = (
  contractId,
  data
) =>
  apiRequest("contract", "updateTerms", {
    params: { contractId },
    body: data,
  });

// 계약 조건 확정
export const confirmContractTerms = (
  contractId,
  options = {}
) =>
  apiRequest("contract", "confirmTerms", {
    params: { contractId },
    ...options,
  });

// 계약서 재분석
export const reanalyzeContract = (
  contractId,
  options = {}
) =>
  apiRequest("contract", "reanalyze", {
    params: { contractId },
    ...options,
  });

// 계약서 삭제
export const deleteContract = (contractId) =>
  apiRequest("contract", "delete", {
    params: { contractId },
  });
