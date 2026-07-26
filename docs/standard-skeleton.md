# Standard Skeleton (MVP: Mixamo互換)

## 決定事項

- **交換形式**: GLB（Binary glTF）
- **Standard Skeleton**: Mixamo互換ボーン階層
- **Scale**: 1 unit = 1 m（glTF/Three.js標準）
- **Up axis**: +Y up（glTF標準）
- **Front axis**: -Z forward（glTF標準）
- **Frame rate**: 30 fps（Motion Metadata `durationSec` から逆算可能なので固定はしない）
- **顔リグ**: MVPではなし（ボーン / BlendShape 共に）

## ファイル構成

### Character
```
character.glb
 ├─ Mesh (skinned)
 ├─ Skeleton (Mixamo compat, 下記ボーン名参照)
 ├─ Bind pose
 └─ Material + Textures (base64埋め込み)
 * AnimationClip は含めない
```

### Motion
```
<motion-id>.glb
 └─ AnimationClip[0]  (単一クリップ推奨)
     ├─ mixamorig:Hips.position
     ├─ mixamorig:Hips.rotation
     ├─ mixamorig:Spine.rotation
     ...
 * Mesh を含めてもよいが再生時は無視する
 * ボーン名は Character と完全一致すること
```

## ボーン名（Mixamo標準、プレフィックス `mixamorig:` はローダー側で自動除去）

必須:
- `Hips`
- `Spine`, `Spine1`, `Spine2`
- `Neck`, `Head`, `HeadTop_End`
- `LeftShoulder`, `LeftArm`, `LeftForeArm`, `LeftHand`
- `RightShoulder`, `RightArm`, `RightForeArm`, `RightHand`
- `LeftUpLeg`, `LeftLeg`, `LeftFoot`, `LeftToeBase`
- `RightUpLeg`, `RightLeg`, `RightFoot`, `RightToeBase`

オプション（あれば認識、なければ無視）:
- 手指: `LeftHandThumb1/2/3`, `LeftHandIndex1/2/3`, `LeftHandMiddle1/2/3`, `LeftHandRing1/2/3`, `LeftHandPinky1/2/3`（Right側も同様）
- `LeftToeBase_End`, `RightToeBase_End`（つま先端）

追加ボーン（髪・服・武器等）は自由に持たせて構いません。ただしMotion側は追加ボーンを制御しないため、CreatorがMotion内で参照する場合はMetadataに明記が必要です。

## Root Motion

- キャラクターの移動距離は **`Hips` の translation** に焼き込む
- In-Place版は `Hips` の translation を除去した派生クリップとして扱う
- グローバル Root ボーン（Hips の親）は作らない — glTF/Three.js慣習に従い Hips 自体をルートとする

## Bind Pose

- **T-pose** を推奨（A-poseでも可、Motion側と一致していること）
- 全ボーンのローカル回転は 0（identity）
- Motionクリップは bind pose からの相対で書き出す

## Maya 側の書き出し手順（要点）

1. **Scale**: Scene が cm なら Export 時に **Scale factor 0.01** を必ずかける（1 unit = 1 m 化）
2. **Axis**: Maya は Y-up がデフォルトなのでそのまま
3. **Frame Rate**: 30fps推奨（Maya の Preferences → Settings → Working Units → Time = NTSC 30fps）
4. **glTF Exporter**:
   - Maya 2023+ の公式 Autodesk glTF Exporter、または
   - Babylon glTF Exporter、または
   - FBX → GLB 変換（`FBX2glTF` OSS ツール）
5. **Export内容の切り分け**:
   - Character export: **Skin + Mesh + Skeleton のみ**（クリップは含めない）
   - Motion export: **Skeleton + AnimationClip のみ**（Mesh はチェック外す or 後で剥がす）
6. **Bone Names**: Mixamo互換名 or `mixamorig:` プレフィックス付き。Advanced Skeleton や HIK の骨名を Mixamo にリネームするスクリプトを事前に用意することを推奨

## Runtime での扱い（Web / Three.js側）

- **Character**: `GLTFLoader` で読み込み → `SkinnedMesh` を scene に追加
- **Motion**: 別GLBを読み込み → `AnimationClip[0]` を抽出 → `AnimationMixer.clipAction(clip, character)` で再生
- **Blend**: `AnimationAction.crossFadeTo(nextAction, blendLengthSec)` を使用（Auto Transition）
- **Root Motion**: `Hips.position` の XZ 成分を毎フレーム root Object の transform に転写、Hips の position は原点にクランプ（お好みで）

## Buyer Tool（Maya）側

- 購入した Motion Package から `sequence.json` を読み込み、各 Motion GLB を順次バインドされた User Rig に適用
- Standard Skeleton → User Rig の retarget は Maya の HIK もしくは Advanced Skeleton の Motion Transfer を利用

## Motion Metadata との対応

`motion.recommendedBlend` などのメタデータは GLB とは別に、Marketplace のバックエンド or `db.ts` に保持する。GLBはあくまで骨・メッシュ・キーフレームのコンテナ。

## 将来的な拡張候補

- 顔リグ導入時: BlendShape 経由（Mixamo は顔BSを持たないので、独自拡張または VRM 準拠を検討）
- 追加ボーン: 髪・胸・服 → SecondaryBoneMetadata で「物理シミュ or Motion内制御」を宣言
- 複数解像度: LOD0 / LOD1 のGLB切り替え（Web最適化）
