"use client";

import React from "react";

interface BattleLogProps {
  log: string[];
  queueLength: number;
}

/**
 * BattleLog - Display-only component for battle messages
 * Shows last 7 messages and queue indicator
 * Props-based, no side effects
 */
export default function BattleLog({ log, queueLength }: BattleLogProps) {
  return (
    <div className="log">
      {[...log.slice(-7)].map((l, i) => <div key={i}>{l}</div>)}
      {queueLength > 0 && <div className="nextTip">▶ 次へ（残り{queueLength}）</div>}
    </div>
  );
}
