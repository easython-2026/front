import { ENDPOINTS } from "./endpoints";

const BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "");

let accessTokenProvider = () => null;
let unauthorizedHandler = null;

export function setAccessTokenProvider(provider) {
  if (typeof provider !== "function") {
    throw new TypeError("Access Token provider must be a function.");
  }
  accessTokenProvider = provider;
}

// 만료된 토큰을 화면 인증 상태와 동기화하기 위한 콜백.
// 재발급 API 계약이 확정되기 전까지 임의의 refresh 요청은 수행하지 않는다.
export function setUnauthorizedHandler(handler) {
  if (handler !== null && typeof handler !== "function") {
    throw new TypeError("Unauthorized handler must be a function or null.");
  }
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.errorCode =
      data && typeof data === "object"
        ? data.errorCode ?? data.error?.code ?? null
        : null;
  }
}

function buildPath(path, params = {}) {
  return path.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing URL parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

function buildQuery(query = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

async function parseResponse(response, responseType = "auto") {
  if (response.status === 204 || response.status === 205) return null;
  if (responseType === "blob") return response.blob();
  if (responseType === "text") return response.text();

  const contentType = response.headers.get("content-type") || "";
  if (/application\/json|\+json/i.test(contentType)) {
    return response.json();
  }
  return response.text();
}

async function parseErrorResponse(response) {
  if (response.status === 204 || response.status === 205) return null;
  const contentType = response.headers.get("content-type") || "";
  if (/application\/json|\+json/i.test(contentType)) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
}

export async function apiRequest(
  group,
  action,
  {
    params = {},
    query = {},
    body,
    headers = {},
    token,
    signal,
    responseType = "auto",
    credentials = "same-origin",
  } = {}
) {
  const endpoint = ENDPOINTS[group]?.[action];
  if (!endpoint) {
    throw new Error(`Unknown API endpoint: ${group}.${action}`);
  }
  if (!BASE_URL) {
    throw new Error("VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.");
  }

  const path = buildPath(endpoint.path, params);
  const qs = buildQuery(query);
  const url = `${BASE_URL}${path}${qs ? `?${qs}` : ""}`;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set(
      "Accept",
      responseType === "blob"
        ? "application/pdf, application/json"
        : "application/json"
    );
  }

  // token:null을 전달하는 로그인/비밀번호 재설정 API에는
  // 저장되어 있던 이전 토큰을 첨부하지 않는다.
  const accessToken = token === undefined ? accessTokenProvider() : token;
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let requestBody;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      requestBody = body;
      requestHeaders.delete("Content-Type");
    } else if (body instanceof Blob || typeof body === "string") {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
      requestHeaders.set("Content-Type", "application/json");
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method: endpoint.method,
      headers: requestHeaders,
      body: requestBody,
      credentials,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("서버에 연결할 수 없습니다.", 0, error);
  }

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    const message =
      errorData && typeof errorData === "object"
        ? errorData.message || errorData.error?.message ||
          `요청 실패 (${response.status})`
        : typeof errorData === "string" && errorData.trim()
        ? errorData
        : `요청 실패 (${response.status})`;

    // 로그인 실패(401)는 기존 세션을 강제로 제거하는 근거가 아니다.
    // 보호 API 401에서만, 요청할 때 사용한 토큰을 넘겨 경쟁 상황을 방지한다.
    if (response.status === 401 && accessToken && group !== "auth") {
      try {
        unauthorizedHandler?.(accessToken);
      } catch {
        // 오류 콜백 실패가 원래 API 오류를 가리지 않게 한다.
      }
    }
    throw new ApiError(message, response.status, errorData);
  }

  const data = await parseResponse(response, responseType);
  if (
    data &&
    typeof data === "object" &&
    !(data instanceof Blob) &&
    data.success === false
  ) {
    throw new ApiError(
      data.message || "API 요청에 실패했습니다.",
      response.status,
      data
    );
  }
  return data;
}