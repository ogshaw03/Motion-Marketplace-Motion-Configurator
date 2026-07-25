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
  frame: () => void
}

export function createPreview(options: {
  clip?: ClipKey
  loop?: boolean
  background?: number
  showGround?: boolean
  /** true = ユーザー操作不可、ゆっくり自動回転 (Top hero用). default false. */
  autoOrbit?: boolean
  /** true = Maya風カメラ操作を有効 (default true, autoOrbit時は無効) */
  interactive?: boolean
} = {}): PreviewController {
  const autoOrbit = options.autoOrbit ?? false
  const interactive = (options.interactive ?? true) && !autoOrbit

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
  if (interactive) renderer.domElement.style.cursor = 'default'
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)

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

  // --- Camera state (Maya-style orbit around pivot) ---
  const DEFAULT_PIVOT = new THREE.Vector3(0, 1.05, 0)
  const DEFAULT_RADIUS = 4.2
  const DEFAULT_THETA = Math.PI / 4      // azimuth (yaw)
  const DEFAULT_PHI = Math.PI / 2 - 0.25  // polar from +Y down (slightly above horizon)
  const cam = {
    pivot: DEFAULT_PIVOT.clone(),
    radius: DEFAULT_RADIUS,
    theta: DEFAULT_THETA,
    phi: DEFAULT_PHI,
  }
  const RADIUS_MIN = 1.5
  const RADIUS_MAX = 20
  const PHI_MIN = 0.15
  const PHI_MAX = Math.PI - 0.15

  let cameraOrbitDeg = 0 // for auto-orbit fallback

  function applyCamera() {
    if (autoOrbit) {
      const aspect = camera.aspect
      const r = aspect < 1.1 ? 5.2 : aspect < 1.5 ? 4.6 : 4.0
      const camY = aspect < 1.1 ? 1.3 : 1.5
      camera.position.x = Math.sin(cameraOrbitDeg) * r
      camera.position.z = Math.cos(cameraOrbitDeg) * r
      camera.position.y = camY
      camera.lookAt(0, 1.05, 0)
      return
    }
    const sinPhi = Math.sin(cam.phi)
    camera.position.set(
      cam.pivot.x + cam.radius * sinPhi * Math.sin(cam.theta),
      cam.pivot.y + cam.radius * Math.cos(cam.phi),
      cam.pivot.z + cam.radius * sinPhi * Math.cos(cam.theta),
    )
    camera.lookAt(cam.pivot)
  }

  function frame() {
    cam.pivot.copy(DEFAULT_PIVOT)
    // If autoOrbit, radius/theta/phi are ignored anyway; still reset for consistency.
    const aspect = camera.aspect
    cam.radius = aspect < 1.1 ? 5.2 : aspect < 1.5 ? 4.8 : DEFAULT_RADIUS
    cam.theta = DEFAULT_THETA
    cam.phi = DEFAULT_PHI
    applyCamera()
  }

  function resize() {
    const w = el.clientWidth || 400
    const h = el.clientHeight || 300
    renderer.setSize(w, h, true)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const ro = new ResizeObserver(() => {
    resize()
    if (!interactive) frame() // re-frame for hero-style layouts
  })
  ro.observe(el)
  resize()
  frame()

  // --- Maya-style camera input ---
  type DragMode = 'tumble' | 'track' | 'dolly' | null
  const drag = { mode: null as DragMode, lastX: 0, lastY: 0, button: -1 }

  const onContextMenu = (e: MouseEvent) => {
    // Prevent right-click menu inside the canvas
    e.preventDefault()
  }

  const modeForButton = (e: MouseEvent): DragMode => {
    if (!e.altKey) return null
    if (e.button === 0) return 'tumble'
    if (e.button === 1) return 'track'
    if (e.button === 2) return 'dolly'
    return null
  }

  const onPointerDown = (e: PointerEvent) => {
    if (!interactive) return
    const mode = modeForButton(e)
    if (!mode) return
    e.preventDefault()
    drag.mode = mode
    drag.lastX = e.clientX
    drag.lastY = e.clientY
    drag.button = e.button
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    renderer.domElement.style.cursor =
      mode === 'tumble' ? 'grabbing' :
      mode === 'track' ? 'move' :
      'ns-resize'
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!interactive || !drag.mode) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY

    if (drag.mode === 'tumble') {
      cam.theta -= dx * 0.008
      cam.phi -= dy * 0.008
      cam.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, cam.phi))
    } else if (drag.mode === 'track') {
      // Pan the pivot in the camera's screen-space right/up axes
      const right = new THREE.Vector3()
      const up = new THREE.Vector3()
      camera.matrixWorld.extractBasis(right, up, new THREE.Vector3())
      const scale = cam.radius * 0.0015
      cam.pivot.addScaledVector(right, -dx * scale)
      cam.pivot.addScaledVector(up, dy * scale)
    } else if (drag.mode === 'dolly') {
      // Horizontal + vertical drag both zoom (Maya combines).
      const factor = Math.exp((dx + dy) * 0.005)
      cam.radius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, cam.radius * factor))
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!drag.mode) return
    drag.mode = null
    drag.button = -1
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    renderer.domElement.style.cursor = 'default'
  }

  const onWheel = (e: WheelEvent) => {
    if (!interactive) return
    e.preventDefault()
    const factor = Math.exp(e.deltaY * 0.0015)
    cam.radius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, cam.radius * factor))
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!interactive) return
    if (e.key === 'f' || e.key === 'F') {
      // Frame character
      if (document.activeElement !== document.body &&
          document.activeElement instanceof HTMLInputElement) return
      frame()
    }
  }

  if (interactive) {
    renderer.domElement.addEventListener('contextmenu', onContextMenu)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
  }

  // Overlay hint (small text bottom-right, autohides)
  let hintEl: HTMLElement | null = null
  if (interactive) {
    hintEl = document.createElement('div')
    hintEl.textContent = 'Alt+Drag: Tumble / Track / Dolly  ·  Wheel: Zoom  ·  F: Frame'
    hintEl.style.cssText =
      'position: absolute; right: 8px; top: 8px; padding: 4px 8px; ' +
      'background: rgba(14,15,19,0.7); border: 1px solid rgba(255,255,255,0.08); ' +
      'border-radius: 4px; color: #a2a9b9; font-size: 10px; ' +
      'font-family: ui-monospace, monospace; pointer-events: none; ' +
      'letter-spacing: 0.02em;'
    el.appendChild(hintEl)
  }

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
        const soloDuration = ['jump', 'landing', 'attack', 'skidStop', 'takeoff'].includes(state.currentClip) ? 0.9 : 1.0
        if (state.loop && state.time > soloDuration) state.time = state.time % soloDuration
        const progress = Math.min(state.time / soloDuration, state.loop ? Infinity : 1)
        poseCharacter(character, state.currentClip, progress)
      }
    }

    if (autoOrbit) {
      cameraOrbitDeg += dt * 0.05
    }
    applyCamera()
    renderer.render(scene, camera)
  }
  loop()

  return {
    el,
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      if (interactive) {
        renderer.domElement.removeEventListener('contextmenu', onContextMenu)
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        renderer.domElement.removeEventListener('pointerup', onPointerUp)
        renderer.domElement.removeEventListener('pointercancel', onPointerUp)
        renderer.domElement.removeEventListener('wheel', onWheel)
        window.removeEventListener('keydown', onKeyDown)
      }
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
    frame,
  }
}
