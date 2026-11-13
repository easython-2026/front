
import { adminApi, AdminApiError } from "./adminApi";

import {
  mockDashboard,
  mockConsultations,
} from "../mocks/adminMockData";

import {
  mockConsultationDetails,
} from "../mocks/adminMockDetailData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const VALID_SORTS = ["recent", "urgency"];

const VALID_STATUSES = [
  "RECEIVED",
  "REVIEWING",
  "INFO_REQUESTED",
  "REFERRED",
  "CLOSED",
];

const URGENCY_RANK = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function mockError(
  message,
  status = 400,
  errorCode = "VALIDATION_ERROR"
) {
  return new AdminApiError(message, status, errorCode);
}

// 1. 관리자 대시보드
export async function getAdminDashboard() {
  if (USE_MOCK) {
    return structuredClone(mockDashboard);
  }

  return adminApi("/api/v1/admin/dashboard");
}

// 2. 관리자 사건 목록
export async function getAdminConsultations({
  sort = "recent",
  status,
  page = 1,
  size = 20,
} = {}) {
  if (!VALID_SORTS.includes(sort)) {
    throw mockError("정렬 기준이 올바르지 않습니다.");
  }

  if (status && !VALID_STATUSES.includes(status)) {
    throw mockError("처리 상태가 올바르지 않습니다.");
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw mockError("페이지 정보가 올바르지 않습니다.");
  }

  if (USE_MOCK) {
    let list = [...mockConsultations];

    if (status) {
      list = list.filter((item) => item.status === status);
    }

    if (sort === "urgency") {
      list.sort((a, b) => {
        const aLevel =
          a.urgencyLevel || a.aiSuggestedUrgency;
        const bLevel =
          b.urgencyLevel || b.aiSuggestedUrgency;

        const difference =
          (URGENCY_RANK[bLevel] || 0) -
          (URGENCY_RANK[aLevel] || 0);

        if (difference !== 0) return difference;

        return (
          new Date(b.receivedAt).getTime() -
          new Date(a.receivedAt).getTime()
        );
      });
    } else {
      list.sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() -
          new Date(a.receivedAt).getTime()
      );
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / size);
    const startIndex = (page - 1) * size;

    return {
      consultations: structuredClone(
        list.slice(startIndex, startIndex + size)
      ),
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
      },
    };
  }

  const params = new URLSearchParams({
    sort,
    page: String(page),
    size: String(size),
  });

  if (status) {
    params.set("status", status);
  }

  return adminApi(
    `/api/v1/admin/consultations?${params.toString()}`
  );
}

// 3. 관리자 사건 상세
export async function getAdminConsultationDetail(
  consultationId
) {
  if (!consultationId) {
    throw mockError("상담 사건 ID가 필요합니다.");
  }

  if (USE_MOCK) {
    const detail = mockConsultationDetails[consultationId];

    if (!detail) {
      throw mockError(
        "상담 사건을 찾을 수 없습니다.",
        404,
        "NOT_FOUND"
      );
    }

    return structuredClone(detail);
  }

  return adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}`
  );
}
