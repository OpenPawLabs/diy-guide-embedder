import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

// The embedder ships as ONE self-contained script: React, the prebuilt
// @openpawlabs/diy-guides-ui bundle (HeroUI + its compiled CSS), and the MDX
// compiler are bundled into dist/embed.js. The library's CSS is injected at
// runtime by JS so authors only ever add a single <script> tag.
export default defineConfig({
  plugins: [react(), cssInjectedByJs()],
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
