import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Local-dev mirror of the netlify.toml proxy rules (redirects only apply
  // on Netlify). Keep both in sync when webhook mappings change.
  server: {
    proxy: {
      "/api/analyze": {
        target: "https://stg-orch-api.abafusion.ai",
        changeOrigin: true,
        rewrite: () => "/webhook/webhook-bir6qybpaazi77sq2wxolq5x/analyze",
      },
      "/api/latest": {
        target: "https://stg-orch-api.abafusion.ai",
        changeOrigin: true,
        rewrite: () => "/webhook/webhook-l3ob2h86slgvg0wxdpjr7f2h/latest",
      },
      "/api": {
        target: "https://stg-orch-api.abafusion.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/webhook"),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Recharts dominates bundle weight; keep it off the critical path.
          charts: ["recharts"],
          react: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
        },
      },
    },
  },
});
