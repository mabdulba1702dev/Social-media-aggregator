import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  {
    // worker/ is a separate Node package (own tsconfig, no React) — the
    // Next.js/React rule set above doesn't apply to it.
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "worker/**"]
  }
];

export default eslintConfig;
