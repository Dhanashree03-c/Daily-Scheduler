import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      registerType: "autoUpdate",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["icons/scheduler-app.png"],
      manifest: {
        name: "DayFlow Scheduler",
        short_name: "DayFlow",
        description: "Plan your day, get reminded, stay on track.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/scheduler-app.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/scheduler-app.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/scheduler-app.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
