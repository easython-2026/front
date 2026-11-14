
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import useGeolocation from "../../hooks/useGeolocation";

// 실제 API Request/Response 명세 확인 전까지
// 출퇴근 기록 서버 전송 비활성화
const API_CONTRACT_VERIFIED = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function AttendanceCapture() {
  const { type } = useParams();

  const isClockIn = type === "clock-in";
  const isClockOut = type === "clock-out";
  const isValidType = isClockIn || isClockOut;

  const title = isClockIn ? "출근" : "퇴근";

  // ========================================
  // GPS 상태
  // ========================================
  const {
    location,
    loading: gpsLoading,
    error: gpsError,
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  // ========================================
  // 사진 상태
  // ========================================
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");

  // 생성한 Object URL을 보관
  const previewUrlRef = useRef(null);

  // ========================================
  // 서버 요청 상태
  // ========================================
  const [serverMessage, setServerMessage] =
    useState("");

  // ========================================
  // 페이지 종료 시 이미지 URL 정리
  // ========================================
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // ========================================
  // GPS 위치 확인
  // ========================================
  async function handleLocationCheck() {
    setServerMessage("");

    try {
      await getCurrentLocation();
    } catch {
      // GPS 오류는 useGeolocation에서 처리
    }
  }

  // ========================================
  // 사진 촬영 및 파일 선택
  // ========================================
  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    // 동일한 사진을 재선택할 수 있도록 초기화
    event.target.value = "";

    if (!file) return;

    setPhotoError("");
    setServerMessage("");

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      setPhotoError(
        "이미지 파일만 선택할 수 있습니다."
      );
      return;
    }

    // 파일 크기 검사
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError(
        "10MB 이하의 사진을 선택해 주세요."
      );
      return;
    }

    // 기존 이미지 URL 정리
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    // 새 이미지 URL 생성
    const newUrl = URL.createObjectURL(file);

    previewUrlRef.current = newUrl;

    setPhoto(file);
    setPreviewUrl(newUrl);
  }

  // ========================================
  // 사진 삭제 및 재촬영
  // ========================================
  function handleRemovePhoto() {
    // 기존 URL 메모리 해제
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPhoto(null);
    setPreviewUrl("");
    setPhotoError("");
    setServerMessage("");
  }

  // ========================================
  // GPS 초기화
  // ========================================
  function handleResetLocation() {
    resetLocation();
    setServerMessage("");
  }

  // ========================================
  // 출퇴근 기록 요청 전 검증
  // ========================================
  function validateCapture() {
    if (!location) {
      return "GPS 위치를 먼저 확인해 주세요.";
    }

    if (!photo) {
      return "현장 사진을 촬영해 주세요.";
    }

    if (!API_CONTRACT_VERIFIED) {
      return (
        "백엔드 API 요청 명세 확인이 필요합니다. " +
        "현재 실제 출퇴근 기록은 전송하지 않습니다."
      );
    }

    return null;
  }

  // ========================================
  // 출퇴근 기록 처리
  // ========================================
  function handleSubmit() {
    const validationError = validateCapture();

    if (validationError) {
      setServerMessage(validationError);
      return;
    }

    // API 상세 명세 확인 후 구현 예정
    // 1. POST /api/v1/attendance/location-check
    // 2. 사업장 위치 인증 성공 확인
    // 3. 현장 사진 업로드
    // 4. POST /api/v1/attendance/clock-in
    //    또는 /clock-out

    setServerMessage(
      "출퇴근 API 연동이 아직 완료되지 않았습니다."
    );
  }

  // ========================================
  // 잘못된 URL 처리
  // ========================================
  if (!isValidType) {
    return (
      <main style={{ padding: 24 }}>
        <h1>잘못된 출퇴근 유형입니다.</h1>

        <Link to="/attendance">
          출퇴근 관리로 돌아가기
        </Link>
      </main>
    );
  }

  const readyForCapture = Boolean(
    location && photo
  );

  // ========================================
  // 화면
  // ========================================
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <h1>{title} 인증</h1>

      <p>
        현재 위치를 확인하고 근무 현장 사진을
        촬영해 주세요.
      </p>

      {/* 1. GPS 위치 확인 */}
      <section style={{ marginBottom: 32 }}>
        <h2>1. GPS 위치 확인</h2>

        <button
          type="button"
          onClick={handleLocationCheck}
          disabled={gpsLoading}
        >
          {gpsLoading
            ? "위치 확인 중..."
            : "현재 위치 확인"}
        </button>

        <button
          type="button"
          onClick={handleResetLocation}
          disabled={gpsLoading}
          style={{ marginLeft: 8 }}
        >
          위치 초기화
        </button>

        {gpsError && (
          <p role="alert" style={{ color: "red" }}>
            {gpsError}
          </p>
        )}

        {location && (
          <div style={{ marginTop: 16 }}>
            <h3>GPS 좌표 획득 성공</h3>

            <p>
              <strong>위도:</strong>{" "}
              {location.latitude}
            </p>

            <p>
              <strong>경도:</strong>{" "}
              {location.longitude}
            </p>

            <p>
              <strong>정확도:</strong>{" "}
              약 {Math.round(location.accuracy)}m
            </p>

            <p>
              <strong>측정 시각:</strong>{" "}
              {new Date(
                location.timestamp
              ).toLocaleString()}
            </p>

            <p>
              아직 사업장 GPS 인증이 완료된 것은
              아닙니다.
            </p>
          </div>
        )}
      </section>

      {/* 2. 현장 사진 촬영 */}
      <section style={{ marginBottom: 32 }}>
        <h2>2. 근무 현장 사진 촬영</h2>

        <p>
          스마트폰에서는 카메라 촬영,
          PC에서는 파일 선택이 가능합니다.
        </p>

        <label htmlFor="attendance-photo">
          현장 사진 선택
        </label>

        <input
          id="attendance-photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
        />

        {photoError && (
          <p role="alert" style={{ color: "red" }}>
            {photoError}
          </p>
        )}

        {photo && (
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>파일명:</strong>{" "}
              {photo.name}
            </p>

            <p>
              <strong>파일 크기:</strong>{" "}
              {(photo.size / 1024 / 1024).toFixed(2)}
              MB
            </p>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="근무 현장 사진 미리보기"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                }}
              />
            )}

            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{ marginTop: 12 }}
            >
              사진 삭제 및 재촬영
            </button>
          </div>
        )}
      </section>

      {/* 3. 출퇴근 기록 */}
      <section style={{ marginBottom: 32 }}>
        <h2>3. {title} 기록</h2>

        <p>
          GPS:{" "}
          {location ? "좌표 확인 완료" : "미확인"}
        </p>

        <p>
          사진:{" "}
          {photo ? "선택 완료" : "미선택"}
        </p>

        <p>서버 GPS 인증: 미진행</p>

        {readyForCapture && (
          <p role="status">
            GPS와 사진이 준비되었습니다.
            서버 인증은 아직 연결되지 않았습니다.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!readyForCapture}
        >
          {title} 기록 요청 확인
        </button>

        {serverMessage && (
          <p role="status">
            {serverMessage}
          </p>
        )}
      </section>

      <Link to="/attendance">
        출퇴근 관리로 돌아가기
      </Link>
    </main>
  );
}
