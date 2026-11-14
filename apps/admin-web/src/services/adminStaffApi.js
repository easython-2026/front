
import { getAdminAuth } from "./adminApi";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

function getApiUrl(path) {
  // VITE_API_BASE_URL은 서버 주소(예: https://example.com)
  // 또는 빈 문자열이라고 가정한다.
  return `${API_BASE_URL}${path}`;
}

export async function getAdminStaff() {
  const auth = getAdminAuth();

  if (USE_MOCK) {
    const currentStaff = auth?.staff;

    if (!currentStaff?.id) {
      throw new Error(
        "관리자 로그인 정보가 없습니다."
      );
    }

    // Mock은 실제 기관 전체 직원 명단이 아님.
    // 로그인한 관리자만 표시한다.
    return [
      {
        id: currentStaff.id,
        name: currentStaff.name || "관리자",
        languages: Array.isArray(
          currentStaff.languages
        )
          ? currentStaff.languages
          : [],
      },
    ];
  }

  const accessToken = auth?.accessToken;

  if (!accessToken) {
    const error = new Error(
      "로그인 정보가 만료되었습니다. 다시 로그인해 주세요."
    );

    error.errorCode = "UNAUTHORIZED";
    throw error;
  }

  const response = await fetch(
    getApiUrl("/api/v1/admin/staff"),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  const body = await response.json().catch(
    () => null
  );

  if (!response.ok || body?.success === false) {
    const error = new Error(
      body?.message ||
        "담당자 목록을 불러오지 못했습니다."
    );

    error.errorCode =
      body?.errorCode ||
      (response.status === 401
        ? "UNAUTHORIZED"
        : response.status === 403
          ? "FORBIDDEN"
          : "REQUEST_FAILED");

    throw error;
  }

  const staff = body?.data?.staff;

  if (!Array.isArray(staff)) {
    throw new Error(
      "담당자 조회 응답 형식이 올바르지 않습니다."
    );
  }

  return staff;
}
