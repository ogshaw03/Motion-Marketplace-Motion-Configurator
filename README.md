# Motion Marketplace / Motion Configurator

Animator-Crafted Motion × Motion Configurator。プロのアニメーターがデザインしたキャラクターモーションを、Web上の3D Configuratorで組み合わせてPreview・購入できるMarketplace。

## 開発

```bash
npm install
npm run dev       # http://127.0.0.1:5173/
npm run build     # dist/ に本番ビルド出力
npm run preview   # 本番ビルドをローカル確認
npm run screenshots  # 各ページのスクショを保存 (scratchpad/screenshots)
```

## 技術構成

- **Vite + Vanilla TypeScript**（React/Vue不使用）
- **Three.js** — 3D Preview の描画とProceduralアニメーション
- **Hash routing**（GitHub Pagesと相性が良い）
- **モックモード**: すべてのデータは `window.DB` にオンメモリ保持。バックエンド無しで動作。Playwright等から `page.evaluate(() => window.DB.motions.push(...))` で状態注入可能。

## デプロイ

`.github/workflows/deploy-pages.yml` によりpush時にGitHub Pagesへ自動デプロイ。

想定URL: `https://ogshaw03.github.io/Motion-Marketplace-Motion-Configurator/`

## 画面構成

- `/#/` — Top
- `/#/motions` — Motions一覧
- `/#/motion/:id` — Motion詳細
- `/#/configurator` — Configurator（3D Preview / Next Motion / Sequence / PLAY ALL）
- `/#/library` — My Motion Library
- `/#/purchase` — Sequence購入（所有済み自動除外）
- `/#/creators` — Creator一覧
- `/#/creator/:id` — Creator詳細

## MVP方針

- Configurator = 選ぶ・組む・試す・買う（Animation Editorにはしない）
- Auto Transition = Phase-aware Blend（AI無し）
- Designed Transition = Animatorがつなぎ方をデザインしたMotion商品
- Compatibility判定はMetadata（Foot Phase / Condition / Speed）ベース
- 全画面モック状態で操作可能。購入・LibraryはLocalStorage未使用のオンメモリ実装

## Transition Model

Motion同士の接続には **Blend Length**（クロスフェード時間）を持たせる。Designed Transition の場合は Motion A → Designed → Motion B の**両端に微小Blend**を挟むことで、
Designed Transitionの開始・終了ポーズと隣接Motionの微妙なズレ（ループ位置差など）を吸収する。

```ts
type Transition =
  | { kind: 'Auto'; blendLengthSec: number }                    // A → B の1本Blend
  | {                                                            // A →[in]→ D →[out]→ B
      kind: 'Designed'
      designedMotionId: string
      inBlendSec: number
      outBlendSec: number
    }
```

### Recommended Blend (Motion Metadata)

各Motionは Creator が「このMotionはこの範囲でBlendするのが自然」というレンジを持つ:

```ts
motion.recommendedBlend = {
  inMinSec, inMaxSec,      // 前のMotion → 自分 の吸収Blend推奨範囲
  outMinSec, outMaxSec,    // 自分 → 次のMotion の吸収Blend推奨範囲
  designerNote?: string,   // 「これ以上長いとAnticipationが薄まる」等の注記
}
```

Configurator の Transition Editor では:
- Blend Lengthスライダー上に **緑帯（Recommended Band）** で推奨レンジを表示（両端Motionのレンジ交差）
- 選択されたDesigned Transitionの `designerNote` があれば表示

### Default Blend Length

- **Auto**: `min(fromMotion.recommendedBlend.outMaxSec, toMotion.recommendedBlend.inMaxSec)`（両端の推奨上限のタイトい方）
- **Designed inBlend**: `min(fromMotion.outMaxSec, designedMotion.inMaxSec)`
- **Designed outBlend**: `min(designedMotion.outMaxSec, toMotion.inMaxSec)`

Sequence Strip の各Transitionノードには数値表示:
- Auto: `0.20s`
- Designed: `0.08 + 0.08s`
