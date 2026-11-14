
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  getNotifications,
  markNotificationAsRead,
} from "../../api/notification";

import {
  getNotificationPath,
} from "../../utils/notificationNavigation";

import {
  SettingsBadge,
  SettingsHeader,
  SettingsIcon,
  SettingsNotice,
  formatKst,
  settingsError,
  unwrap,
} from "../../components/SettingsPageUI";

const types = {
  PAYDAY: {
    title: "월급날 안내",
    icon: "wallet",
  },
  MISSING_RECORD: {
    title: "근무기록 누락",
    icon: "clock",
  },
  MISMATCH: {
    title: "급여 비교",
    icon: "alert",
  },
  CONSULTATION_UPDATE: {
    title: "상담 진행",
    icon: "message",
  },
  INFO_REQUEST: {
    title: "추가 자료 요청",
    icon: "file",
  },
};

function parseNotifications(response) {
  const data = unwrap(response);

  if (!Array.isArray(data?.notifications)) {
    throw new Error(
      "알림 목록 응답 형식을 확인해 주세요."
    );
  }

  return data;
}

export default function Notifications() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] =
    useState(null);

  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // 알림 목록 API
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getNotifications({
      unreadOnly,
      page,
      size: 20,
    })
      .then((response) => {
        if (!active) return;

        const data = parseNotifications(response);

        setItems(data.notifications);
        setUnreadCount(data.unreadCount ?? null);
        setPageInfo(data.pageInfo ?? null);
      })
      .catch((err) => {
        if (active) {
          setItems([]);
          setError(settingsError(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unreadOnly, page, reload]);

  // 알림 읽음 처리 및 이동
  async function openItem(item) {
    if (
      readingId !== null ||
      item.id == null
    ) {
      return;
    }

    setReadingId(item.id);
    setError("");

    try {
      if (!item.read) {
        await markNotificationAsRead(
          item.id
        );

        setItems((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? { ...v, read: true }
              : v
          )
        );

        setUnreadCount((count) =>
          typeof count === "number"
            ? Math.max(0, count - 1)
            : count
        );
      }

      const path = getNotificationPath(item);

      if (path) {
        navigate(path);
      } else {
        setReload((n) => n + 1);
      }
    } catch (err) {
      setError(settingsError(err));
    } finally {
      setReadingId(null);
    }
  }

  const totalPages = Number(
    pageInfo?.totalPages
  );

  const canNext =
    Number.isInteger(totalPages)
      ? page < totalPages
      : pageInfo?.hasNext === true;

  return (
    <div className="efx-screen">
      <SettingsHeader
        title="알림"
        back="/home"
        onRefresh={() =>
          setReload((n) => n + 1)
        }
        disabled={loading || readingId !== null}
      />

      <main className="efx-content">
        <div className="efx-heading">
          <p className="efx-eyebrow">NOTIFICATIONS</p>
          <h1>중요한 소식을 모아봤어요</h1>

          <p>
            월급날, 근무기록, 상담 진행 상황을
            놓치지 않도록 확인해요.
          </p>
        </div>

        {/* 읽지 않은 알림 요약 */}
        <section className="efx-notification-count">
          <div>
            <span>읽지 않은 알림</span>

            <strong>
              {unreadCount == null
                ? "–"
                : unreadCount}
              <small>개</small>
            </strong>
          </div>

          <span className="efx-big-icon">
            <SettingsIcon name="bell" size={29}/>
          </span>
        </section>

        {/* 알림 필터 */}
        <div
          className="efx-filter-row"
          role="group"
          aria-label="알림 보기"
        >
          <button
            type="button"
            className={!unreadOnly ? "active" : ""}
            aria-pressed={!unreadOnly}
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
          >
            전체 알림
          </button>

          <button
            type="button"
            className={unreadOnly ? "active" : ""}
            aria-pressed={unreadOnly}
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
          >
            읽지 않음
          </button>
        </div>

        {loading && (
          <SettingsNotice>
            알림을 불러오는 중입니다.
          </SettingsNotice>
        )}

        {error && (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        )}

        {!loading &&
          !error &&
          items.length === 0 && (
            <section className="efx-card efx-empty">
              <SettingsIcon name="bell" size={30}/>

              <b>
                {unreadOnly
                  ? "읽지 않은 알림이 없어요"
                  : "아직 도착한 알림이 없어요"}
              </b>

              <p>
                새 알림은 이곳에서 확인할 수 있습니다.
              </p>
            </section>
          )}

        {/* 실제 알림 목록 */}
        {!loading && !error && items.map(
          (item, index) => {
            const info = types[item.type] ?? {
              title: item.type ?? "안내",
              icon: "bell",
            };

            const path = getNotificationPath(item);

            return (
              <article
                className={`efx-card efx-alert-card ${
                  item.read ? "" : "efx-unread"
                }`}
                key={item.id ?? index}
              >
                <span className="efx-small-icon">
                  <SettingsIcon name={info.icon}/>
                </span>

                <div className="efx-alert-main">
                  <div className="efx-section-head">
                    <span className="efx-overline">
                      {info.title}
                    </span>

                    {!item.read && (
                      <SettingsBadge tone="warning">
                        새 알림
                      </SettingsBadge>
                    )}
                  </div>

                  <h2>
                    {item.title ?? "새로운 알림"}
                  </h2>

                  <p>{item.body ?? ""}</p>

                  <small>
                    {formatKst(item.createdAt)}
                  </small>

                  <button
                    className="efx-alert-action"
                    type="button"
                    onClick={() => openItem(item)}
                    disabled={
                      readingId !== null ||
                      item.id == null
                    }
                  >
                    {readingId === item.id
                      ? "처리 중..."
                      : path
                      ? "확인하고 이동"
                      : item.read
                      ? "확인"
                      : "읽음 처리"}

                    <SettingsIcon
                      name="chevron"
                      size={15}
                    />
                  </button>
                </div>
              </article>
            );
          }
        )}

        {/* 페이지 이동 */}
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

        <p className="efx-muted efx-center">
          알림을 열면 서버에 읽음 상태가 저장됩니다.
          일괄 읽음 처리 기능은 현재 API에 없습니다.
        </p>
      </main>
    </div>
  );
}
