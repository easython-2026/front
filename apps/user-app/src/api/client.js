
import { ENDPOINTS } from "./endpoints";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");

// Access Token 제공 함수
let accessTokenProvider = () => null;

export function setAccessTokenProvider(provider) {
  if (typeof provider !== "function") {
    throw new TypeError(
      "Access Token provider must be a function."
    );
  }

  accessTokenProvider = provider;
}

// API 오류 클래스
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;

    // 서버가 반환한 오류 코드
    this.errorCode =
      data &&
      typeof data === "object"
        ? data.errorCode ?? null
        : null;
  }
}

// 동적 URL 생성
function buildPath(path, params = {}) {
  return path.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = params[key];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      throw new Error(
        `Missing URL parameter: ${key}`
      );
    }

    return encodeURIComponent(String(value));
  });
}

// Query String 생성
function buildQuery(query = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

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

// 응답 데이터 파싱
async function parseResponse(response, responseType = "auto") {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  if (responseType === "blob") {
    return response.blob();
  }

  if (responseType === "text") {
    return response.text();
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json") ||
    contentType.includes("+json")
  ) {
    return response.json();
  }

  return response.text();
}

// 오류 응답 전용 파싱
async function parseErrorResponse(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  // 오류는 JSON을 우선 확인
  if (
    contentType.includes("application/json") ||
    contentType.includes("+json")
  ) {
    return response.json().catch(() => null);
  }

  // JSON이 아니면 텍스트로 처리
  return response.text().catch(() => null);
}

// 공통 API 요청
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
    throw new Error(
      `Unknown API endpoint: ${group}.${action}`
    );
  }

  if (!BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL 환경변수가 설정되지 않았습니다."
    );
  }

  const path = buildPath(endpoint.path, params);
  const queryString = buildQuery(query);

  const url =
    `${BASE_URL}${path}` +
    (queryString ? `?${queryString}` : "");

  const requestHeaders = new Headers(headers);

  // PDF 요청과 일반 API 요청 구분
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set(
      "Accept",
      responseType === "blob"
        ? "application/pdf, application/json"
        : "application/json"
    );
  }

  const accessToken =
    token === undefined
      ? accessTokenProvider()
      : token;

  if (accessToken) {
    requestHeaders.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  let requestBody;

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      requestBody = body;

      // multipart boundary는 브라우저가 자동 생성
      requestHeaders.delete("Content-Type");
    } else if (
      body instanceof Blob ||
      typeof body === "string"
    ) {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);

      requestHeaders.set(
        "Content-Type",
        "application/json"
      );
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
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "서버에 연결할 수 없습니다.",
      0,
      error
    );
  }

  // ========================================
  // 1. HTTP 오류 응답을 먼저 처리
  // ========================================
  if (!response.ok) {
    const errorData =
      await parseErrorResponse(response);

    const message =
      errorData &&
      typeof errorData === "object"
        ? errorData.message ||
          errorData.error?.message ||
          `요청 실패 (${response.status})`
        : typeof errorData === "string" &&
            errorData.trim()
          ? errorData
          : `요청 실패 (${response.status})`;

    throw new ApiError(
      message,
      response.status,
      errorData
    );
  }

  // ========================================
  // 2. 성공 응답만 요청 타입에 맞게 파싱
  // ========================================
  const data = await parseResponse(
    response,
    responseType
  );

  // ========================================
  // 3. 공통 JSON 응답의 success 확인
  // ========================================
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
