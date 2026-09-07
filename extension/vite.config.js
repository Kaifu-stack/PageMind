import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const buildContentScript = mode === "content";

  return {
    plugins: [react()],
    base: "./",
    build: {
      // Build the popup first; then add one classic content-script bundle.
      emptyOutDir: !buildContentScript,
      rollupOptions: {
        input: buildContentScript
          ? resolve(import.meta.dirname, "src/contentScript.js")
          : resolve(import.meta.dirname, "index.html"),
        output: buildContentScript
          ? {
              format: "iife",
              entryFileNames: "contentScript.js",
              assetFileNames: "assets/[name]-[hash][extname]"
            }
          : {
              entryFileNames: "assets/[name]-[hash].js",
              chunkFileNames: "assets/[name]-[hash].js",
              assetFileNames: "assets/[name]-[hash][extname]"
            }
      }
    }
  };
});
