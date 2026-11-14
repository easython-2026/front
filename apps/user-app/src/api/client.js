// API 공통 설정


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
        searchParams.append(key, String(item));
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

// 응답 데이터 파싱
async function parseResponse(response, responseType) {
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

  requestHeaders.set("Accept", "application/json");

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

      // FormData boundary 자동 설정
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
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "서버에 연결할 수 없습니다.",
      0,
      error
    );
  }

  const data = await parseResponse(
    response,
    responseType
  );

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      !(data instanceof Blob)
        ? data.message ||
          data.error?.message ||
          `요청 실패 (${response.status})`
        : `요청 실패 (${response.status})`;

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data;
}
