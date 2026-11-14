
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { AuthContext } from "./auth-context";
import { setAccessTokenProvider } from "../api/client";
import {
  login as loginApi,
  logout as logoutApi,
} from "../api/auth";

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

function extractAccessToken(response) {
  const token =
    response?.accessToken ??
    response?.data?.accessToken;

  if (typeof token !== "string" || !token) {
    throw new Error(
      "로그인 응답에서 Access Token을 찾지 못했습니다. " +
      "백엔드 응답 형식을 확인해 주세요."
    );
  }

  return token;
}

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] =
    useState(readStoredToken);

  const tokenRef = useRef(accessToken);

  useEffect(() => {
    setAccessTokenProvider(() => tokenRef.current);

    return () => {
      setAccessTokenProvider(() => null);
    };
  }, []);

  async function signIn(
    credentials,
    { remember = false } = {}
  ) {
    const response = await loginApi(credentials);
    const token = extractAccessToken(response);

    tokenRef.current = token;
    setAccessToken(token);

    try {
      window.localStorage.removeItem(LOCAL_TOKEN_KEY);
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);

      if (remember) {
        window.localStorage.setItem(
          LOCAL_TOKEN_KEY,
          token
        );
      } else {
        window.sessionStorage.setItem(
          SESSION_TOKEN_KEY,
          token
        );
      }
    } catch {
      // 저장소가 차단되어도 메모리 로그인은 유지
    }

    return response;
  }

  async function signOut() {
    try {
      await logoutApi();
    } finally {
      tokenRef.current = null;
      setAccessToken(null);

      try {
        window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
      } catch {
        // 저장소 접근 실패 예외 처리
      }
    }
  }

  const value = {
    accessToken,
    isAuthenticated: Boolean(accessToken),
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
