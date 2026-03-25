'use client'

import React from 'react'
import Link from 'next/link'

/**
 * Error Boundary for the entire application
 * Catches runtime errors and displays a fallback UI
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
  },
  card: {
    maxWidth: '500px',
    textAlign: 'center' as const,
    backgroundColor: '#334155',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#ef4444',
  },
  message: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
};

function ErrorDetails({ error }: { error: Error & { digest?: string } }) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <details
      style={{
        marginBottom: '1.5rem',
        textAlign: 'left',
        backgroundColor: '#1e293b',
        padding: '1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          color: '#94a3b8',
          marginBottom: '0.5rem',
        }}
      >
        エラー詳細（開発モード）
      </summary>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#fca5a5',
          fontSize: '0.75rem',
          margin: 0,
        }}
      >
        {error.message}
        {error.digest && `\n\nDigest: ${error.digest}`}
      </pre>
    </details>
  );
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error)
    }
  }, [error])

  return (
    <html lang="ja">
      <body>
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>
              ⚠️ エラーが発生しました
            </h1>
            <p style={styles.message}>
              申し訳ございません。予期しないエラーが発生しました。
              <br />
              下のボタンをクリックして再試行してください。
            </p>

            <ErrorDetails error={error} />

            <button
              onClick={reset}
              style={styles.button}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6' }}
            >
              🔄 再試行
            </button>

            <div style={{ marginTop: '1.5rem' }}>
              <Link
                href="/"
                style={styles.link}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
              >
                🏠 トップに戻る
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
