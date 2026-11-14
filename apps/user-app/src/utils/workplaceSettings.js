
import {
  getWorkplace,
  updateWorkplace,
} from "../api/user";

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const unwrap = (response) =>
  response?.data ?? response;

// 오류 메시지
export function errorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }

  if (error?.status === 403) {
    return "이 정보를 변경할 권한이 없습니다.";
  }

  if (
    error?.status === 400 ||
    error?.status === 422
  ) {
    return (
      error?.message ??
      "입력 항목 또는 서버 요청 형식을 확인해 주세요."
    );
  }

  return (
    error?.message ??
    "서버 요청에 실패했습니다."
  );
}

// 서버 응답 검사
export function readSettings(response) {
  const data = unwrap(response);

  if (
    !isObject(data) ||
    !("workplace" in data) ||
    !("business" in data)
  ) {
    throw new Error(
      "근무장소 API 응답에 workplace/business 정보가 없습니다. 서버 응답 형식을 확인해 주세요."
    );
  }

  if (
    data.workplace != null &&
    !isObject(data.workplace)
  ) {
    throw new Error(
      "근무장소 응답 형식이 올바르지 않습니다."
    );
  }

  if (
    data.business != null &&
    !isObject(data.business)
  ) {
    throw new Error(
      "사업장 정보 응답 형식이 올바르지 않습니다."
    );
  }

  return data;
}

// 근무장소 응답 → 폼
export const workplaceForm = (value) => ({
  name: value?.name ?? "",
  address: value?.address ?? "",

  latitude:
    value?.latitude == null
      ? ""
      : String(value.latitude),

  longitude:
    value?.longitude == null
      ? ""
      : String(value.longitude),

  radiusMeters:
    value?.radiusMeters == null
      ? ""
      : String(value.radiusMeters),
});

// 사업장 응답 → 폼
export const businessForm = (value) => ({
  name: value?.name ?? "",
  address: value?.address ?? "",
  ownerName: value?.ownerName ?? "",
});

// 근무장소 입력 검증
export function validateWorkplace(
  form,
  previous = null
) {
  const name = form.name.trim();
  const address = form.address.trim();

  if (!name || !address) {
    throw new Error(
      "근무장소명과 주소를 입력해 주세요."
    );
  }

  if (
    form.latitude.trim() === "" ||
    form.longitude.trim() === ""
  ) {
    throw new Error(
      "위도와 경도가 필요합니다. 근무장소에서 현재 위치를 가져오거나 직접 입력해 주세요."
    );
  }

  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "위도는 -90~90 범위로 입력해 주세요."
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "경도는 -180~180 범위로 입력해 주세요."
    );
  }

  const result = {
    name,
    address,
    latitude,
    longitude,
  };

  if (form.radiusMeters.trim()) {
    const radius = Number(
      form.radiusMeters
    );

    if (
      !Number.isSafeInteger(radius) ||
      radius < 1
    ) {
      throw new Error(
        "GPS 허용 반경은 1 이상의 정수로 입력해 주세요."
      );
    }

    result.radiusMeters = radius;
  } else if (
    previous?.radiusMeters != null
  ) {
    // 반경 해제 API가 확인되지 않아
    // 기존 설정을 보존
    result.radiusMeters =
      previous.radiusMeters;
  }

  return result;
}

// 사업장 정보 입력 검증
export function validateBusiness(form) {
  const name = form.name.trim();
  const address = form.address.trim();
  const ownerName = form.ownerName.trim();

  if (
    !name ||
    !address ||
    !ownerName
  ) {
    throw new Error(
      "사업장명·사업장 주소·대표자명을 모두 입력해 주세요."
    );
  }

  return {
    name,
    address,
    ownerName,
  };
}

// 두 화면에서 공유하는 서버 저장 로직
export async function saveSettingsSection(
  section,
  form
) {
  if (
    section !== "workplace" &&
    section !== "business"
  ) {
    throw new Error(
      "저장 대상이 올바르지 않습니다."
    );
  }

  // 1. 저장 직전 서버 최신 데이터 조회
  const before = readSettings(
    await getWorkplace()
  );

  const other =
    section === "workplace"
      ? "business"
      : "workplace";

  // 2. 수정할 영역만 검증
  const edited =
    section === "workplace"
      ? validateWorkplace(
          form,
          before.workplace
        )
      : validateBusiness(form);

  // 3. Preserve the other section, but never echo server-only response fields.
  const body = {};
  if (before.workplace) {
    const { name, address, latitude, longitude, radiusMeters } = before.workplace;
    body.workplace = { name, address, latitude, longitude };
    if (radiusMeters != null) body.workplace.radiusMeters = radiusMeters;
  }
  if (before.business) {
    const { name, address, ownerName } = before.business;
    body.business = { name, address, ownerName };
  }
  body[section] = edited;

  // 4. 기존 PUT API 호출
  await updateWorkplace(body);

  // 5. 저장 후 GET으로 재확인
  const after = readSettings(
    await getWorkplace()
  );

  const saved = after[section];

  const incorrectlySaved =
    !saved ||
    Object.entries(edited).some(
      ([key, value]) =>
        String(saved[key]) !==
        String(value)
    );

  if (incorrectlySaved) {
    throw new Error(
      "저장 요청 후 조회한 값이 입력값과 다릅니다. 다시 확인해 주세요."
    );
  }

  // 6. 다른 영역 주요 필드 변경 여부 확인
  if (before[other]) {
    const keys =
      other === "business"
        ? [
            "name",
            "address",
            "ownerName",
          ]
        : [
            "name",
            "address",
            "latitude",
            "longitude",
            "radiusMeters",
          ];

    const changed = keys.some(
      (key) =>
        String(
          before[other]?.[key] ?? ""
        ) !==
        String(
          after[other]?.[key] ?? ""
        )
    );

    if (changed) {
      throw new Error(
        "저장 이후 다른 영역의 값도 달라졌습니다. 서버 PUT 동작을 확인하고, 두 화면의 내용을 다시 확인해 주세요."
      );
    }
  }

  return after;
}
