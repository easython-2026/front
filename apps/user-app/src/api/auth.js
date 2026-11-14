import { apiRequest } from "./client";

// 공개 인증 API는 과거 세션의 Bearer Token을 전송하지 않는다.
export const signup = (data) =>
  apiRequest("auth", "signup", { body: data, token: null });

export const login = (data) =>
  apiRequest("auth", "login", { body: data, token: null });

export const logout = (options = {}) =>
  apiRequest("auth", "logout", options);

// 리프레시 토큰 전달 방식(쿠키/본문)이 백엔드와 일치해야만 사용한다.
export const refreshToken = (options = {}) =>
  apiRequest("auth", "refresh", {
    ...options,
    token: null,
    credentials: options.credentials ?? "include",
  });

export const checkEmail = (query) =>
  apiRequest("auth", "checkEmail", { query, token: null });

export const requestPasswordReset = (data) =>
  apiRequest("auth", "requestPasswordReset", {
    body: data,
    token: null,
  });

export const resetPassword = (data) =>
  apiRequest("auth", "resetPassword", {
    body: data,
    token: null,
  });