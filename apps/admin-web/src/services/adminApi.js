
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || ""
  ).replace(/\/$/, "");
  
  const AUTH_KEY = "ilhanmankeum_admin_auth";
  
  let refreshPromise = null;
  let authVersion = 0;
  
  // ========================================
  // 1. 관리자 인증 정보 관리
  // ========================================
  
  // 현재 저장된 관리자 인증 정보 조회
  export function getAdminAuth() {
    try {
      const raw =
        sessionStorage.getItem(AUTH_KEY) ||
        localStorage.getItem(AUTH_KEY);
  
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  
  // 인증 정보 저장
  export function saveAdminAuth(data, rememberMe = false) {
    authVersion += 1;
  
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  
    const storage = rememberMe
      ? localStorage
      : sessionStorage;
  
    storage.setItem(AUTH_KEY, JSON.stringify(data));
  
    window.dispatchEvent(new Event("admin-auth-change"));
  }
  
  // 인증 정보 삭제
  export function clearAdminAuth() {
    authVersion += 1;
  
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  
    window.dispatchEvent(new Event("admin-auth-change"));
  }
  
  // 관리자 로그인 상태 확인
  export function isAdminLoggedIn() {
    const auth = getAdminAuth();
  
    return Boolean(
      auth?.accessToken &&
      auth?.refreshToken &&
      auth?.staff?.role === "ADMIN"
    );
  }
  
  // ========================================
  // 2. API 오류 클래스
  // ========================================
  
  export class AdminApiError extends Error {
    constructor(message, status, errorCode) {
      super(message);
  
      this.name = "AdminApiError";
      this.status = status;
      this.errorCode = errorCode;
    }
  }
  
  // API 공통 응답 처리
  async function parseResponse(response) {
    let result;
  
    try {
      result = await response.json();
    } catch {
      throw new AdminApiError(
        "서버 응답 형식이 올바르지 않습니다.",
        response.status,
        "INVALID_RESPONSE"
      );
    }
  
    // API 명세서: success, data, message, errorCode
    if (!response.ok || result?.success !== true) {
      throw new AdminApiError(
        result?.message || "요청 처리에 실패했습니다.",
        response.status,
        result?.errorCode || "UNKNOWN_ERROR"
      );
    }
  
    return result.data;
  }
  
  // ========================================
  // 3. 공통 HTTP 요청
  // ========================================
  
  // 인증이 필요 없는 API 호출
  // 예: 관리자 로그인, 토큰 재발급
  export async function publicAdminApi(path, options = {}) {
    const headers = new Headers(options.headers);
  
    if (
      options.body != null &&
      !(options.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
  
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  
    return parseResponse(response);
  }
  
  // 관리자 Bearer 토큰을 첨부하는 요청
  async function sendAuthorized(path, options, token) {
    // bodyFactory가 있으면 요청 직전에 Body 생성
    const { bodyFactory, ...fetchOptions } = options;
  
    const headers = new Headers(fetchOptions.headers);
  
    headers.set("Authorization", `Bearer ${token}`);
  
    const body = bodyFactory
      ? bodyFactory()
      : fetchOptions.body;
  
    if (body != null && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      body,
      headers,
    });
  
    return parseResponse(response);
  }
  
  // ========================================
  // 4. 세션 만료 처리
  // ========================================
  
  function handleSessionExpired(expectedToken) {
    // 다른 로그인 세션의 토큰을 삭제하지 않도록 확인
    if (
      expectedToken &&
      getAdminAuth()?.accessToken !== expectedToken
    ) {
      return;
    }
  
    clearAdminAuth();
  
    // 라우터 basename(/admin) 밖에서 직접 이동하므로 BASE_URL 을 붙인다.
    const loginPath = `${import.meta.env.BASE_URL}login`;
    if (window.location.pathname !== loginPath) {
      window.location.replace(loginPath);
    }
  }
  
  // ========================================
  // 5. 액세스 토큰 재발급
  // ========================================
  
  // 동시에 여러 요청이 401을 받더라도
  // refresh 요청은 한 번만 보내도록 공유
  async function refreshAdminToken() {
    if (refreshPromise) {
      return refreshPromise;
    }
  
    refreshPromise = (async () => {
      const auth = getAdminAuth();
      const versionAtStart = authVersion;
  
      if (!auth?.refreshToken) {
        throw new AdminApiError(
          "다시 로그인해 주세요.",
          401,
          "INVALID_REFRESH_TOKEN"
        );
      }
  
      // 기존 로그인 상태 유지 설정 확인
      const rememberMe =
        localStorage.getItem(AUTH_KEY) !== null;
  
      // 명세서: POST /api/v1/auth/refresh
      // Authorization 헤더 불필요
      const data = await publicAdminApi(
        "/api/v1/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({
            refreshToken: auth.refreshToken,
          }),
        }
      );
  
      if (!data?.accessToken || !data?.refreshToken) {
        throw new AdminApiError(
          "토큰 재발급 응답이 올바르지 않습니다.",
          401,
          "INVALID_REFRESH_RESPONSE"
        );
      }
  
      // 갱신 도중 로그아웃하거나 재로그인한 경우
      if (authVersion !== versionAtStart) {
        throw new AdminApiError(
          "인증 상태가 변경되었습니다.",
          401,
          "SESSION_CHANGED"
        );
      }
  
      // 회전된 토큰으로 기존 값 교체
      saveAdminAuth(
        {
          ...auth,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        rememberMe
      );
  
      return data.accessToken;
    })();
  
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }
  
  // ========================================
  // 6. 관리자 인증 API 요청
  // ========================================
  
  export async function adminApi(path, options = {}) {
    const auth = getAdminAuth();
  
    if (
      !auth?.accessToken ||
      !auth?.refreshToken ||
      auth?.staff?.role !== "ADMIN"
    ) {
      throw new AdminApiError(
        "로그인이 필요합니다.",
        401,
        "UNAUTHORIZED"
      );
    }
  
    const versionAtStart = authVersion;
  
    // 처음 요청할 때 사용한 토큰
    const originalToken = auth.accessToken;
  
    try {
      // 정상 토큰이면 즉시 API 응답 반환
      return await sendAuthorized(
        path,
        options,
        originalToken
      );
    } catch (error) {
      // 401 이외의 오류는 재발급하지 않음
      // 예: 403 FORBIDDEN, 404 NOT_FOUND
      if (error.status !== 401) {
        throw error;
      }
  
      const currentAuth = getAdminAuth();
  
      // 토큰 갱신이 아닌 로그아웃/재로그인으로
      // 세션이 변경되었다면 중단
      if (
        !currentAuth ||
        currentAuth.staff?.id !== auth.staff?.id
      ) {
        throw new AdminApiError(
          "인증 상태가 변경되었습니다.",
          401,
          "SESSION_CHANGED"
        );
      }
  
      // 기존 토큰이 그대로라면 authVersion이
      // 바뀌었는지도 검사
      if (
        currentAuth.accessToken === originalToken &&
        authVersion !== versionAtStart
      ) {
        throw new AdminApiError(
          "인증 상태가 변경되었습니다.",
          401,
          "SESSION_CHANGED"
        );
      }
  
      let newToken;
  
      try {
        if (currentAuth.accessToken !== originalToken) {
          // 다른 API 요청이 이미 토큰을 갱신한 경우
          newToken = currentAuth.accessToken;
        } else {
          // 토큰을 아직 갱신하지 않았다면 재발급
          newToken = await refreshAdminToken();
        }
      } catch (refreshError) {
        // refreshToken 만료/폐기된 경우에만 세션 삭제
        if (
          refreshError.status === 401 &&
          refreshError.errorCode !== "SESSION_CHANGED"
        ) {
          handleSessionExpired(
            getAdminAuth()?.accessToken
          );
        }
  
        throw refreshError;
      }
  
      // 재발급 완료 후 로그인 상태 재확인
      const latestAuth = getAdminAuth();
  
      if (
        !latestAuth ||
        latestAuth.staff?.id !== auth.staff?.id ||
        latestAuth.accessToken !== newToken
      ) {
        throw new AdminApiError(
          "인증 상태가 변경되었습니다.",
          401,
          "SESSION_CHANGED"
        );
      }
  
      try {
        // 새 액세스 토큰으로 원래 API 요청 재시도
        // bodyFactory가 있으면 Body도 다시 생성
        return await sendAuthorized(
          path,
          options,
          newToken
        );
      } catch (retryError) {
        // 새 토큰으로도 401이면 세션 종료
        if (
          retryError.status === 401 &&
          getAdminAuth()?.accessToken === newToken
        ) {
          handleSessionExpired(newToken);
        }
  
        throw retryError;
      }
    }
  }
  