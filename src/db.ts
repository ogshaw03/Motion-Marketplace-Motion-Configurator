import type {
  Creator,
  DB,
  FeaturedSequence,
  Motion,
} from './types'

const creators: Creator[] = [
  {
    id: 'creator-a',
    name: 'Aoi Kurogane',
    displayMode: 'Public',
    icon: '#e05b8f',
    bio: 'Anime action animator. Specialty in stylized locomotion and combat.',
    specialty: ['Anime', 'Action', 'Stylized'],
  },
  {
    id: 'creator-b',
    name: 'Ren Fujisawa',
    displayMode: 'Public',
    icon: '#4c8dff',
    bio: 'Cinematic animator with a decade of film-quality character work.',
    specialty: ['Cinematic', 'Realistic'],
  },
  {
    id: 'creator-c',
    name: 'HERO_ATELIER',
    displayMode: 'Alias',
    icon: '#ffb547',
    bio: 'Studio alias. Signature hero landings and impact frames.',
    specialty: ['Stylized', 'Action'],
  },
  {
    id: 'creator-d',
    name: 'nn_studio',
    displayMode: 'Private',
    icon: '#6be3b0',
    bio: '',
    specialty: ['Anime'],
  },
]

const motions: Motion[] = [
  {
    id: 'anime-run',
    name: 'Anime Run',
    creatorId: 'creator-a',
    category: 'Locomotion',
    state: 'Run',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 800,
    loop: true,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Signature anime run. Forward lean, wide arm swing, snappy timing.',
    metadata: {
      speed: 6.2,
      direction: 'Forward',
      rootVelocity: 6.2,
      startFoot: 'LeftContact',
      endFoot: 'LeftContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.6,
    },
    animationClipKey: 'run',
    thumbColor: '#e05b8f',
  },
  {
    id: 'stylized-run',
    name: 'Stylized Run',
    creatorId: 'creator-c',
    category: 'Locomotion',
    state: 'Run',
    style: 'Stylized',
    productionMethod: 'Mocap + Polish',
    price: 700,
    loop: true,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Grounded stylized run with strong silhouette.',
    metadata: {
      speed: 5.6,
      direction: 'Forward',
      rootVelocity: 5.6,
      startFoot: 'LeftContact',
      endFoot: 'LeftContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.7,
    },
    animationClipKey: 'run',
    thumbColor: '#ffb547',
  },
  {
    id: 'realistic-walk',
    name: 'Realistic Walk',
    creatorId: 'creator-b',
    category: 'Locomotion',
    state: 'Walk',
    style: 'Realistic',
    productionMethod: 'Mocap',
    price: 500,
    loop: true,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Neutral realistic walk cycle. Great as connecting motion.',
    metadata: {
      speed: 1.4,
      direction: 'Forward',
      rootVelocity: 1.4,
      startFoot: 'LeftContact',
      endFoot: 'LeftContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 1.1,
    },
    animationClipKey: 'walk',
    thumbColor: '#4c8dff',
  },
  {
    id: 'idle-neutral',
    name: 'Neutral Idle',
    creatorId: 'creator-b',
    category: 'Idle',
    state: 'Idle',
    style: 'Realistic',
    productionMethod: 'Hand-Keyed',
    price: 400,
    loop: true,
    rootMotion: false,
    isDesignedTransition: false,
    description: 'Subtle breathing idle with small weight shifts.',
    metadata: {
      speed: 0,
      direction: 'None',
      rootVelocity: 0,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 3.2,
    },
    animationClipKey: 'idle',
    thumbColor: '#4c8dff',
  },
  {
    id: 'anime-idle',
    name: 'Anime Combat Idle',
    creatorId: 'creator-a',
    category: 'Idle',
    state: 'Idle',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 500,
    loop: true,
    rootMotion: false,
    isDesignedTransition: false,
    description: 'Ready stance with slight rocking. Reads well from silhouette.',
    metadata: {
      speed: 0,
      direction: 'None',
      rootVelocity: 0,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 2.4,
    },
    animationClipKey: 'idle',
    thumbColor: '#e05b8f',
  },
  {
    id: 'hero-jump',
    name: 'Hero Jump',
    creatorId: 'creator-c',
    category: 'Action',
    state: 'Jump',
    style: 'Stylized',
    productionMethod: 'Hand-Keyed',
    price: 900,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Big vertical jump with anticipation. Reads as heroic weight.',
    metadata: {
      speed: 4.0,
      direction: 'Forward',
      rootVelocity: 4.0,
      startFoot: 'BothContact',
      endFoot: 'Airborne',
      startCondition: 'ground',
      endCondition: 'airborne',
      durationSec: 0.9,
    },
    animationClipKey: 'jump',
    thumbColor: '#ffb547',
  },
  {
    id: 'anime-jump',
    name: 'Anime Jump',
    creatorId: 'creator-a',
    category: 'Action',
    state: 'Jump',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 700,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Snappy anime jump. Fast anticipation, held apex frame.',
    metadata: {
      speed: 5.2,
      direction: 'Forward',
      rootVelocity: 5.2,
      startFoot: 'LeftContact',
      endFoot: 'Airborne',
      startCondition: 'ground',
      endCondition: 'airborne',
      durationSec: 0.7,
    },
    animationClipKey: 'jump',
    thumbColor: '#e05b8f',
  },
  {
    id: 'anime-landing',
    name: 'Anime Landing',
    creatorId: 'creator-a',
    category: 'Action',
    state: 'Landing',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 700,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Deep landing recovery with recentering stance.',
    metadata: {
      speed: 0,
      direction: 'None',
      rootVelocity: 0.5,
      startFoot: 'Airborne',
      endFoot: 'BothContact',
      startCondition: 'airborne',
      endCondition: 'ground',
      durationSec: 0.8,
    },
    animationClipKey: 'landing',
    thumbColor: '#e05b8f',
  },
  {
    id: 'skid-stop',
    name: 'Skid Stop',
    creatorId: 'creator-c',
    category: 'Transition',
    state: 'Transition',
    style: 'Stylized',
    productionMethod: 'Hand-Keyed',
    price: 600,
    loop: false,
    rootMotion: true,
    isDesignedTransition: true,
    from: 'Run',
    to: 'Idle',
    description:
      'Designed Transition. Aggressive skid to a plant. Signature stop.',
    metadata: {
      speed: 5.2,
      direction: 'Forward',
      rootVelocity: 3.4,
      startFoot: 'LeftContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.7,
    },
    animationClipKey: 'skidStop',
    thumbColor: '#ffb547',
  },
  {
    id: 'anime-pivot-stop',
    name: 'Anime Pivot Stop',
    creatorId: 'creator-a',
    category: 'Transition',
    state: 'Transition',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 650,
    loop: false,
    rootMotion: true,
    isDesignedTransition: true,
    from: 'Run',
    to: 'Idle',
    description:
      'Designed Transition. Sharp anime-style stop. Hold pose reads as decisive.',
    metadata: {
      speed: 6.0,
      direction: 'Forward',
      rootVelocity: 3.0,
      startFoot: 'LeftContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.5,
    },
    animationClipKey: 'skidStop',
    thumbColor: '#e05b8f',
  },
  {
    id: 'powerful-takeoff',
    name: 'Powerful Takeoff',
    creatorId: 'creator-c',
    category: 'Transition',
    state: 'Transition',
    style: 'Stylized',
    productionMethod: 'Hand-Keyed',
    price: 500,
    loop: false,
    rootMotion: true,
    isDesignedTransition: true,
    from: 'Run',
    to: 'Jump',
    description:
      'Designed Transition. Deep anticipation into a heavy takeoff.',
    metadata: {
      speed: 5.2,
      direction: 'Forward',
      rootVelocity: 4.6,
      startFoot: 'LeftContact',
      endFoot: 'Airborne',
      startCondition: 'ground',
      endCondition: 'airborne',
      durationSec: 0.5,
    },
    animationClipKey: 'takeoff',
    thumbColor: '#ffb547',
  },
  {
    id: 'quick-step',
    name: 'Quick Step',
    creatorId: 'creator-a',
    category: 'Transition',
    state: 'Transition',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 400,
    loop: false,
    rootMotion: true,
    isDesignedTransition: true,
    from: 'Run',
    to: 'Jump',
    description:
      'Designed Transition. Light step into a fast jump takeoff.',
    metadata: {
      speed: 5.4,
      direction: 'Forward',
      rootVelocity: 5.0,
      startFoot: 'LeftContact',
      endFoot: 'Airborne',
      startCondition: 'ground',
      endCondition: 'airborne',
      durationSec: 0.35,
    },
    animationClipKey: 'takeoff',
    thumbColor: '#e05b8f',
  },
  {
    id: 'sword-attack',
    name: 'Sword Attack',
    creatorId: 'creator-a',
    category: 'Action',
    state: 'Attack',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 1200,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Overhead sword slash with strong impact frame.',
    metadata: {
      speed: 2.0,
      direction: 'Forward',
      rootVelocity: 1.0,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.8,
    },
    animationClipKey: 'attack',
    thumbColor: '#e05b8f',
  },
  {
    id: 'finisher',
    name: 'Finisher',
    creatorId: 'creator-a',
    category: 'Action',
    state: 'Attack',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 1400,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Two-handed finishing blow with recovery.',
    metadata: {
      speed: 2.4,
      direction: 'Forward',
      rootVelocity: 1.2,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 1.1,
    },
    animationClipKey: 'attack',
    thumbColor: '#e05b8f',
  },
  {
    id: 'combat-recovery',
    name: 'Combat Recovery',
    creatorId: 'creator-a',
    category: 'Acting',
    state: 'Recovery',
    style: 'Anime',
    productionMethod: 'Hand-Keyed',
    price: 500,
    loop: false,
    rootMotion: false,
    isDesignedTransition: false,
    description: 'Return to combat ready stance from finisher.',
    metadata: {
      speed: 0,
      direction: 'None',
      rootVelocity: 0,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.6,
    },
    animationClipKey: 'idle',
    thumbColor: '#e05b8f',
  },
  {
    id: 'turn-180',
    name: 'Turn 180',
    creatorId: 'creator-b',
    category: 'Locomotion',
    state: 'Turn',
    style: 'Realistic',
    productionMethod: 'Mocap + Polish',
    price: 500,
    loop: false,
    rootMotion: true,
    isDesignedTransition: false,
    description: 'Grounded 180 degree turn.',
    metadata: {
      speed: 0,
      direction: 'None',
      rootVelocity: 0,
      startFoot: 'BothContact',
      endFoot: 'BothContact',
      startCondition: 'ground',
      endCondition: 'ground',
      durationSec: 0.9,
    },
    animationClipKey: 'idle',
    thumbColor: '#4c8dff',
  },
]

const featuredSequences: FeaturedSequence[] = [
  {
    id: 'anime-locomotion',
    name: 'Anime Locomotion',
    description: 'Idle → Walk → Run → Anime Pivot Stop.',
    thumbColor: '#e05b8f',
    steps: [
      { motionId: 'anime-idle', loopCount: 1 },
      { motionId: 'realistic-walk', loopCount: 2 },
      { motionId: 'anime-run', loopCount: 3 },
      { motionId: 'anime-pivot-stop', loopCount: 1 },
    ],
  },
  {
    id: 'hero-jump-set',
    name: 'Hero Jump Set',
    description: 'Stylized run into a designed takeoff, hero jump, and landing.',
    thumbColor: '#ffb547',
    steps: [
      { motionId: 'stylized-run', loopCount: 2 },
      { motionId: 'powerful-takeoff', loopCount: 1 },
      { motionId: 'hero-jump', loopCount: 1 },
      { motionId: 'anime-landing', loopCount: 1 },
    ],
  },
  {
    id: 'action-demo',
    name: 'Stylized Action Demo',
    description: 'Run → Designed Transition → Sword Attack → Finisher → Recovery.',
    thumbColor: '#4c8dff',
    steps: [
      { motionId: 'anime-run', loopCount: 2 },
      { motionId: 'anime-pivot-stop', loopCount: 1 },
      { motionId: 'sword-attack', loopCount: 1 },
      { motionId: 'finisher', loopCount: 1 },
      { motionId: 'combat-recovery', loopCount: 1 },
    ],
  },
]

export function createDB(mock: boolean): DB {
  return {
    creators,
    motions,
    featuredSequences,
    ownedMotionIds: new Set(['anime-run', 'hero-jump']),
    currentSequence: {
      id: 'working-sequence',
      name: 'My Sequence',
      steps: [
        { motionId: 'anime-run', loopCount: 2, transitionToNext: { kind: 'Auto', blendLengthSec: 0.2 } },
        { motionId: 'powerful-takeoff', loopCount: 1, transitionToNext: { kind: 'Auto', blendLengthSec: 0.1 } },
        { motionId: 'hero-jump', loopCount: 1, transitionToNext: { kind: 'Auto', blendLengthSec: 0.15 } },
        { motionId: 'anime-landing', loopCount: 1 },
      ],
    },
    cart: [],
    mock,
  }
}

export function initDB(): DB {
  const params = new URLSearchParams(window.location.search)
  const mock = params.get('mock') !== '0'
  const db = createDB(mock)
  window.DB = db
  return db
}

export function getMotion(id: string): Motion | undefined {
  return window.DB.motions.find((m) => m.id === id)
}

export function getCreator(id: string): Creator | undefined {
  return window.DB.creators.find((c) => c.id === id)
}

export function isOwned(motionId: string): boolean {
  return window.DB.ownedMotionIds.has(motionId)
}

export function purchase(ids: string[]): void {
  ids.forEach((id) => window.DB.ownedMotionIds.add(id))
}

export function totalMissingPrice(steps: { motionId: string }[]): number {
  return steps
    .filter((s) => !isOwned(s.motionId))
    .map((s) => getMotion(s.motionId)?.price ?? 0)
    .reduce((a, b) => a + b, 0)
}

export function compatibility(fromMotionId: string, toMotionId: string): 'Excellent' | 'Good' | 'Low' {
  const a = getMotion(fromMotionId)
  const b = getMotion(toMotionId)
  if (!a || !b) return 'Low'
  const endFoot = a.metadata.endFoot
  const startFoot = b.metadata.startFoot
  const endCond = a.metadata.endCondition
  const startCond = b.metadata.startCondition
  const speedDelta = Math.abs(a.metadata.rootVelocity - b.metadata.rootVelocity)
  const footMatch = endFoot === startFoot || endFoot === 'BothContact' || startFoot === 'BothContact'
  const condMatch = endCond === startCond
  if (b.isDesignedTransition && b.from === a.state) return 'Excellent'
  if (a.isDesignedTransition && a.to === b.state) return 'Excellent'
  if (footMatch && condMatch && speedDelta < 1.5) return 'Excellent'
  if (condMatch && speedDelta < 3.5) return 'Good'
  return 'Low'
}

export function candidateNextMotions(fromMotionId: string, includeLow = false): Motion[] {
  const from = getMotion(fromMotionId)
  if (!from) return []
  return window.DB.motions
    .filter((m) => m.id !== fromMotionId)
    .map((m) => ({ m, c: compatibility(fromMotionId, m.id) }))
    .filter(({ c }) => (includeLow ? true : c !== 'Low'))
    .sort((a, b) => {
      const order = { Excellent: 0, Good: 1, Low: 2 }
      return order[a.c] - order[b.c]
    })
    .map(({ m }) => m)
}
