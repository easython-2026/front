
import { Link, Outlet } from "react-router";

export default function UserLayout() {
  return (
    <div>
      {/* 실제 페이지가 표시되는 영역 */}
      <Outlet />

      {/* 임시 하단 내비게이션 */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "16px",
          borderTop: "1px solid #ddd",
        }}
      >
        <Link to="/home">홈</Link>
        <Link to="/attendance">출퇴근</Link>
        <Link to="/salary">급여</Link>
        <Link to="/profile">내 정보</Link>
      </nav>
    </div>
  );
}
