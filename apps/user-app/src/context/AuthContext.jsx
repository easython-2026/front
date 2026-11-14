import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./auth-context";
import {
  setAccessTokenProvider,
  setTokenRefreshHandler,
  setUnauthorizedHandler,
} from "../api/client";
import {
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshTokenApi,
} from "../api/auth";

const LOCAL_ACCESS = "easython.accessToken";
const SESSION_ACCESS = "easython.sessionAccessToken";
const LOCAL_REFRESH = "easython.refreshToken";
const SESSION_REFRESH = "easython.sessionRefreshToken";

function readStorage(localKey, sessionKey) {
  try {
    return window.sessionStorage.getItem(sessionKey) ||
      window.localStorage.getItem(localKey) || null;
  } catch {
    return null;
  }
}
function clearStorage() {
  try {
    [LOCAL_ACCESS, LOCAL_REFRESH].forEach((key) => window.localStorage.removeItem(key));
    [SESSION_ACCESS, SESSION_REFRESH].forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // An unavailable browser storage must not block state cleanup.
  }
}
function credentialsFrom(response) {
  const data = response?.data ?? response;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("인증 응답에서 Access/Refresh Token을 찾지 못했습니다.");
  }
  return {
    access: data.accessToken,
    refresh: data.refreshToken,
  };
}
function rememberSession() {
  try { return Boolean(window.localStorage.getItem(LOCAL_ACCESS)); }
  catch { return false; }
}
function persistTokens(access, refresh, remember) {
  clearStorage();
  try {
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(remember ? LOCAL_ACCESS : SESSION_ACCESS, access);
    store.setItem(remember ? LOCAL_REFRESH : SESSION_REFRESH, refresh);
  } catch {
    // Tokens will remain in-memory for the current tab.
  }
}

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => readStorage(LOCAL_ACCESS, SESSION_ACCESS));
  const tokenRef = useRef(accessToken);
  const refreshRef = useRef(readStorage(LOCAL_REFRESH, SESSION_REFRESH));
  const refreshingRef = useRef(null);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    refreshRef.current = null;
    clearStorage();
    setAccessToken(null);
  }, []);

  const refreshSession = useCallback(async (staleToken) => {
    if (tokenRef.current && tokenRef.current !== staleToken) {
      return tokenRef.current; // another request already rotated the token
    }
    if (!refreshRef.current) return null;
    if (!refreshingRef.current) {
      const oldAccess = tokenRef.current;
      const oldRefresh = refreshRef.current;
      const remember = rememberSession();
      const job = (async () => {
        const response = await refreshTokenApi(oldRefresh);
        const next = credentialsFrom(response);
        // Logging out while refresh is underway must not reinstate the session.
        if (tokenRef.current !== oldAccess) return tokenRef.current;
        tokenRef.current = next.access;
        refreshRef.current = next.refresh;
        persistTokens(next.access, next.refresh, remember);
        setAccessToken(next.access);
        return next.access;
      })();
      refreshingRef.current = job;
      void job.finally(() => { if (refreshingRef.current === job) refreshingRef.current = null; }).catch(() => {});
    }
    try { return await refreshingRef.current; }
    catch { return null; }
  }, []);

  useLayoutEffect(() => {
    setAccessTokenProvider(() => tokenRef.current);
    setTokenRefreshHandler(refreshSession);
    setUnauthorizedHandler((failedToken) => {
      if (tokenRef.current && tokenRef.current === failedToken) clearSession();
    });
    return () => {
      setAccessTokenProvider(() => null);
      setTokenRefreshHandler(null);
      setUnauthorizedHandler(null);
    };
  }, [clearSession, refreshSession]);

  async function signIn(credentials, { remember = false } = {}) {
    const response = await loginApi(credentials);
    const next = credentialsFrom(response);
    tokenRef.current = next.access;
    refreshRef.current = next.refresh;
    persistTokens(next.access, next.refresh, remember);
    setAccessToken(next.access);
    return response;
  }

  async function signOut() {
    // Capture the current credentials before clearing local state.
    const access = tokenRef.current;
    const refresh = refreshRef.current;
    try {
      if (access && refresh) await logoutApi(refresh, { token: access });
    } finally {
      clearSession();
    }
  }

  return (
    <AuthContext.Provider value={{
      accessToken,
      isAuthenticated: Boolean(accessToken),
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
