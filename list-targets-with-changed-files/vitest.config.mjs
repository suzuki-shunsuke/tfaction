import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      // https://vitest.dev/guide/common-errors#cannot-find-module-relative-path
      lib: new URL("../lib/dist", import.meta.url).pathname,
    },
  },
});
