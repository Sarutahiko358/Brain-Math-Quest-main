import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // CI環境でのメモリ問題を回避 - 並列実行を抑制
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : 4, // CI環境では2並列、ローカルは4並列
        minForks: 1,
      },
    },
    // テストの分離を有効化（各テストが独立した環境で実行）
    isolate: true,
    // タイムアウトを短縮（問題を早期発見）
    testTimeout: 10000,  // 30秒 → 10秒
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // CI環境ではverbose reporterを使用（詳細なログ）
    reporters: process.env.CI ? ['verbose'] : ['default'],
    // 失敗時の動作を改善
    bail: process.env.CI ? 1 : 0,  // CIでは1つ失敗したら停止
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        '**/*.config.{js,ts}',
        '**/types.ts',
        '**/__tests__/**',
        '**/docs/**',
        'vitest.setup.ts',
      ],
      include: ['app/**/*.{ts,tsx}'],
      // Removed all:true to avoid instrumenting un-imported files, speeding up end-of-run aggregation.
    },
  },
});
