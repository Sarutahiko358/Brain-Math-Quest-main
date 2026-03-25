import React from 'react'
import './globals.css'
import RegisterSW from './register-sw'

export const metadata = {
  title: '🧠 Brain Math Quest',
  description: '脳トレで戦う ちいさなRPG',
}

export const viewport = {
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* PWA: 開発環境ではトンネルのCORS回りの誤検知を避けるため、manifestは本番のみ */}
        {process.env.NODE_ENV === 'production' && (
          <link rel="manifest" href="/manifest.webmanifest" />
        )}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="application-name" content="Brain Math Quest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Brain Math Quest" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  )
}
