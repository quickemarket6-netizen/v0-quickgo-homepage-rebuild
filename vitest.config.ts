import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    // Deterministic secret so webhook-signature tests can compute the expected
    // hash. Read at module load in lib/payments/cinetpay.ts.
    env: {
      CINETPAY_SECRET_KEY: "test_secret_key_deterministic",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
})
