
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowRight,
  Building2,
  CircleAlert,
  ClipboardList,
  Languages,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { getAdminAuth } from "../services/adminApi";
import { getAdminStaff } from "../services/adminStaffApi";

import "./AdminStaff.css";

const LANGUAGE_LABELS = {
  ko: "한국어",
  en: "영어",
  vi: "베트남어",
  ne: "네팔어",
  zh: "중국어",
  th: "태국어",
  uz: "우즈베크어",
};

function getLanguageLabel(code) {
  return LANGUAGE_LABELS[code] || code;
}

export default function AdminStaff() {
  const navigate = useNavigate();

  const currentStaff = getAdminAuth()?.staff;
  const agencyName =
    currentStaff?.agencyName || "상담기관";

  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const isMock =
    import.meta.env.VITE_USE_MOCK === "true";

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminStaff();

        if (!active) return;

        setStaff(result);
      } catch (err) {
        if (!active) return;

        setStaff([]);
        setError(
          err.message ||
            "담당자 목록 조회에 실패했습니다."
        );
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

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return staff;

    return staff.filter((member) => {
      const name = member.name || "";
      const id = member.id || "";

      const languages = Array.isArray(
        member.languages
      )
        ? member.languages
        : [];

      const searchable = [
        name,
        id,
        ...languages,
        ...languages.map(getLanguageLabel),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [staff, search]);

  const languageCount = new Set(
    staff.flatMap((member) =>
      Array.isArray(member.languages)
        ? member.languages
        : []
    )
  ).size;

  const handleRefresh = () => {
    setReloadKey((previous) => previous + 1);
  };

  return (
    <div className="admin-staff">
      {/* 상단 헤더 */}

      <header className="admin-staff__header">
        <div>
          <span className="admin-staff__eyebrow">
            AGENCY STAFF
          </span>

          <h1>
            <UsersRound size={28} />
            기관 담당자
          </h1>

          <p>
            동일 상담기관 소속 담당자와
            지원 언어를 확인할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="admin-staff__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "admin-staff__spin" : ""
            }
          />
          새로고침
        </button>
      </header>

      {/* 기관 및 담당자 정보 */}

      <section className="admin-staff__summary">
        <div className="admin-staff__summary-item">
          <span className="admin-staff__summary-icon">
            <Building2 size={22} />
          </span>

          <div>
            <span>소속 상담기관</span>
            <strong>{agencyName}</strong>
          </div>
        </div>

        <div className="admin-staff__summary-item">
          <span className="admin-staff__summary-icon">
            <UsersRound size={22} />
          </span>

          <div>
            <span>조회된 담당자</span>
            <strong>
              {loading || error ? "-" : staff.length}
              <small>명</small>
            </strong>
          </div>
        </div>

        <div className="admin-staff__summary-item">
          <span className="admin-staff__summary-icon">
            <Languages size={22} />
          </span>

          <div>
            <span>등록된 지원 언어 종류</span>
            <strong>
              {loading || error ? "-" : languageCount}
              <small>개</small>
            </strong>
          </div>
        </div>
      </section>

      {isMock && (
        <div className="admin-staff__mock">
          <CircleAlert size={17} />
          Mock 모드에서는 로그인된 관리자 한 명만
          표시합니다. 실제 기관 명단은 API 연동 후
          확인할 수 있습니다.
        </div>
      )}

      {/* 검색 및 목록 헤더 */}

      <section className="admin-staff__directory">
        <div className="admin-staff__directory-heading">
          <div>
            <span>STAFF DIRECTORY</span>
            <h2>담당자 목록</h2>
          </div>

          <label className="admin-staff__search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="이름 또는 언어 검색"
              aria-label="담당자 검색"
            />
          </label>
        </div>

        {error && (
          <div
            className="admin-staff__error"
            role="alert"
          >
            <CircleAlert size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={handleRefresh}
            >
              다시 시도
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-staff__empty">
            <LoaderCircle
              size={28}
              className="admin-staff__spin"
            />
            <p>담당자를 불러오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="admin-staff__empty">
            <CircleAlert size={28} />
            <p>담당자 목록을 표시할 수 없습니다.</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="admin-staff__empty">
            <UsersRound size={28} />
            <p>
              {search
                ? "검색 조건에 맞는 담당자가 없습니다."
                : "등록된 담당자가 없습니다."}
            </p>
          </div>
        ) : (
          <div className="admin-staff__list">
            {filteredStaff.map((member) => {
              const isMe =
                String(member.id) ===
                String(currentStaff?.id);

              const languages = Array.isArray(
                member.languages
              )
                ? member.languages
                : [];

              return (
                <article
                  className="admin-staff__member"
                  key={member.id}
                >
                  <div className="admin-staff__member-avatar">
                    <UserRound size={22} />
                  </div>

                  <div className="admin-staff__member-info">
                    <div className="admin-staff__member-name">
                      <strong>
                        {member.name || "이름 없음"}
                      </strong>

                      {isMe && (
                        <span className="admin-staff__me">
                          본인
                        </span>
                      )}
                    </div>

                    <small>담당자 ID: {member.id}</small>
                  </div>

                  <div className="admin-staff__member-languages">
                    <span>지원 언어</span>

                    <div>
                      {languages.length ? (
                        languages.map((code) => (
                          <span
                            className="admin-staff__language"
                            key={code}
                          >
                            <Languages size={13} />
                            {getLanguageLabel(code)}
                          </span>
                        ))
                      ) : (
                        <span className="admin-staff__no-language">
                          등록 정보 없음
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="admin-staff__member-status">
                    <ShieldCheck size={15} />
                    기관 소속
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 하단 이동 */}

      <div className="admin-staff__footer">
        <div>
          <ClipboardList size={21} />
          <p>
            담당자 배정이나 변경은 개별 상담 사건
            상세 화면에서 진행합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/cases")}
        >
          사건 목록으로 이동
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
