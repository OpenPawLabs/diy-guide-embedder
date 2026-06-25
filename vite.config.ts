import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

// The embedder ships as ONE self-contained script: React, the prebuilt
// @openpawlabs/diy-guides-ui bundle (HeroUI + its compiled CSS), and the MDX
// compiler are bundled into dist/embed.js. The library's CSS is injected at
// runtime by JS so authors only ever add a single <script> tag.
export default defineConfig({
  plugins: [react(), cssInjectedByJs()],
  // Library builds (unlike app builds) do NOT replace process.env.NODE_ENV, so
  // React's dev/prod branch would survive and reference `process` — undefined in
  // a plain browser. Define it so the production path is selected and the dev
  // branch is dead-code-eliminated.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  // Ensure the prebuilt diy-guides-ui (which externalizes React) shares this
  // bundle's single React copy.
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    cssCodeSplit: false,
    lib: {
      // IIFE cannot code-split, so the UI lib's dynamic online-3d-viewer import
      // is automatically folded into the single file.
      entry: "src/index.ts",
      formats: ["iife"],
      name: "DiyGuideEmbedder",
      fileName: () => "embed.js",
    },
  },
});
