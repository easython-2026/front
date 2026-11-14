import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // https://일한만큼.kro.kr/admin/ 아래에서 서비스(사용자 앱은 /). 정적 파일도 /admin/assets/... 로 요청된다.
  base: "/admin/",

  server: {
    port: 5174,

    proxy: {
      "/api": {
        target: "https://xn--lz2b93ws3gu8e.kro.kr",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});