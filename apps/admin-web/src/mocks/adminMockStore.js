
/**
 * 관리자 공통 Mock 변경사항 저장소
 *
 * 원본 Mock 데이터는 기존 파일에서 관리하고,
 * 이 파일에서는 사건별 변경사항만 저장한다.
 *
 * localStorage 사용으로 새로고침해도
 * Mock 변경사항이 유지된다.
 */

const STORAGE_KEY =
  "ilhanmankeum_admin_mock_case_overrides";

function readOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeOverrides(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

  // 같은 탭의 React 컴포넌트에도 변경 알림
  window.dispatchEvent(
    new CustomEvent("admin-mock-data-changed")
  );
}

/**
 * 한 사건의 Mock 변경사항 조회
 */
export function getMockCaseOverride(caseId) {
  const overrides = readOverrides();

  return overrides[String(caseId)] || null;
}

/**
 * 사건 정보 일부 변경
 *
 * 예:
 * updateMockCase("co1", {
 *   status: "CLOSED"
 * });
 */
export function updateMockCase(
  caseId,
  changes
) {
  if (!caseId) {
    throw new Error("사건 ID가 필요합니다.");
  }

  const overrides = readOverrides();
  const key = String(caseId);

  const previous = overrides[key] || {};

  const next = {
    ...previous,
    ...changes,
  };

  overrides[key] = next;

  writeOverrides(overrides);

  return structuredClone(next);
}

/**
 * 원본 사건 데이터와 변경사항 합치기
 */
export function applyMockCaseOverride(caseData) {
  if (!caseData || !caseData.id) {
    return caseData;
  }

  const changes = getMockCaseOverride(
    caseData.id
  );

  if (!changes) {
    return structuredClone(caseData);
  }

  return {
    ...structuredClone(caseData),
    ...structuredClone(changes),
  };
}

/**
 * 상담 사건 목록에 변경사항 적용
 */
export function applyMockCaseOverrides(cases) {
  if (!Array.isArray(cases)) {
    return [];
  }

  return cases.map(applyMockCaseOverride);
}

/**
 * Mock 데이터 초기화
 *
 * 테스트 데이터만 삭제하며
 * 실제 서버 데이터에는 영향 없음.
 */
export function resetAdminMockStore() {
  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent("admin-mock-data-changed")
  );
}
