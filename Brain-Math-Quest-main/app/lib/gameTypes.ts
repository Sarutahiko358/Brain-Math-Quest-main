// Common game-wide lightweight type exports
import { Enemy } from './enemies';
import { QuizBundle } from './quiz/types';

// Re-export Enemy type for convenience
export type { Enemy };

export type Difficulty = 'easy' | 'normal' | 'hard';

// Game modes
export type GameMode = 'story' | 'endless' | 'library';

// Scene types
export type Scene = "title" | "map" | "battle" | "result" | "brainOnly";

export type Weapon = { name: string; atk: number; price: number };
export type Armor = { name: string; def: number; price: number };
export type Accessory = { name: string; comboPlus?: number };
export type Tool = { name: string; effect: 'heal' | 'mp' | 'comboUp' | 'comboGuard'; amount: number; price: number; qty?: number };

// Battle state
export type BattleState = {
  enemy: Enemy;
  log: string[];
  queue: string[];
  mode: "select" | "selectSkill" | "selectFireList" | "selectHealList" | "selectItem" | "quiz" | "queue" | "victory";
  quiz?: QuizBundle | null;
  rewards?: { exp: number; gold: number; timeBonus?: number; items?: string[]; levelUp?: { oldLv: number; newLv: number; hpGain: number; mpGain: number; atkGain: number; defGain: number }, levelUpDetails?: { fromLv: number; toLv: number; hp: number; mp: number; atk: number; def: number }[] } | null;
  quizStats: { total: number; correct: number; totalTime: number };
  onVictory?: () => void;
  testMode?: {
    totalQuestions: number;
    requiredCorrect: number;
    questionsAsked: number;
    correctAnswers: number;
  };
};

export type Player = {
	name: string;
	avatar: string;
	lv: number;
	exp: number;
	gold: number;
	maxHP: number;
	hp: number;
	maxMP: number;
	mp: number;
	baseATK: number;
	baseDEF: number;
	equip: { weapon: Weapon; armor: Armor; accessory?: Accessory | null };
	items: Tool[];
	keyItems: string[];
	pos: { r: number; c: number };
	currentArea: number;
	clearedAreas: number[];
	storyShownAreas: number[];
	endlessFloor?: number; // Current floor in endless dungeon mode
	flags?: {
		ultimateUnlocked?: boolean;
		ultimateMagicUnlocked?: boolean;
		genbuDefeated?: boolean;
		seiryuDefeated?: boolean;
		suzakuDefeated?: boolean;
		byakkoDefeated?: boolean;
		comboGuard?: number; // 次のミスでコンボ維持する回数
		// 究極4種の強化段階（+1, +2 ...）
		ultimateWeaponPlus?: number;
		ultimateArmorPlus?: number;
		ultimateSkillPlus?: number;
		ultimateMagicPlus?: number;
	};
};

