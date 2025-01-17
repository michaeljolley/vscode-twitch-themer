import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  tseslint.configs.recommended,
  {
    "rules": {
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "off"
    },
    "ignores": [
        "out/**/*.js",
        "dist",
        "**/*.d.ts",
        "**/*.js"
    ],
    "files": [
        "src/**/*.ts"
    ],
  }
);