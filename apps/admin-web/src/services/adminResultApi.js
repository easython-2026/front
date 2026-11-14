
import { adminApi } from "./adminApi";

import {
  getAdminConsultationDetail,
} from "./adminConsultationApi";

import {
  getMockCaseOverride,
  updateMockCase,
} from "../mocks/adminMockStore";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true";

function createError(
  message,
  errorCode = "VALIDATION_ERROR"
) {
  const error = new Error(message);
  error.errorCode = errorCode;
  return error;
}

function unwrapData(response) {
  if (
    response &&
    typeof response === "object" &&
    "success" in response
  ) {
    if (response.success === false) {
      throw createError(
        response.message || "요청에 실패했습니다.",
        response.errorCode || "API_ERROR"
      );
    }

    return response.data;
  }

  return response;
}

/**
 * Mock에서 종결 결과 조회
 */
export function getMockClosedCase(consultationId) {
  const data = getMockCaseOverride(
    consultationId
  );

  if (data?.status !== "CLOSED") {
    return null;
  }

  return {
    id: String(consultationId),
    status: data.status,
    closedAt: data.closedAt,
    result: data.result,
  };
}

/**
 * 상담 결과 저장 및 종결
 *
 * POST /api/v1/admin/consultations/{id}/result
 */
export async function closeAdminConsultation(
  consultationId,
  {
    content,
    actionTaken,
    closeReason,
    shareWithWorker = true,
  }
) {
  if (!consultationId) {
    throw createError(
      "상담 사건 ID가 필요합니다."
    );
  }

  const payload = {
    content: content?.trim() || "",
    actionTaken: actionTaken?.trim() || "",
    closeReason: closeReason?.trim() || "",
    shareWithWorker: Boolean(shareWithWorker),
  };

  if (
    !payload.content ||
    !payload.actionTaken ||
    !payload.closeReason
  ) {
    throw createError(
      "상담 내용, 조치 결과, 종결 사유를 모두 입력해 주세요."
    );
  }

  // ========================================
  // MOCK MODE
  // ========================================

  if (USE_MOCK) {
    // 실제로 존재하는 Mock 사건인지 확인
    const detail =
      await getAdminConsultationDetail(
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
        "정보 공유 동의가 철회된 상담입니다.",
        "CONSENT_NOT_GRANTED"
      );
    }

    if (detail.status === "CLOSED") {
      throw createError(
        "이미 종결된 상담입니다.",
        "CONFLICT"
      );
    }

    // 테스트용 요청 지연
    await new Promise((resolve) =>
      setTimeout(resolve, 400)
    );

    const result = {
      id: String(consultationId),
      status: "CLOSED",
      closedAt: new Date().toISOString(),
    };

    // 사건 목록 / 상세 화면이 공유할 변경사항 저장
    updateMockCase(consultationId, {
      status: "CLOSED",
      closedAt: result.closedAt,
      result: {
        ...payload,
        createdAt: result.closedAt,
      },
    });

    return result;
  }

  // ========================================
  // REAL API MODE
  // ========================================

  const response = await adminApi(
    `/api/v1/admin/consultations/${encodeURIComponent(
      consultationId
    )}/result`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const data = unwrapData(response);

  if (
    !data ||
    data.status !== "CLOSED" ||
    !data.id
  ) {
    throw createError(
      "상담 종결 응답 형식이 올바르지 않습니다.",
      "INVALID_RESPONSE"
    );
  }

  return data;
}
