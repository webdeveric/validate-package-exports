import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import globals from 'globals';
import { configs as tseslintConfigs } from 'typescript-eslint';

function getNamingConvention(
  extraRules: {
    format: string[] | null;
    leadingUnderscore?: 'allow' | 'forbid' | 'require';
    modifiers?: string[];
    selector: string | string[];
    types: string[];
  }[] = [],
): unknown[] {
  const namingConvention = [
    {
      format: ['camelCase'],
      selector: 'default',
    },
    {
      format: ['camelCase'],
      leadingUnderscore: 'allow',
      selector: 'parameter',
    },
    {
      format: ['camelCase'],
      leadingUnderscore: 'allow',
      modifiers: ['private'],
      selector: 'memberLike',
    },
    {
      format: ['PascalCase'],
      selector: 'typeLike',
    },
    {
      format: ['PascalCase'],
      selector: 'enumMember',
    },
    {
      format: ['camelCase'],
      selector: 'variable',
    },
    {
      format: ['camelCase', 'UPPER_CASE'],
      modifiers: ['const'],
      selector: 'variable',
    },
    {
      format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      leadingUnderscore: 'allow',
      selector: ['objectLiteralProperty', 'typeProperty'],
    },
    {
      format: null,
      modifiers: ['requiresQuotes'],
      selector: [
        'classProperty',
        'objectLiteralProperty',
        'typeProperty',
        'classMethod',
        'objectLiteralMethod',
        'typeMethod',
        'accessor',
        'enumMember',
      ],
    },
    {
      format: null,
      modifiers: ['destructured'],
      selector: 'variable',
    },
    {
      format: ['camelCase', 'PascalCase'],
      selector: ['import'],
    },
    ...extraRules,
  ];

  return namingConvention;
}

export default defineConfig([
  globalIgnores(['coverage/', 'dist/', 'private/', 'cache/']),
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
  },
  tseslintConfigs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    settings: {
      'import-x/extensions': ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'],
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
        }),
        createNodeResolver({
          extensions: ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'],
        }),
      ],
    },
    rules: {
      'import-x/first': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-deprecated': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['./*.{js,mjs,cjs,ts,mts,cts}', '**/*.test.ts', '__mocks__/**'],
        },
      ],
      'import-x/no-relative-packages': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-unresolved': 'error',
      'import-x/no-useless-path-segments': [
        'error',
        {
          noUselessIndex: false,
        },
      ],
      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['builtin', 'external', 'internal', 'parent', ['sibling', 'index'], 'type'],
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '@{src,utils,lib}/**',
              group: 'internal',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
  // Turns off formatting rules that conflict with Prettier. Rules enabled below are Prettier-compatible.
  prettierConfig,
  {
    // Type-aware linting for TS and JSDoc-typed JS (see `allowJs`/`checkJs` in tsconfig.configs.json).
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'capitalized-comments': [
        'error',
        'always',
        {
          block: {
            ignoreConsecutiveComments: false,
            ignoreInlineComments: true,
            ignorePattern: 'ignored',
          },
          line: {
            ignorePattern: '.',
          },
        },
      ],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'smart'],
      'id-length': [
        'error',
        {
          exceptions: ['_', 'i', 'j'],
          min: 2,
          properties: 'never',
        },
      ],
      'lines-between-class-members': ['error', 'always'],
      'no-await-in-loop': 'error',
      'no-promise-executor-return': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              message: 'Please use full paths to imports',
              name: '..',
            },
          ],
        },
      ],
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: 'return', prev: '*' },
        { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
        { blankLine: 'any', next: ['const', 'let', 'var'], prev: ['const', 'let', 'var'] },
        { blankLine: 'always', next: '*', prev: 'directive' },
        { blankLine: 'any', next: 'directive', prev: 'directive' },
      ],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-object-has-own': 'warn',
      'prefer-promise-reject-errors': 'error',
      'spaced-comment': ['error', 'always'],
      strict: ['error', 'safe'],
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-use-before-define': ['error', { variables: false }],
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/unbound-method': 'error',
      'default-param-last': 'off',
      'no-shadow': 'off',
      'no-use-before-define': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.cts', '**/*.mts'],
    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
        },
      ],
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/naming-convention': ['error', ...getNamingConvention()],
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
      '@typescript-eslint/unified-signatures': 'warn',
      camelcase: 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.cts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        ...getNamingConvention([
          {
            format: ['camelCase', 'PascalCase'],
            selector: ['variable', 'function'],
            types: ['function'],
          },
        ]),
      ],
    },
  },
]);
