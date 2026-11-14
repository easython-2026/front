import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

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