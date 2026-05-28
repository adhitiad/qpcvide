import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Auiso",
        short_name: "Auiso",
        description: "Global Adult Video Platform",
        theme_color: "#0A0A0F",
        background_color: "#0A0A0F",
        display: "standalone",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
