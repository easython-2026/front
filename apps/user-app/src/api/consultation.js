// 상담 신청, 메시지


import { apiRequest } from "./client";

// 상담기관 목록 조회
export const getConsultationAgencies = (query = {}) =>
  apiRequest("consultation", "getAgencies", {
    query,
  });

// 내 상담 목록
export const getConsultations = (query = {}) =>
  apiRequest("consultation", "getList", {
    query,
  });

// 상담 신청 및 정보 공유 동의
export const createConsultation = (data) =>
  apiRequest("consultation", "create", {
    body: data,
  });

// 상담 상세 및 처리 현황
export const getConsultation = (consultationId) =>
  apiRequest("consultation", "getDetail", {
    params: { consultationId },
  });

// 번역 메시지 목록
export const getConsultationMessages = (
  consultationId,
  query = {}
) =>
  apiRequest("consultation", "getMessages", {
    params: { consultationId },
    query,
  });

// 상담 메시지 보내기
export const sendConsultationMessage = (
  consultationId,
  data
) =>
  apiRequest("consultation", "sendMessage", {
    params: { consultationId },
    body: data,
  });

// 정보 공유 동의 철회
export const revokeConsultationConsent = (
  consultationId
) =>
  apiRequest("consultation", "revokeConsent", {
    params: { consultationId },
  });
