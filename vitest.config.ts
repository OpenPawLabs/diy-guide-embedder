import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Ensure the linked @openpawlabs/diy-guides-ui shares this app's single React copy.
  resolve: {
    alias: {
      react: resolve(__dirname, "node_modules/react"),
      "react-dom": resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": resolve(__dirname, "node_modules/react/jsx-runtime.js"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    server: {
      deps: {
        inline: ["@openpawlabs/diy-guides-ui"],
      },
    },
    setupFiles: "./src/test/setup.ts",
  },
});
