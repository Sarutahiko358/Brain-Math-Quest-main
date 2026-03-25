
// =========================
// 敵型定義
// =========================
export type Enemy = {
  name: string;
  emoji: string;
  imageUrl: string; // 画像のパス（/images/enemies/配下）
  hp: number;
  maxHP: number;
  atk: number;
  minLevel: number; // 出現する最小レベル
  maxLevel: number; // 出現する最大レベル
  area?: number; // 出現するエリア(マップ)番号
  boss?: boolean;
  renderSize?: number; // バトル画面での表示サイズ(px)
};

// =========================
// フィールド敵（エリア・レベル順）
// =========================
export const ENEMY_POOL: Enemy[] = [
  // エリア1: 草原の村周辺 (Lv 1-3)
  { name: "スライム", emoji: "🟢", imageUrl: "/images/enemies/mob/slime.png", hp: 12, maxHP: 12, atk: 4, minLevel: 1, maxLevel: 3, area: 1, renderSize: 90 },
  { name: "プチスライム", emoji: "🟩", imageUrl: "/images/enemies/mob/slime-small.png", hp: 8, maxHP: 8, atk: 3, minLevel: 1, maxLevel: 2, area: 1, renderSize: 70 },
  { name: "コウモリ", emoji: "🦇", imageUrl: "/images/enemies/mob/bat.png", hp: 14, maxHP: 14, atk: 5, minLevel: 1, maxLevel: 4, area: 1, renderSize: 80 },
  { name: "いもむし", emoji: "🐛", imageUrl: "/images/enemies/mob/caterpillar.png", hp: 10, maxHP: 10, atk: 3, minLevel: 1, maxLevel: 3, area: 1, renderSize: 80 },
  // エリア1-2: 森の入り口 (Lv 3-6)
  { name: "オオカミ", emoji: "🐺", imageUrl: "/images/enemies/mob/wolf.png", hp: 20, maxHP: 20, atk: 7, minLevel: 3, maxLevel: 6, area: 1, renderSize: 110 },
  { name: "大ネズミ", emoji: "🐀", imageUrl: "/images/enemies/mob/rat.png", hp: 18, maxHP: 18, atk: 6, minLevel: 3, maxLevel: 6, area: 1, renderSize: 80 },
  { name: "キノコ戦士", emoji: "🍄", imageUrl: "/images/enemies/mob/mushroom-warrior.png", hp: 22, maxHP: 22, atk: 7, minLevel: 4, maxLevel: 7, area: 1, renderSize: 100 },

  // エリア2: 深い森 (Lv 5-9)
  { name: "オーク", emoji: "👹", imageUrl: "/images/enemies/mob/orc.png", hp: 28, maxHP: 28, atk: 9, minLevel: 5, maxLevel: 9, area: 2, renderSize: 120 },
  { name: "ゴブリン", emoji: "👺", imageUrl: "/images/enemies/mob/goblin.png", hp: 26, maxHP: 26, atk: 8, minLevel: 5, maxLevel: 8, area: 2, renderSize: 100 },
  { name: "毒蜘蛛", emoji: "🕷️", imageUrl: "/images/enemies/mob/spider-poison.png", hp: 24, maxHP: 24, atk: 10, minLevel: 5, maxLevel: 9, area: 2, renderSize: 90 },
  { name: "トカゲ戦士", emoji: "🦎", imageUrl: "/images/enemies/mob/lizard-warrior.png", hp: 30, maxHP: 30, atk: 10, minLevel: 6, maxLevel: 10, area: 2, renderSize: 110 },
  { name: "森の魔女", emoji: "🧙‍♀️", imageUrl: "/images/enemies/mob/witch-forest.png", hp: 25, maxHP: 25, atk: 11, minLevel: 7, maxLevel: 10, area: 2, renderSize: 120 },

  // エリア3: 洞窟 (Lv 8-12)
  { name: "リザードマン", emoji: "🦖", imageUrl: "/images/enemies/mob/lizardman.png", hp: 35, maxHP: 35, atk: 12, minLevel: 8, maxLevel: 12, area: 3, renderSize: 120 },
  { name: "ストーンゴーレム", emoji: "🗿", imageUrl: "/images/enemies/mob/golem-stone.png", hp: 42, maxHP: 42, atk: 11, minLevel: 9, maxLevel: 13, area: 3, renderSize: 140 },
  { name: "洞窟グマ", emoji: "🐻", imageUrl: "/images/enemies/mob/bear-cave.png", hp: 38, maxHP: 38, atk: 13, minLevel: 8, maxLevel: 12, area: 3, renderSize: 130 },
  { name: "ガイコツ", emoji: "💀", imageUrl: "/images/enemies/mob/skeleton.png", hp: 32, maxHP: 32, atk: 14, minLevel: 9, maxLevel: 13, area: 3, renderSize: 110 },
  // （移動）火炎コウモリは火山地帯へ

  // エリア4: 火山地帯 (Lv 11-15)
  { name: "ファイアドレイク", emoji: "�", imageUrl: "/images/enemies/mob/drake-fire.png", hp: 48, maxHP: 48, atk: 16, minLevel: 11, maxLevel: 15, area: 4, renderSize: 140 },
  { name: "溶岩スライム", emoji: "�", imageUrl: "/images/enemies/mob/slime-lava.png", hp: 40, maxHP: 40, atk: 15, minLevel: 11, maxLevel: 15, area: 4, renderSize: 100 },
  { name: "炎の精霊", emoji: "�", imageUrl: "/images/enemies/mob/spirit-fire.png", hp: 38, maxHP: 38, atk: 17, minLevel: 12, maxLevel: 16, area: 4, renderSize: 110 },
  { name: "マグマゴーレム", emoji: "🌋", imageUrl: "/images/enemies/mob/golem-magma.png", hp: 52, maxHP: 52, atk: 16, minLevel: 13, maxLevel: 16, area: 4, renderSize: 150 },
  { name: "火炎コウモリ", emoji: "🔥", imageUrl: "/images/enemies/mob/bat-fire.png", hp: 30, maxHP: 30, atk: 15, minLevel: 11, maxLevel: 15, area: 4, renderSize: 90 },

  // エリア5: 氷の大地 (Lv 14-18)
  { name: "アイスウルフ", emoji: "🐺", imageUrl: "/images/enemies/mob/wolf-ice.png", hp: 50, maxHP: 50, atk: 18, minLevel: 14, maxLevel: 18, area: 5, renderSize: 120 },
  { name: "雪男", emoji: "⛄", imageUrl: "/images/enemies/mob/yeti.png", hp: 55, maxHP: 55, atk: 19, minLevel: 15, maxLevel: 19, area: 5, renderSize: 130 },
  { name: "氷の魔術師", emoji: "🧊", imageUrl: "/images/enemies/mob/mage-ice.png", hp: 48, maxHP: 48, atk: 21, minLevel: 15, maxLevel: 19, area: 5, renderSize: 110 },
  { name: "フロストドラゴン", emoji: "❄️", imageUrl: "/images/enemies/mob/dragon-frost.png", hp: 58, maxHP: 58, atk: 20, minLevel: 16, maxLevel: 20, area: 5, renderSize: 160 },

  // エリア6: 魔王城周辺 (Lv 17-20)
  { name: "ダークナイト", emoji: "⚔️", imageUrl: "/images/enemies/mob/knight-dark.png", hp: 60, maxHP: 60, atk: 22, minLevel: 17, maxLevel: 20, area: 6, renderSize: 130 },
  { name: "デビルサージェント", emoji: "😈", imageUrl: "/images/enemies/mob/devil-sergeant.png", hp: 58, maxHP: 58, atk: 23, minLevel: 18, maxLevel: 20, area: 6, renderSize: 110 },
  { name: "ヘルハウンド", emoji: "🐕", imageUrl: "/images/enemies/mob/hellhound.png", hp: 55, maxHP: 55, atk: 24, minLevel: 18, maxLevel: 20, area: 6, renderSize: 120 },
  { name: "闇の司祭", emoji: "🧛", imageUrl: "/images/enemies/mob/priest-dark.png", hp: 52, maxHP: 52, atk: 25, minLevel: 19, maxLevel: 20, area: 6, renderSize: 110 },

  // ステージ7: 試練の塔 フィールド敵
  { name: "シャドウナイト", emoji: "🗡️", imageUrl: "/images/enemies/mob/shadow-knight.png", hp: 90, maxHP: 90, atk: 28, minLevel: 18, maxLevel: 20, area: 7, renderSize: 140 },
  { name: "フレイムドラゴン", emoji: "🔥🐉", imageUrl: "/images/enemies/mob/flame-dragon-ex.png", hp: 110, maxHP: 110, atk: 32, minLevel: 19, maxLevel: 20, area: 7, renderSize: 170 },

  // ステージ8: 虚空の間 フィールド敵
  { name: "ダークスピリット", emoji: "👻", imageUrl: "/images/enemies/mob/dark-spirit-ex.png", hp: 120, maxHP: 120, atk: 36, minLevel: 20, maxLevel: 20, area: 8, renderSize: 120 },
  { name: "ヴォイドキングの影", emoji: "🕳️", imageUrl: "/images/enemies/mob/void-king-shadow.png", hp: 140, maxHP: 140, atk: 38, minLevel: 20, maxLevel: 20, area: 8, renderSize: 150 },
];

// =========================
// ボス敵（エリア順）
// =========================
export const BOSS_POOL: Enemy[] = [
  // エリア1ボス
  { name: "巨大スライム", emoji: "🟢👑", imageUrl: "/images/enemies/boss/Giant-Slime.png", hp: 40, maxHP: 40, atk: 10, minLevel: 1, maxLevel: 5, area: 1, boss: true, renderSize: 150 },
  // エリア2ボス
  { name: "オークキング", emoji: "👹👑", imageUrl: "/images/enemies/boss/Oak-King.png", hp: 60, maxHP: 60, atk: 14, minLevel: 5, maxLevel: 10, area: 2, boss: true, renderSize: 160 },
  // エリア3ボス
  { name: "洞窟の主", emoji: "🦖👑", imageUrl: "/images/enemies/boss/Cave-Master.png", hp: 80, maxHP: 80, atk: 18, minLevel: 8, maxLevel: 13, area: 3, boss: true, renderSize: 170 },
  // エリア4ボス
  { name: "炎龍ヴォルカノ", emoji: "🐲👑", imageUrl: "/images/enemies/boss/Flame-Dragon-Volcano.png", hp: 100, maxHP: 100, atk: 22, minLevel: 11, maxLevel: 16, area: 4, boss: true, renderSize: 180 },
  // エリア5ボス
  { name: "氷帝フリーザー", emoji: "❄️👑", imageUrl: "/images/enemies/boss/Hyoutei-Freezer.png", hp: 120, maxHP: 120, atk: 26, minLevel: 14, maxLevel: 19, area: 5, boss: true, renderSize: 170 },
  // エリア6ボス（最終ボス）
  { name: "魔王ダークロード", emoji: "😈👑", imageUrl: "/images/enemies/boss/Demon-King-Dark-Lord.png", hp: 150, maxHP: 150, atk: 30, minLevel: 17, maxLevel: 20, area: 6, boss: true, renderSize: 200 },
  // 任意の終盤ステージ用 四聖獣
  { name: "玄武", emoji: "🐢👑", imageUrl: "/images/enemies/boss/genbu.png", hp: 170, maxHP: 170, atk: 32, minLevel: 18, maxLevel: 20, area: 7, boss: true, renderSize: 170 },
  { name: "青龍", emoji: "🐉👑", imageUrl: "/images/enemies/boss/seiryu.png", hp: 180, maxHP: 180, atk: 35, minLevel: 18, maxLevel: 20, area: 7, boss: true, renderSize: 180 },
  { name: "朱雀", emoji: "🕊️👑", imageUrl: "/images/enemies/boss/suzaku.png", hp: 165, maxHP: 165, atk: 33, minLevel: 18, maxLevel: 20, area: 7, boss: true, renderSize: 160 },
  { name: "白虎", emoji: "🐯👑", imageUrl: "/images/enemies/boss/byakko.png", hp: 175, maxHP: 175, atk: 34, minLevel: 18, maxLevel: 20, area: 7, boss: true, renderSize: 170 },
  // 裏ボス（エリア8）
  { name: "虚空の王", emoji: "🕳️👑", imageUrl: "/images/enemies/boss/void-king.png", hp: 220, maxHP: 220, atk: 40, minLevel: 20, maxLevel: 20, area: 8, boss: true, renderSize: 200 },
  // ボスの間（エリア9）専用 伝説の神獣
  { name: "九尾の麒麟", emoji: "🦄🔥", imageUrl: "/images/enemies/boss/kirin-nine-tails.png", hp: 260, maxHP: 260, atk: 45, minLevel: 20, maxLevel: 20, area: 9, boss: true, renderSize: 200 },

  // =========================
  // ライブラリモード用ボス
  // =========================
  // エリア1: 数の門
  { name: "初級試験官", emoji: "📝", imageUrl: "/images/enemies/lib/beginner-examiner.png", hp: 50, maxHP: 50, atk: 12, minLevel: 1, maxLevel: 5, boss: true, renderSize: 140 },
  // エリア2: 加算の草原
  { name: "足し算の導師", emoji: "➕🧙", imageUrl: "/images/enemies/lib/addition-master.png", hp: 70, maxHP: 70, atk: 16, minLevel: 5, maxLevel: 10, boss: true, renderSize: 150 },
  // エリア3: 減算の森
  { name: "引き算の賢者", emoji: "➖🧙‍♂️", imageUrl: "/images/enemies/lib/subtraction-sage.png", hp: 90, maxHP: 90, atk: 20, minLevel: 8, maxLevel: 13, boss: true, renderSize: 160 },
  // エリア4: 乗算の山
  { name: "掛け算の戦士", emoji: "✖️⚔️", imageUrl: "/images/enemies/lib/multiplication-warrior.png", hp: 110, maxHP: 110, atk: 24, minLevel: 11, maxLevel: 16, boss: true, renderSize: 170 },
  // エリア5: 除算の谷
  { name: "割り算の術師", emoji: "➗🎩", imageUrl: "/images/enemies/lib/division-magician.png", hp: 130, maxHP: 130, atk: 28, minLevel: 14, maxLevel: 19, boss: true, renderSize: 160 },
  // エリア6: 四則の神殿
  { name: "四則演算の大師", emoji: "🐢🐉🦅🐯", imageUrl: "/images/enemies/lib/four-operations-grandmaster.png", hp: 160, maxHP: 160, atk: 32, minLevel: 18, maxLevel: 20, boss: true, renderSize: 190 },
  // エリア7: 分数の迷宮
  { name: "分数の魔導士", emoji: "🔢🧙‍♀️", imageUrl: "/images/enemies/lib/fraction-mage.png", hp: 180, maxHP: 180, atk: 36, minLevel: 19, maxLevel: 20, boss: true, renderSize: 170 },
  // エリア8: 方程式の塔
  { name: "代数の統括者", emoji: "🦄", imageUrl: "/images/enemies/lib/algebra-overseer.png", hp: 210, maxHP: 210, atk: 40, minLevel: 20, maxLevel: 20, boss: true, renderSize: 180 },
  // エリア9: 数の玉座
  { name: "数の支配者", emoji: "👑🔢", imageUrl: "/images/enemies/lib/number-ruler.png", hp: 250, maxHP: 250, atk: 45, minLevel: 20, maxLevel: 20, boss: true, renderSize: 200 },
];

// =========================
// 敵名リスト
// =========================
export const ENEMY_NAMES = Array.from(new Set([...ENEMY_POOL, ...BOSS_POOL].map(e => e.name)));
