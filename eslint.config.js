import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'max-lines-per-function': ['error', { max: 70, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', 18],
      'max-depth': ['error', 4],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  { files: ['**/*.test.ts', 'tests/**'], rules: { 'max-lines-per-function': 'off', complexity: 'off' } },
);
