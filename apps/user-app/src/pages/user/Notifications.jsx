
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiRequest } from "../../api/client";
import { getNotificationPath } from "../../utils/notificationNavigation";

const TYPE_LABELS = {
  PAYDAY: "월급날",
  MISSING_RECORD: "근무기록 누락",
  MISMATCH: "임금 불일치",
  CONSULTATION_UPDATE: "상담 진행",
  INFO_REQUEST: "추가 자료 요청",
};

function unwrap(response) {
  return response?.data ?? response;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  return error?.message ?? "알림을 불러오지 못했습니다.";
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(
    async (signal) => {
      const response = await apiRequest(
        "notification",
        "getList",
        {
          query: {
            unreadOnly,
            page,
            size: 20,
          },
          signal,
        }
      );

      const data = unwrap(response);

      if (!Array.isArray(data?.notifications)) {
        throw new Error(
          "알림 목록 응답 형식이 올바르지 않습니다."
        );
      }

      return data;
    },
    [unreadOnly, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const data = await loadNotifications(controller.signal);

        if (!active) return;

        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? null);
        setPageInfo(data.pageInfo ?? null);
        setError("");
      } catch (err) {
        if (!active || err?.name === "AbortError") return;

        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [loadNotifications, reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  function changeFilter(nextValue) {
    setUnreadOnly(nextValue);
    setPage(1);
    setLoading(true);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setLoading(true);
  }

  async function openNotification(item) {
    if (readingId) return;

    setReadingId(item.id);
    setError("");

    try {
      if (!item.read) {
        await apiRequest(
          "notification",
          "markAsRead",
          {
            params: { notificationId: item.id },
          }
        );
      }

      const path = getNotificationPath(item);

      if (path) {
        navigate(path);
        return;
      }

      // 이동할 대상이 없는 경우에는
      // 읽음 처리 후 목록을 갱신한다.
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReadingId(null);
    }
  }

  return (
    <main
      style={{
        maxWidth: 680,
        padding: 24,
        margin: "0 auto",
      }}
    >
      <h1>알림</h1>

      <p>
        읽지 않은 알림:{" "}
        {unreadCount == null
          ? "조회 중"
          : `${unreadCount}개`}
      </p>

      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
      }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => changeFilter(false)}
          aria-pressed={!unreadOnly}
        >
          전체
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => changeFilter(true)}
          aria-pressed={unreadOnly}
        >
          읽지 않음
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={refresh}
        >
          새로고침
        </button>
      </div>

      {loading && (
        <p role="status">알림 조회 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <p>
            {unreadOnly
              ? "읽지 않은 알림이 없습니다."
              : "도착한 알림이 없습니다."}
          </p>
        )}

      {!loading && notifications.map((item) => {
        const path = getNotificationPath(item);

        return (
          <article
            key={item.id}
            style={{
              padding: 16,
              border: item.read
                ? "1px solid #ddd"
                : "2px solid #F56B4A",
              borderRadius: 10,
              marginBottom: 12,
              background: item.read
                ? "#fff"
                : "#fff7f4",
            }}
          >
            <p style={{
              fontSize: 12,
              color: "#666",
            }}>
              {TYPE_LABELS[item.type] ??
                item.type ??
                "알림"}
            </p>

            <h2 style={{ fontSize: 17 }}>
              {item.title ?? "알림"}
            </h2>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {item.body ?? ""}
            </p>

            {item.createdAt && (
              <p style={{ fontSize: 12 }}>
                {item.createdAt}
              </p>
            )}

            <p>
              {item.read ? "읽음" : "읽지 않음"}
            </p>

            <button
              type="button"
              disabled={readingId !== null}
              onClick={() => openNotification(item)}
            >
              {readingId === item.id
                ? "처리 중..."
                : path
                  ? "확인하고 이동"
                  : "읽음 처리"}
            </button>
          </article>
        );
      })}

      {pageInfo && (
        <div style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 24,
        }}>
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => changePage(page - 1)}
          >
            이전
          </button>

          <span>
            {page} / {pageInfo.totalPages ?? page}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              page >= (pageInfo.totalPages ?? page)
            }
            onClick={() => changePage(page + 1)}
          >
            다음
          </button>
        </div>
      )}

      <p style={{ marginTop: 28 }}>
        <Link to="/home">홈으로 돌아가기</Link>
      </p>
    </main>
  );
}
