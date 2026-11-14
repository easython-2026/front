
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  getEvidences,
} from "../../api/report";

import {
  SettingsBadge,
  SettingsHeader,
  SettingsIcon,
  SettingsNotice,
  formatKst,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

const groups = [
  ["all", "전체"],
  ["attendance", "출퇴근"],
  ["contract", "계약서"],
  ["salary", "급여"],
  ["other", "기타"],
];

const labels = {
  CONTRACT: "근로계약서",
  CLOCK_IN_PHOTO: "출근 인증 사진",
  CLOCK_OUT_PHOTO: "퇴근 인증 사진",
  ATTENDANCE_PHOTO: "출퇴근 인증 사진",
  GPS: "GPS 기록",
  GPS_LOG: "GPS 위치 기록",
  TIMESTAMP: "서버 타임스탬프",
  SALARY_STATEMENT: "급여명세서",
  PAYSLIP: "급여명세서",
  MANUAL_RECORD: "수동 근무기록",
};

function category(type = "") {
  const name = String(type).toUpperCase();

  if (
    /CLOCK|GPS|ATTENDANCE|TIMESTAMP|MANUAL_RECORD/.test(name)
  ) {
    return "attendance";
  }

  if (/CONTRACT/.test(name)) {
    return "contract";
  }

  if (/PAY|SALARY|WAGE/.test(name)) {
    return "salary";
  }

  return "other";
}

function parseData(response) {
  const data = unwrap(response);

  const list = Array.isArray(data)
    ? data
    : data?.evidences ??
      data?.content ??
      data?.items;

  if (!Array.isArray(list)) {
    throw new Error(
      "증거 목록 응답의 배열 형식을 확인해 주세요."
    );
  }

  return {
    list,
    pageInfo:
      data?.pageInfo ??
      data?.pagination ??
      null,
  };
}

function safeFileLink(value) {
  if (typeof value !== "string") {
    return null;
  }

  if (
    /^https?:\/\//i.test(value) ||
    (
      value.startsWith("/") &&
      !value.startsWith("//")
    )
  ) {
    return value;
  }

  return null;
}

export default function Evidences() {
  const [list, setList] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // 실제 증거 목록 API
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setExpanded(null);

    getEvidences({
      page,
      size: 20,
    })
      .then((response) => {
        if (!active) return;

        const next = parseData(response);

        setList(next.list);
        setPageInfo(next.pageInfo);
      })
      .catch((err) => {
        if (active) {
          setList([]);
          setError(settingsError(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, reload]);

  const filtered = useMemo(
    () =>
      list.filter(
        (item) =>
          filter === "all" ||
          category(
            item.type ?? item.evidenceType
          ) === filter
      ),
    [list, filter]
  );

  const totalPages = Number(
    pageInfo?.totalPages
  );

  const canNext =
    Number.isInteger(totalPages) &&
    totalPages > page
      ? true
      : pageInfo?.hasNext === true;

  return (
    <div className="efx-screen">
      <SettingsHeader
        title="저장된 증거"
        back="/profile"
        onRefresh={() =>
          setReload((n) => n + 1)
        }
        disabled={loading}
      />

      <main className="efx-content">
        <div className="efx-heading">
          <p className="efx-eyebrow">MY EVIDENCE</p>
          <h1>나의 증거를 모아봐요</h1>

          <p>
            계약서·출퇴근·급여 기록에서
            서버에 보관된 증거를 확인할 수 있어요.
          </p>
        </div>

        <section className="efx-card efx-hero-card">
          <span className="efx-big-icon">
            <SettingsIcon name="shield" size={30}/>
          </span>

          <b>근거는 원본 데이터로 확인해요</b>

          <p>
            해당 페이지에서 조회된 증거만 표시합니다.
            근무기록의 수정 이력과 사진 원본은
            상세 화면에서 확인할 수 있어요.
          </p>
        </section>

        {/* 증거 유형 필터 */}
        <div
          className="efx-filter-row"
          role="group"
          aria-label="증거 유형"
        >
          {groups.map(([key, name]) => (
            <button
              type="button"
              key={key}
              className={
                filter === key ? "active" : ""
              }
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              {name}
            </button>
          ))}
        </div>

        {loading && (
          <SettingsNotice>
            증거를 조회하고 있습니다.
          </SettingsNotice>
        )}

        {error && (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        )}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="efx-card efx-empty">
              <SettingsIcon name="file" size={30}/>
              <b>
                {filter === "all"
                  ? "조회된 증거가 없어요"
                  : "이 유형의 증거가 없어요"}
              </b>
              <p>
                현재 조회 페이지에서 확인된 항목이 없습니다.
              </p>
            </div>
          )}

        {/* 실제 증거 카드 */}
        {!loading && !error && filtered.map(
          (item, index) => {
            const type = String(
              item.type ??
              item.evidenceType ??
              "OTHER"
            );

            const id = String(
              item.id ??
              `${page}-${index}`
            );

            const open = expanded === id;

            const fileUrl = safeFileLink(
              item.fileUrl ?? item.url
            );

            const recordId = item.recordId;
            const group = category(type);

            return (
              <article
                className="efx-card efx-evidence-card"
                key={id}
              >
                <button
                  type="button"
                  className="efx-evidence-toggle"
                  onClick={() =>
                    setExpanded(open ? null : id)
                  }
                  aria-expanded={open}
                >
                  <span className="efx-small-icon">
                    <SettingsIcon
                      name={
                        group === "attendance"
                          ? "clock"
                          : group === "salary"
                          ? "wallet"
                          : "file"
                      }
                    />
                  </span>

                  <span>
                    <b>
                      {item.title ??
                        labels[type] ??
                        type}
                    </b>
                    <small>
                      {formatKst(
                        item.occurredAt ??
                        item.createdAt ??
                        item.recordedAt
                      )}
                    </small>
                  </span>

                  <SettingsBadge
                    tone={
                      group === "other"
                        ? "neutral"
                        : "info"
                    }
                  >
                    {
                      groups.find(
                        ([key]) => key === group
                      )?.[1]
                    }
                  </SettingsBadge>
                </button>

                {/* 증거 상세 */}
                {open && (
                  <div className="efx-evidence-detail">
                    <div className="efx-info-line">
                      <span>증거 유형</span>
                      <b>{labels[type] ?? type}</b>
                    </div>

                    <div className="efx-info-line">
                      <span>증거 ID</span>
                      <b>{item.id ?? "미제공"}</b>
                    </div>

                    {item.hash && (
                      <details>
                        <summary>증거 해시 확인</summary>
                        <code className="efx-hash">
                          {item.hash}
                        </code>
                      </details>
                    )}

                    {fileUrl && (
                      <a
                        className="efx-outline-button"
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        원본 파일 열기
                      </a>
                    )}

                    {recordId != null && (
                      <Link
                        className="efx-outline-button"
                        to={`/attendance/${encodeURIComponent(
                          recordId
                        )}`}
                      >
                        근무기록 상세 보기
                      </Link>
                    )}

                    {!fileUrl &&
                      recordId == null && (
                        <p className="efx-muted">
                          서버가 개별 파일 링크를
                          제공하지 않았습니다.
                        </p>
                      )}
                  </div>
                )}
              </article>
            );
          }
        )}

        <p className="efx-muted efx-center">
          유형 필터는 현재 서버 조회 페이지에 적용돼요.
        </p>

        {/* 서버 페이지 이동 */}
        <div className="efx-pager">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() =>
              setPage((n) => n - 1)
            }
          >
            이전
          </button>

          <span>
            {page}
            {Number.isInteger(totalPages) &&
              totalPages > 0
              ? ` / ${totalPages}`
              : ""}
          </span>

          <button
            type="button"
            disabled={loading || !canNext}
            onClick={() =>
              setPage((n) => n + 1)
            }
          >
            다음
          </button>
        </div>

        <Link
          to="/reports"
          className="efx-outline-button"
        >
          월별 리포트 보기
        </Link>
      </main>
    </div>
  );
}
