import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/management-api": {
        target: "https://spring-boot-test-production-a0d6.up.railway.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/management-api/, ""),
      },
    },
  },
});
