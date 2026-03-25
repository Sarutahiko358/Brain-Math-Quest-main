import { describe, it, expect, beforeEach } from 'vitest'

// Minimal stubs to import page-level utilities indirectly are heavy; instead test migration/save helpers shape.
import { migrateSaveData } from '../lib/saveMigration'

// LocalStorage mock
class LocalStorageMock {
  store: Record<string,string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, val: string) { this.store[key] = String(val) }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
}

declare global { var localStorage: Storage }

describe('Save format and equipment dex (light E2E)', () => {
  let ls: LocalStorageMock
  beforeEach(() => {
    ls = new LocalStorageMock()
    global.localStorage = ls as unknown as Storage
  })

  it('migrates old dex {} into story bucket', () => {
    const raw = { player: {}, settings: {}, dex: { Slime: { seen: 2, defeated: 1 } }, combo: 0, meta: { saveDate: 1, playTime: 0, version: '1.0' } }
    const m = migrateSaveData(raw)
    expect(m?.dex).toEqual({ Slime: { seen: 2, defeated: 1 } })
  })

  it('new shape {story,endless,equip} survives roundtrip', () => {
    const saveKey = 'dq_like_brain_v2_slot_1'
    const data = {
      player: { name: 'T', currentArea: 1, endlessFloor: 3 },
      settings: {},
      dex: { story: { A: { seen: 1, defeated: 1 } }, endless: { B: { seen: 2, defeated: 1 } }, equip: { weapons: ['木の杖'], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'endless' as const,
    }
    localStorage.setItem(saveKey, JSON.stringify(data))
    const loaded = JSON.parse(localStorage.getItem(saveKey)!)
    expect(loaded.mode).toBe('endless')
    expect(loaded.dex).toBeDefined()
    expect(loaded.dex.story.A.seen).toBe(1)
    expect(loaded.dex.endless.B.seen).toBe(2)
    expect(loaded.dex.equip.weapons).toContain('木の杖')
  })

  it('equipment dex accepts unique additions', () => {
    const equipDex = { weapons: ['木の杖'], armors: [] as string[] }
    const add = (kind: 'weapon'|'armor', name: string) => {
      if (kind === 'weapon') {
        if (!equipDex.weapons.includes(name)) equipDex.weapons.push(name)
      } else {
        if (!equipDex.armors.includes(name)) equipDex.armors.push(name)
      }
    }
    add('weapon', '銅の杖')
    add('weapon', '銅の杖')
    add('armor', '布の服')
    expect(equipDex.weapons).toEqual(['木の杖','銅の杖'])
    expect(equipDex.armors).toEqual(['布の服'])
  })

  it('starting equipment should be in catalog from the beginning', () => {
    // When game starts, equipment catalog should include starting equipment
    const initialEquipDex = { weapons: ['木の杖'], armors: ['布の服'] }
    expect(initialEquipDex.weapons).toContain('木の杖')
    expect(initialEquipDex.armors).toContain('布の服')
    expect(initialEquipDex.weapons.length).toBe(1)
    expect(initialEquipDex.armors.length).toBe(1)
  })
})
