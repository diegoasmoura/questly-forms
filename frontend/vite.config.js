import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(__dirname, "../node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "react": path.resolve(rootNodeModules, "react"),
      "react-dom": path.resolve(rootNodeModules, "react-dom"),
      "react-router-dom": path.resolve(rootNodeModules, "react-router-dom"),
    },
  },
  server: {
    port: 3002,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
