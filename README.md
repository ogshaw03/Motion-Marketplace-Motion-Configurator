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
