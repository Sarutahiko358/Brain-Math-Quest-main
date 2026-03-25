/**
 * Equipment data module
 * 
 * Contains all weapons, armors, accessories, tools and related constants.
 * This data is critical to game balance and save compatibility - do not modify values.
 */

import { Weapon, Armor, Tool, Accessory } from './gameTypes';

/* -------------------- Weapons -------------------- */

export const WEAPONS: Weapon[] = [
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
export const ULTIMATE_WEAPON: Weapon = { name: "勇者の聖杖", atk: 26, price: 0 };

/* -------------------- Armors -------------------- */

export const ARMORS: Armor[] = [
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
export const ULTIMATE_ARMOR: Armor = { name: "光の聖衣", def: 24, price: 0 };

/* -------------------- Accessories -------------------- */

// 四聖獣・麒麟の証（アクセサリ）: 常時コンボ+10
export const ACCESSORIES: Accessory[] = [
  { name: "繁盛の青木宝", comboPlus: 10 }, // 青龍
  { name: "繁栄の白金石", comboPlus: 10 }, // 白虎
  { name: "隆盛の朱火玉", comboPlus: 10 }, // 朱雀
  { name: "守護の黒水鉱", comboPlus: 10 }, // 玄武
  { name: "鎮静の黄土珠", comboPlus: 10 }, // 麒麟
];

export const ACC_BY_NAME = Object.fromEntries(ACCESSORIES.map(a => [a.name, a]));

/* -------------------- Tools/Items -------------------- */

export const TOOLS: Tool[] = [
  { name: "やくそう", effect: "heal", amount: 24, price: 20 },
  { name: "マナ草", effect: "mp", amount: 8, price: 25 },
  // 新規追加
  { name: "強ポーション", effect: "heal", amount: 80, price: 120 },
  { name: "コンボの実", effect: "comboUp", amount: 10, price: 90 },
  { name: "コンボのお守り", effect: "comboGuard", amount: 1, price: 120 },
];

/* -------------------- Prices -------------------- */

export const INN_PRICE = 15;

/* -------------------- Ultimate Equipment Upgrade Helpers -------------------- */

import { ultimatePlusName } from './skills';

/**
 * Create upgraded version of ultimate weapon
 * Each +1 adds +2 ATK to the base stats
 * @param plus Enhancement level
 * @returns Upgraded weapon object
 */
export function ultimateWeaponUpgraded(plus: number): Weapon {
  return {
    name: ultimatePlusName(ULTIMATE_WEAPON.name, plus),
    atk: ULTIMATE_WEAPON.atk + plus * 2,
    price: 0
  };
}

/**
 * Create upgraded version of ultimate armor
 * Each +1 adds +2 DEF to the base stats
 * @param plus Enhancement level
 * @returns Upgraded armor object
 */
export function ultimateArmorUpgraded(plus: number): Armor {
  return {
    name: ultimatePlusName(ULTIMATE_ARMOR.name, plus),
    def: ULTIMATE_ARMOR.def + plus * 2,
    price: 0
  };
}
