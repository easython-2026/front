
import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router";

import useGeolocation from "../../hooks/useGeolocation";

import {
  getWorkplace,
} from "../../api/user";

import {
  errorMessage,
  readSettings,
  saveSettingsSection,
  workplaceForm,
} from "../../utils/workplaceSettings";

import "../../styles/figma-settings.css";
import "../../styles/figma-workplace-split.css";

const EMPTY = workplaceForm(null);

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
      ) : name === "pin" ? (
        <>
          <path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13 7 13Z" />
          <circle cx="12" cy="9" r="2.5" />
        </>
      ) : name === "refresh" ? (
        <>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M18.4 9A7 7 0 0 0 6.5 6.5L4 9m1.6 6a7 7 0 0 0 11.9 2.5L20 15" />
        </>
      ) : (
        <path d="m5 12 4 4L19 6" />
      )}
    </svg>
  );
}

export default function Workplace() {
  const [form, setForm] =
    useState(EMPTY);

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

  const [accuracy, setAccuracy] =
    useState(null);

  const {
    getCurrentLocation,
    loading: locating,
    error: geoError,
  } = useGeolocation();

  // 서버 근무장소 정보 조회
  useEffect(() => {
    let active = true;

    setLoading(true);
    setOriginal(null);
    setError("");

    getWorkplace()
      .then((response) => {
        if (!active) return;

        const value = workplaceForm(
          readSettings(response).workplace
        );

        setForm(value);
        setOriginal(value);
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

  const busy =
    loading || saving || locating;

  function change(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
    setMessage("");
  }

  // 현재 GPS 위치 획득
  async function useCurrentPosition() {
    if (busy) return;

    setError("");
    setMessage("");

    try {
      const coords =
        await getCurrentLocation();

      if (
        !Number.isFinite(coords.latitude) ||
        !Number.isFinite(coords.longitude)
      ) {
        throw new Error(
          "현재 위치 좌표가 올바르지 않습니다."
        );
      }

      setForm((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));

      setAccuracy(coords.accuracy);

      setMessage(
        "현재 위치를 입력했습니다. 실제 근무장소인지 확인하고 저장해 주세요."
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // 근무장소만 수정
  async function handleSave(event) {
    event.preventDefault();

    if (busy || !dirty) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated =
        await saveSettingsSection(
          "workplace",
          form
        );

      const current = workplaceForm(
        updated.workplace
      );

      setForm(current);
      setOriginal(current);

      setMessage(
        "근무장소가 서버에 저장된 것을 확인했습니다."
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

        <strong>근무장소 관리</strong>

        <button
          type="button"
          aria-label="근무장소 새로고침"
          disabled={busy}
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
            WORKPLACE LOCATION
          </p>

          <h1>
            출퇴근할 장소를
            <br />
            등록해 주세요
          </h1>

          <p>
            GPS 인증에 사용하는 실제 근무장소를
            설정합니다. 사업장 주소와 다를 수 있어요.
          </p>
        </div>

        {loading && (
          <p
            className="pfs-notice"
            role="status"
          >
            근무장소 정보를 불러오는 중...
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

        {geoError && !error && (
          <p
            className="pfs-notice pfs-error"
            role="alert"
          >
            {geoError}
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
            {/* GPS 인증 기준 장소 */}
            <section className="pfs-card pfs-workplace-card">

              <div className="pfs-split-card-heading">
                <span className="pfs-split-icon">
                  <Icon name="pin" />
                </span>

                <div>
                  <h2>GPS 인증 기준 장소</h2>

                  <p>
                    출퇴근할 때 비교하는 기준 위치입니다.
                  </p>
                </div>
              </div>

              {/* Figma 위치 카드 */}
              <div className="pfs-map-placeholder">
                <Icon name="pin" size={38} />

                <b>
                  {form.name || "근무장소 미등록"}
                </b>

                <span>
                  {form.latitude !== "" &&
                  form.longitude !== ""
                    ? `${form.latitude}, ${form.longitude}`
                    : "위도·경도 정보 없음"}
                </span>

                <small>
                  위치 안내 영역 · 실제 지도는 아닙니다
                </small>
              </div>

              {/* 근무장소명 */}
              <label className="pfs-field">
                근무장소명

                <input
                  value={form.name}
                  disabled={busy}
                  required
                  placeholder="예: 제1공장"
                  onChange={(event) =>
                    change(
                      "name",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 근무장소 주소 */}
              <label className="pfs-field">
                실제 근무장소 주소

                <input
                  value={form.address}
                  disabled={busy}
                  required
                  placeholder="실제 출퇴근하는 주소"
                  onChange={(event) =>
                    change(
                      "address",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 위도·경도 */}
              <div className="pfs-coordinate-row">
                <label className="pfs-field">
                  위도

                  <input
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    required
                    value={form.latitude}
                    disabled={busy}
                    onChange={(event) =>
                      change(
                        "latitude",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="pfs-field">
                  경도

                  <input
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    required
                    value={form.longitude}
                    disabled={busy}
                    onChange={(event) =>
                      change(
                        "longitude",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {/* GPS 허용 반경 */}
              <label className="pfs-field">
                GPS 허용 반경 (m · 선택)

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.radiusMeters}
                  disabled={busy}
                  placeholder="미입력 시 기존 값 또는 서버 기본값 유지"
                  onChange={(event) =>
                    change(
                      "radiusMeters",
                      event.target.value
                    )
                  }
                />
              </label>

              {/* 위치 불러오기 */}
              <button
                type="button"
                className="pfs-secondary"
                onClick={useCurrentPosition}
                disabled={busy}
              >
                <Icon name="pin" size={18} />

                {locating
                  ? "현재 위치 확인 중..."
                  : "현재 위치로 변경"}
              </button>

              <p className="pfs-muted">
                실제 근무장소에서 버튼을 누르세요.
                주소가 자동 변환되지는 않습니다.

                {accuracy != null
                  ? ` 최근 GPS 정확도 약 ${Math.round(
                      accuracy
                    )}m`
                  : ""}
              </p>
            </section>

            {/* 저장 */}
            <button
              className="pfs-primary"
              type="submit"
              disabled={busy || !dirty}
            >
              {saving
                ? "저장 및 확인 중..."
                : "근무장소 저장"}
            </button>

            <button
              className="pfs-reset"
              type="button"
              disabled={busy || !dirty}
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

        {/* 사업장 정보 페이지로 이동 */}
        <Link
          className="pfs-split-next"
          to="/workplace/business"
        >
          <span className="pfs-split-icon pfs-split-building">
            ▤
          </span>

          <span>
            <b>사업장 정보 관리</b>

            <small>
              사업장명·주소·대표자명을 수정해요.
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
