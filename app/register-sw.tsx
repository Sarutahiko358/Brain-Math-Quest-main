"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const url = '/sw.js';
      const doRegister = async () => {
        try {
          const reg = await navigator.serviceWorker.register(url, { scope: '/' });
          // 変更検知時に即時更新
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新しいSWがインストールされた場合はリロードして反映
                window.location.reload();
              }
            });
          });
        } catch (e) {
          console.warn('ServiceWorker register failed:', e);
        }
      };

      // devサーバでも一応登録（NextのHMRと競合しにくいように遅延）
      const timer = setTimeout(doRegister, 500);
      return () => clearTimeout(timer);
    }
  }, []);
  return null;
}
