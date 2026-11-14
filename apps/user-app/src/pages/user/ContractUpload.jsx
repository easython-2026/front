
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

// 백엔드 multipart 필드명 확인 전에는
// 실제 계약서 업로드를 실행하지 않는다.
const UPLOAD_API_READY = false;

function isSupportedFile(file) {
  const mimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  return mimeTypes.includes(file.type);
}

export default function ContractUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const previewUrlRef = useRef(null);

  // 페이지를 벗어날 때 Object URL 정리
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) return;

    setError("");
    setMessage("");

    if (!isSupportedFile(selectedFile)) {
      setError(
        "PDF, JPG, PNG, WEBP 파일만 등록할 수 있습니다."
      );
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        "파일 크기는 20MB 이하여야 합니다."
      );
      return;
    }

    clearPreviewUrl();

    const newUrl = URL.createObjectURL(selectedFile);

    previewUrlRef.current = newUrl;

    setFile(selectedFile);
    setPreviewUrl(newUrl);
  }

  function handleRemoveFile() {
    clearPreviewUrl();

    setFile(null);
    setPreviewUrl("");
    setError("");
    setMessage("");
  }

  function handleUpload() {
    if (!file) {
      setError("근로계약서 파일을 선택해 주세요.");
      return;
    }

    if (!UPLOAD_API_READY) {
      setMessage(
        "파일 선택과 미리보기가 완료되었습니다. " +
        "백엔드 업로드 요청 형식을 확인한 후 " +
        "서버 저장 기능을 연결합니다."
      );
      return;
    }

    // 실제 업로드 로직은 API 상세 명세 확인 후 구현.
    // POST /api/v1/contracts
    //
    // 서버에 따라 파일 필드명이
    // file, contractFile, document 등으로 달라짐.
    //
    // 분석 결과가 즉시 반환되는지,
    // 별도 상태 조회가 필요한지도 확인 필요.
  }

  const isPdf = file?.type === "application/pdf";

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1>근로계약서 등록</h1>

      <p>
        계약서 PDF 또는 사진 파일을 선택해 주세요.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2>1. 파일 선택</h2>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          aria-label="근로계약서 파일 선택"
        />

        <p>
          지원 형식: PDF, JPG, PNG, WEBP
        </p>

        <p>최대 파일 크기: 20MB</p>

        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}
      </section>

      {file && (
        <section style={{ marginBottom: 24 }}>
          <h2>2. 계약서 미리보기</h2>

          <p>파일명: {file.name}</p>

          <p>
            파일 크기:{" "}
            {(file.size / 1024 / 1024).toFixed(2)}
            MB
          </p>

          {previewUrl && isPdf && (
            <iframe
              title="근로계약서 PDF 미리보기"
              src={previewUrl}
              style={{
                width: "100%",
                height: 480,
                border: "1px solid #ddd",
              }}
            />
          )}

          {previewUrl && !isPdf && (
            <img
              src={previewUrl}
              alt="근로계약서 미리보기"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: 480,
                objectFit: "contain",
              }}
            />
          )}

          <button
            type="button"
            onClick={handleRemoveFile}
            style={{ marginTop: 16 }}
          >
            파일 삭제 및 다시 선택
          </button>
        </section>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>3. 계약서 등록</h2>

        <p>
          파일을 확인한 다음 등록 버튼을 눌러 주세요.
        </p>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file}
        >
          계약서 등록 요청 확인
        </button>

        {message && (
          <p role="status">{message}</p>
        )}

        <p style={{ fontSize: 13 }}>
          현재는 파일 업로드 준비 단계입니다.
          서버 저장은 아직 실행되지 않습니다.
        </p>
      </section>

      <Link to="/contracts">
        근로계약서 목록으로 돌아가기
      </Link>
    </main>
  );
}
