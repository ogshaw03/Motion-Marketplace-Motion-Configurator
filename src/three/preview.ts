import * as THREE from 'three'
import { createCharacter, poseCharacter, type ClipKey, type Character } from './character'

export interface PreviewController {
  el: HTMLElement
  dispose: () => void
  setClip: (clip: ClipKey, loop?: boolean) => void
  play: () => void
  pause: () => void
  setSpeed: (s: number) => void
  isPlaying: () => boolean
  getTime: () => number
  setSequence: (steps: { clip: ClipKey; durationSec: number; loopCount: number }[]) => void
}

export function createPreview(options: {
  clip?: ClipKey
  loop?: boolean
  background?: number
  showGround?: boolean
} = {}): PreviewController {
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.inset = '0'
  el.style.width = '100%'
  el.style.height = '100%'

  const scene = new THREE.Scene()
  const bg = options.background ?? 0x14161d
  scene.background = new THREE.Color(bg)
  scene.fog = new THREE.Fog(bg, 6, 14)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(300, 300)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(2.4, 1.7, 3.4)
  camera.lookAt(0, 1.0, 0)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 0.6)
  scene.add(hemi)

  const key = new THREE.DirectionalLight(0xffe0d0, 1.2)
  key.position.set(3, 5, 2)
  key.castShadow = true
  key.shadow.mapSize.width = 1024
  key.shadow.mapSize.height = 1024
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 15
  key.shadow.camera.left = -3
  key.shadow.camera.right = 3
  key.shadow.camera.top = 3
  key.shadow.camera.bottom = -3
  scene.add(key)

  const rim = new THREE.DirectionalLight(0x7cc0ff, 0.6)
  rim.position.set(-3, 3, -2)
  scene.add(rim)

  if (options.showGround !== false) {
    const groundGeo = new THREE.CircleGeometry(3.5, 48)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1c1f2a,
      roughness: 0.9,
      metalness: 0,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // grid ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 3.5, 64),
      new THREE.MeshBasicMaterial({ color: 0x2a2f40 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.001
    scene.add(ring)
  }

  const character = createCharacter()
  scene.add(character.root)

  const state = {
    currentClip: (options.clip ?? 'idle') as ClipKey,
    loop: options.loop ?? true,
    playing: true,
    speed: 1.0,
    time: 0,
    lastFrame: performance.now(),
    sequence: null as
      | { clip: ClipKey; durationSec: number; loopCount: number }[]
      | null,
    sequenceIndex: 0,
    sequenceIterInStep: 0,
  }

  let cameraAngle = 0

  function resize() {
    const w = el.clientWidth || 400
    const h = el.clientHeight || 300
    renderer.setSize(w, h, true)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const ro = new ResizeObserver(resize)
  ro.observe(el)
  resize()

  let raf = 0
  function loop() {
    raf = requestAnimationFrame(loop)
    const now = performance.now()
    const dt = (now - state.lastFrame) / 1000
    state.lastFrame = now

    if (state.playing) {
      state.time += dt * state.speed

      if (state.sequence && state.sequence.length > 0) {
        let step = state.sequence[state.sequenceIndex]
        if (step && state.time >= step.durationSec) {
          state.sequenceIterInStep += 1
          state.time = 0
          if (state.sequenceIterInStep >= step.loopCount) {
            state.sequenceIterInStep = 0
            state.sequenceIndex = (state.sequenceIndex + 1) % state.sequence.length
          }
          step = state.sequence[state.sequenceIndex]
        }
        if (step) {
          const progress = state.time / step.durationSec
          poseCharacter(character, step.clip, progress)
        }
      } else {
        // Solo clip: use default 1-second cycle for looping poses, or 0.9s for one-shots
        const soloDuration = ['jump', 'landing', 'attack', 'skidStop', 'takeoff'].includes(state.currentClip) ? 0.9 : 1.0
        if (state.loop && state.time > soloDuration) state.time = state.time % soloDuration
        const progress = Math.min(state.time / soloDuration, state.loop ? Infinity : 1)
        poseCharacter(character, state.currentClip, progress)
      }
    }

    cameraAngle += dt * 0.05
    const aspect = camera.aspect
    const r = aspect < 1.1 ? 5.2 : aspect < 1.5 ? 4.6 : 4.0
    const camY = aspect < 1.1 ? 1.3 : 1.5
    camera.position.x = Math.sin(cameraAngle) * r
    camera.position.z = Math.cos(cameraAngle) * r
    camera.position.y = camY
    camera.lookAt(0, 1.05, 0)

    renderer.render(scene, camera)
  }
  loop()

  return {
    el,
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      character.root.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
        const mat = (obj as THREE.Mesh).material
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m: THREE.Material) => m.dispose())
          else mat.dispose()
        }
      })
    },
    setClip: (clip, loop = true) => {
      state.currentClip = clip
      state.loop = loop
      state.time = 0
      state.sequence = null
    },
    play: () => {
      state.playing = true
    },
    pause: () => {
      state.playing = false
    },
    setSpeed: (s) => {
      state.speed = s
    },
    isPlaying: () => state.playing,
    getTime: () => state.time,
    setSequence: (steps) => {
      state.sequence = steps
      state.sequenceIndex = 0
      state.sequenceIterInStep = 0
      state.time = 0
    },
  }
}
