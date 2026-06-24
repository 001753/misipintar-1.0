import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environmentMatchGlobs: [
      // Existing phase2 test uses jsdom (DOM testing)
      ["src/test/**", "jsdom"],
      // New Phase 8 DB/server tests use node
      ["src/__tests__/**", "node"],
    ],
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
