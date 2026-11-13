// 리포트 & 진정서 & PDF


import { apiRequest } from "./client";

// 월별 근무 및 임금 리포트
export const getMonthlyReport = (query = {}) =>
  apiRequest("report", "getMonthly", {
    query,
  });

// 증거 목록 조회
export const getEvidences = (query = {}) =>
  apiRequest("report", "getEvidences", {
    query,
  });

// 진정서 목록 조회
export const getComplaints = (query = {}) =>
  apiRequest("report", "getComplaints", {
    query,
  });

// 진정서 초안 생성
export const createComplaint = (data) =>
  apiRequest("report", "createComplaint", {
    body: data,
  });

// 진정서 상세 조회
export const getComplaint = (complaintId) =>
  apiRequest("report", "getComplaint", {
    params: { complaintId },
  });

// 진정서 검토·수정·확정
export const updateComplaint = (complaintId, data) =>
  apiRequest("report", "updateComplaint", {
    params: { complaintId },
    body: data,
  });

// 진정서에 증거 목록 연결
export const updateComplaintEvidences = (
  complaintId,
  data
) =>
  apiRequest("report", "updateComplaintEvidences", {
    params: { complaintId },
    body: data,
  });

// 진정서 PDF 파일 응답
export const downloadComplaintPdf = (complaintId) =>
  apiRequest("report", "downloadComplaintPdf", {
    params: { complaintId },
    responseType: "blob",
  });
