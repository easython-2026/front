// GPS & 출퇴근 & GPS 인증


import { apiRequest } from "./client";

// 오늘 근무 현황
export const getTodayAttendance = () =>
  apiRequest("attendance", "getToday");

// 주간 근무 그래프
export const getWeeklyAttendance = (query = {}) =>
  apiRequest("attendance", "getWeekly", {
    query,
  });

// 월간 근무 내역
export const getMonthlyAttendance = (query = {}) =>
  apiRequest("attendance", "getMonthly", {
    query,
  });

// GPS 위치 인증
export const checkLocation = (data) =>
  apiRequest("attendance", "locationCheck", {
    body: data,
  });

// 출근 기록
// JSON 또는 FormData 전달 가능
export const clockIn = (data) =>
  apiRequest("attendance", "clockIn", {
    body: data,
  });

// 퇴근 기록
export const clockOut = (data) =>
  apiRequest("attendance", "clockOut", {
    body: data,
  });

// 근무기록 상세
export const getAttendanceRecord = (recordId) =>
  apiRequest("attendance", "getRecord", {
    params: { recordId },
  });

// 누락 근무기록 수동 추가
export const addAttendanceRecord = (data) =>
  apiRequest("attendance", "addRecord", {
    body: data,
  });

// 근무기록 수정
export const updateAttendanceRecord = (
  recordId,
  data
) =>
  apiRequest("attendance", "updateRecord", {
    params: { recordId },
    body: data,
  });

// 휴게시간 입력 및 수정
export const updateBreakTime = (recordId, data) =>
  apiRequest("attendance", "updateBreak", {
    params: { recordId },
    body: data,
  });

// 누락 및 검증 알림
export const getAttendanceIssues = () =>
  apiRequest("attendance", "getIssues");

// AI 이상 패턴 (P1)
export const getAttendanceAnomalies = () =>
  apiRequest("attendance", "getAnomalies");
