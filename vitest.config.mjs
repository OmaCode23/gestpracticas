import path from "node:path";

export default {
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    pool: "threads",
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
};
