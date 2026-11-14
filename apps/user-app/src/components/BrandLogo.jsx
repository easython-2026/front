
import symbolLogo from "../assets/images/symbol_logo.svg";
import symbolText from "../assets/images/symbol_text.svg";
import "../styles/brand-logo.css";

/**
 * 동일한 SVG 파일을 홈과 온보딩에서 재사용합니다.
 * 왼쪽: 심볼 / 오른쪽: '일한만큼' 글자 로고
 */
export default function BrandLogo({ size = "header" }) {
  const variant = size === "intro" ? "intro" : "header";

  return (
    <span
      className={`brand-logo brand-logo--${variant}`}
      role="img"
      aria-label="일한만큼"
    >
      <img
        src={symbolLogo}
        alt=""
        className="brand-logo__symbol"
        draggable={false}
      />
      <img
        src={symbolText}
        alt=""
        className="brand-logo__text"
        draggable={false}
      />
    </span>
  );
}
