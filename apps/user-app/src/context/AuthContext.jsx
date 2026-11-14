
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

// 로그인 응답에서 Access Token 추출
// 실제 응답 명세 확인 후 수정할 부분
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
  const [accessToken, setAccessToken] = useState(null);

  // API 요청에서 최신 토큰을 참조하기 위한 Ref
  const tokenRef = useRef(null);

  useEffect(() => {
    setAccessTokenProvider(() => tokenRef.current);

    return () => {
      setAccessTokenProvider(() => null);
    };
  }, []);

  // 로그인
  const signIn = async (credentials) => {
    const response = await loginApi(credentials);

    const token = extractAccessToken(response);

    tokenRef.current = token;
    setAccessToken(token);

    return response;
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await logoutApi();
    } finally {
      tokenRef.current = null;
      setAccessToken(null);
    }
  };

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
