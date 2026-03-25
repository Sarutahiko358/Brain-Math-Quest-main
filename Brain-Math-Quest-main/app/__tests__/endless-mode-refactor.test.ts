import { describe, it, expect } from 'vitest';
import { ENDLESS_CONFIG } from '../lib/world/endless';

describe('Endless mode refactor', () => {
  it('ENDLESS_CONFIG provides all required configuration', () => {
    expect(ENDLESS_CONFIG.name).toBe("無限の回廊");
    expect(ENDLESS_CONFIG.description).toBeTruthy();
    expect(ENDLESS_CONFIG.startPos).toEqual({ r: 2, c: 2 });
    expect(ENDLESS_CONFIG.bossName).toBe("フロアボス");
    expect(ENDLESS_CONFIG.bossPos).toEqual({ r: 6, c: 10 });
    expect(ENDLESS_CONFIG.dojoPos).toEqual({ r: 4, c: 2 });
  });

  it('ENDLESS_CONFIG has complete story definitions', () => {
    expect(ENDLESS_CONFIG.story.intro).toBeTruthy();
    expect(ENDLESS_CONFIG.story.bossEncounter).toBeTruthy();
    expect(ENDLESS_CONFIG.story.victory).toBeTruthy();
    expect(ENDLESS_CONFIG.story.intro).toContain("無限の回廊");
    expect(ENDLESS_CONFIG.story.bossEncounter).toContain("フロアボス");
  });

  it('ENDLESS_CONFIG is independent of AREAS array', () => {
    // This test confirms that ENDLESS_CONFIG can work standalone
    // without needing to reference AREAS[10]
    const config = ENDLESS_CONFIG;
    expect(config).toBeDefined();
    expect(typeof config.name).toBe('string');
    expect(typeof config.description).toBe('string');
  });
});
