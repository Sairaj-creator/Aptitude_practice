import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    env: {
      // Allow local subprocess fallback for sandbox unit tests (never set in production)
      ALLOW_LOCAL_EXEC: "true"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
