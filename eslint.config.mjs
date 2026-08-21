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
    // The design-canvas export under docs/ ships its own vendored/generated
    // runtime (support.js, _ds/**) — reference material, not hand-written
    // app code, and not meant to be edited or linted as if it were.
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "worker/**",
      "docs/Social media embed aggregator UI/**"
    ]
  }
];

export default eslintConfig;
