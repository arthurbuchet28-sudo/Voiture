import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Chemin de publication : « / » en local, « /<dépôt>/ » sur GitHub Pages (voir .github/workflows/pages.yml).
  base: process.env.BASE_URL ?? "/",
  plugins: [react()],
  test: { include: ["src/**/*.test.ts", "scripts/tests/**/*.test.ts"] },
});
