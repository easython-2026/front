
import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router";

import {
  getWorkplace,
} from "../../api/user";

import {
  businessForm,
  errorMessage,
  readSettings,
  saveSettingsSection,
} from "../../utils/workplaceSettings";

import "../../styles/figma-settings.css";
import "../../styles/figma-workplace-split.css";

function Icon({ name, size = 20 }) {
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
      {name === "back" ? (
        <path d="M19 12H5m6-6-6 6 6 6" />
      ) : name === "refresh" ? (
        <>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15" />
        </>
      ) : (
        <>
          <path d="M4 21V7l8-4 8 4v14M2 21h20M9 10h1m4 0h1m-6 4h1m4 0h1M10 21v-4h4v4" />
        </>
      )}
    </svg>
  );
}

export default function BusinessInfo() {
  const [form, setForm] = useState(
    businessForm(null)
  );

  const [original, setOriginal] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  // 사업장 정보 조회
  useEffect(() => {
    let active = true;

    setLoading(true);
    setOriginal(null);
    setError("");

    getWorkplace()
      .then((response) => {
        if (!active) return;

        const next = businessForm(
          readSettings(response).business
        );

        setForm(next);
        setOriginal(next);
      })
      .catch((err) => {
        if (active) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const dirty =
    original !== null &&
    JSON.stringify(form) !==
      JSON.stringify(original);

  function change(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
    setMessage("");
  }

  // 사업장 정보 저장
  async function handleSave(event) {
    event.preventDefault();

    if (
      loading ||
      saving ||
      !dirty
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated =
        await saveSettingsSection(
          "business",
          form
        );

      const next = businessForm(
        updated.business
      );

      setOriginal(next);
      setForm(next);

      setMessage(
        "사업장 정보가 서버에 저장된 것을 확인했습니다."
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pfs-screen pfs-workplace-page pfs-split-page">

      {/* 상단바 */}
      <header className="pfs-header pfs-back-header">
        <Link
          to="/profile"
          aria-label="내 정보로 돌아가기"
        >
          <Icon name="back" />
        </Link>

        <strong>사업장 정보 관리</strong>

        <button
          type="button"
          aria-label="사업장 정보 새로고침"
          disabled={loading || saving}
          onClick={() => {
            setMessage("");
            setRefreshKey((n) => n + 1);
          }}
        >
          <Icon name="refresh" size={18} />
        </button>
      </header>

      <main className="pfs-content pfs-workplace-content">

        {/* 제목 */}
        <div className="pfs-heading">
          <p className="pfs-eyebrow">
            BUSINESS INFORMATION
          </p>

          <h1>
            사업장 정보를
            <br />
            확인해 주세요
          </h1>

          <p>
            근로계약서와 진정서에 활용되는
            사업장 정보를 관리해요.
          </p>
        </div>

        {loading && (
          <p
            className="pfs-notice"
            role="status"
          >
            사업장 정보를 불러오는 중...
          </p>
        )}

        {error && (
          <p
            className="pfs-notice pfs-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="pfs-notice pfs-success"
            role="status"
          >
            {message}
          </p>
        )}

        {!loading && original && (
          <form
            className="pfs-workplace-form"
            onSubmit={handleSave}
          >
            {/* 사업장 입력 카드 */}
            <section className="pfs-card pfs-workplace-card">

              <div className="pfs-split-card-heading">
                <span className="pfs-split-icon pfs-split-building">
                  <Icon name="building" />
                </span>

                <div>
                  <h2>사업장 기본 정보</h2>

                  <p>
                    계약서에서 추출된 정보가 있다면
                    내용이 맞는지 확인하세요.
                  </p>
                </div>
              </div>

              {/* OCR 정보 안내 */}
              <div className="pfs-split-ocr">
                <span className="pfs-chip">
                  계약서 OCR 정보 검토
                </span>

                <small>
                  자동 추출 결과는 실제 등록된
                  서버 값에 한해 표시됩니다.
                </small>
              </div>

              {/* 사업장명 */}
              <label className="pfs-field">
                사업장명

                <input
                  required
                  value={form.name}
                  disabled={saving}
                  placeholder="예: 가상제조 주식회사"
                  onChange={(event) =>
                    change(
                      "name",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 사업장 주소 */}
              <label className="pfs-field">
                사업장 주소

                <input
                  required
                  value={form.address}
                  disabled={saving}
                  placeholder="계약서에 기재된 사업장 주소"
                  onChange={(event) =>
                    change(
                      "address",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 대표자명 */}
              <label className="pfs-field">
                대표자명

                <input
                  required
                  value={form.ownerName}
                  disabled={saving}
                  placeholder="대표자 성명"
                  onChange={(event) =>
                    change(
                      "ownerName",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 사용처 안내 */}
              <div className="pfs-split-tip">
                <b>어디에 사용되나요?</b>

                <p>
                  사업장명·사업장 주소·대표자명은
                  진정서의 피진정인 정보 등에
                  사용될 수 있습니다.
                </p>
              </div>
            </section>

            <button
              className="pfs-primary"
              type="submit"
              disabled={saving || !dirty}
            >
              {saving
                ? "저장 및 확인 중..."
                : "사업장 정보 저장"}
            </button>

            <button
              className="pfs-reset"
              type="button"
              disabled={saving || !dirty}
              onClick={() => {
                setForm({ ...original });
                setError("");
                setMessage("");
              }}
            >
              변경 취소
            </button>
          </form>
        )}

        {/* 근무장소 이동 */}
        <Link
          className="pfs-split-next"
          to="/workplace"
        >
          <span className="pfs-split-icon">
            <Icon name="building" />
          </span>

          <span>
            <b>근무장소 관리</b>

            <small>
              GPS 출퇴근 인증 장소를 관리해요.
            </small>
          </span>

          <span aria-hidden="true">›</span>
        </Link>

        <Link
          className="pfs-footer-link"
          to="/profile"
        >
          내 정보로 돌아가기
        </Link>
      </main>
    </div>
  );
}
