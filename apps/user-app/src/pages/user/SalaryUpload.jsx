
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { apiRequest } from "../../api/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

function isValidMonth(value) {
  if (!value) return true;

  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인 인증이 필요합니다.";
  }

  if (error?.status === 413) {
    return "파일 용량은 10MB 이하여야 합니다.";
  }

  if (error?.status === 415) {
    return "JPG, PNG, PDF 파일만 업로드할 수 있습니다.";
  }

  return error instanceof Error
    ? error.message
    : "급여명세서 업로드에 실패했습니다.";
}

export default function SalaryUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [month, setMonth] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const previewRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 페이지를 벗어날 때 미리보기 URL 해제
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  function releasePreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0];

    event.target.value = "";

    if (!selected) return;

    setError("");
    setMessage("");

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError(
        "JPG, PNG 또는 PDF 파일을 선택해 주세요."
      );
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(
        "파일 크기는 10MB 이하여야 합니다."
      );
      return;
    }

    releasePreview();

    const url = URL.createObjectURL(selected);
    previewRef.current = url;

    setFile(selected);
    setPreviewUrl(url);
  }

  function handleRemoveFile() {
    releasePreview();

    setFile(null);
    setPreviewUrl("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    if (!file) {
      setError("급여명세서 파일을 선택해 주세요.");
      return;
    }

    if (!isValidMonth(month)) {
      setError("귀속 월은 YYYY-MM 형식이어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      // API 명세에서 지정한 파일 필드명
      formData.append("file", file);

      // month는 선택 항목
      if (month) {
        formData.append("month", month);
      }

      const response = await apiRequest(
        "salary",
        "uploadStatement",
        {
          body: formData,
        }
      );

      const result = response?.data ?? response;

      if (!result?.statementId) {
        throw new Error(
          "업로드 응답에 statementId가 없습니다."
        );
      }

      setMessage("업로드 완료. AI 분석 화면으로 이동합니다.");

      navigate(
        `/salary/statements/${encodeURIComponent(
          result.statementId
        )}`,
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isPdf =
    file?.type === "application/pdf";

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>급여명세서 업로드</h1>

      <p>
        급여명세서를 등록하면 AI가
        급여 항목과 지급 금액을 추출합니다.
      </p>

      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: 24 }}>
          <h2>1. 급여명세서 선택</h2>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            disabled={loading}
            aria-label="급여명세서 파일"
          />

          <p>지원 형식: JPG, PNG, PDF</p>
          <p>최대 크기: 10MB</p>

          {file && (
            <div>
              <p>선택 파일: {file.name}</p>

              <p>
                파일 크기:{" "}
                {(file.size / 1024 / 1024).toFixed(2)}
                MB
              </p>

              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={loading}
              >
                파일 삭제
              </button>
            </div>
          )}
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2>2. 귀속 월 선택</h2>

          <label htmlFor="payroll-month">
            급여 귀속 월 (선택)
          </label>

          <input
            id="payroll-month"
            type="month"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setError("");
            }}
            disabled={loading}
          />

          <p>
            귀속 월을 입력하지 않으면
            AI가 명세서에서 추출을 시도합니다.
          </p>
        </section>

        {file && previewUrl && (
          <section style={{ marginBottom: 24 }}>
            <h2>3. 파일 미리보기</h2>

            {isPdf ? (
              <iframe
                title="급여명세서 PDF 미리보기"
                src={previewUrl}
                style={{
                  width: "100%",
                  height: 420,
                  border: "1px solid #ddd",
                }}
              />
            ) : (
              <img
                src={previewUrl}
                alt="급여명세서 미리보기"
                style={{
                  maxWidth: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                }}
              />
            )}
          </section>
        )}

        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}

        {message && (
          <p role="status">{message}</p>
        )}

        <button
          type="submit"
          disabled={!file || loading}
        >
          {loading
            ? "업로드 중..."
            : "급여명세서 업로드"}
        </button>
      </form>

      <p style={{ marginTop: 24 }}>
        <Link to="/salary">
          급여 관리로 돌아가기
        </Link>
      </p>
    </main>
  );
}
