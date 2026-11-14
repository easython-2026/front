
import { apiRequest } from "./client";

// 내 정보 조회
export const getMyProfile = () =>
  apiRequest("user", "getMe");

// 내 정보 수정
export const updateMyProfile = (data) =>
  apiRequest("user", "updateMe", {
    body: data,
  });

// 회원 탈퇴
export const deleteAccount = (options = {}) =>
  apiRequest("user", "deleteAccount", options);

// 근무장소 및 사업장 정보 조회
export const getWorkplace = () =>
  apiRequest("user", "getWorkplace");

// 근무장소 및 사업장 정보 등록·수정
export const updateWorkplace = (data) =>
  apiRequest("user", "updateWorkplace", {
    body: data,
  });

// 개인정보 동의 내역 조회
export const getConsents = () =>
  apiRequest("user", "getConsents");

// 선택 동의 변경
export const updateConsents = (data) =>
  apiRequest("user", "updateConsents", {
    body: data,
  });

// 월급날 및 알림 설정
export const updateSettings = (data) =>
  apiRequest("user", "updateSettings", {
    body: data,
  });

// 저장 기록 삭제 요청
export const requestDataDeletion = (data) =>
  apiRequest("user", "requestDataDeletion", {
    body: data,
  });

// 지원 언어 목록
export const getLanguages = () =>
  apiRequest("user", "getLanguages", { token: null });
