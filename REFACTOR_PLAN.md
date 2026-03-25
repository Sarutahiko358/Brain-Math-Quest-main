# Brain Math Quest リファクタリング計画

> このドキュメントはチャットを跨いでリファクタリングの進捗を引き継ぐためのものです。
> 各フェーズ完了時にチェックを入れ、コミットしてください。
> 新しいチャットを始める際は、このファイルの内容をAIに共有してください。

---

## 現状サマリー（2026-03-25 時点）

- **メインコンポーネント:** `app/game/DQBrain.tsx`（約39KB、983行の関数、complexity 44）
- **技術スタック:** Next.js 15 / React 18 / TypeScript / Vitest
- **根本問題:** DQBrain.tsx が God Component。22個のhandlerファイルに関数を外出ししたが、DQBrain内で全てを useCallback + deps オブジェクト手組みで再ラップしており実質的に軽くなっていない
- **ファイル数の問題:** handlers 22個（うち1KB以下が多数）、hooks 14個（2箇所に分散）、overlays 16個 — 過度な細分化

---

## フェーズ一覧と進捗

### Phase 1: handlers/ の統合（22ファイル → 7ファイル）
> ロジック変更なし。ファイル結合 + import パス書き換えのみ。

- [x] **1-1.** `battleHandlers.ts` を作成（以下を統合）
  - `handleBattleItemUse.ts` (1.7KB)
  - `handleBattleLog.ts` (1.5KB)
  - `handleEnemyStrike.ts` (2KB)
  - `handleSkillOrMagic.ts` (3.8KB)
  - `handleStartBrainQuiz.ts` (2.4KB)
  - `handleStartEncounter.ts`
  - `handleQuizResult.ts` (4KB)
  - `handleExpGoldReward.ts` (1.8KB)
  - `battleAnimations.ts` (3.6KB)
  - `comboManager.ts` (3.2KB)
  - `bossVictoryProcessor.ts` (14KB)
  - `actionHandlers.ts` (1.4KB)
  - `actions/` ディレクトリの中身
- [x] **1-2.** `saveHandlers.ts` を作成（以下を統合）
  - `handleSaveOperations.ts` (2.8KB)
  - `handleLoadOperations.ts` (2.4KB)
  - `handleDeleteSlot.ts` (662B)
  - `handleExportSave.ts` (1.2KB)
  - `handleImportSave.ts` (968B)
- [x] **1-3.** `fieldHandlers.ts` を作成（以下を統合）
  - `handleFieldActions.ts` (3.4KB)
  - `handleShopActions.ts` (4.2KB)
  - `handleEquipAccessory.ts` (743B)
- [x] **1-4.** `navigationHandlers.ts` を作成（以下を統合）
  - `handleChangeStage.ts` (1.8KB)
  - `handleChangeFloor.ts` (1KB)
  - `handleTryMove.ts`
  - `handleResetGame.ts` (3.4KB)
- [x] **1-5.** `brainOnlyHandlers.ts` を作成（以下を統合）
  - `handleBrainOnlyResult.ts` (2.8KB)
  - `handleStartBrainOnlyQuiz.ts` (1.7KB)
- [x] **1-6.** `uiHandlers.ts` を作成（以下を統合）
  - `handleConfirmDialog.ts` (1.1KB)
  - `handleVibration.ts`
- [x] **1-7.** `handleSoundEffects.ts` はそのまま残す
- [x] **1-8.** DQBrain.tsx の import パスを全て新ファイルに書き換え
- [x] **1-9.** 元の個別ファイルを全て削除
- [x] **1-10.** `npm run typecheck` 通過確認
- [x] **1-11.** `npm test` 通過確認
- [x] **1-12.** テストファイル（`handlers/__tests__/`）も統合先に合わせてリネーム
- [x] **1-13.** コミット: `refactor: handlers/ を22ファイルからドメイン別7ファイルに統合`

**Phase 1 完了後の handlers/ 構成:**
```
app/game/handlers/
├── battleHandlers.ts
├── saveHandlers.ts
├── fieldHandlers.ts
├── navigationHandlers.ts
├── brainOnlyHandlers.ts
├── uiHandlers.ts
├── handleSoundEffects.ts
└── __tests__/
```

---

### Phase 2: hooks/ の統合（14ファイル → 6ファイル）
> app/hooks/（10個）と app/game/hooks/（4個）を app/game/hooks/ に集約

- [ ] **2-1.** `useInputControls.ts` を作成（以下を統合）
  - `app/hooks/useKeyboardControls.ts` (4.8KB)
  - `app/hooks/useGamepadControls.ts` (8.4KB)
- [ ] **2-2.** `usePadControls.ts` を作成（以下を統合）
  - `app/hooks/usePadDrag.ts` (1.6KB)
  - `app/hooks/usePadRepeat.ts` (1.4KB)
  - `app/hooks/usePadOverlapDetection.ts` (3.5KB)
- [ ] **2-3.** `useGameData.ts` を作成（以下を統合）
  - `app/game/hooks/useSaveData.ts` (4KB)
  - `app/game/hooks/useSettingsSync.ts` (1.2KB)
  - `app/game/hooks/useDexManagement.ts` (1.7KB)
- [ ] **2-4.** 以下はそのまま残す（サイズ十分 or 独立性高い）
  - `app/hooks/useUIState.ts` (5.2KB) → `app/game/hooks/useUIState.ts` に移動
  - `app/hooks/useBrainOnlyMode.ts` (4.4KB) → `app/game/hooks/useBrainOnlyMode.ts` に移動
  - `app/hooks/useGameState.ts` (11.9KB) → `app/game/hooks/useGameState.ts` に移動
  - `app/hooks/usePlayTime.ts` (844B) → `useGameData.ts` に統合
  - `app/hooks/useWorld.ts` (943B) → `useGameData.ts` に統合
  - `app/game/hooks/useFirstRunLayout.ts` (2.5KB) → `useGameData.ts` に統合
- [ ] **2-5.** `app/hooks/` ディレクトリを削除（全て app/game/hooks/ に移動済み）
- [ ] **2-6.** DQBrain.tsx と全コンポーネントの import パスを書き換え
- [ ] **2-7.** `npm run typecheck` 通過確認
- [ ] **2-8.** `npm test` 通過確認
- [ ] **2-9.** コミット: `refactor: hooks/ を14ファイルから6ファイルに統合、app/hooks/ を廃止`

**Phase 2 完了後の hooks/ 構成:**
```
app/game/hooks/
├── useUIState.ts
├── useBrainOnlyMode.ts
├── useGameState.ts
├── useInputControls.ts
├── usePadControls.ts
└── useGameData.ts
```

---

### Phase 3: overlays/ の統合（16ファイル → 6ファイル）
> 関連するオーバーレイ画面をグループ化

- [ ] **3-1.** `BrainOnlyOverlays.tsx` を作成（以下を統合）
  - `BrainOnlyConfigOverlay.tsx` (7.5KB)
  - `BrainOnlyResultOverlay.tsx` (5.6KB)
  - `BrainOnlySetupOverlay.tsx` (9KB)
- [ ] **3-2.** `GameMenuOverlays.tsx` を作成（以下を統合）
  - `MenuOverlay.tsx` (3.7KB)
  - `SaveMenuOverlay.tsx` (4.3KB)
  - `SettingsOverlay.tsx` (1.5KB)
  - `HowToOverlay.tsx` (1.2KB)
- [ ] **3-3.** `TownOverlays.tsx` を作成（以下を統合）
  - `TownOverlay.tsx` (7.3KB)
  - `FieldHealListOverlay.tsx` (2.1KB)
  - `FieldItemListOverlay.tsx` (1.4KB)
- [ ] **3-4.** `LibraryOverlays.tsx` を作成（以下を統合）
  - `DojoOverlay.tsx` (7.5KB)
  - `TeacherOverlay.tsx` (6.1KB)
- [ ] **3-5.** 以下はそのまま残す
  - `StageSelectOverlay.tsx` (5.3KB)
  - `StoryOverlay.tsx` (5.2KB)
  - `BestiaryOverlay.tsx` (3KB)
  - `EquipDexOverlay.tsx` (3.5KB)
- [ ] **3-6.** `OverlaysRenderer.tsx` の import パスを書き換え
- [ ] **3-7.** `npm run typecheck` && `npm test` 通過確認
- [ ] **3-8.** コミット: `refactor: overlays/ を16ファイルから10ファイルに統合`

---

### Phase 4: components/ の整理（app/components/ と app/game/components/ の統合）
> 共通コンポーネントをゲーム内に吸収

- [ ] **4-1.** `app/components/` の全ファイルを `app/game/components/` に移動
- [ ] **4-2.** `app/components/constants/` → `app/game/components/constants/` に移動
- [ ] **4-3.** `app/components/quiz/` → `app/game/components/quiz/` に移動
- [ ] **4-4.** `app/components/result/` → `app/game/components/result/` に移動
- [ ] **4-5.** `app/components/EncounterView/` → `app/game/components/` に移動
- [ ] **4-6.** `app/components/__tests__/` → `app/game/components/__tests__/` に統合
- [ ] **4-7.** `app/components/` ディレクトリを削除
- [ ] **4-8.** 全ファイルの import パスを書き換え
- [ ] **4-9.** `npm run typecheck` && `npm test` 通過確認
- [ ] **4-10.** コミット: `refactor: app/components/ を app/game/components/ に統合`

---

### Phase 5: DQBrain.tsx の分解（God Component 解消）
> これが最終目標。Phase 1〜4 の統合が完了してから着手。

- [ ] **5-1.** `useGameReducer.ts` を作成（player, battle, ui を useReducer で管理）
- [ ] **5-2.** DQBrain.tsx の useState を useGameReducer に置き換え
- [ ] **5-3.** 各 Scene コンポーネントが GameContext から直接 dispatch するように変更
- [ ] **5-4.** DQBrain.tsx を「Context Provider + Scene Switcher」のみ（200行以下）に削減
- [ ] **5-5.** `npm run typecheck` && `npm test` 通過確認
- [ ] **5-6.** コミット: `refactor: DQBrain.tsx をuseReducerベースに分解（39KB → ~8KB）`

---

## 作業ルール

1. **1つのPhaseを1つのPRで完結させる**（混ぜない）
2. **ロジック変更は絶対にしない**（Phase 1〜4 はファイル移動・結合のみ）
3. **毎ステップで `npm run typecheck` と `npm test` を実行**
4. **完了したステップの `[ ]` を `[x]` に変更してコミットに含める**
5. **Phase 5 のみロジック変更を伴う**（Phase 1〜4 完了後に着手）

---

## 進捗ログ

| 日付 | Phase | 内容 | コミットSHA |
|------|-------|------|-------------|
| | | | |

---

## 新しいチャットで引き継ぐ際のテンプレート

```
以下はリファクタリング計画の進捗ドキュメントです。
チェック済みの項目は完了しています。
次の未完了ステップから作業を続けてください。

リポジトリ: https://github.com/Sarutahiko358/Brain-Math-Quest-main
計画書: REFACTOR_PLAN.md の内容を貼り付け

作業ルール:
- ロジック変更はしない（Phase 5以外）
- 毎ステップで typecheck と test を通す
- 完了ステップに [x] を付ける
```
