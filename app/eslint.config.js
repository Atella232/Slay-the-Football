import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const engineBans = {
  'no-restricted-imports': ['error', {
    patterns: [
      { group: ['react', 'react-dom', 'zustand', 'framer-motion'], message: 'El motor es TS puro.' },
      { group: ['**/ui/**', '**/platform/**', '**/sim/**'], message: 'El motor no depende de capas superiores.' },
    ],
  }],
  'no-restricted-properties': ['error',
    { object: 'Math', property: 'random', message: 'Usa el RNG con semilla del motor.' },
    { object: 'Date', property: 'now', message: 'El motor es determinista.' },
  ],
  'no-restricted-globals': ['error', { name: 'performance', message: 'El motor es determinista.' }],
}

export default defineConfig([
  globalIgnores(['dist', 'dist-single', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/engine/**/*.ts', 'src/content/**/*.ts'],
    ignores: ['src/engine/debug/cli.ts', '**/*.test.ts'],
    rules: engineBans,
  },
  {
    files: ['src/main.tsx', 'src/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/sim/**/*.ts', 'src/engine/debug/cli.ts', 'e2e/**/*.ts', '*.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
])
