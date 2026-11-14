
import {
    adminApi,
    publicAdminApi,
    getAdminAuth,
    saveAdminAuth,
    clearAdminAuth,
    isAdminLoggedIn,
    AdminApiError,
  } from "./adminApi";
  
  import { mockAdmin } from "../mocks/adminMockData";
  
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
  
  console.log("[Admin] Mock 모드:", USE_MOCK);
  
  export { getAdminAuth, isAdminLoggedIn };
  
  // 관리자 로그인
  export async function loginAdmin({
    email,
    password,
    rememberMe = false,
  }) {
    // Mock 로그인: 실제 서버 요청 없음
    if (USE_MOCK) {
      console.log("[Admin] Mock 로그인 실행");
  
      if (!email?.trim() || !password) {
        throw new AdminApiError(
          "이메일과 비밀번호를 입력해 주세요.",
          400,
          "VALIDATION_ERROR"
        );
      }
  
      const mockAuth = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        staff: mockAdmin,
      };
  
      saveAdminAuth(mockAuth, rememberMe);
  
      return mockAdmin;
    }
  
    // 실제 관리자 로그인 API
    const data = await publicAdminApi(
      "/api/v1/admin/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );
  
    if (
      !data?.accessToken ||
      !data?.refreshToken ||
      !data?.staff?.id ||
      data?.staff?.role !== "ADMIN"
    ) {
      throw new AdminApiError(
        "관리자 인증 응답이 올바르지 않습니다.",
        403,
        "FORBIDDEN"
      );
    }
  
    saveAdminAuth(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        staff: data.staff,
      },
      rememberMe
    );
  
    return data.staff;
  }
  
  // 관리자 로그아웃
  export async function logoutAdmin() {
    if (USE_MOCK) {
      clearAdminAuth();
      return;
    }
  
    try {
      if (isAdminLoggedIn()) {
        await adminApi("/api/v1/auth/logout", {
          method: "POST",
          bodyFactory: () =>
            JSON.stringify({
              refreshToken: getAdminAuth()?.refreshToken,
            }),
        });
      }
    } finally {
      clearAdminAuth();
    }
  }
  