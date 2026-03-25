"use client";

import React from "react";
import { Player } from "../lib/gameTypes";
import { Skill } from "../lib/skills";

interface CommandBarProps {
  mode: "select" | "selectSkill" | "selectFireList" | "selectHealList" | "selectItem" | "queue" | "victory" | "other";
  player: Player;
  skills: Skill[];
  fireList: Skill[];
  healList: Skill[];
  onAttack: () => void;
  onRun: () => void;
  onSelectMode: (mode: "selectSkill" | "selectFireList" | "selectHealList" | "selectItem" | "select") => void;
  onActivateSkillOrMagic: (s: Skill) => void;
  onUseItem: (idx: number) => void;
  onLogClick: () => void;
  onAdvanceLog: () => void;
}

/**
 * CommandBar - Display-only component for battle commands
 * Shows different command sets based on battle mode
 * All event handlers passed via props, no internal logic
 */
export default function CommandBar({
  mode,
  player,
  skills,
  fireList,
  healList,
  onAttack,
  onRun,
  onSelectMode,
  onActivateSkillOrMagic,
  onUseItem,
  onLogClick,
  onAdvanceLog,
}: CommandBarProps) {
  if (mode === "select") {
    return (
      <div className="cmds grid2" role="group" aria-label="バトルコマンド">
        <button onClick={onAttack} aria-label="たたかう - 通常攻撃を行う">たたかう</button>
        <button onClick={() => onSelectMode('selectSkill')} aria-label="必殺技 - 必殺技を選択する">必殺技</button>
        <button onClick={() => onSelectMode('selectFireList')} aria-label="攻撃魔法 - 攻撃魔法を選択する">攻撃魔法</button>
        <button onClick={() => onSelectMode('selectHealList')} aria-label="回復魔法 - 回復魔法を選択する">回復魔法</button>
        <button onClick={() => onSelectMode('selectItem')} aria-label="道具 - 道具を使用する">道具</button>
        <button onClick={onRun} aria-label="逃げる - 戦闘から逃走する">逃げる</button>
      </div>
    );
  }

  if (mode === 'selectSkill') {
    return (
      <div className="cmds onecol" role="group" aria-label="必殺技選択">
        <div style={{textAlign:'center',opacity:0.8}} role="heading" aria-level={3}>必殺技一覧（失敗すると攻撃をミス）</div>
        {skills.map((s) => (
          <button
            key={s.key}
            onClick={() => onActivateSkillOrMagic(s)}
            aria-label={`${s.name} ランク${s.rank}${s.mp ? ` 消費MP${s.mp}` : ''}`}
          >
            {s.name}（R{s.rank}{s.mp ? ` / ${s.mp}MP` : ''}）
          </button>
        ))}
        <button onClick={() => onSelectMode('select')} aria-label="もどる - コマンド選択に戻る">← もどる</button>
      </div>
    );
  }

  if (mode === 'selectFireList') {
    return (
      <div className="cmds onecol" role="group" aria-label="攻撃魔法選択">
        <div style={{textAlign:'center',opacity:0.8}} role="heading" aria-level={3}>攻撃魔法一覧</div>
        {fireList.map((s) => (
          <button
            key={s.key}
            onClick={() => onActivateSkillOrMagic(s)}
            aria-label={`${s.name} ランク${s.rank} 消費MP${s.mp}`}
          >
            {s.name}（R{s.rank} / {s.mp}MP）
          </button>
        ))}
        <button onClick={() => onSelectMode('select')} aria-label="もどる - コマンド選択に戻る">← もどる</button>
      </div>
    );
  }

  if (mode === 'selectHealList') {
    return (
      <div className="cmds onecol" role="group" aria-label="回復魔法選択">
        <div style={{textAlign:'center',opacity:0.8}} role="heading" aria-level={3}>回復魔法一覧</div>
        {healList.map((s) => (
          <button
            key={s.key}
            onClick={() => onActivateSkillOrMagic(s)}
            aria-label={`${s.name} ランク${s.rank} 消費MP${s.mp}`}
          >
            {s.name}（R{s.rank} / {s.mp}MP）
          </button>
        ))}
        <button onClick={() => onSelectMode('select')} aria-label="もどる - コマンド選択に戻る">← もどる</button>
      </div>
    );
  }

  if (mode === 'selectItem') {
    return (
      <div className="cmds onecol" role="group" aria-label="道具選択">
        {player.items.map((it, idx) => (
          <button
            key={idx}
            disabled={(it.qty || 0) <= 0}
            onClick={() => onUseItem(idx)}
            aria-label={`${it.name} 残り${it.qty}個`}
          >
            どうぐ：{it.name} ×{it.qty}
          </button>
        ))}
        <button onClick={() => onSelectMode('select')} aria-label="もどる - コマンド選択に戻る">← もどる</button>
      </div>
    );
  }

  if (mode === "queue") {
    return null;
  }

  if (mode === "victory") {
    return (
      <div className="cmds onecol" role="group" aria-label="戦闘終了">
        <button onClick={onLogClick} aria-label="続ける - 次に進む">▶ 続ける</button>
      </div>
    );
  }

  // Default mode ("other")
  return (
    <div className="cmds onecol" role="group" aria-label="ログ進行">
      <button onClick={onAdvanceLog} aria-label="次へ - ログを進める">▶ 次へ</button>
    </div>
  );
}
