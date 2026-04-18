import { defineConfig } from "vitest/config";

// eslint-disable-next-line -- vitest requires default export
const config = defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/index.ts"],
    },
  },
});

export { config as default };
