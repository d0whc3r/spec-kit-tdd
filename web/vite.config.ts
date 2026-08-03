import { defineConfig } from "vite";

// The site is published to a GitHub Pages PROJECT path
// (https://d0whc3r.github.io/spec-kit-tdd/), so every emitted asset URL
// must be relative. base: "./" keeps the injected <script>/<link> tags
// relative and matches the runtime fetch() of the example markdown files,
// which resolve against the document URL.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    // mermaid is bundled from npm and code-split per diagram type. A few of its
    // vendor chunks (mermaid-parser, cytoscape, katex) exceed the default 500 kB
    // warning, but they are lazy: only fetched when a rendered doc actually uses
    // that diagram type. Raise the limit so an expected split is not flagged.
    chunkSizeWarningLimit: 700,
  },
});
