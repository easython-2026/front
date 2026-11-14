
import { adminApi, AdminApiError } from "./adminApi";

import {
  mockAdmin,
  mockConsultations,
} from "../mocks/adminMockData";

import {
  mockConsultationDetails,
} from "../mocks/adminMockDetailData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const URGENCY_RANK = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const VALID_SORTS = ["recent", "urgency"];

const VALID_STATUSES = [
  "RECEIVED",
  "REVIEWING",
  "INFO_REQUESTED",
  "REFERRED",
  "CLOSED",
];

const VALID_URGENCIES = ["HIGH", "MEDIUM", "LOW"];

const ALLOWED_TRANSITIONS = {
  RECEIVED: ["REVIEWING"],
  REVIEWING: ["INFO_REQUESTED", "REFERRED"],
  INFO_REQUESTED: ["REVIEWING"],
  REFERRED: ["REVIEWING"],
  CLOSED: [],
};

// Mock 모드에서 공유하는 데이터
// 새로고침하면 원래 예시 데이터로 초기화됨
let mockCases = structuredClone(mockConsultations);
let mockDetails = structuredClone(mockConsultationDetails);

const mockStaff = [
  {
    id: mockAdmin.id,
    name: mockAdmin.name,
    languages: ["ko"],
  },
  {
    id: "st2-demo",
    name: "김통역",
    languages: ["ko", "vi"],
  },
];

function apiError(
  message,
  status = 400,
  code = "VALIDATION_ERROR"
) {
  return new AdminApiError(message, status, code);
}

function getMockCase(consultationId) {
  const detail = mockDetails[consultationId];

  if (!detail) {
    throw apiError(
      "상담을 찾을 수 없습니다.",
      404,
      "NOT_FOUND"
    );
  }

  return detail;
}

// Mock 데이터에서 동일 사건의 목록 정보 갱신
function updateMockCase(consultationId, changes) {
  mockCases = mockCases.map((item) =>
    item.id === consultationId
      ? { ...item, ...changes }
      : item
  );
}

// =======================================
// 1. 관리자 대시보드
// GET /api/v1/admin/dashboard
// =======================================

export async function getAdminDashboard() {
  if (USE_MOCK) {
    return {
      newCount: mockCases.filter(
        (item) => item.status === "RECEIVED"
      ).length,

      inProgressCount: mockCases.filter(
        (item) =>
          ["REVIEWING", "INFO_REQUESTED", "REFERRED"].includes(
            item.status
          )
      ).length,

      closedCount: mockCases.filter(
        (item) => item.status === "CLOSED"
      ).length,

      highUrgencyCount: mockCases.filter(
        (item) =>
          item.status !== "CLOSED" &&
          (item.urgencyLevel || item.aiSuggestedUrgency) ===
            "HIGH"
      ).length,

      unreadMessageCount: mockCases.filter(
        (item) => item.hasNewMessage
      ).length,
    };
  }

  return adminApi("/api/v1/admin/dashboard");
}

// =======================================
// 2. 사건 목록
// GET /api/v1/admin/consultations
// =======================================

export async function getAdminConsultations({
  sort = "recent",
  status,
  page = 1,
  size = 20,
} = {}) {
  if (!VALID_SORTS.includes(sort)) {
    throw apiError("정렬 기준이 올바르지 않습니다.");
  }

  if (status && !VALID_STATUSES.includes(status)) {
    throw apiError("처리 상태가 올바르지 않습니다.");
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw apiError("페이지 정보가 올바르지 않습니다.");
  }

  if (USE_MOCK) {
    let list = [...mockCases];

    if (status) {
      list = list.filter(
        (item) => item.status === status
      );
    }

    list.sort((a, b) => {
      const dateDifference =
        new Date(b.receivedAt).getTime() -
        new Date(a.receivedAt).getTime();

      if (sort === "recent") return dateDifference;

      const aLevel =
        a.urgencyLevel || a.aiSuggestedUrgency;
      const bLevel =
        b.urgencyLevel || b.aiSuggestedUrgency;

      const priorityDifference =
        (URGENCY_RANK[bLevel] || 0) -
        (URGENCY_RANK[aLevel] || 0);

      return priorityDifference || dateDifference;
    });

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / size);
    const start = (page - 1) * size;

    return {
      consultations: structuredClone(
        list.slice(start, start + size)
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

// =======================================
// 3. 사건 상세 조회
// GET /api/v1/admin/consultations/{id}
// =======================================

export async function getAdminConsultationDetail(
  consultationId
) {
  if (!consultationId) {
    throw apiError("상담 사건 ID가 필요합니다.");
  }

  if (USE_MOCK) {
    return structuredClone(getMockCase(consultationId));
  }

  return adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}`
  );
}

// =======================================
// 4. 상담기관 담당자 목록
// GET /api/v1/admin/staff
// =======================================

export async function getAdminStaff() {
  if (USE_MOCK) {
    return {
      staff: structuredClone(mockStaff),
    };
  }

  return adminApi("/api/v1/admin/staff");
}

// =======================================
// 5. 담당자 배정 및 변경
// /api/v1/admin/consultations/{id}/assignee
// =======================================

export async function assignAdminConsultation(
  consultationId,
  staffId
) {
  if (!staffId) {
    throw apiError("담당자를 선택해 주세요.");
  }

  if (USE_MOCK) {
    const detail = getMockCase(consultationId);

    const staff = mockStaff.find(
      (item) => item.id === staffId
    );

    if (!staff) {
      throw apiError(
        "담당자를 찾을 수 없습니다.",
        404,
        "NOT_FOUND"
      );
    }

    if (detail.status === "CLOSED") {
      throw apiError(
        "종결된 사건은 변경할 수 없습니다.",
        409,
        "CONFLICT"
      );
    }

    detail.assignee = {
      id: staff.id,
      name: staff.name,
    };

    updateMockCase(consultationId, {
      assignee: detail.assignee,
    });

    return {
      id: consultationId,
      assignee: structuredClone(detail.assignee),
    };
  }

  return adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/assignee`,
    {
      method: "PATCH",
      body: JSON.stringify({ staffId }),
    }
  );
}

// =======================================
// 6. 긴급도 검토 및 확정
// /api/v1/admin/consultations/{id}/triage
// =======================================

export async function triageAdminConsultation(
  consultationId,
  { urgencyLevel, note = "" }
) {
  if (!VALID_URGENCIES.includes(urgencyLevel)) {
    throw apiError("올바른 긴급도를 선택해 주세요.");
  }

  const body = { urgencyLevel };

  if (note.trim()) {
    body.note = note.trim();
  }

  if (USE_MOCK) {
    const detail = getMockCase(consultationId);

    if (detail.status === "CLOSED") {
      throw apiError(
        "종결된 사건은 변경할 수 없습니다.",
        409,
        "CONFLICT"
      );
    }

    detail.urgencyLevel = urgencyLevel;

    updateMockCase(consultationId, {
      urgencyLevel,
    });

    return {
      id: consultationId,
      urgencyLevel,
      updatedAt: new Date().toISOString(),
    };
  }

  return adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/triage`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}

// =======================================
// 7. 처리 상태 변경
// PATCH /api/v1/admin/consultations/{id}/status
// =======================================

export async function updateAdminConsultationStatus(
  consultationId,
  { status, note = "" }
) {
  if (!VALID_STATUSES.includes(status) || status === "CLOSED") {
    throw apiError(
      "처리 상태가 올바르지 않습니다. 종결은 상담 결과 API를 사용해야 합니다."
    );
  }

  const body = { status };

  if (note.trim()) {
    body.note = note.trim();
  }

  if (USE_MOCK) {
    const detail = getMockCase(consultationId);

    const allowed =
      ALLOWED_TRANSITIONS[detail.status] || [];

    if (!allowed.includes(status)) {
      throw apiError(
        "현재 상태에서 변경할 수 없는 상태입니다.",
        409,
        "INVALID_TRANSITION"
      );
    }

    detail.status = status;

    updateMockCase(consultationId, {
      status,
    });

    return {
      id: consultationId,
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  return adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
}


/**
 * 관리자 추가 자료 요청
 * POST /api/v1/admin/consultations/{consultationId}/info-requests
 *
 * Mock 모드: 메모리의 사건 상세 데이터 수정
 * API 모드: 백엔드 서버로 요청
 */
export async function createAdminInfoRequest(
    consultationId,
    { message }
  ) {
    if (!consultationId) {
      throw apiError("상담 사건 ID가 필요합니다.");
    }
  
    const trimmedMessage = message?.trim();
  
    if (!trimmedMessage) {
      throw apiError("요청 내용을 입력해 주세요.");
    }
  
    if (trimmedMessage.length > 2000) {
      throw apiError(
        "요청 내용은 2,000자 이내로 입력해 주세요."
      );
    }
  
    // Mock 모드
    if (USE_MOCK) {
      const detail = getMockCase(consultationId);
  
      if (detail.status === "CLOSED") {
        throw apiError(
          "종결된 상담 사건에는 자료를 요청할 수 없습니다.",
          409,
          "CONFLICT"
        );
      }
  
      const newRequest = {
        id: crypto.randomUUID(),
        message: trimmedMessage,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
  
      if (!Array.isArray(detail.infoRequests)) {
        detail.infoRequests = [];
      }
  
      detail.infoRequests.push(newRequest);
  
      return structuredClone(newRequest);
    }
  
    // 실제 API 모드
    // 요청 본문 필드명은 백엔드 최종 명세 확인 필요
    return adminApi(
      `/api/v1/admin/consultations/${encodeURIComponent(
        consultationId
      )}/info-requests`,
      {
        method: "POST",
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      }
    );
  }
  

/**
 * 관리자 전문가 연계 기록
 *
 * POST /api/v1/admin/consultations/{consultationId}/referrals
 *
 * Request:
 * {
 *   type: "LABOR_ATTORNEY" | "INTERPRETER",
 *   organization: string,
 *   contact?: string,
 *   note?: string
 * }
 *
 * Response data:
 * {
 *   id: string,
 *   status: "REFERRED",
 *   createdAt: string
 * }
 */
export async function createAdminReferral(
    consultationId,
    {
      type,
      organization,
      contact = "",
      note = "",
    }
  ) {
    // 기본 입력 검증
    if (!consultationId) {
      throw apiError("상담 사건 ID가 필요합니다.");
    }
  
    const validTypes = [
      "LABOR_ATTORNEY",
      "INTERPRETER",
    ];
  
    if (!validTypes.includes(type)) {
      throw apiError("연계 유형을 선택해 주세요.");
    }
  
    const trimmedOrganization = organization?.trim();
  
    if (!trimmedOrganization) {
      throw apiError(
        "연계 기관 또는 전문가명을 입력해 주세요."
      );
    }
  
    // API 명세에 따른 요청 Body
    const body = {
      type,
      organization: trimmedOrganization,
    };
  
    if (contact.trim()) {
      body.contact = contact.trim();
    }
  
    if (note.trim()) {
      body.note = note.trim();
    }
  
    // ========================================
    // Mock 모드
    // ========================================
    if (USE_MOCK) {
      const detail = getMockCase(consultationId);
  
      if (detail.status === "CLOSED") {
        throw apiError(
          "종결된 사건에는 전문가 연계를 추가할 수 없습니다.",
          409,
          "CONFLICT"
        );
      }
  
      const createdAt = new Date().toISOString();
  
      const referral = {
        id: crypto.randomUUID(),
        ...body,
        createdAt,
      };
  
      if (!Array.isArray(detail.referrals)) {
        detail.referrals = [];
      }
  
      detail.referrals.push(referral);
  
      // API 명세에 따라 사건 상태 변경
      detail.status = "REFERRED";
  
      // Mock 사건 목록에도 변경사항 반영
      updateMockCase(consultationId, {
        status: "REFERRED",
      });
  
      return {
        id: referral.id,
        status: "REFERRED",
        createdAt,
      };
    }
  
    // ========================================
    // 실제 백엔드 API 호출
    // ========================================
    return adminApi(
      `/api/v1/admin/consultations/${encodeURIComponent(
        consultationId
      )}/referrals`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }
  