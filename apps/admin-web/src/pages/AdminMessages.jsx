
import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from "react";

  import { useNavigate, useParams } from "react-router";

  import {
    ArrowLeft,
    AlertCircle,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileText,
    Languages,
    LoaderCircle,
    MessageCircle,
    RefreshCw,
    Send,
    ShieldAlert,
    Sparkles,
    UserRound,
  } from "lucide-react";

  import {
    getAdminConsultationDetail,
  } from "../services/adminConsultationApi";

  import {
    getAdminMessages,
    sendAdminMessage,
  } from "../services/adminMessageApi";

  import "./AdminMessages.css";

  const PAGE_SIZE = 50;

  const STATUS_LABELS = {
    RECEIVED: "접수",
    REVIEWING: "검토 중",
    INFO_REQUESTED: "자료 요청",
    REFERRED: "전문가 연계",
    CLOSED: "종결",
  };

  const LANGUAGE_LABELS = {
    ko: "한국어",
    en: "영어",
    vi: "베트남어",
    ne: "네팔어",
    zh: "중국어",
    th: "태국어",
    uz: "우즈베크어",
  };

  function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function getLanguageLabel(code) {
    if (!code) return "노동자 언어";
    return LANGUAGE_LABELS[code] || code;
  }

  // ========================================
  // 개별 메시지
  // ========================================

  function MessageBubble({ message, workerLanguage }) {
    const [showWorkerText, setShowWorkerText] =
      useState(false);

    const isStaff = message.sender === "STAFF";

    const status = message.translationStatus;

    // API 명세:
    // koText = 한국어
    // text   = 노동자 언어
    const koreanText = message.koText || "";
    const workerText = message.text || "";

    // 실제 번역이 완료되고 결과가 있을 때만
    // 언어 전환 버튼을 표시한다.
    const hasWorkerTranslation =
      status === "DONE" &&
      Boolean(workerText) &&
      Boolean(koreanText) &&
      workerText !== koreanText;

    // 한국어 번역이 없으면 원문을 숨기지 않는다.
    const displayText =
      koreanText || workerText;

    const isProcessing = status === "PROCESSING";
    const isFailed = status === "FAILED";

    const attachedEvidences = Array.isArray(
      message.attachedEvidences
    )
      ? message.attachedEvidences
      : [];

    useEffect(() => {
      setShowWorkerText(false);
    }, [message.id]);

    return (
      <article
        className={`admin-messages__message ${
          isStaff ? "is-staff" : "is-worker"
        }`}
      >
        <div className="admin-messages__message-avatar">
          {isStaff ? (
            <MessageCircle size={18} />
          ) : (
            <UserRound size={18} />
          )}
        </div>

        <div className="admin-messages__message-content">
          <div className="admin-messages__message-meta">
            <strong>
              {isStaff ? "상담 담당자" : "노동자"}
            </strong>

            <span>{formatTime(message.createdAt)}</span>
          </div>

          <div className="admin-messages__bubble">
            {/* 한국어 우선 표시 */}
            {displayText ? (
              <p className="admin-messages__korean">
                {displayText}
              </p>
            ) : (
              <p className="admin-messages__pending">
                메시지 내용을 확인할 수 없습니다.
              </p>
            )}

            {/* 번역 처리 중일 때만 상태 표시 */}
            {isProcessing && (
              <div className="admin-messages__bubble-footer">
                <span className="admin-messages__translation-status processing">
                  <Clock3 size={13} />
                  번역 처리 중
                </span>
              </div>
            )}

            {/* 번역 실패 안내 */}
            {isFailed && (
              <div className="admin-messages__bubble-footer">
                <span className="admin-messages__translation-status failed">
                  <AlertCircle size={13} />
                  번역 실패
                </span>
              </div>
            )}

            {/* DONE일 때 불필요한 완료 배지 제거 */}
            {/* 실제 번역문이 있으면 언어 전환 버튼 표시 */}
            {hasWorkerTranslation && (
              <div className="admin-messages__bubble-footer">
                <button
                  type="button"
                  className="admin-messages__translation-toggle"
                  onClick={() =>
                    setShowWorkerText((previous) => !previous)
                  }
                  aria-expanded={showWorkerText}
                >
                  <Languages size={14} />

                  {showWorkerText
                    ? "노동자 언어 숨기기"
                    : `${getLanguageLabel(
                        workerLanguage
                      )} 번역문 보기`}
                </button>
              </div>
            )}

            {/* 서버 응답의 실제 노동자 언어 표시 */}
            {hasWorkerTranslation && showWorkerText && (
              <div className="admin-messages__translated">
                <span>
                  <Languages size={14} />
                  {getLanguageLabel(workerLanguage)} 번역문
                </span>

                <p>{workerText}</p>
              </div>
            )}

            {/* 번역 실패 시 원문 확인 */}
            {isFailed && workerText && koreanText && (
              <div className="admin-messages__translated">
                <span>
                  <AlertCircle size={14} />
                  노동자 언어 원문
                </span>

                <p>{workerText}</p>
              </div>
            )}

            {/* 첨부된 증거 */}
            {attachedEvidences.length > 0 && (
              <div className="admin-messages__attachments">
                <strong>연결된 증거</strong>

                {attachedEvidences.map(
                  (evidence, index) => (
                    <div
                      className="admin-messages__attachment"
                      key={evidence.id ?? index}
                    >
                      <FileText size={15} />

                      <span>
                        {evidence.title ||
                          evidence.id ||
                          "증거 자료"}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // ========================================
  // 메시지 페이지
  // ========================================

  export default function AdminMessages() {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const bottomRef = useRef(null);

    const [detail, setDetail] = useState(null);
    const [messages, setMessages] = useState([]);

    const [page, setPage] = useState(1);

    const [pageInfo, setPageInfo] = useState({
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
    });

    const [draft, setDraft] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState(false);

    const [error, setError] = useState("");
    const [sendError, setSendError] = useState("");

    const [lastSent, setLastSent] = useState(null);

    // ========================================
    // 사건 및 메시지 조회
    // ========================================

    const loadData = useCallback(
      async (targetPage = 1, initial = false) => {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const [caseDetail, messageData] =
            await Promise.all([
              getAdminConsultationDetail(caseId),
              getAdminMessages(caseId, {
                page: targetPage,
                size: PAGE_SIZE,
              }),
            ]);

          setDetail(caseDetail);

          const sortedMessages = [
            ...(messageData.messages || []),
          ].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );

          setMessages(sortedMessages);

          const info = messageData.pageInfo || {};

          setPageInfo({
            currentPage:
              info.currentPage || targetPage,
            totalPages: info.totalPages || 1,
            totalCount: info.totalCount || 0,
          });

          setPage(info.currentPage || targetPage);

          return {
            detail: caseDetail,
            pageInfo: info,
          };
        } catch (err) {
          setError(
            err.message ||
              "상담 메시지를 불러오지 못했습니다."
          );

          if (
            err.errorCode === "CONSENT_NOT_GRANTED" ||
            err.errorCode === "FORBIDDEN"
          ) {
            setDetail(null);
            setMessages([]);
          }

          return null;
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [caseId]
    );

    // 사건 변경 시 초기화
    useEffect(() => {
      setDetail(null);
      setMessages([]);
      setDraft("");
      setLastSent(null);
      setPage(1);

      loadData(1, true);
    }, [loadData]);

    // 메시지 목록 변경 시 스크롤 이동
    useEffect(() => {
      if (!loading && messages.length > 0) {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, [messages, loading]);

    const isClosed = detail?.status === "CLOSED";

    const isRevoked = Boolean(
      detail?.consent?.revokedAt
    );

    const workerLanguage = detail?.worker?.language;

    const canSend =
      Boolean(detail) &&
      !isClosed &&
      !isRevoked &&
      !sending &&
      !loading &&
      draft.trim().length > 0 &&
      draft.trim().length <= 2000;

    // ========================================
    // 메시지 전송
    // ========================================

    async function handleSend(event) {
      event.preventDefault();

      if (!canSend) return;

      setSending(true);
      setSendError("");
      setLastSent(null);

      try {
        // 기존 API 함수와 요청 형식 유지
        const sent = await sendAdminMessage(
          caseId,
          {
            text: draft.trim(),
          }
        );

        // 서버가 반환한 실제 번역 결과 저장
        setLastSent(sent);
        setDraft("");

        // 전송 후 마지막 페이지 조회
        const nextTotal =
          (pageInfo.totalCount || 0) + 1;

        const nextPage = Math.max(
          1,
          Math.ceil(nextTotal / PAGE_SIZE)
        );

        const result = await loadData(
          nextPage,
          false
        );

        if (result) {
          const finalPage =
            result.pageInfo?.totalPages ||
            nextPage;

          if (finalPage !== nextPage) {
            await loadData(finalPage, false);
          }
        }
      } catch (err) {
        if (err.errorCode === "CONFLICT") {
          setSendError(
            "종결된 상담에는 메시지를 보낼 수 없습니다."
          );
        } else if (
          err.errorCode === "CONSENT_NOT_GRANTED" ||
          err.errorCode === "FORBIDDEN"
        ) {
          setSendError(
            "상담 정보 공유 동의 또는 접근 권한을 확인해 주세요."
          );
        } else {
          setSendError(
            err.message ||
              "메시지 전송에 실패했습니다."
          );
        }
      } finally {
        setSending(false);
      }
    }

    // ========================================
    // 화면
    // ========================================

    return (
      <div className="admin-messages">
        {/* 상단 네비게이션 */}

        <header className="admin-messages__topbar">
          <div>
            <button
              type="button"
              className="admin-messages__back"
              onClick={() =>
                navigate(`/cases/${caseId}`)
              }
            >
              <ArrowLeft size={17} />
              사건 상세로 돌아가기
            </button>

            <div className="admin-messages__title-row">
              <div className="admin-messages__title-icon">
                <MessageCircle
                  size={25}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <span>CONSULTATION MESSAGE</span>
                <h1>상담 메시지</h1>
                <p>
                  노동자와 상담 담당자가
                  주고받은 대화 내역을 확인합니다.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-messages__refresh"
            onClick={() =>
              loadData(page, false)
            }
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-messages__spinning"
                  : ""
              }
            />
            새로고침
          </button>
        </header>

        {/* 사건 정보 */}

        {detail && (
          <section className="admin-messages__case-info">
            <div>
              <span>상담 사건</span>
              <strong>{detail.id}</strong>
            </div>

            <div>
              <span>노동자</span>
              <strong>
                {detail.worker?.name ||
                  "확인 필요"}
              </strong>
            </div>

            <div>
              <span>사용 언어</span>
              <strong>
                {getLanguageLabel(workerLanguage)}
              </strong>
            </div>

            <div>
              <span>처리 상태</span>
              <strong>
                {STATUS_LABELS[detail.status] ||
                  detail.status ||
                  "확인 필요"}
              </strong>
            </div>
          </section>
        )}

        {/* 조회 오류 */}

        {error && (
          <div
            className="admin-messages__error-banner"
            role="alert"
          >
            <AlertCircle size={19} />

            <div>
              <strong>
                메시지를 불러올 수 없습니다.
              </strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 메시지 패널 */}

        <section className="admin-messages__panel">
          <div className="admin-messages__panel-header">
            <div>
              <MessageCircle size={18} />
              <strong>상담 대화</strong>
              <span>
                {pageInfo.totalCount}개의 메시지
              </span>
            </div>

            <div className="admin-messages__secure">
              <Languages size={15} />
              한국어 번역 지원
            </div>
          </div>

          {/* 페이지네이션 */}

          {pageInfo.totalPages > 1 && (
            <div className="admin-messages__pagination">
              <button
                type="button"
                disabled={
                  refreshing ||
                  loading ||
                  page <= 1
                }
                onClick={() =>
                  loadData(page - 1, false)
                }
              >
                <ChevronLeft size={16} />
                이전
              </button>

              <span>
                {page} / {pageInfo.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  refreshing ||
                  loading ||
                  page >= pageInfo.totalPages
                }
                onClick={() =>
                  loadData(page + 1, false)
                }
              >
                다음
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* 대화 내용 */}

          <div className="admin-messages__conversation">
            {loading ? (
              <div className="admin-messages__empty">
                <LoaderCircle
                  size={30}
                  className="admin-messages__spinning"
                />

                <strong>
                  메시지를 불러오는 중입니다.
                </strong>
              </div>
            ) : error && messages.length === 0 ? (
              <div className="admin-messages__empty">
                <ShieldAlert size={31} />

                <strong>
                  대화 내역을 표시할 수 없습니다.
                </strong>

                <p>
                  접근 권한과 서버 연결 상태를 확인해 주세요.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="admin-messages__empty">
                <MessageCircle size={32} />

                <strong>
                  아직 주고받은 메시지가 없습니다.
                </strong>

                <p>
                  노동자와 상담을 시작하면
                  이곳에 대화가 표시됩니다.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    workerLanguage={workerLanguage}
                  />
                ))}

                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* 전송 결과 */}

          {lastSent && (
            <div
              className="admin-messages__sent-result"
              role="status"
            >
              <CheckCheck size={19} />

              <div>
                <strong>
                  메시지가 전송되었습니다.
                </strong>

                <p>
                  {lastSent.translationStatus ===
                  "DONE"
                    ? "노동자 언어 번역이 완료되었습니다."
                    : lastSent.translationStatus ===
                        "PROCESSING"
                      ? "번역 처리 중입니다."
                      : lastSent.translationStatus ===
                          "FAILED"
                        ? "메시지는 저장되었지만 번역에 실패했습니다."
                        : "서버의 번역 상태를 확인해 주세요."}
                </p>

                {lastSent.translationStatus ===
                  "DONE" &&
                  lastSent.text && (
                    <div className="admin-messages__sent-translation">
                      <Languages size={15} />

                      <span>
                        {getLanguageLabel(workerLanguage)}:
                        {" "}
                        {lastSent.text}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* 전송 오류 */}

          {sendError && (
            <div
              className="admin-messages__send-error"
              role="alert"
            >
              <AlertCircle size={17} />
              {sendError}
            </div>
          )}

          {/* 메시지 작성 */}

          <form
            className="admin-messages__composer"
            onSubmit={handleSend}
          >
            {isClosed || isRevoked ? (
              <div className="admin-messages__disabled-notice">
                <ShieldAlert size={18} />

                {isClosed
                  ? "종결된 상담에는 메시지를 전송할 수 없습니다."
                  : "정보 공유 동의가 철회된 상담입니다."}
              </div>
            ) : (
              <>
                <div className="admin-messages__composer-heading">
                  <div>
                    <Sparkles size={17} />
                    <strong>
                      한국어 메시지 작성
                    </strong>
                  </div>

                  <span>
                    {draft.length} / 2,000
                  </span>
                </div>

                <textarea
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSendError("");
                    setLastSent(null);
                  }}
                  rows={3}
                  maxLength={2000}
                  placeholder="노동자에게 전달할 상담 내용을 한국어로 입력하세요."
                  disabled={
                    sending || loading || !detail
                  }
                />

                <div className="admin-messages__composer-footer">
                  <div className="admin-messages__translation-hint">
                    <Languages size={16} />

                    <span>
                      전송 후 서버에서 번역한 결과를
                      확인할 수 있습니다.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSend}
                  >
                    {sending ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="admin-messages__spinning"
                        />
                        전송 중
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        메시지 전송
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>

        <div className="admin-messages__bottom-note">
          <ShieldAlert size={16} />
          상담 내역과 번역 결과는 참고용이며,
          민감한 개인정보 전송에 주의해 주세요.
        </div>
      </div>
    );
  }
