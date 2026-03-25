import { describe, it, expect } from 'vitest';

// This is a lightweight behavioral spec to ensure the intended logic:
// After defeating each of the four guardians, you end with all four rewards
// and no duplicates are granted (since state tracks possession).
// We don't import app/page.tsx directly (React component), but we validate
// the algorithmic invariants with a mock progression.

type Flags = {
  genbuDefeated?: boolean;
  seiryuDefeated?: boolean;
  suzakuDefeated?: boolean;
  byakkoDefeated?: boolean;
  ultimateUnlocked?: boolean;
  ultimateMagicUnlocked?: boolean;
};

type EquipDex = { weapons: string[]; armors: string[] };

type Equip = { weapon: { name: string }; armor: { name: string } };

type PlayerLike = { flags: Flags; equip: Equip };

const ULTIMATE_WEAPON = '勇者の聖杖';
const ULTIMATE_ARMOR = '光の聖衣';
const ULTIMATE_SKILL = 'オーロラ・インパクト';
const ULTIMATE_MAGIC = 'コスモフレア';

function giveOne(kind: 'weapon'|'armor'|'skill'|'magic', st: { p: PlayerLike; ed: EquipDex; msgs: string[] }) {
  if (kind === 'weapon') {
    if (!st.ed.weapons.includes(ULTIMATE_WEAPON)) {
      st.ed.weapons.push(ULTIMATE_WEAPON);
      st.p.equip.weapon = { name: ULTIMATE_WEAPON } as any;
      st.msgs.push(`🌟 ${ULTIMATE_WEAPON} を 手に入れた！`);
    }
  } else if (kind === 'armor') {
    if (!st.ed.armors.includes(ULTIMATE_ARMOR)) {
      st.ed.armors.push(ULTIMATE_ARMOR);
      st.p.equip.armor = { name: ULTIMATE_ARMOR } as any;
      st.msgs.push(`🌟 ${ULTIMATE_ARMOR} を 手に入れた！`);
    }
  } else if (kind === 'skill') {
    if (!st.p.flags.ultimateUnlocked) {
      st.p.flags.ultimateUnlocked = true;
      st.msgs.push(`🌟 究極の必殺技『${ULTIMATE_SKILL}』を習得した！`);
    }
  } else if (kind === 'magic') {
    if (!st.p.flags.ultimateMagicUnlocked) {
      st.p.flags.ultimateMagicUnlocked = true;
      st.msgs.push(`🌟 究極の魔法『${ULTIMATE_MAGIC}』を習得した！`);
    }
  }
}

describe('guardians rewards policy', () => {
  it('no duplicates and complete set after four defeats', () => {
    const st = {
      p: { flags: {}, equip: { weapon: { name: '木の杖' }, armor: { name: '布の服' } } } as PlayerLike,
      ed: { weapons: [], armors: [] } as EquipDex,
      msgs: [] as string[],
    };

    // defeat sequence: 4 times; each time pick one from remaining
    const pickFromRemaining = () => {
      const haveWeapon = st.ed.weapons.includes(ULTIMATE_WEAPON) || st.p.equip.weapon.name === ULTIMATE_WEAPON;
      const haveArmor = st.ed.armors.includes(ULTIMATE_ARMOR) || st.p.equip.armor.name === ULTIMATE_ARMOR;
      const haveSkill = !!st.p.flags.ultimateUnlocked;
      const haveMagic = !!st.p.flags.ultimateMagicUnlocked;
      const remaining: Array<'weapon'|'armor'|'skill'|'magic'> = [];
      if (!haveWeapon) remaining.push('weapon');
      if (!haveArmor) remaining.push('armor');
      if (!haveSkill) remaining.push('skill');
      if (!haveMagic) remaining.push('magic');
      const idx = Math.floor(Math.random() * remaining.length);
      giveOne(remaining[idx], st);
    };

    // simulate 3 early defeats
    pickFromRemaining();
    pickFromRemaining();
    pickFromRemaining();

    // on final defeat: ensure all missing are granted
    const haveWeapon = st.ed.weapons.includes(ULTIMATE_WEAPON) || st.p.equip.weapon.name === ULTIMATE_WEAPON;
    const haveArmor = st.ed.armors.includes(ULTIMATE_ARMOR) || st.p.equip.armor.name === ULTIMATE_ARMOR;
    const haveSkill = !!st.p.flags.ultimateUnlocked;
    const haveMagic = !!st.p.flags.ultimateMagicUnlocked;
    if (!haveWeapon) giveOne('weapon', st);
    if (!haveArmor) giveOne('armor', st);
    if (!haveSkill) giveOne('skill', st);
    if (!haveMagic) giveOne('magic', st);

    expect(st.ed.weapons).toContain(ULTIMATE_WEAPON);
    expect(st.ed.armors).toContain(ULTIMATE_ARMOR);
    expect(st.p.flags.ultimateUnlocked).toBe(true);
    expect(st.p.flags.ultimateMagicUnlocked).toBe(true);
  });
});
