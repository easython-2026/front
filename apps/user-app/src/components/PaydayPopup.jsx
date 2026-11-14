
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../api/client";

function unwrap(response) {
  return response?.data ?? response;
}

export default function PaydayPopup() {
  const navigate = useNavigate();

  const [notification, setNotification] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPopup() {
      try {
        const response = await apiRequest(
          "notification",
          "getList",
          {
            signal: controller.signal,
          }
        );

        if (!active) return;

        const data = unwrap(response);

        if (!Array.isArray(data?.notifications)) {
          throw new Error(
            "월급날 알림 응답 형식이 올바르지 않습니다."
          );
        }

        const payday = data.notifications.find(
          (item) =>
            item.type === "PAYDAY" &&
            item.popup === true &&
            item.read === false
        );

        setNotification(payday ?? null);
      } catch (err) {
        if (!active || err?.name === "AbortError") return;

        setError(
          err?.message ?? "월급날 알림을 조회하지 못했습니다."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPopup();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function confirmPopup() {
    if (!notification || processing) return;

    setProcessing(true);
    setError("");

    try {
      await apiRequest(
        "notification",
        "markAsRead",
        {
          params: {
            notificationId: notification.id,
          },
        }
      );

      setNotification(null);
      navigate("/salary");
    } catch (err) {
      setError(
        err?.message ?? "알림 읽음 처리에 실패했습니다."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading || !notification || dismissed) {
    return null;
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payday-popup-title"
        style={{
          width: "100%",
          maxWidth: 350,
          padding: 24,
          borderRadius: 16,
          background: "white",
          color: "#222",
        }}
      >
        <h2 id="payday-popup-title">
          {notification.title ?? "월급날 알림"}
        </h2>

        <p style={{ whiteSpace: "pre-wrap" }}>
          {notification.body ?? ""}
        </p>

        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}

        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 24,
        }}>
          <button
            type="button"
            disabled={processing}
            onClick={() => setDismissed(true)}
          >
            나중에
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={confirmPopup}
            style={{
              background: "#F56B4A",
              color: "white",
              border: 0,
              padding: "10px 16px",
              borderRadius: 8,
            }}
          >
            {processing
              ? "확인 중..."
              : "급여 확인하기"}
          </button>
        </div>
      </section>
    </div>
  );
}