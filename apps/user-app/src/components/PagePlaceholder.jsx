
import { Link, useParams } from "react-router";

export default function PagePlaceholder({ title }) {
  const params = useParams();

  return (
    <main style={{ padding: 24 }}>
      <h1>{title}</h1>

      <p>Figma UI 구현 전 임시 화면입니다.</p>

      {Object.keys(params).length > 0 && (
        <pre>{JSON.stringify(params, null, 2)}</pre>
      )}

      <Link to="/home">홈으로 이동</Link>
    </main>
  );
}
