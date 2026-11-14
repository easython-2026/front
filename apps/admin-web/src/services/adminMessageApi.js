
import { adminApi } from "./adminApi";
import {
  getAdminConsultationDetail,
} from "./adminConsultationApi";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true";

const mockMessagesByCase = new Map();

const clone = (value) => structuredClone(value);

function createError(message, errorCode = "VALIDATION_ERROR") {
  const error = new Error(message);
  error.errorCode = errorCode;
  return error;
}

function validateCaseId(consultationId) {
  if (!consultationId) {
    throw createError("상담 사건 ID가 필요합니다.");
  }
}

// API 명세의 응답은 { success, data, message }.
// 기존 adminApi가 data를 반환하는 구조를 기본으로 사용하고,
// 전체 envelope를 반환하는 경우도 수용한다.
function unwrapData(response) {
  if (
    response &&
    typeof response === "object" &&
    "success" in response
  ) {
    if (response.success === false) {
      throw createError(
        response.message || "API 요청에 실패했습니다.",
        response.errorCode || "API_ERROR"
      );
    }

    return response.data;
  }

  return response;
}

function getMockMessageStore(consultationId) {
  const key = String(consultationId);

  if (!mockMessagesByCase.has(key)) {
    mockMessagesByCase.set(key, []);
  }

  return mockMessagesByCase.get(key);
}

async function assertMockCase(consultationId) {
  const detail = await getAdminConsultationDetail(
    consultationId
  );

  if (!detail) {
    throw createError(
      "상담 사건을 찾을 수 없습니다.",
      "NOT_FOUND"
    );
  }

  if (detail.consent?.revokedAt) {
    throw createError(
      "정보 공유 동의가 철회된 사건입니다.",
      "CONSENT_NOT_GRANTED"
    );
  }

  return detail;
}

/**
 * 관리자 상담 메시지 조회
 *
 * GET /api/v1/admin/consultations/{id}/messages
 * ?page=1&size=50
 *
 * Response:
 * {
 *   messages: [],
 *   pageInfo: {
 *     currentPage,
 *     totalPages,
 *     totalCount
 *   }
 * }
 */
export async function getAdminMessages(
  consultationId,
  { page = 1, size = 50 } = {}
) {
  validateCaseId(consultationId);

  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(
    100,
    Math.max(1, Number(size) || 50)
  );

  if (USE_MOCK) {
    await assertMockCase(consultationId);

    const all = [...getMockMessageStore(consultationId)]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );

    const totalCount = all.length;
    const totalPages = Math.max(
      1,
      Math.ceil(totalCount / safeSize)
    );

    const start = (safePage - 1) * safeSize;

    return {
      messages: clone(
        all.slice(start, start + safeSize)
      ),
      pageInfo: {
        currentPage: safePage,
        totalPages,
        totalCount,
      },
    };
  }

  const params = new URLSearchParams({
    page: String(safePage),
    size: String(safeSize),
  });

  const response = await adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/messages?${params.toString()}`
  );

  const data = unwrapData(response);

  if (!data || !Array.isArray(data.messages)) {
    throw createError(
      "메시지 조회 응답 형식이 올바르지 않습니다.",
      "INVALID_RESPONSE"
    );
  }

  return data;
}

/**
 * 관리자 상담 메시지 전송
 *
 * POST /api/v1/admin/consultations/{id}/messages
 *
 * Body:
 * { text: "한국어 메시지" }
 *
 * 201 Created:
 * {
 *   id,
 *   sender: "STAFF",
 *   text,
 *   koText,
 *   translationStatus,
 *   createdAt
 * }
 */
export async function sendAdminMessage(
  consultationId,
  { text }
) {
  validateCaseId(consultationId);

  const trimmedText = text?.trim() || "";

  if (trimmedText.length < 1) {
    throw createError("메시지를 입력해 주세요.");
  }

  if (trimmedText.length > 2000) {
    throw createError(
      "메시지는 최대 2,000자까지 입력할 수 있습니다."
    );
  }

  if (USE_MOCK) {
    const detail = await assertMockCase(
      consultationId
    );

    if (detail.status === "CLOSED") {
      throw createError(
        "종결된 상담에는 메시지를 전송할 수 없습니다.",
        "CONFLICT"
      );
    }

    // Mock 모드에서는 실제 번역을 수행하지 않는다.
    // 원문은 저장하되 번역 대기 상태로 명확히 표시한다.
    const newMessage = {
      id: crypto.randomUUID(),
      sender: "STAFF",
      koText: trimmedText,
      text: null,
      translationStatus: "PROCESSING",
      attachedEvidences: [],
      createdAt: new Date().toISOString(),
    };

    getMockMessageStore(consultationId).push(
      newMessage
    );

    return clone(newMessage);
  }

  const response = await adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        text: trimmedText,
      }),
    }
  );

  const data = unwrapData(response);

  if (!data?.id || data.sender !== "STAFF") {
    throw createError(
      "메시지 전송 응답 형식이 올바르지 않습니다.",
      "INVALID_RESPONSE"
    );
  }

  return data;
}
