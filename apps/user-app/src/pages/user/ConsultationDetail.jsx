
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiRequest } from "../../api/client";

const STATUS_LABELS = {
  RECEIVED: "접수 완료",
  REVIEWING: "상담 검토 중",
  INFO_REQUESTED: "추가 자료 요청",
  REFERRED: "전문기관 연계",
  CLOSED: "상담 종료",
};

const SCOPE_LABELS = {
  SUMMARY: "사건 요약",
  CONTRACT: "근로계약서",
  ATTENDANCE: "근무기록",
  PAYSLIP: "급여명세서",
  COMPLAINT_DRAFT: "진정서 초안",
};

function unwrap(response) {
  return response?.data ?? response;
}

const FIELD_LABELS = {
  message: "요청 내용", requestedItems: "요청 자료", createdAt: "요청일",
  type: "연계 유형", organization: "기관", contact: "연락처", note: "메모",
  status: "상태", at: "시각", content: "처리 결과", actionTaken: "조치 내용",
  closeReason: "종결 사유", closedAt: "종결일", ko: "한국어", translated: "번역",
  sharedScope: "공유 범위", agreedAt: "동의일", revokedAt: "철회일",
};
const CODE_LABELS = {
  CONTRACT: "근로계약서", PAYSLIP: "급여명세서", ATTENDANCE: "근무기록", OTHER: "기타",
  SUMMARY: "요약", COMPLAINT_DRAFT: "진정서 초안",
  LABOR_ATTORNEY: "노무사 연계", INTERPRETER: "통역 연계",
  RECEIVED: "접수", REVIEWING: "검토 중", INFO_REQUESTED: "추가 자료 요청", REFERRED: "전문기관 연계", CLOSED: "종결",
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

function formatScalar(value) {
  if (typeof value !== "string") return String(value);
  if (CODE_LABELS[value]) return CODE_LABELS[value];
  if (ISO_DATE.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  }
  return value;
}

// 서버 응답 객체를 원본 JSON 대신 "항목: 값" 줄로 보여 준다(id·빈 값은 생략).
function formatValue(value) {
  if (value == null || value === "") return "정보 없음";
  if (Array.isArray(value)) {
    if (!value.length) return "없음";
    // 객체 배열(이력 등)은 한 줄씩, 값 배열은 쉼표로
    return value.some((v) => v && typeof v === "object")
      ? value.map((v) => formatValue(v).replace(/\n/g, " · ")).join("\n")
      : value.map(formatScalar).join(", ");
  }
  if (typeof value !== "object") return formatScalar(value);
  const lines = Object.entries(value)
    .filter(([key, v]) => key !== "id" && v != null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([key, v]) => {
      const label = FIELD_LABELS[key] ?? key;
      const text = typeof v === "object" && !Array.isArray(v) ? formatValue(v).replace(/\n/g, " · ") : formatValue(v);
      return `${label}: ${text}`;
    });
  return lines.length ? lines.join("\n") : "정보 없음";
}

function getErrorMessage(error) {
  const code =
    error?.errorCode ??
    error?.data?.errorCode ??
    error?.data?.error?.code;

  if (code === "CONSENT_NOT_GRANTED") {
    return "정보 공유 동의가 철회된 상담입니다.";
  }

  if (error?.status === 409) {
    return "종결되었거나 공유가 철회된 상담에는 메시지를 보낼 수 없습니다.";
  }

  if (error?.status === 401) {
    return "로그인이 필요합니다.";
  }

  return error?.message ?? "요청 처리에 실패했습니다.";
}

function SectionData({ title, value }) {
  if (value == null) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2>{title}</h2>
      <pre style={{
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        fontFamily: "inherit",
      }}>
        {formatValue(value)}
      </pre>
    </section>
  );
}

export default function ConsultationDetail() {
  const { consultationId } = useParams();

  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [notice, setNotice] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  const loadMessages = useCallback(async (signal) => {
    const response = await apiRequest(
      "consultation",
      "getMessages",
      {
        params: { consultationId },
        query: { page, size: 50 },
        signal,
      }
    );

    const data = unwrap(response);

    if (!Array.isArray(data?.messages)) {
      throw new Error("메시지 응답 형식이 올바르지 않습니다.");
    }

    return data;
  }, [consultationId, page]);

  // 상담 상세와 메시지 목록 조회
  useEffect(() => {
    if (!consultationId) return;

    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const [detailResult, messageResult] =
          await Promise.allSettled([
            apiRequest("consultation", "getDetail", {
              params: { consultationId },
              signal: controller.signal,
            }),
            loadMessages(controller.signal),
          ]);

        if (!active) return;

        if (detailResult.status === "fulfilled") {
          setDetail(unwrap(detailResult.value));
          setError("");
        } else {
          setDetail(null);
          setError(getErrorMessage(detailResult.reason));
        }

        if (messageResult.status === "fulfilled") {
          const messageData = messageResult.value;
          setMessages(
            [...messageData.messages].sort((a, b) =>
              String(a.createdAt ?? "").localeCompare(
                String(b.createdAt ?? "")
              )
            )
          );
          setPageInfo(messageData.pageInfo ?? null);
          setMessageError("");
        } else {
          setMessages([]);
          setMessageError(getErrorMessage(messageResult.reason));
        }
      } catch (err) {
        if (!active || err?.name === "AbortError") return;

        setError(getErrorMessage(err));
      } finally {
        if (active) {
          setLoading(false);
          setMessagesLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [consultationId, loadMessages, reloadKey]);

  function refresh() {
    setLoading(true);
    setMessagesLoading(true);
    setError("");
    setReloadKey((previous) => previous + 1);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setMessagesLoading(true);
  }

  const revoked = Boolean(
    detail?.consent?.revokedAt ||
    detail?.shared === false
  );

  const closed = detail?.status === "CLOSED";

  const canSend =
    !loading &&
    !sending &&
    !revoking &&
    !closed &&
    !revoked &&
    text.trim().length >= 1 &&
    text.trim().length <= 2000;

  // 메시지 전송
  async function handleSend(event) {
    event.preventDefault();

    if (!canSend) return;

    setSending(true);
    setMessageError("");
    setNotice("");

    try {
      const response = await apiRequest(
        "consultation",
        "sendMessage",
        {
          params: { consultationId },
          body: { text: text.trim() },
        }
      );

      const data = unwrap(response);

      setText("");

      if (data?.translationStatus === "FAILED") {
        setNotice(
          "메시지는 저장되었지만 한국어 번역에 실패했습니다."
        );
      } else {
        setNotice("메시지를 전송했습니다.");
      }

      // 전송한 메시지를 서버에서 다시 조회
      setPage(1);
      refresh();
    } catch (err) {
      setMessageError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  // 정보 공유 동의 철회
  async function handleRevoke() {
    if (revoked || revoking) return;

    const confirmed = window.confirm(
      "이 상담기관에 대한 정보 공유 동의를 철회하시겠습니까?\n\n철회하면 상담기관의 자료 접근이 차단됩니다. 이미 전달된 정보의 회수 여부는 기관 정책에 따릅니다."
    );

    if (!confirmed) return;

    setRevoking(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "consultation",
        "revokeConsent",
        {
          params: { consultationId },
        }
      );

      setNotice(
        "정보 공유 철회 요청이 처리되었습니다. 최신 상태를 확인합니다."
      );

      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRevoking(false);
    }
  }

  const sharedScope = Array.isArray(detail?.consent?.sharedScope)
    ? detail.consent.sharedScope
    : [];

  const infoRequests = Array.isArray(detail?.infoRequests)
    ? detail.infoRequests
    : [];

  const referrals = Array.isArray(detail?.referrals)
    ? detail.referrals
    : [];

  return (
    <main style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: 24,
    }}>
      <h1>상담 상세</h1>

      <p>상담 ID: {consultationId}</p>

      <button
        type="button"
        onClick={refresh}
        disabled={loading || sending || revoking}
      >
        새로고침
      </button>

      {loading && (
        <p role="status">상담 정보를 조회하는 중...</p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {notice && <p role="status">{notice}</p>}

      {detail && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>1. 상담 진행 상태</h2>

            <p>
              상담기관:{" "}
              {detail.agency?.name ??
                detail.agencyName ??
                "미확인"}
            </p>

            <p>
              처리 상태:{" "}
              {STATUS_LABELS[detail.status] ??
                detail.status ??
                "미확인"}
            </p>

            <p>
              상담 요약 상태:{" "}
              {detail.summaryStatus ?? "미확인"}
            </p>

            {detail.summaryStatus === "PROCESSING" && (
              <p>
                상담용 사건 요약을 생성 중입니다.
                아직 완료된 요약은 제공되지 않습니다.
              </p>
            )}
          </section>

          {detail.summaryStatus === "DONE" && (
            <SectionData
              title="2. 상담용 사건 요약"
              value={detail.summary}
            />
          )}

          <section style={{ marginTop: 24 }}>
            <h2>3. 정보 공유 범위</h2>

            <p>
              공유 상태: {revoked ? "철회됨" : "공유 중"}
            </p>

            {sharedScope.length > 0 ? (
              <ul>
                {sharedScope.map((scope) => (
                  <li key={scope}>
                    {SCOPE_LABELS[scope] ?? scope}
                  </li>
                ))}
              </ul>
            ) : (
              <p>공유 범위 정보가 없습니다.</p>
            )}

            {detail.consent?.agreedAt && (
              <p>
                동의 시각: {detail.consent.agreedAt}
              </p>
            )}

            {detail.consent?.revokedAt && (
              <p>
                철회 시각: {detail.consent.revokedAt}
              </p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>4. 추가 자료 요청</h2>

            {infoRequests.length === 0 ? (
              <p>현재 추가 자료 요청이 없습니다.</p>
            ) : (
              infoRequests.map((item, index) => (
                <div
                  key={item.id ?? index}
                  style={{
                    border: "1px solid #ddd",
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <pre style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}>
                    {formatValue(item)}
                  </pre>
                </div>
              ))
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>5. 전문기관 연계</h2>

            {referrals.length === 0 ? (
              <p>등록된 연계 내역이 없습니다.</p>
            ) : (
              referrals.map((item, index) => (
                <pre key={item.id ?? index} style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {formatValue(item)}
                </pre>
              ))
            )}
          </section>

          {closed && (
            <SectionData
              title="상담 결과"
              value={detail.resultSummary}
            />
          )}

          <SectionData
            title="상담 진행 이력"
            value={detail.timeline}
          />

          {/* 메시지 */}
          <section style={{ marginTop: 32 }}>
            <h2>6. 상담 메시지</h2>

            {messagesLoading && (
              <p>메시지 조회 중...</p>
            )}

            {messageError && (
              <p role="alert" style={{ color: "red" }}>
                {messageError}
              </p>
            )}

            {!messagesLoading && messages.length === 0 && (
              <p>아직 주고받은 메시지가 없습니다.</p>
            )}

            {!messagesLoading && messages.map((item) => (
              <article
                key={item.id}
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  marginBottom: 12,
                  background:
                    item.sender === "WORKER"
                      ? "#fff3ef"
                      : "#f6f6f6",
                }}
              >
                <strong>
                  {item.sender === "WORKER"
                    ? "나"
                    : "상담기관"}
                </strong>

                <p style={{ whiteSpace: "pre-wrap" }}>
                  {item.text ?? "본문 없음"}
                </p>

                {item.translationStatus === "FAILED" && (
                  <p>
                    한국어 번역에 실패했습니다.
                    원문 메시지는 저장되어 있습니다.
                  </p>
                )}

                {item.translationStatus === "DONE" &&
                  item.koText && (
                  <details>
                    <summary>한국어 번역 보기</summary>
                    <p>{item.koText}</p>
                  </details>
                )}

                {Array.isArray(item.attachedEvidences) &&
                  item.attachedEvidences.length > 0 && (
                  <div>
                    <p>첨부된 증거</p>
                    <ul>
                      {item.attachedEvidences.map((e, index) => (
                        <li key={e.id ?? index}>
                          {e.title ?? e.id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.createdAt && (
                  <small>{item.createdAt}</small>
                )}
              </article>
            ))}

            {pageInfo && (
              <div style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}>
                <button
                  type="button"
                  disabled={page <= 1 || messagesLoading}
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
                    messagesLoading ||
                    page >= (pageInfo.totalPages ?? page)
                  }
                  onClick={() => changePage(page + 1)}
                >
                  다음
                </button>
              </div>
            )}

            <form
              onSubmit={handleSend}
              style={{ marginTop: 24 }}
            >
              <label htmlFor="message-text">
                상담기관에 메시지 보내기
              </label>

              <textarea
                id="message-text"
                rows={5}
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                maxLength={2000}
                disabled={closed || revoked || sending}
                placeholder="선택한 언어로 작성해 주세요."
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 8,
                }}
              />

              <p>{text.length} / 2000자</p>

              <button
                type="submit"
                disabled={!canSend}
              >
                {sending ? "전송 중..." : "메시지 보내기"}
              </button>

              {(closed || revoked) && (
                <p>
                  종료되거나 공유 동의가 철회된 상담에는
                  메시지를 보낼 수 없습니다.
                </p>
              )}
            </form>
          </section>

          {/* 공유 철회 */}
          <section style={{ marginTop: 32 }}>
            <h2>7. 개인정보 공유 관리</h2>

            <p>
              상담기관에 공유한 자료의 접근 권한을
              철회할 수 있습니다.
            </p>

            <p>
              이미 전달된 정보의 회수 여부는
              상담기관 정책에 따릅니다.
            </p>

            <button
              type="button"
              disabled={revoked || revoking}
              onClick={handleRevoke}
            >
              {revoked
                ? "공유 철회 완료"
                : revoking
                  ? "철회 요청 중..."
                  : "정보 공유 동의 철회"}
            </button>
          </section>

          {detail.disclaimer && (
            <p style={{ marginTop: 24 }}>
              {detail.disclaimer}
            </p>
          )}
        </>
      )}

      <p style={{ marginTop: 32 }}>
        <Link to="/consultations">
          상담 목록으로 돌아가기
        </Link>
      </p>
    </main>
  );
}