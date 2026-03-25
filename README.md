# Brain Math Quest

ドラクエ風RPG × 計算クイズバトルのブラウザゲーム。
マップを探索し、敵とエンカウントしたら計算クイズに答えて戦う。

---

## 技術スタック

- **フレームワーク:** Next.js 15 (App Router)
- **言語:** TypeScript
- **UI:** React 18
- **テスト:** Vitest + Testing Library
- **Lint:** ESLint 9 (Flat Config)
- **保存:** localStorage（サーバー不要）

---

## セットアップ

```bash
git clone https://github.com/Sarutahiko358/Brain-Math-Quest-main.git
cd Brain-Math-Quest-main
npm install
```

## 開発

```bash
npm run dev          # 開発サーバー起動 (http://localhost:3000)
npm run build        # プロダクションビルド
npm run lint         # Lint実行
npm run typecheck    # 型チェック
```

## テスト

```bash
npm test             # テスト実行
npm run test:watch   # ウォッチモード
npm run test:coverage # カバレッジ付き
```

---

## ゲームモード

| モード | 説明 |
|--------|------|
| **ストーリー** | エリアを順に攻略し、ボスを倒して先に進む |
| **無限の回廊** | ランダム生成マップをひたすら踏破するエンドレスモード |
| **ライブラリ** | 道場・先生など学習特化のモード |
| **脳トレ専用** | RPG要素なしで計算クイズだけを連続で解く |

## クイズタイプ

SUM（合計）/ MISSING（虫食い算）/ COMPARE（大小比較）/ PAIR（ペア探し）/ ORDER（並べ替え）/ MAX_MIN（最大最小）

難易度: easy / normal / hard（設定で変更可能）

---

## ディレクトリ構成

```
root/
├── app/                        # Next.js App Router
│   ├── page.tsx                #   エントリーポイント
│   ├── layout.tsx              #   ルートレイアウト
│   ├── globals.css             #   グローバルCSS
│   │
│   ├── game/                   # ★ ゲーム本体
│   │   ├── DQBrain.tsx         #   メインコンポーネント（God Component ← 要分解）
│   │   ├── initialState.ts     #   初期状態の定義
│   │   ├── types.ts            #   ゲーム固有の型
│   │   ├── utils.ts            #   ゲーム用ユーティリティ
│   │   ├── contexts/           #   GameContext (React Context)
│   │   ├── handlers/           #   イベントハンドラ（バトル、ショップ、セーブ等）
│   │   ├── hooks/              #   ゲーム固有のカスタムフック
│   │   ├── components/         #   ゲーム画面のUIコンポーネント
│   │   ├── scenes/             #   シーン別ビュー（Title, Battle, BrainOnly）
│   │   ├── overlays/           #   オーバーレイUI（メニュー, 設定, 町, 図鑑等）
│   │   └── styles/             #   ゲーム固有のスタイル
│   │
│   ├── components/             # 共通UIコンポーネント
│   │   ├── BrainQuizPane.tsx   #   クイズ出題パネル
│   │   ├── CommandBar.tsx      #   バトルコマンド
│   │   ├── EncounterView.tsx   #   エンカウント画面
│   │   ├── StatusBar.tsx       #   ステータスバー
│   │   ├── PadOverlay.tsx      #   D-Padオーバーレイ
│   │   ├── ResultView.tsx      #   バトル結果表示
│   │   └── Topbar.tsx          #   上部ナビゲーション
│   │
│   ├── hooks/                  # 共通カスタムフック
│   │   ├── useGameState.ts     #   ゲーム状態管理
│   │   ├── useUIState.ts       #   UI状態管理
│   │   ├── useBrainOnlyMode.ts #   脳トレ専用モード
│   │   ├── useKeyboardControls.ts # キーボード操作
│   │   └── useGamepadControls.ts  # ゲームパッド操作
│   │
│   ├── lib/                    # ★ 純粋ロジック（UIに依存しない）
│   │   ├── gameTypes.ts        #   ゲーム共通の型定義
│   │   ├── enemies.ts          #   敵データ
│   │   ├── equipment.ts        #   装備データ
│   │   ├── skills.ts           #   スキル・魔法データ
│   │   ├── settings.ts         #   設定の型と初期値
│   │   ├── saveSystem.ts       #   セーブ/ロード
│   │   ├── battle/             #   バトル計算ロジック
│   │   ├── quiz/               #   クイズ生成ロジック
│   │   └── world/              #   マップ・エリア・エンカウント
│   │
│   └── __tests__/              # 統合テスト
│
├── public/                     # 静的アセット（画像等）
├── package.json
├── tsconfig.json
├── next.config.js
├── eslint.config.mjs
├── vitest.config.ts
└── vitest.config.ci.ts
```

---

## 現在の技術的課題

### 最優先: DQBrain.tsx の分解

`app/game/DQBrain.tsx`（約39KB）が「God Component」になっている。
60以上の useState、40以上の useCallback が1ファイルに集中しており、
変更・テスト・理解のすべてが困難な状態。

**対策方針:**

1. **状態をドメイン別の Reducer に分離する**
   - `playerReducer` — HP, MP, 装備, 位置など
   - `battleReducer` — 敵情報, バトルログ, アニメーション
   - `uiReducer` — メニュー開閉, トースト（既存の useUIState を拡張）
   - `brainOnlyReducer` — 脳トレ専用モード（既存の useBrainOnlyMode を拡張）

2. **Scene ごとにコンテナコンポーネントを作る**
   - 各 Scene が GameContext から必要な state/action だけを取得する
   - DQBrain.tsx は Context Provider + Scene 切り替えだけの薄い層にする

3. **進め方:** 1回のPRで1つの Reducer を切り出すくらいの粒度で段階的に進める

---

## データの保存

- セーブデータは `localStorage` に保存（キー: `dq_like_brain_v1`）
- 複数スロット対応
- エクスポート/インポート機能あり（JSONファイル）

## CI

`.github/workflows/ci.yml` で GitHub Actions による自動テストが設定されている。
