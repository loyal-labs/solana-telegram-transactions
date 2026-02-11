import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']",
          message:
            "Use centralized config modules instead of direct process.env access.",
        },
      ],
    },
  },
  {
    files: [
      "src/lib/core/config/**/*.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/app/telegram/**/*.{ts,tsx}",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/template.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/core/config/server",
                "@/lib/core/config/server/*",
                "**/core/config/server",
                "**/core/config/server/*",
              ],
              message:
                "Client code must import public env from '@/lib/core/config/public'.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
