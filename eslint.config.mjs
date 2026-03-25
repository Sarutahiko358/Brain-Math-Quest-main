/**
 * ESLint 9 Flat Config for Next.js + TypeScript
 * Enforces code quality, maintainability, and prevents common bugs
 */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default [
    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'coverage/**',
            'dist/**',
            'docs/legacy/**',
            'next-env.d.ts',
        ],
    },

    // Base configuration for all files
    ...compat.extends('next/core-web-vitals', 'next/typescript'),

    // TypeScript configuration
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                // Node globals
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                // Jest/Vitest globals
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },
        rules: {
            // Critical: Detect unreachable code immediately
            'no-unreachable': 'error',

            // Detect use before initialization (prevents runtime errors)
            '@typescript-eslint/no-use-before-define': [
                'error',
                { functions: false, classes: false, variables: true },
            ],

            // Detect empty blocks (allow empty catch blocks)
            'no-empty': ['error', { allowEmptyCatch: true }],

            // Gradual migration: warn on 'any' types
            '@typescript-eslint/no-explicit-any': 'warn',

            // Unused variables (allow underscore prefix)
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],

            // Enforce modern JavaScript: no var, prefer const
            'no-var': 'error',
            'prefer-const': 'warn',

            // Console statements (allow warn/error, discourage log/debug)
            'no-console': ['warn', { allow: ['warn', 'error'] }],

            // React Hooks dependency management
            'react-hooks/exhaustive-deps': 'warn',

            // Code maintainability: file and function size limits
            'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
            'complexity': ['warn', 12],
        },
    },

    // Test files: Relaxed rules for test convenience
    {
        files: [
            '**/__tests__/**',
            '**/*.test.ts',
            '**/*.test.tsx',
            '**/*.spec.ts',
            '**/*.spec.tsx',
        ],
        rules: {
            // Allow 'any' types and TS suppressions in tests
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',

            // Relaxed unused variables for test helpers
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            // Warn instead of error for code style in tests
            'no-var': 'warn',
            'prefer-const': 'warn',

            // Allow console statements in tests
            'no-console': 'off',

            // Disable React Hooks checks in tests
            'react-hooks/exhaustive-deps': 'off',

            // Relax size limits for comprehensive tests
            'max-lines': 'off',
            'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
        },
    },
];
