import { describe, it, expect } from 'vitest';
import { createMap, T, hasPath } from '../../lib/world/areas';

describe('areas map POI guard', () => {
  it('does not place walls over POIs and keeps path from town to castle', () => {
    const town = { r: 2, c: 2 };
    const castle = { r: 6, c: 10 };
    const m = createMap({
      waterPattern: 'none',
      townPos: town,
      castlePos: castle,
      wallPositions: [{ r: 2, c: 2 }, { r: 6, c: 10 }] // would overlap POIs
    });
    expect(m[town.r][town.c]).toBe(T.Town);
    expect(m[castle.r][castle.c]).toBe(T.Castle);
    // path existence (borders may block, but default map is open inside)
    expect(hasPath(m, town, castle)).toBe(true);
  });
});
