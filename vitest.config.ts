import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "app/components/ui/**",
        "gen/**",
        "**/*.d.ts",
        "tests/**",
        "app/server/**", // not core Remix loader/action
        "app/components/VideoPlayer.tsx",
        "app/components/LikeButton.tsx",
        "app/components/BookmarkButton.tsx",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 30,
        statements: 50,
      },
    },
  },
});
