
import { useState } from "react";

function percentage(value) {
  return `${Math.max(0, Math.min(1, Number(value) || 0)) * 100}%`;
}

export default function ContractHighlights({
  file,
  clauses = [],
  reviews = [],
}) {
  const [imageError, setImageError] = useState(false);

  const url = file?.url;

  if (!url) {
    return <p>원본 파일 주소가 없습니다.</p>;
  }

  // PDF 원본은 브라우저 뷰어로 표시.
  // 이미지 위 좌표 오버레이와는 별도로 처리한다.
  const isPdf = /\.pdf(?:[?#]|$)/i.test(url);

  if (isPdf) {
    return (
      <div>
        <p>
          PDF 원본은 확인할 수 있지만,
          조항 좌표 하이라이트는 아직 지원하지 않습니다.
        </p>

        <iframe
          title="근로계약서 PDF 원본"
          src={url}
          style={{
            width: "100%",
            height: 500,
            border: "1px solid #ddd",
          }}
        />
      </div>
    );
  }

  if (imageError) {
    return (
      <p role="alert">
        원본 이미지를 불러올 수 없습니다.
        서명 URL의 만료 여부를 확인해 주세요.
      </p>
    );
  }

  const highlightedClauses = clauses.filter(
    (clause) =>
      clause.position?.page === 1 &&
      reviews.some(
        (review) =>
          review.clauseId === clause.id
      )
  );

  return (
    <section>
      <p>
        빨간색: 확인 필요(CHECK) /
        노란색: 참고(NOTICE)
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          lineHeight: 0,
        }}
      >
        <img
          src={url}
          alt="근로계약서 원본"
          onError={() => setImageError(true)}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />

        {highlightedClauses.map((clause) => {
          const review = reviews.find(
            (item) =>
              item.clauseId === clause.id &&
              item.level === "CHECK"
          ) ?? reviews.find(
            (item) => item.clauseId === clause.id
          );

          const position = clause.position;

          const x = Math.max(0, Math.min(1, Number(position.x) || 0));
          const y = Math.max(0, Math.min(1, Number(position.y) || 0));

          const width = Math.max(
            0,
            Math.min(1 - x, Number(position.width) || 0)
          );

          const height = Math.max(
            0,
            Math.min(1 - y, Number(position.height) || 0)
          );

          return (
            <div
              key={clause.id}
              title={review?.message ?? "검토 항목"}
              style={{
                position: "absolute",
                left: percentage(x),
                top: percentage(y),
                width: percentage(width),
                height: percentage(height),
                border: `2px solid ${
                  review?.level === "CHECK"
                    ? "#dc2626"
                    : "#eab308"
                }`,
                backgroundColor:
                  review?.level === "CHECK"
                    ? "rgba(220,38,38,0.15)"
                    : "rgba(234,179,8,0.15)",
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            />
          );
        })}
      </div>

      <p style={{ fontSize: 12 }}>
        현재는 이미지 1페이지의 검토 조항만
        하이라이트합니다. 여러 페이지 문서의
        좌표 표시는 추후 페이지별로 구현합니다.
      </p>
    </section>
  );
}
