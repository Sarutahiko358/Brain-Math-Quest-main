/**
 * Movement utilities and adapter
 */

import { T, ROWS, COLS } from './areas.js';
import { clamp } from '../uiLayout.js';

export function calculateNewPosition(currentPos, dr, dc) {
    return {
        r: clamp(currentPos.r + dr, 0, ROWS - 1),
        c: clamp(currentPos.c + dc, 0, COLS - 1),
    };
}

export function isWalkable(tile) {
    return tile !== T.Wall && tile !== T.Water;
}

export function isAtPosition(playerPos, targetPos) {
    return playerPos.r === targetPos.r && playerPos.c === targetPos.c;
}

export function shouldTriggerEncounter(tile, encounterRate) {
    if (tile === T.Town || tile === T.Castle) {
        return false;
    }
    return Math.random() * 100 < encounterRate;
}

export function getSpecialLocationType(tile) {
    if (tile === T.Town) return 'town';
    if (tile === T.Castle) return 'castle';
    return null;
}

export function validateMovement(currentPos, dr, dc, map, encounterRate) {
    const newPos = calculateNewPosition(currentPos, dr, dc);
    const tile = map[newPos.r]?.[newPos.c];

    if (tile === undefined) {
        return {
            allowed: false,
            newPos,
            tile: 0,
            specialLocation: null,
            shouldEncounter: false
        };
    }

    const allowed = isWalkable(tile);
    const specialLocation = getSpecialLocationType(tile);
    const shouldEncounter = allowed && shouldTriggerEncounter(tile, encounterRate);

    return {
        allowed,
        newPos,
        tile,
        specialLocation,
        shouldEncounter
    };
}
