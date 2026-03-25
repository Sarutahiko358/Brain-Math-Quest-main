'use client'

import React from 'react'

/**
 * Global Error Boundary - catches errors in root layout
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error)
    }
  }, [error])

  return (
    <html lang="ja">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#0f172a',
            color: '#f1f5f9',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              textAlign: 'center',
              backgroundColor: '#1e293b',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h1
              style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#ef4444',
              }}
            >
              ⚠️ 重大なエラーが発生しました
            </h1>
            <p
              style={{
                fontSize: '1rem',
                marginBottom: '1.5rem',
                color: '#cbd5e1',
                lineHeight: '1.6',
              }}
            >
              アプリケーションの起動中にエラーが発生しました。
              <br />
              ページを再読み込みしてください。
            </p>

            <button
              onClick={reset}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                marginRight: '10px',
              }}
            >
              🔄 再試行
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🔃 ページ再読み込み
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
