import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { AuthContext } from "./auth-context";
import {
  setAccessTokenProvider,
  setUnauthorizedHandler,
} from "../api/client";
import { login as loginApi, logout as logoutApi } from "../api/auth";

const LOCAL_TOKEN_KEY = "easython.accessToken";
const SESSION_TOKEN_KEY = "easython.sessionAccessToken";

function readStoredToken() {
  try {
    return (
      window.sessionStorage.getItem(SESSION_TOKEN_KEY) ||
      window.localStorage.getItem(LOCAL_TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

function clearStoredToken() {
  try {
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // 브라우저 저장소가 차단된 상황에서도 메모리 상태는 정리한다.
  }
}

function extractAccessToken(response) {
  const token = response?.accessToken ?? response?.data?.accessToken;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("로그인 응답에서 Access Token을 찾지 못했습니다.");
  }
  return token;
}

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(readStoredToken);
  const tokenRef = useRef(accessToken);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    clearStoredToken();
    setAccessToken(null);
  }, []);

  // 자식 페이지의 일반 useEffect(API 요청)보다 먼저 토큰 제공자를 등록한다.
  useLayoutEffect(() => {
    setAccessTokenProvider(() => tokenRef.current);
    setUnauthorizedHandler((failedToken) => {
      // 이전 요청의 401이 새 로그인 세션을 삭제하는 것을 방지한다.
      if (tokenRef.current && tokenRef.current === failedToken) {
        clearSession();
      }
    });
    return () => {
      setAccessTokenProvider(() => null);
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  async function signIn(credentials, { remember = false } = {}) {
    const response = await loginApi(credentials);
    const token = extractAccessToken(response);

    tokenRef.current = token;
    clearStoredToken();

    try {
      if (remember) {
        window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
      } else {
        window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      }
    } catch {
      // 저장소가 차단되어도 현재 탭에서는 로그인 유지.
    }
    setAccessToken(token);
    return response;
  }

  async function signOut() {
    try {
      if (tokenRef.current) await logoutApi();
    } finally {
      clearSession();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: Boolean(accessToken),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}