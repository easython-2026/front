
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  Languages,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { getAdminAuth } from "../services/adminApi";
import { getAdminStaff } from "../services/adminStaffApi";

import "./AdminSettings.css";

const LANGUAGE_NAMES = {
  ko: "한국어",
  en: "영어",
  vi: "베트남어",
  ne: "네팔어",
  zh: "중국어",
  th: "태국어",
  uz: "우즈베크어",
};

function display(value) {
  if (value === undefined || value === null || value === "") {
    return "정보 없음";
  }

  return String(value);
}

export default function AdminSettings() {
  const navigate = useNavigate();

  // 기존 관리자 로그인 응답 사용
  const currentStaff = getAdminAuth()?.staff;

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      setLoading(true);
      setError("");

      try {
        // 기존 GET /api/v1/admin/staff 서비스
        const result = await getAdminStaff();

        if (!active) return;

        setStaffList(
          Array.isArray(result) ? result : []
        );
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            "기관 담당자 정보를 불러오지 못했습니다."
        );
        setStaffList([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStaff();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // 현재 로그인한 담당자의 지원 언어
  const myLanguages = useMemo(() => {
    const me = staffList.find(
      (item) =>
        String(item.id) ===
        String(currentStaff?.id)
    );

    return Array.isArray(me?.languages)
      ? me.languages
      : [];
  }, [staffList, currentStaff?.id]);

  const refresh = () => {
    setReloadKey((previous) => previous + 1);
  };

  return (
    <div className="admin-settings">
      <header className="admin-settings__header">
        <div>
          <span className="admin-settings__eyebrow">
            ADMIN INFORMATION
          </span>

          <h1>
            <UserRound size={27} />
            관리자 정보
          </h1>

          <p>
            로그인한 담당자와 소속 상담기관의
            등록 정보를 확인할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="admin-settings__refresh"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "admin-settings__spin" : ""
            }
          />
          새로고침
        </button>
      </header>

      <div className="admin-settings__grid">
        {/* 내 계정 */}

        <section className="admin-settings__panel">
          <div className="admin-settings__panel-heading">
            <span className="admin-settings__icon">
              <UserRound size={22} />
            </span>

            <div>
              <h2>내 계정</h2>
              <p>관리자 로그인 정보</p>
            </div>
          </div>

          <dl className="admin-settings__details">
            <div>
              <dt>담당자 이름</dt>
              <dd>{display(currentStaff?.name)}</dd>
            </div>

            <div>
              <dt>담당자 ID</dt>
              <dd>{display(currentStaff?.id)}</dd>
            </div>

            <div>
              <dt>계정 권한</dt>
              <dd>
                {currentStaff?.role === "ADMIN" ? (
                  <span className="admin-settings__role">
                    <ShieldCheck size={15} />
                    ADMIN
                  </span>
                ) : (
                  display(currentStaff?.role)
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* 소속 기관 */}

        <section className="admin-settings__panel">
          <div className="admin-settings__panel-heading">
            <span className="admin-settings__icon">
              <Building2 size={22} />
            </span>

            <div>
              <h2>소속 상담기관</h2>
              <p>관리자 등록 기관 정보</p>
            </div>
          </div>

          <dl className="admin-settings__details">
            <div>
              <dt>기관명</dt>
              <dd>
                {display(currentStaff?.agencyName)}
              </dd>
            </div>

            <div>
              <dt>기관 ID</dt>
              <dd>
                {display(currentStaff?.agencyId)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* 지원 언어 */}

      <section className="admin-settings__panel admin-settings__languages-panel">
        <div className="admin-settings__panel-heading">
          <span className="admin-settings__icon">
            <Languages size={22} />
          </span>

          <div>
            <h2>지원 언어</h2>
            <p>
              기관 담당자 조회 API에 등록된
              내 지원 언어
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-settings__feedback">
            <LoaderCircle
              size={21}
              className="admin-settings__spin"
            />
            조회 중입니다.
          </div>
        ) : error ? (
          <div
            className="admin-settings__feedback is-error"
            role="alert"
          >
            <CircleAlert size={18} />
            {error}
          </div>
        ) : myLanguages.length > 0 ? (
          <div className="admin-settings__languages">
            {myLanguages.map((code) => (
              <span
                key={code}
                className="admin-settings__language"
              >
                <Languages size={15} />
                {LANGUAGE_NAMES[code] || code}
              </span>
            ))}
          </div>
        ) : (
          <p className="admin-settings__empty">
            조회된 지원 언어 정보가 없습니다.
          </p>
        )}
      </section>

      <div className="admin-settings__footer">
        <div>
          <UsersRound size={20} />
          <span>
            기관의 다른 담당자는 기관 담당자
            목록에서 확인할 수 있습니다.
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/staff")}
        >
          기관 담당자 목록
          <ArrowRight size={16} />
        </button>
      </div>

      <p className="admin-settings__disclaimer">
        이 화면은 조회 전용입니다. 관리자 정보와
        기관 정보를 수정하는 API는 사용하지 않습니다.
      </p>
    </div>
  );
}
