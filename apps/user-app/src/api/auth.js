// 회원가입 & 로그인 & 토큰


import { apiRequest } from "./client";

// 회원가입
export async function signup(data) {
  return apiRequest("auth", "signup", {
    body: data,
  });
}

// 로그인
export async function login(data) {
  return apiRequest("auth", "login", {
    body: data,
  });
}

// 로그아웃
export async function logout(options = {}) {
  return apiRequest("auth", "logout", options);
}

// 액세스 토큰 재발급
export async function refreshToken(options = {}) {
  return apiRequest("auth", "refresh", options);
}

// 이메일 중복 확인
// query 객체의 정확한 필드명은 상세 명세 기준
export async function checkEmail(query) {
  return apiRequest("auth", "checkEmail", {
    query,
  });
}

// 비밀번호 재설정 요청
export async function requestPasswordReset(data) {
  return apiRequest("auth", "requestPasswordReset", {
    body: data,
  });
}

// 비밀번호 재설정
export async function resetPassword(data) {
  return apiRequest("auth", "resetPassword", {
    body: data,
  });
}
