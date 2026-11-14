
import symbolLogo from "../assets/images/symbol_logo.svg";
import symbolText from "../assets/images/symbol_text.svg";

import "../styles/brand-logo.css";

export default function BrandLogo({
  size = "header",
}) {
  const variant =
    size === "intro" ? "intro" : "header";

  return (
    <div
      className={`brand-logo brand-logo--${variant}`}
      role="img"
      aria-label="일한만큼"
    >
      <img
        className="brand-logo__symbol"
        src={symbolLogo}
        alt=""
        draggable="false"
      />

      <img
        className="brand-logo__text"
        src={symbolText}
        alt=""
        draggable="false"
      />
    </div>
  );
}
