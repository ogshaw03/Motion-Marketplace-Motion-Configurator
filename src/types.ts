export type Style = 'Realistic' | 'Stylized' | 'Anime' | 'Cartoon' | 'Cinematic'

export type ProductionMethod =
  | 'Hand-Keyed'
  | 'Mocap + Polish'
  | 'AI Assisted'
  | 'Mocap'

export type MotionCategory =
  | 'Locomotion'
  | 'Action'
  | 'Transition'
  | 'Acting'
  | 'Idle'

export type MotionState =
  | 'Idle'
  | 'Walk'
  | 'Run'
  | 'Stop'
  | 'Turn'
  | 'Jump'
  | 'Landing'
  | 'Attack'
  | 'Recovery'
  | 'Transition'

export type FootPhase = 'LeftContact' | 'RightContact' | 'Airborne' | 'BothContact'

export type Compatibility = 'Excellent' | 'Good' | 'Low'

export interface Creator {
  id: string
  name: string
  displayMode: 'Public' | 'Alias' | 'Private'
  icon: string
  bio: string
  specialty: string[]
}

export interface RecommendedBlend {
  inMinSec: number
  inMaxSec: number
  outMinSec: number
  outMaxSec: number
  designerNote?: string
}

export interface Motion {
  id: string
  name: string
  creatorId: string
  category: MotionCategory
  state: MotionState
  style: Style
  productionMethod: ProductionMethod
  price: number
  loop: boolean
  rootMotion: boolean
  isDesignedTransition: boolean
  from?: MotionState
  to?: MotionState
  description: string
  metadata: {
    speed: number
    direction: 'Forward' | 'Backward' | 'Left' | 'Right' | 'None'
    rootVelocity: number
    startFoot: FootPhase
    endFoot: FootPhase
    startCondition: string
    endCondition: string
    durationSec: number
  }
  recommendedBlend: RecommendedBlend
  animationClipKey: string
  thumbColor: string
}

export type Transition =
  | { kind: 'Auto'; blendLengthSec: number }
  | {
      kind: 'Designed'
      designedMotionId: string
      inBlendSec: number
      outBlendSec: number
    }

export interface SequenceStep {
  motionId: string
  loopCount: number
  transitionToNext?: Transition
}

export interface Sequence {
  id: string
  name: string
  steps: SequenceStep[]
}

export interface FeaturedSequence {
  id: string
  name: string
  description: string
  steps: SequenceStep[]
  thumbColor: string
}

export interface DB {
  creators: Creator[]
  motions: Motion[]
  featuredSequences: FeaturedSequence[]
  ownedMotionIds: Set<string>
  currentSequence: Sequence
  cart: string[]
  mock: boolean
}

declare global {
  interface Window {
    DB: DB
    __APP_READY__?: boolean
  }
}
