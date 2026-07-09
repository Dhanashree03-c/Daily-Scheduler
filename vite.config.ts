import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 👈 add this import
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 add this plugin
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/scheduler-app.png", "icons/scheduler-app.png"],
      manifest: {
        name: "DayFlow Scheduler",
        short_name: "DayFlow",
        description: "Plan your day, get reminded, stay on track.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
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