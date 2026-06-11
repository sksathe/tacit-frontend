import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || "http://localhost:3001";

  return {
    server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      ".ngrok.io",
      ".ngrok-free.app",
      ".ngrok-free.dev",
      "localhost",
    ],
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "inject-api-base",
      transformIndexHtml(html) {
        const apiBase = (env.VITE_API_BASE_URL || env.VITE_API_URL || "").trim();
        const snippet = `<script>window.__TACIT_API_BASE__=${JSON.stringify(apiBase)}</script>`;
        return html.replace("</head>", `${snippet}</head>`);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
