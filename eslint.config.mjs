import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"
import reactHooks from "eslint-plugin-react-hooks"

// Config flat construite directement (eslint-config-next crashe en flat via
// FlatCompat sur ce projet). Couverture : règles Next (core-web-vitals),
// hooks React, TypeScript recommandé.
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
      "*.config.{js,mjs,ts}",
      "scripts/**",
    ],
  },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    rules: {
      // Codebase existante : any utilisé ponctuellement dans les routes API,
      // underscores pour les paramètres ignorés.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Les ternaires/short-circuits en instruction (cond ? setA() : setB(),
      // x && fn()) sont un pattern volontaire répandu ici.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowTernary: true, allowShortCircuit: true },
      ],
      // Règles nouvelles (react-hooks v7, ère React Compiler) très agressives
      // sur des patterns légitimes du codebase : signal conservé en warning,
      // à durcir progressivement.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
)
