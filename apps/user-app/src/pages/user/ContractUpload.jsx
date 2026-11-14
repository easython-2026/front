
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { uploadContract } from "../../api/contract";
import "../../styles/contract-upload-figma.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const ACCEPTED_EXTENSIONS =
  ".pdf,.jpg,.jpeg,.png";

// 기존 API 명세의 multipart 파일 필드명 확인 필요
const UPLOAD_FIELD = "file";

// 화면 전용 아이콘
function ContractIcon({ name, size = 22 }) {
  const icons = {
    arrow: (
      <path d="M19 12H5m6-6-6 6 6 6" />
    ),

    camera: (
      <>
        <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 15v5h16v-5" />
      </>
    ),

    chevron: (
      <path d="m9 5 7 7-7 7" />
    ),

    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h4M9 12h6M9 16h6" />
      </>
    ),

    alert: (
      <>
        <path d="m12 3 10 18H2z" />
        <path d="M12 9v5M12 18h.01" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3" />
        <path d="M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] ?? icons.file}
    </svg>
  );
}

// 서버 API 오류 출력
function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.";
  }

  if (error?.status === 413) {
    return "업로드 파일이 서버의 허용 용량을 초과했습니다.";
  }

  if (error?.status === 415) {
    return "서버에서 지원하지 않는 파일 형식입니다.";
  }

  return (
    error?.message ??
    "계약서를 업로드하지 못했습니다. 다시 시도해 주세요."
  );
}

// 업로드 응답에서 실제 계약서 ID 추출
function getContractId(response) {
  const result = response?.data ?? response;
  const contract = result?.contract ?? result;

  return (
    result?.contractId ??
    result?.id ??
    contract?.contractId ??
    contract?.id ??
    null
  );
}

export default function ContractUpload() {
  const navigate = useNavigate();

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [fileError, setFileError] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  // 컴포넌트 종료 시 미리보기 메모리 해제
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current = null;
      }
    };
  }, []);

  function releasePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }
  }

  function clearFile() {
    if (uploading) return;

    releasePreview();

    setSelectedFile(null);
    setPreviewUrl("");
    setFileError("");
  }

  // 카메라 촬영 또는 파일 업로드 결과 처리
  function handleFileSelect(file) {
    if (!file || uploading) return;

    setFileError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError(
        "PDF, JPG, PNG 파일만 등록할 수 있습니다."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        "계약서 파일 크기는 10MB 이하여야 합니다."
      );
      return;
    }

    if (file.size === 0) {
      setFileError(
        "파일이 비어 있습니다. 다시 촬영하거나 선택해 주세요."
      );
      return;
    }

    releasePreview();

    const url = URL.createObjectURL(file);

    previewUrlRef.current = url;

    setSelectedFile(file);
    setPreviewUrl(url);
  }

  function handleCameraClick() {
    if (uploading) return;

    cameraInputRef.current?.click();
  }

  function handleUploadClick() {
    if (uploading) return;

    fileInputRef.current?.click();
  }

  // 실제 기존 계약서 API 호출
  async function handleAnalyze() {
    if (uploading) return;

    if (!selectedFile) {
      setFileError(
        "분석할 근로계약서를 먼저 선택해 주세요."
      );
      return;
    }

    setUploading(true);
    setFileError("");

    try {
      const formData = new FormData();

      formData.append(
        UPLOAD_FIELD,
        selectedFile,
        selectedFile.name
      );

      // POST /api/v1/contracts
      // 기존 api/contract.js의 함수를 그대로 사용
      const response = await uploadContract(
        formData
      );

      const contractId = getContractId(
        response
      );

      if (!contractId) {
        throw new Error(
          "업로드 응답에 계약서 ID가 없습니다. " +
          "계약서 목록에서 서버 저장 여부를 확인해 주세요."
        );
      }

      // 기존 계약서 AI 분석·검토 페이지
      navigate(
        `/contracts/${encodeURIComponent(
          contractId
        )}/review`,
        {
          replace: true,
        }
      );
    } catch (error) {
      setFileError(
        getErrorMessage(error)
      );
    } finally {
      setUploading(false);
    }
  }

  const isPdf =
    selectedFile?.type === "application/pdf";

  return (
    <div className="cau-contract-page">

      {/* ====================================
          Figma 상단바
      ==================================== */}

      <header className="cau-topbar">
        <Link
          to="/home"
          className="cau-back-button"
          aria-label="홈으로 돌아가기"
        >
          <ContractIcon
            name="arrow"
            size={21}
          />
        </Link>

        <strong>근로계약서 확인</strong>

        <span className="cau-topbar-space" />
      </header>

      <main className="cau-content">

        {/* ====================================
            Figma 제목
        ==================================== */}

        <section className="cau-heading">
          <p className="cau-eyebrow">
            CONTRACT CHECK
          </p>

          <h1>
            계약서를 등록해 주세요
          </h1>

          <p className="cau-description">
            문서 전체와 글자가 선명하게
            보이도록 촬영하면 더 정확하게
            확인할 수 있어요.
          </p>
        </section>

        {/* ====================================
            Figma 카메라 촬영 카드
        ==================================== */}

        <button
          type="button"
          className="cau-upload-option"
          onClick={handleCameraClick}
          disabled={uploading}
        >
          <span className="cau-option-icon">
            <ContractIcon
              name="camera"
              size={23}
            />
          </span>

          <span className="cau-option-copy">
            <b>카메라로 촬영</b>
            <small>
              계약서 전체가 보이도록 촬영
            </small>
          </span>

          <span className="cau-option-chevron">
            <ContractIcon
              name="chevron"
              size={17}
            />
          </span>
        </button>

        {/* ====================================
            Figma 파일 업로드 카드
        ==================================== */}

        <button
          type="button"
          className="cau-upload-option"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          <span className="cau-option-icon">
            <ContractIcon
              name="upload"
              size={23}
            />
          </span>

          <span className="cau-option-copy">
            <b>이미지·파일 업로드</b>
            <small>
              지원 형식과 파일 크기를 확인해 주세요
            </small>
          </span>

          <span className="cau-option-chevron">
            <ContractIcon
              name="chevron"
              size={17}
            />
          </span>
        </button>

        {/* 실제 촬영 / 파일 선택 */}

        <input
          ref={cameraInputRef}
          className="cau-hidden-input"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="근로계약서 카메라 촬영"
          onChange={(event) => {
            handleFileSelect(
              event.target.files?.[0]
            );

            event.target.value = "";
          }}
        />

        <input
          ref={fileInputRef}
          className="cau-hidden-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          aria-label="근로계약서 이미지 또는 PDF 선택"
          onChange={(event) => {
            handleFileSelect(
              event.target.files?.[0]
            );

            event.target.value = "";
          }}
        />

        {/* ====================================
            파일 선택 후 미리보기
            기능 명세서 1.1.3
        ==================================== */}

        {selectedFile && (
          <section className="cau-preview-card">
            <div className="cau-section-header">
              <h2>촬영 미리보기</h2>

              <button
                type="button"
                disabled={uploading}
                onClick={clearFile}
              >
                <ContractIcon
                  name="refresh"
                  size={15}
                />
                다시 선택
              </button>
            </div>

            <div className="cau-preview-frame">
              {isPdf ? (
                <iframe
                  src={previewUrl}
                  title="근로계약서 PDF 미리보기"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="선택한 근로계약서 미리보기"
                />
              )}
            </div>

            <div className="cau-file-information">
              <ContractIcon
                name="file"
                size={19}
              />

              <div>
                <b>{selectedFile.name}</b>

                <span>
                  {(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}
                  MB
                </span>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={uploading}
                aria-label="선택한 파일 삭제"
              >
                <ContractIcon
                  name="trash"
                  size={19}
                />
              </button>
            </div>

            <button
              className="cau-primary-button"
              type="button"
              onClick={handleAnalyze}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="cau-spinner" />
                  계약서 업로드 중...
                </>
              ) : (
                <>
                  <ContractIcon
                    name="check"
                    size={20}
                  />
                  AI 계약서 분석 시작
                </>
              )}
            </button>
          </section>
        )}

        {/* ====================================
            Figma 촬영 전 확인 카드
        ==================================== */}

        <section className="cau-document-guide">

          {/* Figma 문서 일러스트 */}
          <div
            className="cau-document-mock"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="cau-guide-copy">
            <b>촬영 전 확인</b>

            <ul>
              <li>
                문서 네 모서리가 모두 보여야 해요.
              </li>

              <li>
                빛 반사 없이 글자가 선명해야 해요.
              </li>

              <li>
                촬영 후 미리보기에서 재촬영할 수 있어요.
              </li>
            </ul>
          </div>
        </section>

        {/* ====================================
            Figma 경고 안내
        ==================================== */}

        <div className="cau-warning">
          <ContractIcon
            name="alert"
            size={19}
          />

          <span>
            지원하지 않는 파일이거나 업로드에
            실패하면 파일을 다시 선택하도록
            안내합니다.
          </span>
        </div>

        {/* 오류는 성공 화면으로 숨기지 않음 */}
        {fileError && (
          <div
            className="cau-error"
            role="alert"
          >
            <ContractIcon
              name="alert"
              size={19}
            />
            <span>{fileError}</span>
          </div>
        )}

        {/* 기존 계약서 목록 기능 유지 */}
        <Link
          to="/contracts/list"
          className="cau-contract-list-link"
        >
          등록한 계약서 확인
          <ContractIcon
            name="chevron"
            size={16}
          />
        </Link>

      </main>
    </div>
  );
}
