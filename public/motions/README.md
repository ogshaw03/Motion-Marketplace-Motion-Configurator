# Motion Assets

各Motion商品の GLB ファイルをここに配置します。

## 命名規約

```
public/motions/<motion-id>.glb
```

`<motion-id>` は `src/db.ts` の `motions[].id` と一致させる。
例: `public/motions/anime-run.glb`

## 内容

- **AnimationClip 1本のみ**（`AnimationClip[0]`）
- ボーン名は Character と完全一致（Mixamo互換）
- Mesh を含めても構わないが Runtime では無視される

## Root Motion

- 移動を伴うMotion（Run, Jump, Skid Stopなど）は `mixamorig:Hips`（or `Hips`）の translation にワールド移動を焼き込む
- In-Place版は translation を除去した派生クリップとして別ファイルで用意
  例: `anime-run.glb`（Root Motion版） / `anime-run-inplace.glb`（In-Place版）

## Runtime での参照

現在は `src/db.ts` の各Motionに `motionUrl?: string` を追加すると、
Configuratorのプレビューがそのファイルからクリップを読み込んで再生します（未指定ならプロシージャル）。
