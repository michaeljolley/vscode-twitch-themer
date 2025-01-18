// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/naming-convention": "warn",
      curly: 'warn',
      eqeqeq: 'warn',
      "no-throw-literal": 'warn',
      "semi": 'off'
    },
    files: ['src/**/*.ts'],
    ignores: ['node_modules', 'out', '*.js'],
  }
);