import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import github from 'eslint-plugin-github'
import jest from 'eslint-plugin-jest'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  {
    ignores: ['eslint.config.*', '**/dist/**', '**/coverage/**', 'lib/**']
  },
  js.configs.recommended,
  github.getFlatConfigs().recommended,
  ...github.getFlatConfigs().typescript,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./.github/linters/tsconfig.json', './tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2023,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.es2023,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      }
    },
    rules: {
      'i18n-text/no-en': 'off',

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'no-public' }
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error'
    }
  },
  {
    files: ['**/*.test.{js,ts}', '**/__tests__/**/*.{js,ts}'],
    ...jest.configs['flat/recommended'],
    languageOptions: {
      globals: globals.jest
    },
    rules: {
      'import/no-namespace': 'off'
    }
  },
  prettierRecommended
]
