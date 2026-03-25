"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from 'next/image';
import { ENEMY_POOL, BOSS_POOL, ENEMY_NAMES, Enemy } from "./lib/enemies";
import { Player, Weapon, Armor, Tool, Difficulty } from './lib/gameTypes';
import UiScaler from "./components/UiScaler";
import Topbar from "./components/Topbar";
import PadOverlay from "./components/PadOverlay";
import { clamp, computeFirstRunLayout } from "./lib/uiLayout";

/**
 * DragonQuest-like RPG × NUMTRAIN Battle (Single-file, React/TSX)
 * - Scenes: Title / Map / Battle / Result
 * - Overlays: Settings, HowTo, Menu, Town(Shop/Inn), Bestiary
 * - Save/Load: localStorage ("dq_like_brain_v1")
 * - Difficulty: easy / normal / hard
 * - Battle Quiz Types (current): SUM / MISSING / COMPARE / PAIR / ORDER / MAX_MIN (EVEN_ODDは現在出題しない)
 *   Removed types / 詳細履歴は CHANGELOG.md を参照
 * - D-Pad overlay (anchor/size/opacity)
 * - No external deps
 */

/* -------------------- Types -------------------- */
type Scene = "title" | "map" | "battle" | "result";

type Tile = 0 | 1 | 2 | 3 | 4 | 5; // 0草 1壁 2水 3町 4洞窟 5城
const T = { Grass: 0, Wall: 1, Water: 2, Town: 3, Cave: 4, Castle: 5 } as const;

type Vec = { r: number; c: number };

// Player/Weapon/Armor/Tool/Difficulty moved to lib/gameTypes.ts

type AreaInfo = {
  id: number;
  name: string;
  description: string;
  map: Tile[][];
  startPos: Vec;
  bossName: string;
  bossPos: Vec;
  bossDefeated: boolean;
  mainline?: boolean;
  optionalUnlockAfterAreaId?: number;
  story: {
    intro: string;
    bossEncounter: string;
    victory: string;
  };
};

type SaveData = {
  player: Player;
  settings: any;
  dex: any;
  meta: { saveDate: number; playTime: number; version: string };
};


type BattleState = {
  enemy: Enemy;
  log: string[];
  queue: string[];
  mode: "select" | "selectSkill" | "selectFireList" | "selectHealList" | "selectItem" | "quiz" | "queue" | "victory";
  quiz?: QuizBundle | null;
  rewards?: { exp: number; gold: number; timeBonus?: number; levelUp?: { oldLv: number; newLv: number; hpGain: number; mpGain: number; atkGain: number; defGain: number }, levelUpDetails?: { fromLv: number; toLv: number; hp: number; mp: number; atk: number; def: number }[] } | null;
  quizStats: { total: number; correct: number; totalTime: number };
  onVictory?: () => void;
};

type PadAnchor = "tl" | "tr" | "bl" | "br" | "tc" | "bc" | "tcl" | "tcr" | "bcl" | "bcr";

type Settings = {
  difficulty: Difficulty;
  encounterRate: number; // %
  avatar: Player["avatar"];
  tileSize: number; // UIスケール（タイルサイズpx）
  pad: { show: boolean; anchor: PadAnchor; size: number; sizePct: number; opacity: number; pos?: { x: number; y: number }; collapsed?: boolean; floating?: boolean };
  statusOverlay: { show: boolean; anchor: PadAnchor; size: number; opacity: number; pos?: { x: number; y: number }; collapsed?: boolean; floating?: boolean };
  bottomBar: { auto: boolean; height: number }; // 画面下の専用領域設定
  hardQuizRandom: boolean; // 通常行動でランダム高難度問題を出すか
};

// Valid anchors helper for robust defaulting/validation when merging older saves
const PAD_ANCHORS: PadAnchor[] = [
  "tl", "tr", "bl", "br", "tc", "bc", "tcl", "tcr", "bcl", "bcr"
];
const isPadAnchor = (x: any): x is PadAnchor => PAD_ANCHORS.includes(x);

// 既存/旧バージョンのセーブから安全に設定を組み立てる
function mergeSettings(raw: any): Settings {
  const difficulty: Difficulty = raw?.difficulty ?? "normal";
  const encounterRate: number = raw?.encounterRate ?? 14;
  const avatar: Player["avatar"] = raw?.avatar ?? "🦸‍♀️";
  // tileSizeは数値を安全に取り込み、範囲を軽くガード
  const rawTs = Number(raw?.tileSize);
  const tileSize: number = Number.isFinite(rawTs) ? Math.max(20, Math.min(64, rawTs)) : 32;

  const padRaw = raw?.pad ?? {};
  const padAnchor: PadAnchor = isPadAnchor(padRaw.anchor) ? padRaw.anchor : "bcl";
  const padBaseSize = typeof padRaw.size === "number" && isFinite(padRaw.size) ? padRaw.size : 56;
  const padSizePctFromPx = Math.round((padBaseSize / 56) * 100);
  const pad = {
    show: padRaw.show ?? true,
    anchor: padAnchor,
    size: padBaseSize,
    sizePct: typeof padRaw.sizePct === "number" && isFinite(padRaw.sizePct)
      ? Math.max(40, Math.min(200, Math.round(padRaw.sizePct)))
      : Math.max(40, Math.min(200, padSizePctFromPx || 100)),
    opacity: padRaw.opacity ?? 0.9,
    pos: ((): { x: number; y: number } | undefined => {
      const x = Number(padRaw?.pos?.x);
      const y = Number(padRaw?.pos?.y);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
      return undefined;
    })(),
    collapsed: typeof padRaw?.collapsed === "boolean" ? padRaw.collapsed : false,
    floating: typeof padRaw?.floating === "boolean" ? padRaw.floating : true,
  } as Settings["pad"];

  const stRaw = raw?.statusOverlay ?? {};
  const stAnchor: PadAnchor = isPadAnchor(stRaw.anchor) ? stRaw.anchor : "bcr";
  const statusOverlay = {
    show: stRaw.show ?? true,
    anchor: stAnchor,
  size: typeof stRaw.size === "number" && isFinite(stRaw.size) ? Math.max(50, Math.min(150, stRaw.size)) : 100,
    opacity: typeof stRaw.opacity === "number" && isFinite(stRaw.opacity) ? Math.max(0.4, Math.min(1.0, stRaw.opacity)) : 0.95,
    pos: ((): { x: number; y: number } | undefined => {
      const x = Number(stRaw?.pos?.x);
      const y = Number(stRaw?.pos?.y);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
      return undefined;
    })(),
    collapsed: typeof stRaw?.collapsed === "boolean" ? stRaw.collapsed : false,
    floating: typeof stRaw?.floating === "boolean" ? stRaw.floating : true,
  } as Settings["statusOverlay"];

  // linkSizes 廃止
  const hardQuizRandom: boolean = typeof raw?.hardQuizRandom === "boolean" ? raw.hardQuizRandom : true;
  const bottomBar = {
    auto: typeof raw?.bottomBar?.auto === "boolean" ? raw.bottomBar.auto : true,
    height: ((): number => {
      const v = Number(raw?.bottomBar?.height);
      if (!Number.isFinite(v)) return 120;
      return clamp(Math.round(v), 80, 260);
    })()
  };

  return { difficulty, encounterRate, avatar, tileSize, pad, statusOverlay, bottomBar, hardQuizRandom };
}

/* -------------------- RNG & Utils -------------------- */
import { R, pick, shuffle } from './lib/rng';
import { genSUM, genMISSING, genCOMPARE, genPAIR, genORDER, genEVEN_ODD, genMAX_MIN, makeQuizPack } from './lib/quiz/generators';

/* -------------------- Equipment / Shop -------------------- */
const WEAPONS: Weapon[] = [
  { name: "木の杖", atk: 2, price: 20 },
  { name: "竹の杖", atk: 3, price: 40 },
  { name: "銅の杖", atk: 4, price: 60 },
  { name: "鉄の杖", atk: 6, price: 100 },
  { name: "銀の杖", atk: 7, price: 140 },
  { name: "金の杖", atk: 9, price: 200 },
  { name: "賢者の杖", atk: 11, price: 260 },
  { name: "英雄の杖", atk: 14, price: 420 },
  { name: "伝説の杖", atk: 18, price: 800 },
];

// 最強（ショップには並ばない特別報酬）
const ULTIMATE_WEAPON: Weapon = { name: "勇者の聖杖", atk: 26, price: 0 };

const ARMORS: Armor[] = [
  { name: "布の服", def: 1, price: 15 },
  { name: "麻の服", def: 2, price: 30 },
  { name: "皮の服", def: 3, price: 50 },
  { name: "青銅の法衣", def: 5, price: 90 },
  { name: "銀の法衣", def: 6, price: 120 },
  { name: "金の法衣", def: 8, price: 180 },
  { name: "賢者の法衣", def: 10, price: 240 },
  { name: "英雄の法衣", def: 13, price: 400 },
  { name: "伝説の法衣", def: 18, price: 780 },
];

// 最強（ショップには並ばない特別報酬）
const ULTIMATE_ARMOR: Armor = { name: "光の聖衣", def: 24, price: 0 };

const TOOLS: Tool[] = [
  { name: "やくそう", effect: "heal", amount: 24, price: 20 },
  { name: "マナ草", effect: "mp", amount: 8, price: 25 },
];

const INN_PRICE = 15;


/* -------------------- Player & Progress -------------------- */
import { nextExpFor } from './lib/battle/xp';
import { effATK, effDEF } from './lib/battle/stats';
import { applyExpGold } from './lib/battle/flow';

/* -------------------- Maps & Story -------------------- */
const ROWS = 9, COLS = 13;
// Grid visual metrics (keep in sync with CSS .grid)
const GRID_GAP_PX = 2;      // .grid gap
const GRID_PADDING_PX = 8;  // .grid padding (each side)

function createMap(config: { 
  waterPattern?: 'river' | 'lake' | 'none';
  wallPositions?: Vec[];
  townPos?: Vec;
  cavePos?: Vec;
  castlePos?: Vec;
}): Tile[][] {
  const g: Tile[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => T.Grass));
  
  // borders
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) g[r][c] = T.Wall;
  }
  
  // water patterns
  if (config.waterPattern === 'river') {
    for (let r = 2; r < ROWS - 2; r++) g[r][4] = T.Water;
  } else if (config.waterPattern === 'lake') {
    for (let r = 3; r < 6; r++) for (let c = 5; c < 8; c++) g[r][c] = T.Water;
  }
  
  // special tiles
  if (config.townPos) g[config.townPos.r][config.townPos.c] = T.Town;
  if (config.cavePos) g[config.cavePos.r][config.cavePos.c] = T.Cave;
  if (config.castlePos) g[config.castlePos.r][config.castlePos.c] = T.Castle;
  
  // custom walls
  config.wallPositions?.forEach(({ r, c }) => { g[r][c] = T.Wall; });
  
  return g;
}

// エリア7: 四聖獣の出現座標（分散配置）
const GUARDIANS_A7 = {
  genbu:  { r: 2, c: 10 }, // 北東
  seiryu: { r: 2, c: 4 },  // 北西
  suzaku: { r: 6, c: 4 },  // 南西
  byakko: { r: 6, c: 10 }  // 南東
} as const;

const AREAS: AreaInfo[] = [
  {
    id: 1,
    name: "草原の村",
    description: "平和な草原地帯。冒険の始まりの地。",
    map: createMap({ 
      waterPattern: 'river', 
      townPos: { r: 2, c: 2 },
      cavePos: { r: 6, c: 10 },
      wallPositions: [{ r: 4, c: 7 }, { r: 5, c: 7 }]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "巨大スライム",
    bossPos: { r: 6, c: 10 },
    bossDefeated: false,
    story: {
      intro: "🌱 草原の村へようこそ、若き勇者よ。\n\n村長：「最近、洞窟から巨大なスライムが現れて\n村人たちを襲っているのじゃ...\n魔物退治の経験を積むには良い機会かもしれん。\n頼んだぞ、勇者！」\n\n【クリア条件】洞窟の奥にいる「巨大スライム」を倒す",
      bossEncounter: "🟢👑 洞窟の最深部...\n\n巨大スライムが姿を現した！\n「ぐにゅぐにゅ...ここは我が縄張り！\n侵入者は許さない！」\n\nいよいよ、草原の村を救う戦いが始まる！",
      victory: "🎉 巨大スライムを倒した！\n\n村長：「やったぞ！村に平和が戻った！\nお主こそ真の勇者じゃ！」\n\n村人たちの歓声が響き渡る。\nしかし、世界にはまだ多くの脅威が...\n\n次の目的地：深い森\n（より強力な魔物が待ち受けている）"
    }
  },
  {
    id: 2,
    name: "深い森",
    description: "うっそうとした森。オークたちが支配している。",
    map: createMap({ 
      waterPattern: 'none',
      townPos: { r: 2, c: 2 },
      cavePos: { r: 6, c: 6 },
      castlePos: { r: 2, c: 10 },
      wallPositions: [{ r: 3, c: 4 }, { r: 4, c: 4 }, { r: 5, c: 4 }, { r: 4, c: 8 }]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "オークキング",
    bossPos: { r: 2, c: 10 },
    bossDefeated: false,
    story: {
      intro: "🌳 深い森に足を踏み入れた。\n\n森の精霊：「勇者よ、警告する。\nこの森はオークたちに占拠されている。\nその王、オークキングは残忍で強大だ。\n彼を倒さぬ限り、先へは進めぬ。」\n\n【クリア条件】城で「オークキング」を倒す",
      bossEncounter: "👹👑 城の王座の間...\n\nオークキング：「グオオオ！\nよくぞ我が城まで来たな、人間ども！\nだが、貴様らが我らオーク族に\n勝てると思うな！」\n\n森を解放するための戦いが始まる！",
      victory: "🎉 オークキングを倒した！\n\nオークキング：「くっ...まさか...\nこれほどの強者が...」\n\n森の精霊：「感謝する。森が解放された。\nだが、これから先はさらに危険だ。\n気をつけるのだ...」\n\n次の目的地：暗黒の洞窟"
    }
  },
  {
    id: 3,
    name: "暗黒の洞窟",
    description: "暗く深い洞窟。強力な魔物が潜む。",
    map: createMap({ 
      waterPattern: 'lake',
      townPos: { r: 2, c: 2 },
      castlePos: { r: 6, c: 10 },
      wallPositions: [
        { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 5, c: 5 }, { r: 6, c: 5 },
        { r: 3, c: 9 }, { r: 4, c: 9 }, { r: 5, c: 9 }
      ]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "洞窟の主",
  bossPos: { r: 6, c: 10 },
  bossDefeated: false,
    story: {
      intro: "🕳️ 暗黒の洞窟へようこそ...\n\n旅人：「この洞窟の奥には、\n古代から眠る「洞窟の主」がいるという。\n数百年も生き続ける魔物で、\n多くの勇者が挑んでは敗れ去った...\nおまえも気をつけろ。」\n\n【クリア条件】城で「洞窟の主」を倒す",
      bossEncounter: "🦖👑 洞窟の最深部では...\n\n地鳴りのような咆哮が響き渡る！\n\n洞窟の主：「グオオオオオ！！\n何百年ぶりか...我を起こしたのは誰だ！\nその罰、その身で受けるがいい！」\n\n伝説の魔物との戦い！",
      victory: "🎉 洞窟の主を倒した！\n\n洞窟の主：「まさか...このわしが...\n貴様、真の勇者であったか...」\n\n洞窟が静かになる。\n先へ進むと、火山地帯が見えてきた。\n熱気が伝わってくる...\n\n次の目的地：火山地帯"
    }
  },
  {
    id: 4,
    name: "火山地帯",
    description: "灼熱の火山。炎の魔物が住む危険な場所。",
    map: createMap({ 
      waterPattern: 'none',
      townPos: { r: 2, c: 2 },
      cavePos: { r: 6, c: 6 },
      castlePos: { r: 2, c: 10 },
      wallPositions: [
        { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }
      ]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "炎龍ヴォルカノ",
    bossPos: { r: 2, c: 10 },
    bossDefeated: false,
    story: {
      intro: "🌋 灼熱の火山地帯に到着した。\n\n火山の賢者：「よくぞここまで来た。\nこの火山には炎龍ヴォルカノが棲んでいる。\n古からこの地を支配し、\nその炎ですべてを焼き尽くす魔龍だ。\n並大抵の力では挑めぬぞ。」\n\n【クリア条件】城で「炎龍ヴォルカノ」を倒す",
      bossEncounter: "🐲👑 火山の火口付近では...\n\n地鳴りとともに、巨大な影が！\n\n炎龍ヴォルカノ：「グルルルルル！！\n人間どもが我が領域に足を踏み入れるとは！\n貴様らを炎で焼いてやる！」\n\n伝説の炎龍との決戦！",
      victory: "🎉 炎龍ヴォルカノを倒した！\n\nヴォルカノ：「グルル...まさか、\nこのわしが敗れるとは...」\n\n火山の賢者：「やったな！\n火山の炎が収まっていく...\nだが、最後の試練が待っている。\n気を引き締めていけ！」\n\n次の目的地：氷の大地"
    }
  },
  {
    id: 5,
    name: "氷の大地",
    description: "永遠の冬に閉ざされた氷の世界。",
    map: createMap({ 
      waterPattern: 'lake',
      townPos: { r: 2, c: 2 },
      cavePos: { r: 6, c: 6 },
      castlePos: { r: 2, c: 10 },
      wallPositions: [
        { r: 3, c: 4 }, { r: 4, c: 5 }, { r: 5, c: 4 }, { r: 4, c: 9 }
      ]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "氷帝フリーザー",
    bossPos: { r: 2, c: 10 },
    bossDefeated: false,
    story: {
      intro: "❄️ 氷の大地に足を踏み入れた。\n\n氷の巫女：「この地は永遠の冬に閉ざされている。\n氷帝フリーザーの力によって...\n彼を倒さねば、魔王城への道は開かぬ。\nこれが最後から二番目の試練だ...」\n\n【クリア条件】城で「氷帝フリーザー」を倒す",
      bossEncounter: "❄️👑 氷の城では...\n\n凍てつくような寒気が満ちている。\n\n氷帝フリーザー：「よくぞここまで来たな。\nだが、ここが貴様の墓場だ。\nこの世界を永遠の氷で閉ざし、\n貴様もその一部としてやろう...」\n\n氷帝との決戦！",
      victory: "🎉 氷帝フリーザーを倒した！\n\nフリーザー：「まさか...わたしが...\n貴様は...真の勇者だ...」\n\n氷の巫女：「やった！氷が溶けていく！\nそして、見えるか？\nあれが魔王城だ...\nいよいよ最後の戦いだ。気をつけて！」\n\n次の目的地：魔王城（最終決戦）"
    }
  },
  {
    id: 6,
    name: "魔王城",
    description: "全ての元凶、魔王の居城。最後の戦いが待つ。",
    map: createMap({ 
      waterPattern: 'none',
      townPos: { r: 2, c: 2 },
      castlePos: { r: 6, c: 10 },
      wallPositions: [
        { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 }, { r: 6, c: 6 },
        { r: 4, c: 4 }, { r: 4, c: 8 }
      ]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "魔王ダークロード",
    bossPos: { r: 6, c: 10 },
    bossDefeated: false,
    story: {
      intro: "🏰 ついに魔王城に到達した。\n\n光の精霊：「よくぞここまで来た。\nこの城には、この世界を闇に閉ざそうとする\n魔王ダークロードがいる。\n彼を倒さねば、世界に平和は訪れぬ。\nこれが最後の戦いだ。勝利を祈る。」\n\n【クリア条件】城で「魔王ダークロード」を倒す",
      bossEncounter: "😈👑 魔王城、玉座の間...\n\n闇のオーラが渦巻いている。\n\n魔王ダークロード：「ハッハッハ！\nよくぞここまで来た。\n貴様の旅もここで終わりだ。\nわたしの闇の力、とくと見るがいい！」\n\n運命を懸けた最後の戦い！",
      victory: "🎉🎉🎉 魔王ダークロードを倒した！\n\nダークロード：「まさか...このわたしが...\n貴様は...本当の勇者だ...」\n\n闇が晴れ、光が世界を照らす！\n\n光の精霊：「やった！世界に平和が戻った！\nおめでとう、勇者よ！\nあなたの名は永遠に語り継がれるだろう！」\n\n★★★ 全エリアクリア！ ★★★\nおめでとうございます！"
    }
  }
  ,
  // 任意で行ける最終試練（解放条件: 6をクリア済み）
  {
    id: 7,
    name: "試練の塔",
    description: "最後の方で任意で挑める秘匿の塔。四聖獣に挑み、究極の報酬を得よ。",
    map: createMap({
      waterPattern: 'none',
      townPos: { r: 2, c: 2 },
      castlePos: { r: 6, c: 10 },
      wallPositions: [
        { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 5, c: 4 },
        { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }
      ]
    }),
    startPos: { r: 2, c: 2 },
  bossName: "四聖獣の祝福",
    bossPos: { r: 6, c: 10 },
    bossDefeated: false,
    mainline: false,
    optionalUnlockAfterAreaId: 6,
    story: {
      intro: "🗼 伝説の試練の塔に辿り着いた…\n\n四聖獣は敵ではない。虚空の王を討ち滅ぼせる者を待ち続け、\nその者に祝福を授けるための『試練』を与えるという。\n\n四方に散る玄武・青龍・朱雀・白虎のもとへ赴き、試練を受けよ。\nそのすべてを越えた先に、『祝福』と『扉』は開かれる。\n\n【挑戦条件】魔王城クリア後に開放。四体すべての試練達成で報酬獲得",
      bossEncounter: "⛩️ 四聖獣の一体が静かに立ちはだかる。\n『力を見せよ──試練を越え、祝福を受けよ。』",
      victory: "🎉 四聖獣の試練をすべて越えた！\n\n『見事…これは約束の祝福。』\n\n最強の武器『勇者の聖杖』、最強の防具『光の聖衣』を得た！\nさらに、究極の必殺技『オーロラ・インパクト』と究極の魔法『コスモフレア』が解放された！"
    }
  },
  // 裏ボス（解放条件: 7をクリア済み）
  {
    id: 8,
    name: "虚空の間",
    description: "全てを越えた者のみが辿り着ける、裏の最終決戦の間。",
    map: createMap({
      waterPattern: 'none',
      townPos: { r: 2, c: 2 },
      castlePos: { r: 6, c: 10 },
      wallPositions: [ { r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 } ]
    }),
    startPos: { r: 2, c: 2 },
    bossName: "虚空の王",
    bossPos: { r: 6, c: 10 },
    bossDefeated: false,
    mainline: false,
    optionalUnlockAfterAreaId: 7,
    story: {
      intro: "🌌 深淵の裂け目の先に、虚空が揺らめいている…\n\n声なき声：『真なる強者よ、最後の扉へ』",
      bossEncounter: "🕳️👑 虚空の中心に王が現れた。『すべてを捨てよ』",
      victory: "🎉 虚空の王を打ち倒した！ 世界は静謐に包まれた…"
    }
  }
];

const MAP = AREAS[0].map; // デフォルトマップ

/* -------------------- Save/Load -------------------- */
const SAVE_KEY_PREFIX = "dq_like_brain_v2_slot_";
const MAX_SAVE_SLOTS = 3;
const FIRST_RUN_LAYOUT_DEFAULTS = "dq_like_first_layout_defaults_v1";

// 破損した旧ロード断片は削除（loadSaveを使用）


function saveToSlot(slot: number, data: SaveData) {
  try {
    const saveData: SaveData = {
      ...data,
      meta: {
        saveDate: Date.now(),
        playTime: data.meta?.playTime || 0,
        version: "2.0"
      }
    };
    localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
    return true;
  } catch {
    return false;
  }
}

function loadFromSlot(slot: number): SaveData | null {
  try {
    const s = localStorage.getItem(SAVE_KEY_PREFIX + slot);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function getAllSaveSlots(): (SaveData | null)[] {
  const slots: (SaveData | null)[] = [];
  for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
    slots.push(loadFromSlot(i));
  }
  return slots;
}

function deleteSaveSlot(slot: number) {
  try {
    localStorage.removeItem(SAVE_KEY_PREFIX + slot);
    return true;
  } catch {
    return false;
  }
}

function exportSaveData(data: SaveData): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rpg-brain-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed:", e);
  }
}

function importSaveData(file: File, callback: (data: SaveData | null) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      callback(data);
    } catch {
      callback(null);
    }
  };
  reader.readAsText(file);
}

/* -------------------- Quiz (NUMTRAIN風) -------------------- */
import { QuizType, Quiz, Scratch, QuizBundle, quizBaseByDifficulty, Chip } from './lib/quiz/types';
import { isHardQuiz } from './lib/quiz/difficulty';


function checkAnswer(q: Quiz, sc: Scratch) {
  if (q.checkFn) return q.checkFn(sc);
  if (q.type === "COMPARE" || q.type === "EVEN_ODD") return false;
  if (q.type === "PAIR") return sc.sel.length === 2 && String(sc.sel[0].value + sc.sel[1].value) === q.answer;
  if (q.type === "MAX_MIN") return sc.sel.length === 1 && String(sc.sel[0].value) === q.answer;
  if (q.type === "ORDER") {
    // genORDER側のcheckFnを優先するが、fallbackとしてjson比較も保持
    try {
      const arr = JSON.parse(q.answer || '[]');
      return Array.isArray(arr) && sc.seq.length === arr.length && sc.seq.every((v, i) => v === arr[i]);
    } catch {
      return false;
    }
  }
  return String(sc.val).trim() === q.answer.trim();
}

// 難問検出（クイズ内容から大まかな難易度の高さを推定）
// isHardQuiz moved to ./lib/quiz/difficulty

/* -------------------- Component -------------------- */
export default function DQBrain() {
  /* ---- states ---- */
  const [topStatusExpanded, setTopStatusExpanded] = useState(false);
  const [padObscured, setPadObscured] = useState(false);
  const [padHasDragged, setPadHasDragged] = useState(false);
  const topStatusDetailRef = useRef<HTMLDivElement | null>(null);
  const padWrapRef = useRef<HTMLDivElement | null>(null);
  const [scene, setScene] = useState<Scene>("title");
  const [settings, setSettings] = useState<Settings>(() => ({
    difficulty: "normal",
    encounterRate: 14,
  avatar: "🦸‍♀️",
    tileSize: 32,
    pad: { show: true, anchor: "bcl", size: 56, sizePct: 100, opacity: 0.9, pos: { x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 220 : 420 }, collapsed: false, floating: false },
    statusOverlay: { show: true, anchor: "bcr", size: 100, opacity: 0.95, pos: { x: typeof window !== 'undefined' ? (window.innerWidth - 220) : 540, y: typeof window !== 'undefined' ? (window.innerHeight - 220) : 420 }, collapsed: false, floating: true },
  // linkSizes 廃止
    bottomBar: { auto: true, height: 120 },
    hardQuizRandom: true
  }));
  const [player, setPlayer] = useState<Player>(() => ({
    name: "ユウシャ",
  avatar: settings.avatar,
    lv: 1,
    exp: 0,
    gold: 40,
    maxHP: 40, hp: 40,
    maxMP: 12, mp: 12,
    baseATK: 3, baseDEF: 2,
    equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
  items: [{ ...TOOLS[0], qty: 2 }, { ...TOOLS[1], qty: 1 }],
  keyItems: [],
    pos: { r: 4, c: 2 },
    currentArea: 1,
    clearedAreas: [],
    storyShownAreas: []
    ,
    flags: {
      ultimateUnlocked: false,
      ultimateMagicUnlocked: false,
      genbuDefeated: false,
      seiryuDefeated: false,
      suzakuDefeated: false,
      byakkoDefeated: false
    }
  }));
  const [dex, setDex] = useState<Record<string, { seen: number; defeated: number }>>({});
  // ステータス展開時のPad重なり検知
  useEffect(() => {
    function checkOverlap() {
      if (!topStatusExpanded) { setPadObscured(false); return; }
      const a = topStatusDetailRef.current?.getBoundingClientRect();
      const b = padWrapRef.current?.getBoundingClientRect();
      if (!a || !b) { setPadObscured(false); return; }
      const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      setPadObscured(overlap);
    }
    checkOverlap();
    const onResize = () => checkOverlap();
    window.addEventListener('resize', onResize);
    const t = setTimeout(checkOverlap, 0);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [topStatusExpanded, settings.tileSize, player.hp, player.mp, player.lv]);
  // スキル/魔法の習得状況
  type Skill = { key: string; name: string; rank: 1|2|3; mp?: number; type: 'skill'|'fire'|'heal'; power: number; };
  const ALL_SKILLS: Skill[] = [
    { key: 'power-strike', name: '渾身斬り', rank: 1, type: 'skill', power: 1.3, mp: 0 },
    { key: 'double-slash', name: '二連斬り', rank: 2, type: 'skill', power: 1.6, mp: 0 },
    { key: 'meteor-strike', name: 'メテオ斬', rank: 3, type: 'skill', power: 2.1, mp: 0 },
    { key: 'fire', name: 'ファイア', rank: 1, type: 'fire', power: 1.5, mp: 4 },
    { key: 'flame', name: 'フレイム', rank: 2, type: 'fire', power: 1.9, mp: 6 },
    { key: 'inferno', name: 'インフェルノ', rank: 3, type: 'fire', power: 2.4, mp: 8 },
    { key: 'heal', name: 'ヒール', rank: 1, type: 'heal', power: 0, mp: 3 },
    { key: 'heal-more', name: 'ベホイム', rank: 2, type: 'heal', power: 0, mp: 6 },
    { key: 'heal-all', name: 'ベホマ', rank: 3, type: 'heal', power: 0, mp: 9 },
  ];
  // 究極スキル/魔法（任意ステージクリアで解放）
  const ULTIMATE_SKILL: Skill = { key: 'ultimate-aurora', name: 'オーロラ・インパクト', rank: 3, type: 'skill', power: 3.2, mp: 0 };
  const ULTIMATE_MAGIC: Skill = { key: 'ultimate-cosmos', name: 'コスモフレア', rank: 3, type: 'fire', power: 3.0, mp: 10 };
  const skillsByType = (t: Skill['type']) => ALL_SKILLS.filter(s => s.type === t);
  const learned = (lv: number): { skill: Skill[]; fire: Skill[]; heal: Skill[] } => {
    // 初期は各系統 Rank1 を1つずつ。Lv5/10でRank2, Rank3を解放
    const rank = lv >= 10 ? 3 : lv >= 5 ? 2 : 1;
    const pickRank = (t: Skill['type']) => skillsByType(t).filter(s => s.rank <= rank)
      .sort((a, b) => a.rank - b.rank).slice(0, rank); // 系統ごとに最大rank個
    return { skill: pickRank('skill'), fire: pickRank('fire'), heal: pickRank('heal') };
  };
  // フラグに応じて究極スキルを付与
  const learnedWithUltimate = (lv: number, skillUnlocked: boolean | undefined, magicUnlocked: boolean | undefined): { skill: Skill[]; fire: Skill[]; heal: Skill[] } => {
    const base = learned(lv);
    return {
      skill: skillUnlocked ? [...base.skill, ULTIMATE_SKILL] : base.skill,
      fire: magicUnlocked ? [...base.fire, ULTIMATE_MAGIC] : base.fire,
      heal: base.heal,
    };
  };
  // tileSizeはsettingsに統合
  const [playTime, setPlayTime] = useState(0); // プレイ時間（秒）
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  const [toasts, setToasts] = useState<string[]>([]);
  const addToast = (t: string) => {
    setToasts(s => [...s, t]);
    setTimeout(() => setToasts(s => s.slice(1)), 1800);
  };

  // Overlays
  const [showMenu, setShowMenu] = useState(false);
  const [showTown, setShowTown] = useState<null | "menu" | "weapon" | "tool" | "inn">(null);
  const [showDex, setShowDex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"rpg" | "brain">("rpg");
  const [showHowto, setShowHowto] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);

  // Battle
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [enemyImageError, setEnemyImageError] = useState(false);
  const [quizCombo, setQuizCombo] = useState(0);
  const [battleAnim, setBattleAnim] = useState<{ type: string; value?: number } | null>(null);
  const enemyPanelRef = useRef<HTMLDivElement | null>(null);
  
  // Story & Area
  const [showStory, setShowStory] = useState<string | null>(null);
  const currentAreaInfo = AREAS.find(a => a.id === player.currentArea) || AREAS[0];
  const currentMap = currentAreaInfo.map;

  // バトル背景（画像版）: エリア別に背景画像を切り替え（存在しない場合はグラデでフォールバック）
  const battleBgImage: Record<number, string> = {
    1: '/images/backgrounds/plains.png',
    2: '/images/backgrounds/forest.png',
    3: '/images/backgrounds/cave.png',
    4: '/images/backgrounds/volcano.png',
    5: '/images/backgrounds/ice.png',
    6: '/images/backgrounds/castle.png',
    7: '/images/backgrounds/tower.png',
    8: '/images/backgrounds/void.png',
    9: '/images/backgrounds/bossroom.png',
  };
  const battleBgFallback: Record<number, string> = {
    1: 'linear-gradient(180deg, #c8f7c5 0%, #9be7a3 100%)',
    2: 'linear-gradient(180deg, #98c379 0%, #2e7d32 100%)',
    3: 'linear-gradient(180deg, #616161 0%, #212121 100%)',
    4: 'linear-gradient(180deg, #ff7043 0%, #bf360c 100%)',
    5: 'linear-gradient(180deg, #e3f2fd 0%, #90caf9 100%)',
    6: 'linear-gradient(180deg, #b39ddb 0%, #4527a0 100%)',
    7: 'linear-gradient(180deg, #f0e68c 0%, #c5b358 100%)',
    8: 'linear-gradient(180deg, #2d2d2d 0%, #000000 100%)',
  };
  const bgImg = battleBgImage[player.currentArea];
  // 多重背景: グラデ＋画像（画像がなくてもグラデは常時表示）
  const battlePanelBgStyle: React.CSSProperties = {
    // 画像を最前面、その下にグラデーション（順序が重要）
    backgroundImage: bgImg
      ? `url(${bgImg}), ${battleBgFallback[player.currentArea] || 'linear-gradient(180deg, #eceff1 0%, #cfd8dc 100%)'}`
      : `${battleBgFallback[player.currentArea] || 'linear-gradient(180deg, #eceff1 0%, #cfd8dc 100%)'}`,
    backgroundSize: bgImg ? 'cover, cover' : 'cover',
    backgroundRepeat: bgImg ? 'no-repeat, no-repeat' : 'no-repeat',
    backgroundPosition: bgImg ? 'center, center' : 'center',
    borderRadius: 18,
    boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
  aspectRatio: '1 / 1',
  width: '100%',
  maxWidth: 480,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  position: 'relative',
  padding: '24px 12px 18px 12px',
  };

  /* ---- effects ---- */
  // プレイ時間の計測
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 敵が切り替わったら画像エラーフラグをリセット
  useEffect(() => {
    setEnemyImageError(false);
  }, [battle?.enemy?.imageUrl, battle?.enemy?.name]);

  useEffect(() => {
    const s = loadSave();
    if (s) {
      // 旧バージョンとの互換性を確保
      const loadedPlayer = {
        ...s.player,
        currentArea: s.player.currentArea || 1,
        clearedAreas: s.player.clearedAreas || [],
        storyShownAreas: s.player.storyShownAreas || []
      };
      setPlayer(loadedPlayer);
      // セーブデータから安全に設定を復元
      setSettings(mergeSettings(s.settings));
      setDex(s.dex);
      
    }
    // ライブ設定があればセーブ設定に上書きマージ
    try {
      const liveStr = localStorage.getItem('dq_live_settings_v2');
      if (liveStr) {
        const live = JSON.parse(liveStr);
        setSettings(prev => mergeSettings({ ...prev, ...live }));
      }
    } catch {}
  }, []);

  // 設定の変更をライブ保存（位置・サイズ・タイルサイズ）
  useEffect(() => {
    try {
      // 参照は必要なキーのみに限定し、オブジェクト全体をspreadしないことで
      // exhaustive-depsの警告(親オブジェクト参照)を回避
      const partial = {
        pad: {
          pos: settings.pad.pos,
          sizePct: settings.pad.sizePct,
        },
        statusOverlay: {
          pos: settings.statusOverlay.pos,
          size: settings.statusOverlay.size,
        },
        tileSize: settings.tileSize,
      } as const;
      localStorage.setItem('dq_live_settings_v2', JSON.stringify(partial));
    } catch {}
  }, [settings.pad.pos, settings.pad.sizePct, settings.statusOverlay.pos, settings.statusOverlay.size, settings.tileSize]);

  // 初回起動のレイアウトデフォルト（デバイスに合わせたサイズ・位置、重なり回避）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const done = localStorage.getItem(FIRST_RUN_LAYOUT_DEFAULTS);
      const hasSave = !!loadSave();
      if (done || hasSave) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isTiny = vw < 360 || vh < 520;
      const isPhone = vw < 520;
      const isTablet = vw >= 520 && vw < 1024;
      const topbarEl = document.querySelector('.topbar') as HTMLElement | null;
      const topbarH = topbarEl ? Math.ceil(topbarEl.getBoundingClientRect().height) : 52;
      const layout = computeFirstRunLayout({
        vw, vh,
        cols: COLS, rows: ROWS,
        gridGap: GRID_GAP_PX, gridPad: GRID_PADDING_PX,
        topbarH, isPhone, isTablet, isTiny,
      });

      setSettings((s) => ({
        ...s,
        pad: {
          ...s.pad,
          anchor: 'bl',
          sizePct: layout.pad.sizePct,
          size: layout.pad.sizePx,
          pos: { x: layout.pad.x, y: layout.pad.y },
          floating: true,
          collapsed: false,
        },
        statusOverlay: {
          ...s.statusOverlay,
          anchor: 'br',
          size: layout.status.size,
          pos: { x: layout.status.x, y: layout.status.y },
          floating: true,
          collapsed: false,
        },
        linkSizes: true,
  tileSize: layout.tileSize > 0 && Number.isFinite(layout.tileSize) ? layout.tileSize : s.tileSize,
      }));

      localStorage.setItem(FIRST_RUN_LAYOUT_DEFAULTS, '1');
    } catch {}
  }, []);

  useEffect(() => {
    setPlayer(p => ({ ...p, avatar: settings.avatar }));
  }, [settings.avatar]);

  // エリア変更時にストーリーを表示（最初の一回のみ）
  useEffect(() => {
    if (scene === "map") {
      const areaCleared = dex[currentAreaInfo.bossName]?.defeated > 0;
      const alreadyShown = player.storyShownAreas.includes(player.currentArea);
      
      if (!areaCleared && !alreadyShown) {
        // 新しいエリアに入った時、まだクリアしていない＆ストーリー未表示の場合
        const timer = setTimeout(() => {
          setShowStory("intro");
          setPlayer(p => ({
            ...p,
            storyShownAreas: [...p.storyShownAreas, p.currentArea]
          }));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [player.currentArea, player.storyShownAreas, scene, currentAreaInfo.bossName, dex]);

  // Keyboard controls (Map & Battle)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (scene === "map") {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") tryMove(-1, 0);
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") tryMove(1, 0);
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") tryMove(0, -1);
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") tryMove(0, 1);
        if (e.key === "m" || e.key === "M") setShowMenu(true);
      } else if (scene === "battle") {
        if (!battle) return;
        if (battle.mode === "select") {
          if (e.key === "f" || e.key === "F") startBrainQuiz("attack");
          if (e.key === "r" || e.key === "R") startBrainQuiz("run");
        }
        // 誤操作防止: Enter/Spaceでのログ送りは無効化（専用ボタンのみ）
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---- helpers ---- */
  const pushLog = (msg: string) => setBattle(b => b ? { ...b, log: [...b.log, msg] } : b);

  const vibrate = (ms: number) => {
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
      (navigator as any).vibrate(ms);
    }
  };

  // 敵の強さを固定にするため、レベル条件を排除して「エリア固定 + ボスか否か」で抽選
  function getAvailableEnemies(_: number, currentArea: number, isBoss: boolean): Enemy[] {
    const pool = isBoss ? BOSS_POOL : ENEMY_POOL;
    return pool.filter(e => (e.area === currentArea) && (isBoss ? e.boss === true : e.boss !== true));
  }

  function startEncounter(tile: Tile) {
    // 通常エンカウントではボスは出現しない（ボスはbossPos専用）
    const isCave = tile === T.Cave || tile === T.Castle;

    // エリア7（四聖獣の試練）とエリア8（裏ボス）は通常エンカウントなし
    // → 試練ポイント接触でのみ戦闘、またはボスポイントのみ
    if (player.currentArea >= 7) {
      return; // ランダム遭遇は発生させない
    }

    const availableEnemies = getAvailableEnemies(0, player.currentArea, false);
    
    let enemy: Enemy | undefined;
    if (availableEnemies.length > 0) {
      const picked = pick(availableEnemies);
      if (picked) enemy = { ...picked };
    } else {
      // フォールバック: 現在エリアに該当する通常敵がいない場合（ボスは除外）
      const fallbackPool = ENEMY_POOL.filter(e => e.boss !== true);
      const localFallback = fallbackPool.filter(e => e.area === player.currentArea || !('area' in e) || e.area == null);
      const pickedLocal = localFallback.length > 0 ? pick(localFallback) : undefined;
      const pickedAny = !pickedLocal ? (fallbackPool.length > 0 ? pick(fallbackPool) : undefined) : undefined;
      const picked = pickedLocal || pickedAny;
      if (picked) enemy = { ...picked };
    }

    if (!enemy) {
      // それでも選べない場合は遭遇をスキップ（安全策）
      return;
    }
    
    const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
    enemy.maxHP = Math.round(enemy.maxHP * dmul);
    enemy.hp = enemy.maxHP;
    enemy.atk = Math.round(enemy.atk * dmul + (isCave ? 2 : 0));
    
    setBattle({ enemy, log: [`${enemy.emoji} ${enemy.name} が あらわれた！`], queue: [], mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 } });
    setScene("battle");
    setDex(d => ({ ...d, [enemy.name]: { seen: (d[enemy.name]?.seen || 0) + 1, defeated: d[enemy.name]?.defeated || 0 } }));
  }

  function tryMove(dr: number, dc: number) {
    // フィールド以外のシーンでは移動を無効化（戦闘中に移動して敵が変わるのを防止）
    if (scene !== "map") return;
    // オーバーレイ表示中は移動させない（町メニュー等が即閉じ/即離脱するのを防止）
    const isAnyOverlayOpen = () => !!(showTown || showMenu || showDex || showSettings || showHowto || showStageSelect || showSaveMenu || showStory);
    if (isAnyOverlayOpen()) return;
    setPlayer(p => {
      const nr = clamp(p.pos.r + dr, 0, ROWS - 1);
      const nc = clamp(p.pos.c + dc, 0, COLS - 1);
      const tile = currentMap[nr][nc];
      if (tile === T.Wall || tile === T.Water) return p;
      const moved: Player = { ...p, pos: { r: nr, c: nc } };

      // エリア7: 四聖獣の試練ポイント接触チェック（分散配置）
      if (p.currentArea === 7) {
        const isAt = (v: {r:number;c:number}) => (nr === v.r && nc === v.c);
        const f = p.flags || {};
        // まだ未試練の対象に触れたら、その四聖獣との試練バトルを開始
        if (isAt(GUARDIANS_A7.genbu) && !f.genbuDefeated) {
          setShowStory("bossEncounter");
          setTimeout(() => {
            const boss = BOSS_POOL.find(b => b.name === "玄武");
            if (boss) {
              const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
              const enemy = { ...boss };
              enemy.maxHP = Math.round(enemy.maxHP * dmul);
              enemy.hp = enemy.maxHP;
              enemy.atk = Math.round(enemy.atk * dmul);
              setBattle({
                enemy,
                log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
                queue: [],
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 },
                onVictory: () => {
                  setPlayer(p => ({
                    ...p,
                    keyItems: p.keyItems.includes("玄武の宝珠") ? p.keyItems : [...p.keyItems, "玄武の宝珠"]
                  }));
                  addToast("玄武の宝珠を手に入れた！");
                }
              });
              setScene("battle");
            }
          }, 200);
          return moved;
        }
        if (isAt(GUARDIANS_A7.seiryu) && !f.seiryuDefeated) {
          setShowStory("bossEncounter");
          setTimeout(() => {
            const boss = BOSS_POOL.find(b => b.name === "青龍");
            if (boss) {
              const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
              const enemy = { ...boss };
              enemy.maxHP = Math.round(enemy.maxHP * dmul);
              enemy.hp = enemy.maxHP;
              enemy.atk = Math.round(enemy.atk * dmul);
              setBattle({
                enemy,
                log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
                queue: [],
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 },
                onVictory: () => {
                  setPlayer(p => ({
                    ...p,
                    keyItems: p.keyItems.includes("青龍の宝玉") ? p.keyItems : [...p.keyItems, "青龍の宝玉"]
                  }));
                  addToast("青龍の宝玉を手に入れた！");
                }
              });
              setScene("battle");
            }
          }, 200);
          return moved;
        }
        if (isAt(GUARDIANS_A7.suzaku) && !f.suzakuDefeated) {
          setShowStory("bossEncounter");
          setTimeout(() => {
            const boss = BOSS_POOL.find(b => b.name === "朱雀");
            if (boss) {
              const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
              const enemy = { ...boss };
              enemy.maxHP = Math.round(enemy.maxHP * dmul);
              enemy.hp = enemy.maxHP;
              enemy.atk = Math.round(enemy.atk * dmul);
              setBattle({
                enemy,
                log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
                queue: [],
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 },
                onVictory: () => {
                  setPlayer(p => ({
                    ...p,
                    keyItems: p.keyItems.includes("朱雀の炎石") ? p.keyItems : [...p.keyItems, "朱雀の炎石"]
                  }));
                  addToast("朱雀の炎石を手に入れた！");
                }
              });
              setScene("battle");
            }
          }, 200);
          return moved;
        }
        if (isAt(GUARDIANS_A7.byakko) && !f.byakkoDefeated) {
          setShowStory("bossEncounter");
          setTimeout(() => {
            const boss = BOSS_POOL.find(b => b.name === "白虎");
            if (boss) {
              const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
              const enemy = { ...boss };
              enemy.maxHP = Math.round(enemy.maxHP * dmul);
              enemy.hp = enemy.maxHP;
              enemy.atk = Math.round(enemy.atk * dmul);
              setBattle({
                enemy,
                log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
                queue: [],
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 },
                onVictory: () => {
                  setPlayer(p => ({
                    ...p,
                    keyItems: p.keyItems.includes("白虎の牙") ? p.keyItems : [...p.keyItems, "白虎の牙"]
                  }));
                  addToast("白虎の牙を手に入れた！");
                }
              });
              setScene("battle");
            }
          }, 200);
          return moved;
        }
      }

      // ボスとの接触チェック（エリア7は四聖獣の試練とは別扱い）
      if (nr === currentAreaInfo.bossPos.r && nc === currentAreaInfo.bossPos.c) {
        // エリア7のbossPosは試練完了チェック用（戦闘開始は祝福演出）
        if (p.currentArea === 7) {
          const f = p.flags || {};
          const allDone = !!f.genbuDefeated && !!f.seiryuDefeated && !!f.suzakuDefeated && !!f.byakkoDefeated;
          if (!allDone) {
            addToast("四方に散る四聖獣のもとへ向かい、すべての試練を越えよ。");
            return moved;
          }
        }
        const bossDefeated = ((): number => {
          if (p.currentArea === 7) {
            const f = p.flags || {};
            const allDone = !!f.genbuDefeated && !!f.seiryuDefeated && !!f.suzakuDefeated && !!f.byakkoDefeated;
            return allDone ? 1 : 0;
          }
          return dex[currentAreaInfo.bossName]?.defeated || 0;
        })();
        if (bossDefeated === 0) {
          // 通常エリアはボス戦、エリア7は祝福演出（戦闘テキストを利用）
          setShowStory("bossEncounter");
          setTimeout(() => {
            const bossData = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName);
            if (bossData) {
              const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
              const enemy = { ...bossData };
              enemy.maxHP = Math.round(enemy.maxHP * dmul);
              enemy.hp = enemy.maxHP;
              enemy.atk = Math.round(enemy.atk * dmul);
              setBattle({ enemy, log: [`${enemy.emoji} ${enemy.name} が あらわれた！`], queue: [], mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 } });
              setScene("battle");
              setDex(d => ({ ...d, [enemy.name]: { seen: (d[enemy.name]?.seen || 0) + 1, defeated: d[enemy.name]?.defeated || 0 } }));
            }
          }, 1200);
          return p; // ボスの位置には移動しない
        }
      }

      if (tile === T.Town) {
        setShowTown("menu");
      } else if (tile === T.Castle) {
        // 城では町メニューを開く（ボス撃破後も町に立ち寄れる）
        setShowTown("menu");
      } else if (tile === T.Cave) {
        // 洞窟では強敵/ボス出現率が高い
        if (Math.random() * 100 < settings.encounterRate) startEncounter(tile);
      } else {
        if (Math.random() * 100 < settings.encounterRate) startEncounter(tile);
      }
      return moved;
    });
  }

  function healAtInnCost(p: Player) {
    return Math.min(INN_PRICE + Math.max(0, (p.lv - 1) * 2), 60);
  }

  function doSave() {
    const saveData: SaveData = {
      player,
      settings,
      dex,
      meta: {
        saveDate: Date.now(),
        playTime,
        version: "2.0"
      }
    };
    
    // 手動セーブのみ: 空きスロット優先、なければ最も古いスロットを上書き
    let targetSlot = 1;
    const slots = getAllSaveSlots();
    const emptySlot = slots.findIndex(s => s === null);
    if (emptySlot >= 0) {
      targetSlot = emptySlot + 1;
    } else {
      // 全て埋まっている場合、最も古いスロットを上書き
      let oldestTime = Date.now();
      slots.forEach((s, idx) => {
        if (s && s.meta && s.meta.saveDate < oldestTime) {
          oldestTime = s.meta.saveDate;
          targetSlot = idx + 1;
        }
      });
    }
    saveToSlot(targetSlot, saveData);
    addToast(`💾 スロット${targetSlot}にセーブしました`);
  }

  function doSaveToSlot(slot: number) {
    const saveData: SaveData = {
      player,
      settings,
      dex,
      meta: {
        saveDate: Date.now(),
        playTime,
        version: "2.0"
      }
    };
    if (saveToSlot(slot, saveData)) {
      addToast(`💾 スロット${slot}にセーブしました`);
    } else {
      addToast("❌ セーブに失敗しました");
    }
    setShowSaveMenu(false);
  }
  function doLoad() {
    const s = loadSave();
    if (!s) { 
      addToast("セーブが見つかりません"); 
      return false; 
    }
    const loadedPlayer = {
      ...s.player,
      currentArea: s.player.currentArea || 1,
      clearedAreas: s.player.clearedAreas || [],
      storyShownAreas: s.player.storyShownAreas || []
    };
    setPlayer(loadedPlayer);
    setSettings(mergeSettings(s.settings));
    setDex(s.dex);
    setPlayTime(s.meta?.playTime || 0);
    setScene("map");
    addToast("📂 ロードしました");
    return true;
  }

  function doLoadFromSlot(slot: number) {
    const s = loadFromSlot(slot);
    if (!s) { addToast(`スロット${slot}にデータがありません`); return; }
    const loadedPlayer = {
      ...s.player,
      currentArea: s.player.currentArea || 1,
      clearedAreas: s.player.clearedAreas || [],
      storyShownAreas: s.player.storyShownAreas || []
    };
    setPlayer(loadedPlayer);
    setSettings(mergeSettings(s.settings));
    setDex(s.dex);
    setPlayTime(s.meta?.playTime || 0);
    addToast(`📂 スロット${slot}からロードしました`);
    setShowSaveMenu(false);
  }

  function doDeleteSlot(slot: number) {
    if (deleteSaveSlot(slot)) {
      addToast(`🗑️ スロット${slot}を削除しました`);
    }
  }

  function changeStage(areaId: number) {
    const targetArea = AREAS.find(a => a.id === areaId);
    if (!targetArea) return;
    
    // エリア1は常に開放、それ以降は前のエリアをクリアしている必要がある
    const isUnlocked = (
      areaId === 1 ||
      player.clearedAreas.includes(areaId - 1) ||
      (!!targetArea.optionalUnlockAfterAreaId && player.clearedAreas.includes(targetArea.optionalUnlockAfterAreaId))
    );
    if (!isUnlocked) {
      addToast(`🔒 このステージはまだ開放されていません`);
      return;
    }
    
    setPlayer(p => ({
      ...p,
      currentArea: areaId,
      pos: targetArea.startPos
    }));
    setShowStageSelect(false);
    addToast(`📍 ${targetArea.name} へ移動しました`);
  }

  function doExport() {
    const saveData: SaveData = {
      player,
      settings,
      dex,
      meta: {
        saveDate: Date.now(),
        playTime,
        version: "2.0"
      }
    };
    exportSaveData(saveData);
    addToast("📥 セーブデータをエクスポートしました");
  }

  function doImport(file: File) {
    importSaveData(file, (data) => {
      if (!data) {
        addToast("❌ インポートに失敗しました");
        return;
      }
      setPlayer(data.player);
      setSettings(mergeSettings(data.settings));
      setDex(data.dex);
      setPlayTime(data.meta?.playTime || 0);
      addToast("📤 セーブデータをインポートしました");
    });
  }

  function giveExpGold(exp: number, gold: number): { levelUp?: { oldLv: number; newLv: number; hpGain: number; mpGain: number; atkGain: number; defGain: number }, details?: { fromLv: number; toLv: number; hp: number; mp: number; atk: number; def: number }[] } {
    let resultInfo: { levelUp?: { oldLv: number; newLv: number; hpGain: number; mpGain: number; atkGain: number; defGain: number }, details?: { fromLv: number; toLv: number; hp: number; mp: number; atk: number; def: number }[] } = {};
    setPlayer(p => {
      const { player: updated, levelUp, details } = applyExpGold(p, exp, gold);
      if (levelUp) addToast(`🎉 レベル ${levelUp.newLv} に あがった！`);
      resultInfo = { levelUp, details };
      return updated;
    });
    return resultInfo;
  }

  /* -------------------- Brain-Quiz Battle -------------------- */
  function startBrainQuiz(pack: "attack" | "fire" | "heal" | "run") {
    if (!battle) return;
  if (pack === "fire" && player.mp < 4) { addToast("MPが たりない！"); return; }
  if (pack === "heal" && player.mp < 3) { addToast("MPが たりない！"); return; }
  const { quiz, time, power } = makeQuizPack(settings.difficulty, pack, { hardQuizRandom: settings.hardQuizRandom });
    setBattle(b => b ? { ...b, mode: "quiz", quiz: { quiz, timeMax: time, timeLeft: time, timeStart: Date.now(), pack, power } } : b);
  }

  const doAttack = () => startBrainQuiz("attack");
  const doRun = () => startBrainQuiz("run");
  function doMagic(kind: "fire" | "heal") { startBrainQuiz(kind); }

  // 新：必殺技/各魔法の起動
  function activateSkillOrMagic(s: { key: string; name: string; rank: number; mp?: number; type: 'skill'|'fire'|'heal'; power: number }) {
    if (!battle) return;
    if ((s.type === 'fire' || s.type === 'heal') && (player.mp < (s.mp || 0))) {
      addToast("MPが たりない！"); return;
    }
    // 高ランクほど問題を難しく: diffBoostを rank に応じて加算
    const diffBoost = s.rank === 3 ? 8 : s.rank === 2 ? 4 : 0;
    const pack: "attack"|"fire"|"heal" = s.type === 'skill' ? 'attack' : (s.type as any);
  const { quiz, time, power } = makeQuizPack(settings.difficulty, pack, { diffBoost, hardQuizRandom: settings.hardQuizRandom });
    setBattle(b => b ? { ...b, mode: 'quiz', quiz: { quiz, timeMax: time, timeLeft: time, timeStart: Date.now(), pack, power: s.type === 'skill' ? s.power : s.power, meta: { moveName: s.name, isSkill: s.type === 'skill', mpCost: s.mp, diffBoost } } } : b);
  }

  function enemyStrike(nextCheck = true) {
    if (!battle) return;
    const raw = Math.max(1, Math.round(battle.enemy.atk - effDEF(player) * 0.35) + R(-1, 2));
    const dmg = Math.max(1, raw);
    const blocked = Math.max(0, Math.round(effDEF(player) * 0.35));
    
    // プレイヤー被ダメージのアニメーション（赤フラッシュ）
  setBattleAnim({ type: 'playerHit', value: dmg });
  setTimeout(() => setBattleAnim(null), 300);
    
    // HP減少は一度だけ計算し、同じ値をログ/死亡判定に使う（非同期更新によるズレ防止）
    const newHP = Math.max(0, player.hp - dmg);
    setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
    pushLog(`👊 ${battle.enemy.name} の こうげき！`);
    if (blocked > 0) {
      pushLog(`   防御で ${blocked} 軽減！ ${dmg} ダメージ！`);
    } else {
      pushLog(`   ${dmg} ダメージ！`);
    }
    pushLog(`${player.name} HP: ${newHP}/${player.maxHP}`);
    vibrate(50);

    setTimeout(() => {
      if (newHP <= 0) {
        pushLog(``);
        pushLog(`💀 ${player.name} は ちからつきた…`);
        setTimeout(() => setScene("result"), 200);
      }
    }, 40);
  }

  function handleQuizResult(ok: boolean, pack: "attack"|"fire"|"heal"|"run", power: number) {
    if (!battle) return;

    // クイズ統計を更新
    const timeSpent = battle.quiz?.timeStart ? (Date.now() - battle.quiz.timeStart) / 1000 : 0;
    setBattle(b => {
      if (!b) return b;
      return {
        ...b,
        quizStats: {
          total: b.quizStats.total + 1,
          correct: b.quizStats.correct + (ok ? 1 : 0),
          totalTime: b.quizStats.totalTime + timeSpent
        }
      };
    });

    // 解答速度評価
    const speedThreshold = settings.difficulty === "easy" ? 15 : settings.difficulty === "hard" ? 8 : 10;
    const fastThreshold = speedThreshold * 0.5;
    const speedEmoji = timeSpent < fastThreshold ? "⚡" : timeSpent < speedThreshold ? "✓" : "⏱";
    const speedText = timeSpent < fastThreshold ? "速解き！" : timeSpent < speedThreshold ? "Good" : "OK";

    const hard = battle.quiz ? isHardQuiz(battle.quiz.quiz) : false;

    if (pack === "heal") {
      if (ok) {
        const rnk = battle.quiz?.meta?.diffBoost ? (battle.quiz!.meta!.diffBoost >= 8 ? 3 : battle.quiz!.meta!.diffBoost >= 4 ? 2 : 1) : 1;
        const baseRatio = settings.difficulty === "hard" ? 0.22 : settings.difficulty === "easy" ? 0.36 : 0.28;
        const healRatio = baseRatio * (rnk === 3 ? 1.35 : rnk === 2 ? 1.18 : 1.0);
        const baseHeal = Math.max(6, Math.round(player.maxHP * healRatio));
        const hardBonus = hard ? 1.15 : 1.0;
        const amount = Math.round(baseHeal * hardBonus);
        const newHP = clamp(player.hp + amount, 0, player.maxHP);
        const mpCost = battle.quiz?.meta?.mpCost ?? 3;
        setPlayer(p => ({ ...p, mp: p.mp - mpCost, hp: newHP }));
        setQuizCombo(c => c + 1);
        pushLog(`${speedEmoji} ${speedText} (${timeSpent.toFixed(1)}秒)`);
        pushLog(`${player.name} は ${(battle.quiz?.meta?.moveName) || '回復魔法'} を となえた！（MP -${mpCost}）`);
        pushLog(`✨ HP +${amount} 回復！ HP: ${newHP}/${player.maxHP}`);
        if (hard && hardBonus > 1) pushLog(`🧩 難問ボーナス！ 回復量+15%`);
        pushLog(`（コンボ×${quizCombo + 1}）`);
        
        // 回復アニメーション
  setBattleAnim({ type: 'heal', value: amount });
  setTimeout(() => setBattleAnim(null), 1000);
        
        vibrate(20);
      } else {
        pushLog(`${player.name} の まほうは しっぱいした！`);
        pushLog("敵の反撃！");
        enemyStrike();
        setQuizCombo(0);
      }
      return;
    }

    if (pack === "run") {
      if (ok) {
        pushLog(`${speedEmoji} ${speedText} (${timeSpent.toFixed(1)}秒)`);
        pushLog(`${player.name} は 逃げのスキを つくった！`);
  pushLog("🏃 戦闘から 離脱した！");
        if (hard) pushLog("🧩 難問ボーナス！");
        setTimeout(() => setScene("map"), 120);
      } else {
        pushLog(`${player.name} の にげるは しっぱいした！`);
        if (battle.onVictory) battle.onVictory();
        setTimeout(() => setScene("map"), 1200);
        return;
        setQuizCombo(0);
      }
      return;
    }

    // attack / fire
    if (ok) {
      const atk = effATK(player);
      const isSkill = battle.quiz?.meta?.isSkill;
      const moveName = battle.quiz?.meta?.moveName;
      const mpCost = battle.quiz?.meta?.mpCost ?? (pack === 'fire' ? 4 : 0);
      const base = pack === "fire" ? Math.round(atk * 0.6) + R(6, 10) : Math.round(atk * 0.35) + R(3, 7);
      const comboBoost = Math.floor((quizCombo + 1) * (pack === "fire" ? 2.2 : 1.6));
      // 速解きボーナス（速度閾値の50%以下なら+10%ダメージ）
      const speedBonus = timeSpent < fastThreshold ? 1.1 : 1.0;
      const hardBonus = hard ? 1.15 : 1.0;
      const dmg = Math.max(1, Math.round((base + comboBoost) * power * speedBonus * hardBonus));
      pushLog(`${speedEmoji} ${speedText} (${timeSpent.toFixed(1)}秒)`);
      // --- ダメージ計算の詳細解説を追加 ---
      let detail = `【ダメージ内訳】\n`;
      detail += `ATK: ${atk}  `;
      detail += `基本: ${base}  `;
      detail += `コンボ: +${comboBoost}  `;
      detail += `威力倍率: x${power}  `;
      if (speedBonus > 1) detail += `速解き: x1.1  `;
      if (hardBonus > 1) detail += `難問: x1.15  `;
      detail += `\n→ 合計: ${dmg}`;
      pushLog(detail);
      if (speedBonus > 1) {
        pushLog(`⚡ 速解きボーナス！ ダメージ+10%`);
        setBattleAnim({ type: 'bonusSpeed' });
        setTimeout(() => setBattleAnim(null), 600);
      }
      if (hard && hardBonus > 1) {
        pushLog(`🧩 難問ボーナス！ ダメージ+15%`);
        setBattleAnim({ type: 'bonusHard' });
        setTimeout(() => setBattleAnim(null), 600);
      }
      if (pack === "fire") {
        setPlayer(p => ({ ...p, mp: p.mp - mpCost }));
        pushLog(`${player.name} は ${(moveName)||'攻撃魔法'} を となえた！（MP -${mpCost}）`);
      } else if (isSkill) {
        pushLog(`${player.name} の ${moveName}！`);
      } else {
        pushLog(`${player.name} の こうげき！`);
      }
      setQuizCombo(c => c + 1);
      setBattle(b => b ? ({ ...b, enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - dmg) } }) : b);
      pushLog(`${pack === "fire" ? "🔥" : "🗡"} ${battle.enemy.name} に ${dmg} ダメージ！（コンボ×${quizCombo + 1}）`);
      
      // コンボボーナスのアニメーション（コンボ3以上で派手に）
      // まずエネミーボックスが見えるようにスクロールしてから演出開始
      try {
        enemyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
  const scrollDelay = 320; // スムーススクロール待機
  const extraPause = 200;  // 攻撃開始前の間
      if (quizCombo >= 2) {
        setTimeout(() => {
          setBattleAnim({ type: 'bonusCombo', value: dmg });
          setTimeout(() => setBattleAnim(null), 1000);
  }, scrollDelay + extraPause);
      } else {
        // 通常のダメージアニメーション
        setTimeout(() => {
          setBattleAnim({ type: 'damage', value: dmg });
          setTimeout(() => setBattleAnim(null), 1000);
  }, scrollDelay + extraPause);
      }
      
      vibrate(10);

      setTimeout(() => {
        const after = battle.enemy.hp - dmg;
        if (after <= 0) {
          pushLog(`💀 ${battle.enemy.name} を たおした！`);
          
          // タイムボーナス計算（平均解答時間が速いほどボーナス）
          const stats = battle.quizStats;
          const avgTime = stats.total > 0 ? stats.totalTime / stats.total : 999;
          const speedThreshold = settings.difficulty === "easy" ? 15 : settings.difficulty === "hard" ? 8 : 10;
          let timeBonus = 0;
          if (avgTime < speedThreshold) {
            const speedRatio = Math.max(0, (speedThreshold - avgTime) / speedThreshold);
            timeBonus = Math.round((battle.enemy.boss ? 12 : 5) * speedRatio);
          }
          
          // 敵の強さに応じた報酬: HPとATKとボス補正から重みを算出
          const strength = (battle.enemy.maxHP + battle.enemy.atk * 5) * (battle.enemy.boss ? 1.6 : 1.0);
          const baseExp = Math.max(6, Math.round(strength * 0.25));
          const baseGold = Math.max(5, Math.round(strength * 0.18));
          const hardBonusReward = ((): number => {
            const lastWasHard = hard; // 現在の一問の難問判定
            return lastWasHard ? (battle.enemy.boss ? 6 : 3) : 0;
          })();
          const totalExp = baseExp + timeBonus + (battle.enemy.boss ? 6 : 0) + hardBonusReward;
          const totalGold = baseGold + (battle.enemy.boss ? 5 : 0) + Math.round(hardBonusReward / 2);
          
          if (hardBonusReward > 0) pushLog(`🧩 難問ボーナス +${hardBonusReward} EXP / +${Math.round(hardBonusReward/2)} G`);
          const result = giveExpGold(totalExp, totalGold);
          pushLog(``);
          pushLog(`✨ 経験値 +${baseExp}${timeBonus > 0 ? ` (⚡速解き+${timeBonus})` : ""}`);
          pushLog(`💰 ゴールド +${baseGold}${timeBonus > 0 ? ` (⚡+${Math.floor(timeBonus * 0.8)})` : ""}`);
          if (timeBonus > 0) {
            pushLog(`⚡ タイムボーナス！ (平均 ${avgTime.toFixed(1)}秒)`);
          }
          if (result.levelUp) {
            pushLog("");
            pushLog(`🎉 レベルアップ！ Lv${result.levelUp.oldLv} → Lv${result.levelUp.newLv}`);
            // 連続演出: レベルごとの上昇内訳をキューに投入
            if ((result.details?.length || 0) > 0) {
              setBattle(b => b ? ({
                ...b,
                queue: [
                  ...b.queue,
                  ...result.details!.map((d, i) => `  └ Lv${d.fromLv} → Lv${d.toLv}：HP +${d.hp} / MP +${d.mp} / ATK +${d.atk} / DEF +${d.def}`)
                ]
              }) : b);
            }
          }
          pushLog(``);
          pushLog(`「▶ 続ける」ボタンを押してください`);
          setBattle(b => b ? ({ ...b, mode: "victory", rewards: { exp: totalExp, gold: totalGold, timeBonus, levelUp: result.levelUp, levelUpDetails: result.details } }) : b);
          setDex(d => ({ ...d, [battle.enemy.name]: { seen: (d[battle.enemy.name]?.seen || 0), defeated: (d[battle.enemy.name]?.defeated || 0) + 1 } }));
          
          // ボスを倒した場合、専用ジングル + ストーリーダイアログを表示し、エリアをクリア済みに追加
          if (battle.enemy.boss && (battle.enemy.name === currentAreaInfo.bossName || player.currentArea === 7)) {
            setPlayer(p => {
              if (p.currentArea !== 7) {
                if (!p.clearedAreas.includes(p.currentArea)) {
                  return { ...p, clearedAreas: [...p.clearedAreas, p.currentArea] };
                }
                return p;
              } else {
                let next = { ...p, flags: { ...(p.flags || {}) } };
                const n = battle.enemy.name;
                if (n === "玄武") next.flags!.genbuDefeated = true;
                if (n === "青龍") next.flags!.seiryuDefeated = true;
                if (n === "朱雀") next.flags!.suzakuDefeated = true;
                if (n === "白虎") next.flags!.byakkoDefeated = true;
                const allDone = !!next.flags!.genbuDefeated && !!next.flags!.seiryuDefeated && !!next.flags!.suzakuDefeated && !!next.flags!.byakkoDefeated;
                if (allDone) {
                  next.flags!.ultimateUnlocked = true;
                  next.flags!.ultimateMagicUnlocked = true;
                  next = { ...next, equip: { weapon: ULTIMATE_WEAPON, armor: ULTIMATE_ARMOR } };
                  if (!next.clearedAreas.includes(7)) next.clearedAreas = [...next.clearedAreas, 7];
                }
                return next;
              }
            });
            // エリア7は四聖獣を全て倒したときのみボス勝利ストーリーを表示
            const defeatedName = battle.enemy.name;
            const f0 = (player.flags || {});
            const f1 = {
              ...f0,
              genbuDefeated: f0.genbuDefeated || defeatedName === "玄武",
              seiryuDefeated: f0.seiryuDefeated || defeatedName === "青龍",
              suzakuDefeated: f0.suzakuDefeated || defeatedName === "朱雀",
              byakkoDefeated: f0.byakkoDefeated || defeatedName === "白虎",
            } as typeof f0;
            const allDoneLocal = !!f1.genbuDefeated && !!f1.seiryuDefeated && !!f1.suzakuDefeated && !!f1.byakkoDefeated;
            setTimeout(() => {
              if (player.currentArea === 7) {
                if (allDoneLocal) setShowStory("bossVictory");
              } else {
                setShowStory("bossVictory");
              }
            }, 1000);
            if (player.currentArea === 7 && allDoneLocal) {
              addToast("🏆 四聖獣討伐！最強装備と究極スキル・魔法を獲得！");
            }
          }
        } else {
          pushLog(`${battle.enemy.name} HP: ${after}/${battle.enemy.maxHP}`);
          enemyStrike();
        }
      }, 40);
    } else {
      // 失敗時：必殺技はミス（ダメージ0）、攻撃/攻撃魔法は弱ダメージ、回復は失敗
      const isSkill = battle.quiz?.meta?.isSkill;
      const moveName = battle.quiz?.meta?.moveName;
  // ここは pack が attack か fire のみ到達（heal/run は前段で return 済み）
  const mpCost = battle.quiz?.meta?.mpCost ?? (pack === 'fire' ? 4 : 0);
      const atk = effATK(player);
      const failDmg = isSkill ? 0 : Math.max(1, Math.round(atk * 0.15) + R(1, 3));
      if (pack === 'fire') {
        setPlayer(p => ({ ...p, mp: p.mp - mpCost }));
        pushLog(`${player.name} の ${(moveName)||'攻撃魔法'} は うまく きまらなかった！（MP -${mpCost}）`);
      } else if (pack === 'attack' && isSkill) {
        pushLog(`${player.name} の ${moveName} は はずれた！`);
      } else if (pack === 'attack') {
        pushLog(`${player.name} の こうげきは 弱かった！`);
      }
      if (failDmg > 0) {
        setBattle(b => b ? ({ ...b, enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - failDmg) } }) : b);
        pushLog(`${battle.enemy.name} に ${failDmg} ダメージ！`);
      }
      
      // 弱い攻撃のアニメーション
      setBattleAnim({ type: 'damage', value: failDmg });
      setTimeout(() => setBattleAnim(null), 1000);
      
      pushLog("敵の反撃！");
      enemyStrike();
      setQuizCombo(0);
    }
  }

  /* -------------------- Town -------------------- */
  function buyWeapon(w: Weapon) {
  const tradeIn = Math.floor(player.equip.weapon.price / 2);
  const net = w.price - tradeIn;
  if (net > 0 && player.gold < net) { addToast("お金が たりない！"); return; }
    // 現在装備より弱い場合は確認
    if (w.atk < player.equip.weapon.atk) {
      const ok = confirm(`今の武器(${player.equip.weapon.name} ATK${player.equip.weapon.atk})より弱い武器です。購入しますか？`);
      if (!ok) return;
    }
    setPlayer(p => ({ ...p, gold: p.gold - net, equip: { ...p.equip, weapon: w } }));
  addToast(`🔪 ${w.name} を かった！（下取り +${tradeIn}G / 支払い ${Math.max(0, net)}G）`);
  }
  function buyArmor(a: Armor) {
  const tradeIn = Math.floor(player.equip.armor.price / 2);
  const net = a.price - tradeIn;
  if (net > 0 && player.gold < net) { addToast("お金が たりない！"); return; }
    // 現在装備より弱い場合は確認
    if (a.def < player.equip.armor.def) {
      const ok = confirm(`今の防具(${player.equip.armor.name} DEF${player.equip.armor.def})より弱い防具です。購入しますか？`);
      if (!ok) return;
    }
    setPlayer(p => ({ ...p, gold: p.gold - net, equip: { ...p.equip, armor: a } }));
  addToast(`🛡 ${a.name} を かった！（下取り +${tradeIn}G / 支払い ${Math.max(0, net)}G）`);
  }
  function buyTool(t: Tool) {
  if (player.gold < t.price) { addToast("お金が たりない！"); return; }
    setPlayer(p => {
      const items = [...p.items];
      const i = items.findIndex(it => it.name === t.name);
      if (i >= 0) items[i] = { ...items[i], qty: (items[i].qty || 0) + 1 };
      else items.push({ ...t, qty: 1 });
      return { ...p, gold: p.gold - t.price, items };
    });
    addToast(`🧪 ${t.name} を かった！`);
  }
  function restAtInn() {
    const price = healAtInnCost(player);
    if (player.hp >= player.maxHP && player.mp >= player.maxMP) {
      addToast("🛏️ HP/MPは 満タンです！");
      return;
    }
    if (player.gold < price) { addToast("お金が たりない！"); return; }
    setPlayer(p => ({ ...p, gold: p.gold - price, hp: p.maxHP, mp: p.maxMP }));
    addToast("🛏️ HP/MP が かいふくした！");
  }

  function handleUseItem(idx: number) {
    const it = player.items[idx];
    if (!it || (it.qty || 0) <= 0) { addToast("使える どうぐが ない"); return; }
    setPlayer(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], qty: (items[idx].qty || 0) - 1 };
      if (items[idx].qty! <= 0) items.splice(idx, 1);
      if (it.effect === "heal") {
        const v = it.amount;
        return { ...p, hp: clamp(p.hp + v, 0, p.maxHP), items };
      } else {
        const v = it.amount;
        return { ...p, mp: clamp(p.mp + v, 0, p.maxMP), items };
      }
    });
  addToast(`🧪 ${it.name} を つかった`);
  }

  /* -------------------- UI helpers -------------------- */
  // ステージ進行に応じたショップ品揃え（最大: ステージ6で最強が出る）
  function getShopAssortment() {
    const area = player.currentArea;
    // インデックス上限: ステージ番号+1程度をベースに、最大は全アイテム
    // 例: 1→2個、2→3個、…、6以上→全て
    const maxIdx = Math.min(WEAPONS.length, Math.max(2, area + 1));
    const maxArmorIdx = Math.min(ARMORS.length, Math.max(2, area + 1));
    return {
      weapons: WEAPONS.slice(0, maxIdx),
      armors: ARMORS.slice(0, maxArmorIdx),
    };
  }
  function onLogClick() {
    if (!battle) return;
    if (battle.mode === "victory") {
      // 勝利モードでも、先にキューを吐き切ってからリザルトへ
      if (battle.queue.length > 0) {
        const [head, ...rest] = battle.queue;
        pushLog(head);
        setBattle(b => b ? { ...b, queue: rest } : b);
        return;
      }
      setScene("result");
      return;
    }
    // 最初の一押しでコマンドに移行するステップを挟む
    if (battle.mode === "queue" && battle.queue.length === 0) {
      setBattle(b => b ? { ...b, mode: "select" } : b);
      return;
    }
    if (battle.queue.length > 0) {
      const [head, ...rest] = battle.queue;
      pushLog(head);
      setBattle(b => b ? { ...b, queue: rest } : b);
    }
  }
  function advanceLog() {
    if (!battle) return;
    if (battle.queue.length > 0) onLogClick();
  }

  // スタイル関数はコンポーネント側へ移動（PadOverlay）

  // 旧インラインのドラッグは各コンポーネントで扱う

  /* -------------------- Render -------------------- */
  return (
  <div className="wrap" style={{ ['--tile-size' as any]: `${settings.tileSize}px` }}>
      <Topbar
        scene={scene}
        onOpenMenu={() => setShowMenu(true)}
        onOpenStageSelect={() => setShowStageSelect(true)}
        onGoTitle={() => setScene("title")}
        onOpenHowto={() => setShowHowto(true)}
        onOpenSettings={() => setShowSettings(true)}
      />


      {/* ヘッダー直下のUIスケーラー（マップ・設定等のみ表示、戦闘中は非表示） */}
      {scene !== 'title' && scene !== 'battle' && (
        <UiScaler
          value={settings.tileSize}
          min={16}
          max={64}
          step={1}
          onChange={(v) => setSettings(s => ({ ...s, tileSize: clamp(v, 16, 64) }))}
        />
      )}


  <main className="main" style={{ alignItems: scene === "map" ? "start" : undefined }}>
        {scene === "title" && (
          <div className="title">
            <div className="logo">🧙‍♀️🧠 Brain Math Quest</div>
            <div className="subtitle">脳トレで戦う ちいさなRPG</div>
            <div className="titleBtns">
              <button onClick={() => setScene("map")}>はじめる</button>
              <button onClick={doLoad}>ロード</button>
              <button onClick={() => setShowSettings(true)}>設定</button>
              <button onClick={() => setShowHowto(true)}>操作説明</button>
            </div>
            <div className="tips">セーブはメニューから</div>
          </div>
        )}

        {scene === "map" && (
          <div className="mapView">
            <div className="areaInfo" style={{ textAlign: 'center', padding: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>
              📍 {currentAreaInfo.name} - {currentAreaInfo.description}
            </div>
            <div className="clearCondition" style={{ 
              textAlign: 'center', 
              padding: '6px', 
              fontSize: '13px', 
              background: dex[currentAreaInfo.bossName]?.defeated > 0 ? '#4CAF50' : '#FF9800',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '4px',
              margin: '4px auto',
              maxWidth: '90%'
            }}>
              {dex[currentAreaInfo.bossName]?.defeated > 0 ? (
                <>✅ クリア済み：{currentAreaInfo.bossName}を倒した！</>
              ) : (
                <>🎯 クリア条件：城で「{currentAreaInfo.bossName}」を倒す</>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${settings.tileSize}px)` }}>
              {currentMap.flatMap((row, r) => row.map((t, c) => {
                const isP = player.pos.r === r && player.pos.c === c;
                const f = player.flags || {};
                const allDoneA7 = !!f.genbuDefeated && !!f.seiryuDefeated && !!f.suzakuDefeated && !!f.byakkoDefeated;
                // エリア7のボス表示は四試練完了後のみ
                const atBossPos = currentAreaInfo.bossPos.r === r && currentAreaInfo.bossPos.c === c;
                const isBoss = player.currentArea !== 7
                  ? (atBossPos && !(dex[currentAreaInfo.bossName]?.defeated > 0))
                  : (atBossPos && allDoneA7);
                const bossEmoji = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName)?.emoji || "👑";

                // 四聖獣の目印（未試練のみ表示）
                let guardianEmoji: string | null = null;
                if (player.currentArea === 7) {
                  if (r === GUARDIANS_A7.genbu.r && c === GUARDIANS_A7.genbu.c && !f.genbuDefeated) guardianEmoji = "🐢";
                  if (r === GUARDIANS_A7.seiryu.r && c === GUARDIANS_A7.seiryu.c && !f.seiryuDefeated) guardianEmoji = "🐉";
                  if (r === GUARDIANS_A7.suzaku.r && c === GUARDIANS_A7.suzaku.c && !f.suzakuDefeated) guardianEmoji = "🕊️";
                  if (r === GUARDIANS_A7.byakko.r && c === GUARDIANS_A7.byakko.c && !f.byakkoDefeated) guardianEmoji = "🐯";
                }

                return (
                  <div className="cell" key={`${r}-${c}`}>
                    <div className="tile">{tileEmoji(t)}</div>
                    {guardianEmoji && (
                      <div className="ply" title="四聖獣の試練地点" style={{ fontSize: '18px', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.7))', animation: 'pulse 2s infinite' }}>
                        {guardianEmoji}
                      </div>
                    )}
                    {isBoss && <div className="ply" title="祝福の間" style={{ fontSize: '24px', animation: 'pulse 2s infinite' }}>{bossEmoji}</div>}
                    {isP && <div className="ply">{player.avatar}</div>}
                  </div>
                );
              }))}
            </div>
            <div className="toasts">
              {toasts.map((t, i) => <div key={i} className="toast">{t}</div>)}
            </div>
            {/* 下部バーは廃止。余白予約は不要。 */}
            {/* マップフィールド直下のステータス領域 */
            /* ここを展開したときは、直下のコントローラーを自動でブラー */}
            <div
              className="topStatusWrap"
              style={{
                marginTop: 8,
                opacity: settings.statusOverlay.opacity,
                transition: 'opacity 0.2s, font-size 0.2s',
              }}
            >
              <div className="topStatusBar">
                <button className="ghost" aria-label={topStatusExpanded ? '折りたたむ' : '展開'} onClick={() => setTopStatusExpanded(v => !v)}>
                  {topStatusExpanded ? '▲' : '▼'}
                </button>
                <div
                  className="topStatusMini"
                  style={{
                    fontSize: `${Math.round(14 * (settings.statusOverlay.size / 100) * 0.9)}px`
                  }}
                >
                  <span style={{ marginRight: 8 }}>{player.avatar}</span>
                  <span>Lv{player.lv}</span>
                  <span style={{ margin: '0 8px' }}>HP {player.hp}/{player.maxHP}</span>
                  <span>MP {player.mp}/{player.maxMP}</span>
                </div>
              </div>
              {topStatusExpanded && (
                <div
                  className="topStatusDetail"
                  ref={topStatusDetailRef}
                  style={{
                    fontSize: `${Math.round(14 * (settings.statusOverlay.size / 100) * 0.8)}px`
                  }}
                >
                  <div className="statusLine nowrap">HP {player.hp}/{player.maxHP}　MP {player.mp}/{player.maxMP}</div>
                  <div className="statusLine">ATK {effATK(player)}（主人公 {player.baseATK} + 装備 {player.equip.weapon.atk}：{player.equip.weapon.name}）</div>
                  <div className="statusLine">DEF {effDEF(player)}（主人公 {player.baseDEF} + 装備 {player.equip.armor.def}：{player.equip.armor.name}）</div>
                  <div className="statusLine nowrap">EXP {player.exp}/{nextExpFor(player.lv)}　GOLD {player.gold}</div>
                  <div className="statusLine" style={{ marginTop: 4 }}>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join('、') || 'なし'}</div>
                </div>
              )}
            </div>
            {/* ステータス直下：コントローラー（非フローティングで文書フロー内） */}
            {settings.pad.show && (
              <div ref={padWrapRef} className={padObscured ? 'padBlurWrap blurred' : 'padBlurWrap'}>
                { (padHasDragged ? settings.pad.floating : false) ? (
                  // 浮動時はラッパー（transformあり）を介さず直接配置
                  <PadOverlay
                    pad={{ ...settings.pad, floating: true }}
                    onMove={(x, y) => {
                      setPadHasDragged(true);
                      setSettings(s => ({ ...s, pad: { ...s.pad, pos: { x, y }, floating: true } }));
                    }}
                    onToggleCollapsed={() => setSettings(s => ({ ...s, pad: { ...s.pad, collapsed: !s.pad.collapsed } }))}
                    onChangeSizePct={(nextPct) => setSettings(s => ({ ...s, pad: { ...s.pad, sizePct: nextPct, size: Math.round(56 * nextPct / 100) } }))}
                    tryMove={tryMove}
                    onOpenMenu={() => setShowMenu(true)}
                    autoRepeatEnabled={scene === "map"}
                  />
                ) : (
                  // 非浮動時のみ中央寄せラッパーを使用
                  <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', top: 12 }}>
                    <PadOverlay
                      pad={{ ...settings.pad, floating: false }}
                      onMove={(x, y) => {
                        setPadHasDragged(true);
                        setSettings(s => ({ ...s, pad: { ...s.pad, pos: { x, y }, floating: true } }));
                      }}
                      onToggleCollapsed={() => setSettings(s => ({ ...s, pad: { ...s.pad, collapsed: !s.pad.collapsed } }))}
                      onChangeSizePct={(nextPct) => setSettings(s => ({ ...s, pad: { ...s.pad, sizePct: nextPct, size: Math.round(56 * nextPct / 100) } }))}
                      tryMove={tryMove}
                      onOpenMenu={() => setShowMenu(true)}
                      autoRepeatEnabled={scene === "map"}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

  {/* 旧: 浮動オーバーレイPadはマップ直下配置に移行したため非表示 */}

        {/* 旧: 浮動オーバーレイのステータスは廃止 */}

        {scene === "battle" && battle && (
          <div className="battle">
            <div
              className={`enemy ${battleAnim?.type === 'damage' ? 'shake' : ''} ${battleAnim?.type === 'playerHit' ? 'flash' : ''}`}
              style={battlePanelBgStyle}
              ref={enemyPanelRef}
            >
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%'}}>
                <div
                  className="ename"
                  style={{
                    textAlign: 'center',
                    marginTop: 0,
                    marginBottom: 8,
                    display: 'inline-block',
                    padding: '6px 10px',
                    borderRadius: 12,
                    background: 'rgba(12,19,48,0.80)',
                    border: '1px solid #2a3a7a',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                  }}
                >
                  {battle.enemy.name}{battle.enemy.boss ? " 👑" : ""}
                </div>
                {battle.enemy.imageUrl && !enemyImageError ? (
                  <div className="enemyImage" style={{ position: 'relative', width: Math.round((battle.enemy.renderSize || 160) * 1.6), height: Math.round((battle.enemy.renderSize || 160) * 1.6), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Image
                      src={battle.enemy.imageUrl}
                      alt={battle.enemy.name}
                      fill
                      sizes={(battle.enemy.renderSize ? `${Math.round(battle.enemy.renderSize * 1.6)}px` : '256px')}
                      priority
                      style={{
                        objectFit: 'contain',
                        imageRendering: 'pixelated' as any,
                        display: 'block',
                        margin: '0 auto',
                        ...(battle.enemy.name === '玄武' || battle.enemy.name === '青龍' || battle.enemy.name === '朱雀' || battle.enemy.name === '白虎'
                          ? { filter: 'drop-shadow(0 0 6px rgba(255,255,220,0.6)) saturate(1.06) brightness(1.05)' }
                          : battle.enemy.name === '虚空の王'
                          ? { filter: 'drop-shadow(0 0 6px rgba(60,60,100,0.6)) brightness(0.88) saturate(0.92) contrast(1.06)' }
                          : {})
                      }}
                      onError={() => setEnemyImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="enemyEmoji" style={{ fontSize: `${Math.round((battle.enemy.renderSize ? battle.enemy.renderSize * 1.6 : 160 * 1.6) * 0.53)}px`, margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {battle.enemy.emoji}
                  </div>
                )}
              </div>
              <div style={{width:'100%',position:'absolute',bottom:0,left:0,display:'flex',flexDirection:'column',alignItems:'center',paddingBottom:18}}>
                <div
                  className="ehp"
                  style={{
                    textAlign: 'center',
                    marginTop: 0,
                    display: 'inline-block',
                    padding: '5px 10px',
                    borderRadius: 10,
                    background: 'rgba(12,19,48,0.88)',
                    border: '1px solid #2a3a7a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.30)',
                  }}
                >
                  HP {battle.enemy.hp}/{battle.enemy.maxHP}
                </div>
                {battle.mode === "queue" && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                    <button onClick={onLogClick}>▶ 続ける</button>
                  </div>
                )}
              </div>
              {/* ダメージ数値の表示 */}
              {battleAnim?.type === 'damage' && battleAnim.value && (
                <div className="damageNumber" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
                  -{battleAnim.value}
                </div>
              )}
              {/* コンボダメージの表示（より派手に） */}
              {battleAnim?.type === 'bonusCombo' && battleAnim.value && (
                <div className="damageNumber critical" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
                  -{battleAnim.value}
                </div>
              )}
              {/* 回復の表示 */}
              {battleAnim?.type === 'heal' && battleAnim.value && (
                <div className="damageNumber heal" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
                  +{battleAnim.value}
                </div>
              )}
              {/* レベルアップ演出 */}
              {battleAnim?.type === 'levelup' && (
                <>
                  <div className="levelupRing" />
                  <div className="bonusEffect" style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', color: 'var(--good)', fontWeight: 800 }}>
                    🎉 LEVEL UP!
                  </div>
                  <div className="starSparkle" style={{ top: '8%', left: '40%' }}>✦</div>
                  <div className="starSparkle" style={{ top: '18%', left: '62%', animationDelay: '0.1s' }}>✧</div>
                  <div className="starSparkle" style={{ top: '4%', left: '58%', animationDelay: '0.2s' }}>✦</div>
                </>
              )}
              {/* ボーナスエフェクト */}
              {battleAnim?.type === 'bonusSpeed' && (
                <div className="bonusEffect speed" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }}>
                  ⚡速解き!
                </div>
              )}
              {battleAnim?.type === 'bonusHard' && (
                <div className="bonusEffect hard" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }}>
                  🧩難問!
                </div>
              )}
              {battleAnim?.type === 'bonusCombo' && (
                <div className="bonusEffect combo" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }}>
                  🔥COMBO!
                </div>
              )}
            </div>
            <div className="plStat">
              <div>{player.avatar} {player.name} Lv{player.lv}</div>
              <div>HP {player.hp}/{player.maxHP} / MP {player.mp}/{player.maxMP}</div>
              <div>ATK {effATK(player)}（{player.equip.weapon.name}） / DEF {effDEF(player)}（{player.equip.armor.name}）</div>
              <div>EXP {player.exp}/{nextExpFor(player.lv)} / G {player.gold}</div>
              <div>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join("、") || "なし"}</div>
            </div>

            <div className="log">
              {[...battle.log.slice(-7)].map((l, i) => <div key={i}>{l}</div>)}
              {battle.queue.length > 0 && <div className="nextTip">▶ 次へ（残り{battle.queue.length}）</div>}
            </div>

            {battle.mode === "quiz" && battle.quiz ? (
              <BrainQuizPane
                quiz={battle.quiz.quiz}
                timeMax={battle.quiz.timeMax}
                timeLeft={battle.quiz.timeLeft}
                onTick={() => {
                  setBattle(b => {
                    if (!b || !b.quiz) return b;
                    const left = b.quiz.timeLeft - 0.1;
                    if (left <= 0) {
                      handleQuizResult(false, b.quiz.pack, b.quiz.power);
                      return { ...b, mode: "select", quiz: null };
                    }
                    return { ...b, quiz: { ...b.quiz, timeLeft: left } };
                  });
                }}
                onSubmit={(ok) => {
                  const q = battle.quiz!;
                  handleQuizResult(ok, q.pack, q.power);
                  setBattle(b => ({ ...b!, mode: "select", quiz: null }));
                }}
                onGiveup={() => {
                  const q = battle.quiz!;
                  handleQuizResult(false, q.pack, q.power);
                  setBattle(b => ({ ...b!, mode: "select", quiz: null }));
                }}
              />
            ) : battle.mode === "select" ? (
              <div className="cmds grid2">
                <button onClick={doAttack}>たたかう</button>
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'selectSkill' } : b)}>必殺技</button>
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'selectFireList' } : b)}>攻撃魔法</button>
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'selectHealList' } : b)}>回復魔法</button>
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'selectItem' } : b)}>道具</button>
                <button onClick={doRun}>逃げる</button>
              </div>
            ) : battle.mode === 'selectSkill' ? (
              <div className="cmds onecol">
                <div style={{textAlign:'center',opacity:0.8}}>必殺技一覧（失敗すると攻撃をミス）</div>
                {learnedWithUltimate(player.lv, player.flags?.ultimateUnlocked, player.flags?.ultimateMagicUnlocked).skill.map((s) => (
                  <button key={s.key} onClick={() => activateSkillOrMagic(s)}>{s.name}（R{s.rank}{s.mp ? ` / ${s.mp}MP` : ''}）</button>
                ))}
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'select' } : b)}>← もどる</button>
              </div>
            ) : battle.mode === 'selectFireList' ? (
              <div className="cmds onecol">
                <div style={{textAlign:'center',opacity:0.8}}>攻撃魔法一覧</div>
                {learnedWithUltimate(player.lv, player.flags?.ultimateUnlocked, player.flags?.ultimateMagicUnlocked).fire.map((s) => (
                  <button key={s.key} onClick={() => activateSkillOrMagic(s)}>{s.name}（R{s.rank} / {s.mp}MP）</button>
                ))}
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'select' } : b)}>← もどる</button>
              </div>
            ) : battle.mode === 'selectHealList' ? (
              <div className="cmds onecol">
                <div style={{textAlign:'center',opacity:0.8}}>回復魔法一覧</div>
                {learnedWithUltimate(player.lv, player.flags?.ultimateUnlocked, player.flags?.ultimateMagicUnlocked).heal.map((s) => (
                  <button key={s.key} onClick={() => activateSkillOrMagic(s)}>{s.name}（R{s.rank} / {s.mp}MP）</button>
                ))}
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'select' } : b)}>← もどる</button>
              </div>
            ) : battle.mode === 'selectItem' ? (
              <div className="cmds onecol">
                {player.items.map((it, idx) => (
                  <button key={idx} disabled={(it.qty || 0) <= 0} onClick={() => handleUseItem(idx)}>
                    どうぐ：{it.name} ×{it.qty}
                  </button>
                ))}
                <button onClick={() => setBattle(b => b ? { ...b, mode: 'select' } : b)}>← もどる</button>
              </div>
            ) : battle.mode === "queue" ? (
              null
            ) : battle.mode === "victory" ? (
              <div className="cmds onecol">
                <button onClick={onLogClick}>▶ 続ける</button>
              </div>
            ) : (
              <div className="cmds onecol">
                <button onClick={advanceLog}>▶ 次へ</button>
              </div>
            )}
          </div>
        )}

        {scene === "result" && (
          <div className="result">
            {player.hp <= 0 ? (
              <>
                <div className="logo">💤 GAME OVER</div>
                <div className="subtitle">目の前が まっくらに なった…</div>
                <div style={{ padding: '10px', fontSize: '14px', lineHeight: '1.6' }}>
                  「勇者よ、まだ終わりではない。\n町の宿屋から再び旅立つのだ...」
                </div>
                <div className="titleBtns">
                  <button onClick={() => {
                    setPlayer(p => ({
                      ...p,
                      hp: Math.floor(p.maxHP / 2),
                      mp: Math.floor(p.maxMP / 2),
                      gold: Math.floor(p.gold * 0.7),
                      pos: currentAreaInfo.startPos
                    }));
                    setBattle(null);
                    setScene("map");
                    addToast("💫 町の宿屋で目が覚めた...");
                  }}>
                    町から再開（HP/MP半分、所持金30%減）
                  </button>
                  <button onClick={doLoad}>セーブから再開</button>
                  <button onClick={() => { resetAll(); setScene("title"); }}>タイトルにもどる</button>
                </div>
              </>
            ) : (
              <>
                <div className="logo">🎉 勝利！</div>
                {battle?.rewards && (
                  <div className="rewards">
                    <div className="rewardTitle">― 戦闘結果 ―</div>
                    <div className="rewardItem">✨ 経験値：<strong>+{battle.rewards.exp}</strong></div>
                    <div className="rewardItem">💰 ゴールド：<strong>+{battle.rewards.gold}</strong></div>
                    {battle.rewards.timeBonus && battle.rewards.timeBonus > 0 && (
                      <div className="rewardItem timeBonusItem">⚡ タイムボーナス：<strong>+{battle.rewards.timeBonus}</strong></div>
                    )}
                    {battle.rewards.levelUp && (
                      <div className="levelUpBox">
                        <div className="levelUpTitle">🎉 レベルアップ！</div>
                        <div className="levelUpDetail">Lv {battle.rewards.levelUp.oldLv} → Lv {battle.rewards.levelUp.newLv}</div>
                        <div className="levelUpStats">
                          <span>HP +{battle.rewards.levelUp.hpGain}</span>
                          <span>MP +{battle.rewards.levelUp.mpGain}</span>
                          <span>ATK +{battle.rewards.levelUp.atkGain}</span>
                          <span>DEF +{battle.rewards.levelUp.defGain}</span>
                        </div>
                        {battle.rewards.levelUpDetails && battle.rewards.levelUpDetails.length > 0 && (
                          <div className="levelUpList" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                            {battle.rewards.levelUpDetails.map((d, i) => (
                              <div key={i}>・Lv{d.fromLv} → Lv{d.toLv}：HP +{d.hp} / MP +{d.mp} / ATK +{d.atk} / DEF +{d.def}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {battle?.quizStats && battle.quizStats.total > 0 && (
                  <div className="quizStatsBox">
                    <div className="quizStatsTitle">🧠 脳トレ成績</div>
                    <div className="quizStatsContent">
                      <div className="statRow">
                        <span>正解率：</span>
                        <strong>{battle.quizStats.correct}/{battle.quizStats.total} ({Math.round(battle.quizStats.correct / battle.quizStats.total * 100)}%)</strong>
                      </div>
                      <div className="statRow">
                        <span>平均時間：</span>
                        <strong>{(battle.quizStats.totalTime / battle.quizStats.total).toFixed(1)}秒</strong>
                      </div>
                      {battle.rewards?.timeBonus && battle.rewards.timeBonus > 0 && (
                        <div className="statRow bonusRow">
                          <span>⚡ 速解きボーナス獲得！</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="subtitle">つぎの冒険へ でかけよう！</div>
                <div className="titleBtns">
                  <button onClick={() => { setScene("map"); setBattle(null); }}>冒険を つづける</button>
                  <button onClick={() => { setShowDex(true); }}>図鑑を見る</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

  {/* 下部バーは廃止。パッドとステータスは浮動オーバーレイとして個別に表示する */}

      {showMenu && (
        <Overlay title="メニュー" onClose={() => setShowMenu(false)}>
          <div className="menuGrid">
            <div>
              <h4>ステータス</h4>
              <p>{player.avatar} {player.name} Lv{player.lv}</p>
              <p>HP {player.hp}/{player.maxHP} / MP {player.mp}/{player.maxMP}</p>
              <p>ATK {effATK(player)}（{player.equip.weapon.name}） / DEF {effDEF(player)}（{player.equip.armor.name}）</p>
              <p>EXP {player.exp}/{nextExpFor(player.lv)} / GOLD {player.gold}</p>
              <p>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join("、") || "なし"}</p>
              <p style={{fontSize: "12px", opacity: 0.8}}>⏱ プレイ時間: {Math.floor(playTime / 3600)}h {Math.floor((playTime % 3600) / 60)}m</p>
            </div>
            <div className="vbtns">
              <button onClick={() => { setShowStory("intro"); setShowMenu(false); }}>📖 ストーリーを見る</button>
              <button onClick={() => { setShowDex(true); setShowMenu(false); }}>図鑑</button>
              <button onClick={() => { setShowSaveMenu(true); setShowMenu(false); }}>💾 セーブ/ロード</button>
              <button onClick={() => { setShowSettings(true); setShowMenu(false); }}>設定</button>
              <button onClick={() => setShowMenu(false)}>閉じる</button>
            </div>
          </div>
        </Overlay>
      )}

      {showTown && (
        <Overlay title="町" onClose={() => setShowTown(null)}>
          {showTown === "menu" && (
            <div className="townMenu">
              <p>ようこそ、旅の方！今日は 何を お求めですか？（所持金 {player.gold}G）</p>
              <div className="gBtns">
                <button onClick={() => setShowTown("weapon")}>🔪 武器・防具屋</button>
                <button onClick={() => setShowTown("tool")}>🧪 道具屋</button>
                <button onClick={() => setShowTown("inn")}>🛏️ 宿屋（{healAtInnCost(player)}G）</button>
                <button onClick={() => setShowTown(null)}>出る</button>
              </div>
            </div>
          )}
          {showTown === "weapon" && (
            <div className="shop">
              <h4>🔪 武器・防具屋（所持金 {player.gold}G）</h4>
              {(() => {
                const shop = getShopAssortment();
                const full = shop.weapons.length === WEAPONS.length && shop.armors.length === ARMORS.length;
                return (
                  <p style={{ margin: "6px 0 10px", opacity: 0.85, fontSize: 12 }}>
                    この地域の品揃え：武器 {shop.weapons.length}/{WEAPONS.length} ・ 防具 {shop.armors.length}/{ARMORS.length}
                    （{full ? "現在、全ての商品が解放されています" : "次のステージで増えます"}）
                  </p>
                );
              })()}
              <div className="shopList">
                <h5>武器</h5>
                {getShopAssortment().weapons.map(w => (
                  <div className="shopRow" key={w.name}>
                    <span>{w.name}（ATK+{w.atk}）</span>
                    <span>{w.price}G</span>
                    <button onClick={() => buyWeapon(w)}>買う</button>
                  </div>
                ))}
                <h5>防具</h5>
                {getShopAssortment().armors.map(a => (
                  <div className="shopRow" key={a.name}>
                    <span>{a.name}（DEF+{a.def}）</span>
                    <span>{a.price}G</span>
                    <button onClick={() => buyArmor(a)}>買う</button>
                  </div>
                ))}
              </div>
              <div className="gBtns">
                <button className="ghost" onClick={() => setShowTown("menu")}>戻る</button>
              </div>
            </div>
          )}
          {showTown === "tool" && (
            <div className="shop">
              <h4>🧪 道具屋（所持金 {player.gold}G）</h4>
              {TOOLS.map(tl => (
                <div className="shopRow" key={tl.name}>
                  <span>{tl.name}（{tl.effect === "heal" ? "HP回復" : "MP回復"}）</span>
                  <span>{tl.price}G</span>
                  <button onClick={() => buyTool(tl)}>買う</button>
                </div>
              ))}
              <div className="gBtns">
                <button className="ghost" onClick={() => setShowTown("menu")}>戻る</button>
              </div>
            </div>
          )}
          {showTown === "inn" && (
            <div className="inn">
              <p>一泊 {healAtInnCost(player)}G ですが、泊まっていかれますか？</p>
              {player.hp >= player.maxHP && player.mp >= player.maxMP && (
                <p style={{ color: "var(--good)" }}>✨ HP/MPは満タンです！</p>
              )}
              <div className="gBtns">
                <button onClick={restAtInn} disabled={player.hp >= player.maxHP && player.mp >= player.maxMP}>泊まる</button>
                <button className="ghost" onClick={() => setShowTown("menu")}>やめる</button>
              </div>
            </div>
          )}
        </Overlay>
      )}

      {showDex && (
        <Overlay title="魔物図鑑" onClose={() => setShowDex(false)}>
          <div className="dex">
            {[...ENEMY_POOL, ...BOSS_POOL].map((enemy) => {
              const rec = dex[enemy.name] || { seen: 0, defeated: 0 };
              const encountered = rec.seen > 0;
              return (
                <div className="dexRow" key={enemy.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* 画像 or ？ */}
                  <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2226', borderRadius: 8 }}>
                    {encountered && enemy.imageUrl ? (
                      <Image src={enemy.imageUrl} alt={enemy.name} width={48} height={48} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                    ) : (
                      <span style={{ fontSize: 32, color: '#888' }}>？</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="dexName" style={{ fontWeight: 'bold', fontSize: 18 }}>
                      {encountered ? enemy.name : '？？？？？'}
                    </div>
                    <div className="dexMeta" style={{ fontSize: 13, opacity: 0.85 }}>
                      {encountered ? `出現エリア: ${enemy.area ? `エリア${enemy.area}` : '???'}` : '出現エリア: ???'}
                    </div>
                    <div className="dexMeta" style={{ fontSize: 13, opacity: 0.85 }}>
                      出会った回数: {rec.seen} / たおした数: {rec.defeated}
                    </div>
                    <div className="dexBar">
                      <div className="dexFill" style={{ width: `${Math.min(100, rec.defeated * 25)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="gBtns">
              <button className="ghost" onClick={() => setShowDex(false)}>閉じる</button>
            </div>
          </div>
        </Overlay>
      )}

      {showStageSelect && (
        <Overlay title="ステージ選択" onClose={() => setShowStageSelect(false)}>
          <div className="stageSelect">
            <p>🗺️ 移動先のステージを選択してください</p>
            <div className="stageList">
              {AREAS.map((area) => {
                const isUnlocked = (
                  area.id === 1 ||
                  player.clearedAreas.includes(area.id - 1) ||
                  (!!area.optionalUnlockAfterAreaId && player.clearedAreas.includes(area.optionalUnlockAfterAreaId))
                );
                const isCleared = player.clearedAreas.includes(area.id);
                const isCurrent = player.currentArea === area.id;
                return (
                  <div 
                    key={area.id}
                    className={`stageItem ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="stageHeader">
                      <h4>
                        {isUnlocked ? (isCleared ? '✅' : '📍') : '🔒'} {area.name} {area.mainline === false ? <span className="stageBadge" style={{marginLeft:6}}>任意</span> : null}
                      </h4>
                      {isCurrent && <span className="stageBadge">現在地</span>}
                    </div>
                    <p className="stageDesc">{area.description}</p>
                    <div className="stageBoss">
                      ボス: {area.bossName} {isCleared ? '(撃破済み)' : ''}
                    </div>
                    <button 
                      onClick={() => changeStage(area.id)}
                      disabled={!isUnlocked || isCurrent}
                      className={!isUnlocked ? 'disabled' : ''}
                    >
                      {isCurrent ? '現在のステージ' : isUnlocked ? 'このステージへ' : '未開放'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="gBtns">
              <button className="ghost" onClick={() => setShowStageSelect(false)}>閉じる</button>
            </div>
          </div>
        </Overlay>
      )}

      {showSettings && (
        <Overlay title="設定" onClose={() => setShowSettings(false)}>
          <div className="settingsTabs">
            <button 
              className={settingsTab === "rpg" ? "tabBtn active" : "tabBtn"}
              onClick={() => setSettingsTab("rpg")}
            >
              🎮 RPG設定
            </button>
            <button 
              className={settingsTab === "brain" ? "tabBtn active" : "tabBtn"}
              onClick={() => setSettingsTab("brain")}
            >
              🧠 脳トレ設定
            </button>
          </div>

          {settingsTab === "rpg" && (
            <div className="form">
              <h4>🎮 RPG設定</h4>
              <label>
                UIスケール：{settings.tileSize}px
                <input
                  type="range"
                  min={20}
                  max={64}
                  step={1}
                  value={settings.tileSize}
                  onChange={(e) => setSettings(s => ({ ...s, tileSize: Number(e.target.value) }))}
                />
                <small>マップやUIの大きさを調整します</small>
              </label>
              <label>
                エンカウント率：{settings.encounterRate}%
                <input type="range" min={5} max={40} value={settings.encounterRate}
                  onChange={(e) => setSettings(s => ({ ...s, encounterRate: Number(e.target.value) }))}/>
                <small>敵との遇遇頻度</small>
              </label>
              <label>
                アバター：
                <select
                  value={settings.avatar}
                  onChange={(e) => {
                    const v = e.target.value as Player["avatar"];
                    setSettings(s => ({ ...s, avatar: v }));
                  }}
                >
                  <option value="🦸‍♀️">🦸‍♀️ 勇者（女）</option>
                  <option value="🦸‍♂️">🦸‍♂️ 勇者（男）</option>
                  <option value="🧙‍♀️">🧙‍♀️ 魔法使い（女）</option>
                  <option value="🧙‍♂️">🧙‍♂️ 魔法使い（男）</option>
                  <option value="🧝‍♀️">🧝‍♀️ エルフ（女）</option>
                  <option value="🧝‍♂️">🧝‍♂️ エルフ（男）</option>
                </select>
              </label>

              <hr />
              <h4>コントローラー（Dパッド）</h4>
              <label className="row">
                表示：
                <input
                  type="checkbox"
                  checked={settings.pad.show}
                  onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, show: e.target.checked } }))}
                />
              </label>
              <label className="row">
                ドラッグ移動を有効化：
                <input
                  type="checkbox"
                  checked={!!settings.pad.floating}
                  onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, floating: e.target.checked } }))}
                />
              </label>
              <label className="row">
                折りたたみ：
                <input
                  type="checkbox"
                  checked={!!settings.pad.collapsed}
                  onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, collapsed: e.target.checked } }))}
                />
              </label>
              <label>
                サイズ：{settings.pad.sizePct}%
                <input
                  type="range"
                  min={40}
                  max={200}
                  step={5}
                  value={settings.pad.sizePct}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSettings((s) => ({ ...s, pad: { ...s.pad, sizePct: v, size: Math.round(56 * v / 100) } }));
                  }}
                />
              </label>
              <label>
                不透明度：{Math.round(settings.pad.opacity * 100)}%
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={Math.round(settings.pad.opacity * 100)}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      pad: { ...s.pad, opacity: Number(e.target.value) / 100 },
                    }))
                  }
                />
              </label>

              <hr />
              <h4>ステータス表示</h4>
              <label className="row">
                画面表示：
                <input
                  type="checkbox"
                  checked={settings.statusOverlay.show}
                  onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, show: e.target.checked } }))}
                />
              </label>
              <label>
                サイズ：{settings.statusOverlay.size}%
                <input
                  type="range"
                  min={50}
                  max={150}
                  step={5}
                  value={settings.statusOverlay.size}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSettings((s) => ({ ...s, statusOverlay: { ...s.statusOverlay, size: v } }));
                  }}
                />
              </label>
              <label>
                不透明度：{Math.round(settings.statusOverlay.opacity * 100)}%
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={Math.round(settings.statusOverlay.opacity * 100)}
                  onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, opacity: Number(e.target.value) / 100 } }))}
                />
              </label>
            </div>
          )}

          {settingsTab === "brain" && (
            <div className="form">
              <h4>🧠 脳トレ設定</h4>
              <label>
                難易度：
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings(s => ({ ...s, difficulty: e.target.value as Difficulty }))}
                >
                  <option value="easy">easy（簡単）</option>
                  <option value="normal">normal（普通）</option>
                  <option value="hard">hard（難しい）</option>
                </select>
                <small>クイズの難度、数値範囲、制限時間に影響</small>
              </label>

              <div className="difficultyInfo">
                <h5>難易度別詳細：</h5>
                <div className="diffBox">
                  <strong>easy</strong>
                  <ul>
                    <li>数値範囲：1-18</li>
                    <li>制限時間：30秒</li>
                    <li>乗算なし</li>
                  </ul>
                </div>
                <div className="diffBox">
                  <strong>normal</strong>
                  <ul>
                    <li>数値範囲：1-28</li>
                    <li>制限時間：24秒</li>
                    <li>乗算あり</li>
                  </ul>
                </div>
                <div className="diffBox">
                  <strong>hard</strong>
                  <ul>
                    <li>数値範囲：1-48</li>
                    <li>制限時間：18秒</li>
                    <li>乗算あり</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Overlay>
      )}

      {showSaveMenu && (
        <Overlay title="💾 セーブ / ロード" onClose={() => setShowSaveMenu(false)}>
          <div className="saveMenu">
            <div className="saveSlots">
              {getAllSaveSlots().map((saveData, idx) => {
                const slot = idx + 1;
                return (
                  <div key={slot} className="saveSlot">
                    <div className="slotHeader">
                      <h4>スロット {slot}</h4>
                      {saveData && (
                        <button className="deleteBtn ghost" onClick={() => doDeleteSlot(slot)}>🗑️</button>
                      )}
                    </div>
                    {saveData ? (
                      <div className="slotInfo">
                        <p><strong>{saveData.player.avatar} {saveData.player.name}</strong> Lv{saveData.player.lv}</p>
                        <p>HP {saveData.player.hp}/{saveData.player.maxHP} / MP {saveData.player.mp}/{saveData.player.maxMP}</p>
                        <p>💰 {saveData.player.gold}G / 📍 マップ座標 ({saveData.player.pos.r}, {saveData.player.pos.c})</p>
                        <p className="saveTime">
                          💾 {new Date(saveData.meta.saveDate).toLocaleString('ja-JP')}
                        </p>
                        <p className="playTime">
                          ⏱ {Math.floor(saveData.meta.playTime / 3600)}h {Math.floor((saveData.meta.playTime % 3600) / 60)}m
                        </p>
                        <div className="slotBtns">
                          <button onClick={() => doLoadFromSlot(slot)}>📂 ロード</button>
                          <button onClick={() => doSaveToSlot(slot)}>💾 上書き保存</button>
                        </div>
                      </div>
                    ) : (
                      <div className="slotEmpty">
                        <p>データなし</p>
                        <button onClick={() => doSaveToSlot(slot)}>💾 新規保存</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="saveExtra">
              <h4>データ管理</h4>
              <label className="row">
                ドラッグ移動を有効化：
                <input
                  type="checkbox"
                  checked={!!settings.statusOverlay.floating}
                  onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, floating: e.target.checked } }))}
                />
              </label>
              <div className="gBtns">
                <button onClick={doExport}>📥 エクスポート</button>
                <button onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e: any) => {
                    const file = e.target?.files?.[0];
                    if (file) doImport(file);
                  };
                  input.click();
                }}>📤 インポート</button>
              </div>
              <p style={{fontSize: "12px", opacity: 0.7, marginTop: "8px"}}>
                ※ エクスポートでセーブデータをファイルとしてダウンロードできます
              </p>
              <label className="row">
                折りたたみ：
                <input
                  type="checkbox"
                  checked={!!settings.statusOverlay.collapsed}
                  onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, collapsed: e.target.checked } }))}
                />
              </label>
            </div>
          </div>
        </Overlay>
      )}

      {showHowto && (
        <Overlay title="操作説明" onClose={() => setShowHowto(false)}>
          <ul className="help">
            <li>移動：矢印キー / WASD / 画面のDパッド</li>
            <li>メニュー：Mキー（マップ時）</li>
            <li>バトル：脳トレに正解して攻撃・回復・逃走</li>
            <li>ログ進行：クリック / Enter / Space</li>
            <li>町（🏘️）：武器屋・道具屋・宿屋（HP/MP全回復）</li>
            <li>洞窟（🕳️）・城（🏰）：ボスに出会いやすい</li>
            <li>城でボス撃破：次のエリアへ進める</li>
            <li>セーブ/ロード：メニューから💾セーブ/ロード</li>
            <li>図鑑：出会った/倒した敵を記録します</li>
          </ul>
        </Overlay>
      )}

      {showStory && (
        <Overlay title="📖 ストーリー" onClose={() => setShowStory(null)}>
          <div className={showStory === 'bossVictory' ? 'fade-in' : undefined} style={{ padding: '20px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {showStory === "intro" && currentAreaInfo.story.intro}
            {showStory === "bossEncounter" && currentAreaInfo.story.bossEncounter}
            {showStory === "bossVictory" && (
              <>
                <div>{currentAreaInfo.story.victory}</div>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  {(player.currentArea < AREAS.length) && (player.currentArea !== 7 || (player.flags?.genbuDefeated && player.flags?.seiryuDefeated && player.flags?.suzakuDefeated && player.flags?.byakkoDefeated)) ? (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => {
                        const nextAreaId = player.currentArea + 1;
                        setPlayer(p => ({
                          ...p,
                          currentArea: nextAreaId,
                          pos: AREAS.find(a => a.id === nextAreaId)?.startPos || { r: 4, c: 2 },
                          hp: p.maxHP,
                          mp: p.maxMP
                        }));
                        setShowStory(null);
                        setScene("map");
                        addToast(`次のエリア「${AREAS.find(a => a.id === nextAreaId)?.name}」へ！`);
                      }}>
                        次のエリアへ進む
                      </button>
                      <button className="ghost" onClick={() => {
                        setShowStory(null);
                        setScene("map");
                      }}>
                        このエリアに留まる
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFD700' }}>
                      🎉 全エリアクリア！おめでとうございます！ 🎉
                    </div>
                  )}
                </div>
              </>
            )}
            {showStory === "victory" && (
              <>
                <div>エリア「{currentAreaInfo.name}」をクリアしました！</div>
                <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {player.currentArea < AREAS.length && (
                    <button onClick={() => {
                      const nextAreaId = player.currentArea + 1;
                      setPlayer(p => ({
                        ...p,
                        currentArea: nextAreaId,
                        pos: AREAS.find(a => a.id === nextAreaId)?.startPos || { r: 4, c: 2 },
                        hp: p.maxHP,
                        mp: p.maxMP
                      }));
                      setShowStory(null);
                      addToast(`次のエリア「${AREAS.find(a => a.id === nextAreaId)?.name}」へ！`);
                    }}>
                      次のエリアへ進む
                    </button>
                  )}
                  <button className="ghost" onClick={() => setShowStory(null)}>
                    このエリアに留まる
                  </button>
                </div>
              </>
            )}
          </div>
        </Overlay>
      )}
    </div>
  );

  /* -------------------- Local helpers -------------------- */
  function resetAll() {
    setPlayer({
      name: "ユウシャ",
      avatar: settings.avatar,
      lv: 1,
      exp: 0,
      gold: 40,
      maxHP: 40,
      hp: 40,
      maxMP: 12,
      mp: 12,
      baseATK: 3,
      baseDEF: 2,
      equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
      items: [{ ...TOOLS[0], qty: 2 }, { ...TOOLS[1], qty: 1 }],
      keyItems: [],
      pos: { r: 4, c: 2 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: []
    });
    setBattle(null);
    setDex({});
    setQuizCombo(0);
    addToast("はじめから");
  }

  function tileEmoji(t: Tile) {
    return t === T.Grass
      ? "🟩"
      : t === T.Wall
      ? "🪨"
      : t === T.Water
      ? "🟦"
      : t === T.Town
      ? "🏘️"
      : t === T.Cave
      ? "🕳️"
      : "🏰";
  }
}

// セーブの最新をロード（存在しない場合null）
import { migrateSaveData } from './lib/saveMigration';

function loadSave(): SaveData | null {
  try {
    let latestSlot = 1;
    let latestTime = 0;
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const data = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (data) {
        const parsed: SaveData = JSON.parse(data);
        if (parsed.meta && parsed.meta.saveDate > latestTime) {
          latestTime = parsed.meta.saveDate;
          latestSlot = i;
        }
      }
    }
    if (latestTime > 0) {
      const s = localStorage.getItem(SAVE_KEY_PREFIX + latestSlot);
      if (!s) return null;
      const raw = JSON.parse(s);
      // マイグレーション（削除済みクイズタイプの除去など）
      const migrated = migrateSaveData(raw);
      return migrated as unknown as SaveData;
    }
  } catch {}
  return null;
}

/* -------------------- BrainQuiz Pane -------------------- */
function BrainQuizPane({
  quiz,
  timeMax,
  timeLeft,
  onTick,
  onSubmit,
  onGiveup,
}: {
  quiz: Quiz;
  timeMax: number;
  timeLeft: number;
  onTick: () => void;
  onSubmit: (ok: boolean, scratch: Scratch) => void;
  onGiveup: () => void;
}) {
  const [scratch, setScratch] = useState<Scratch>({ val: "", sel: [], seq: [], seqIds: [] });

  useEffect(() => {
    const id = setInterval(onTick, 100);
    return () => clearInterval(id);
  }, [onTick]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (quiz.ui.kind !== "input") return;
      if (e.key === "Enter") {
        onSubmit(checkAnswer(quiz, scratch), scratch);
        return;
      }
      if (/^\d$/.test(e.key)) {
        setScratch((s) => ({ ...s, val: (s.val + e.key).slice(0, 6) }));
      }
      if (e.key === "Backspace") {
        setScratch((s) => ({ ...s, val: s.val.slice(0, -1) }));
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [quiz, scratch, onSubmit]);

  const pct = Math.max(0, Math.min(100, (timeLeft / timeMax) * 100));
  const elapsed = timeMax - timeLeft;
  const speedTarget = timeMax * 0.5;
  const isFast = elapsed < speedTarget;

  return (
    <div className="quizWrap">
      <div className="timerBar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="quizTimeInfo">
        <span className={isFast ? "timeElapsed fast" : "timeElapsed"}>{elapsed.toFixed(1)}秒</span>
        <span className="timeTarget">⚡目標: {speedTarget.toFixed(0)}秒以下</span>
        <span className="timeLeft">{timeLeft.toFixed(1)}秒</span>
      </div>
      <div className="prompt">{quiz.prompt}</div>
      {quiz.expr && <div className="expr">{quiz.expr}</div>}

      <div className="dyn">
        {quiz.ui.kind === "choices2" && (
          <div className="twoChoices">
            <button onClick={() => onSubmit(quiz.answer === "L", scratch)}>
              {(quiz.ui as any).left}
            </button>
            <button onClick={() => onSubmit(quiz.answer === "R", scratch)}>
              {(quiz.ui as any).right}
            </button>
          </div>
        )}
        {quiz.ui.kind === "chips" && (
          <div className="chips">
            {(quiz.ui as any).chips.map((c: Chip) => {
              const selected = scratch.sel.find((x) => x.id === c.id);
              return (
                <button
                  key={c.id}
                  className={`chip ${selected ? "sel" : ""}`}
                  onClick={() => {
                    setScratch((s) => {
                      const i = s.sel.findIndex((x) => x.id === c.id);
                      const sel = [...s.sel];
                      if (i >= 0) sel.splice(i, 1);
                      else if (sel.length < 2) sel.push(c);
                      return { ...s, sel };
                    });
                  }}
                >
                  {c.text}
                </button>
              );
            })}
          </div>
        )}

        {quiz.ui.kind === "chips-order" && (
          <div className="chipsOrderWrap">
            <div className="chips">
              {(quiz.ui as any).chips.map((c: Chip) => {
                const disabled = scratch.seqIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className={`chip ${disabled ? "disabled" : ""}`}
                    onClick={() => {
                      if (disabled) return;
                      setScratch((s) => ({ ...s, seq: [...s.seq, c.value], seqIds: [...s.seqIds, c.id] }));
                    }}
                  >
                    {c.text}
                  </button>
                );
              })}
            </div>
            {/* 選択済みの順序と編集（誤り対応） */}
            <div className="chips picked" style={{ marginTop: 8 }}>
              {scratch.seqIds.map((id, idx) => {
                const ch = (quiz.ui as any).chips.find((x: Chip) => x.id === id);
                if (!ch) return null;
                return (
                  <button
                    key={`${id}-${idx}`}
                    className="chip sel"
                    title="この選択を取り消す"
                    onClick={() => {
                      setScratch((s) => {
                        const i = s.seqIds.indexOf(id);
                        if (i < 0) return s;
                        const seqIds = [...s.seqIds];
                        const seq = [...s.seq];
                        seqIds.splice(i, 1);
                        seq.splice(i, 1);
                        return { ...s, seq, seqIds };
                      });
                    }}
                  >
                    {ch.text} ✕
                  </button>
                );
              })}
            </div>
            <div className="gBtns" style={{ marginTop: 8 }}>
              <button className="ghost" onClick={() => setScratch((s) => ({ ...s, seq: [], seqIds: [] }))}>全消去</button>
              <button className="ghost" onClick={() => setScratch((s) => ({ ...s, seq: s.seq.slice(0, -1), seqIds: s.seqIds.slice(0, -1) }))}>ひとつ戻す</button>
            </div>
          </div>
        )}

        {quiz.ui.kind === "input" && (
          <div className="keypad">
            <div className="screen">{scratch.val}</div>
            <div className="keys">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "OK"].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === "←") {
                      setScratch((s) => ({ ...s, val: s.val.slice(0, -1) }));
                    } else if (k === "OK") {
                      onSubmit(checkAnswer(quiz, scratch), scratch);
                    } else {
                      setScratch((s) =>
                        s.val.length >= 6 ? s : { ...s, val: s.val + k }
                      );
                    }
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="quizBtns">
        <button className="ghost" onClick={onGiveup}>
          スキップ
        </button>
        {quiz.ui.kind !== "choices2" && (
          <button onClick={() => onSubmit(checkAnswer(quiz, scratch), scratch)}>
            決定
          </button>
        )}
      </div>

      {quiz.note && <div className="note">{quiz.note}</div>}
    </div>
  );
}

/* -------------------- Overlay -------------------- */
function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // オーバーレイを開いた直後のクリック（Dパッド等のPointerUpに伴うクリック抜け）で
  // 即座に閉じないよう、短時間は背景クリックを無視するガードを入れる
  const [armed, setArmed] = React.useState(false);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", f);
    // 250ms後に閉じ処理を有効化
    const t = setTimeout(() => setArmed(true), 250);
    return () => {
      window.removeEventListener("keydown", f);
      clearTimeout(t);
    };
  }, [onClose]);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        // 開いた直後は無視
        if (!armed) return;
        onClose();
      }}
      onMouseDown={(e) => {
        // 開いた直後のmousedownも念のため無視
        if (!armed) e.stopPropagation();
      }}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panelHead">
          <h3>{title}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="panelBody">{children}</div>
      </div>
    </div>
  );
}