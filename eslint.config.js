import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";
import cfg from "./svelte.config.js";

export default defineConfig(
  {
    ignores: [
      "eslint.config.js",
      "**/.pnpm-store/**",
      "**/.svelte-kit/**",
      ".pnpm-store",
      ".svelte-kit",
      ".pnpm-store/**",
      ".svelte-kit/**",
      "build/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "package/**",
      "src/lib/components/ui/**",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.{js,cjs,mjs,ts}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.js", "**/*.svelte.ts"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        project: "./tsconfig.eslint.json",
        svelteConfig: cfg,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/routes/**/+page.svelte", "src/lib/components/**/*.svelte"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      "drizzle.config.ts",
      "postcss.config.js",
      "src/hooks.server.ts",
      "src/lib/server/**/*.{js,ts}",
      "src/routes/**/+server.ts",
      "svelte.config.js",
      "vite.config.ts",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      "drizzle.config.ts",
      "postcss.config.js",
      "svelte.config.js",
      "vite.config.ts",
    ],
    extends: [ts.configs.disableTypeChecked],
  },
  {
    files: ["src/lib/components/ui/**/*.{ts,svelte}"],
    extends: [ts.configs.disableTypeChecked],
  },
  {
    files: ["src/lib/components/**/*.svelte"],
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  {
    files: [
      "src/lib/server/**/*.{js,ts}",
      "src/routes/**/+server.ts",
      "src/routes/**/+page.server.ts",
      "src/routes/**/+layout.server.ts",
      "src/routes/**/*.svelte",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
  {
    files: ["src/lib/components/ui/button/button.svelte"],
    rules: {
      "svelte/no-navigation-without-resolve": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: false,
        },
      ],
      "svelte/block-lang": "off",
      "svelte/no-unused-class-name": "off",
      "svelte/sort-attributes": "off",
    },
  },
  {
    files: [
      "drizzle.config.ts",
      "postcss.config.js",
      "svelte.config.js",
      "vite.config.ts",
    ],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-import-type-side-effects": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: ["src/lib/components/ui/**/*.{ts,svelte}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-import-type-side-effects": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: [
      "src/lib/server/**/*.{js,ts}",
      "src/routes/**/+server.ts",
      "src/routes/**/+page.server.ts",
      "src/routes/**/+layout.server.ts",
      "src/routes/**/*.svelte",
      "src/lib/components/**/*.svelte",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
  ...svelte.configs["flat/prettier"],
  prettier,
);
