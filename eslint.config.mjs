/* eslint-disable import/no-unresolved */
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslint from 'typescript-eslint';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import typescriptParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  importPlugin.flatConfigs.recommended,
  typescriptEslint.configs.eslintRecommended,
  prettierPluginRecommended,

  // https://stackoverflow.com/questions/58510287/parseroptions-project-has-been-set-for-typescript-eslint-parser
  ...typescriptEslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  {
    ignores: ['**/node_modules/', '**/build/', '**/dist/', '**/*d.ts'],
  },

  {
    files: ['**/*.ts', '**/*.tsx'],

    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      'react-hooks': reactHooksPlugin,
    },

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        __dirname: 'readonly',
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      // for some reason, these can't be applied at top level
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',

      // typescript eslint
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/member-ordering': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // react
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-closing-bracket-location': [
        'error',
        { location: 'line-aligned' },
      ],
      'react/jsx-fragments': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': [
        'error',
        { allowAllCaps: true, allowNamespace: true },
      ],
      'react/self-closing-comp': 'error',

      // import
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'sibling', 'parent', 'index', 'object'],
          ],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: '**/*.json', group: 'object', position: 'after' },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
          warnOnUnassignedImports: true,
        },
      ],
      'import/no-named-as-default': 'error',

      // javascript
      'no-useless-return': 'error',
      eqeqeq: 'error',
      'no-console': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': 'error',
      radix: 'error',
    },
  },
];
