# Character Assets

このディレクトリに **Standard Skeleton (Mixamo互換) 準拠の GLB** を置くと、
Configurator / Motion詳細 / Top hero のプレビューが自動的にそのキャラクターに切り替わります。

## 期待するファイル名

```
public/character/character.glb
```

このパスにファイルがあれば Three.js の GLTFLoader が読み込み、
プロシージャル箱人間に代わって表示されます。

存在しなければ自動的に **箱人間フォールバック** に戻ります（開発中はこの状態でOK）。

## 仕様

`docs/standard-skeleton.md` を参照。要点:

- 1 unit = 1 m（Mayaでcm作業ならExport時にScale 0.01）
- Y-up / -Z forward
- ボーン名は Mixamo互換（`mixamorig:` プレフィックスは付いていてもよい／なくてもよい）
- T-poseバインド
- AnimationClip はキャラGLBには含めない（Motion側で持たせる）
