import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages 部署於 /klnes/ 子路徑；本機開發仍使用根路徑
  base: command === "build" ? "/klnes/" : "/",
  server: {
    port: 5179,
  },
}));
