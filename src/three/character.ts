import * as THREE from 'three'

export interface Character {
  root: THREE.Group
  parts: {
    hip: THREE.Group
    torso: THREE.Group
    head: THREE.Mesh
    leftArm: THREE.Group
    rightArm: THREE.Group
    leftForearm: THREE.Group
    rightForearm: THREE.Group
    leftLeg: THREE.Group
    rightLeg: THREE.Group
    leftShin: THREE.Group
    rightShin: THREE.Group
  }
}

function mat(color: number): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.1,
    roughness: 0.55,
  })
}

function boxMesh(w: number, h: number, d: number, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const m = new THREE.Mesh(geo, mat(color))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function pivot(offsetY: number): THREE.Group {
  const g = new THREE.Group()
  g.position.y = offsetY
  return g
}

const SKIN = 0xf0c9a4
const SUIT = 0x3a4266
const SUIT_ACCENT = 0xff5c8a
const HAIR = 0x27242c

export function createCharacter(): Character {
  const root = new THREE.Group()

  const hip = pivot(1.05)
  root.add(hip)
  hip.add(boxMesh(0.42, 0.24, 0.32, SUIT))

  const torso = pivot(0.28)
  hip.add(torso)
  torso.add(boxMesh(0.48, 0.55, 0.34, SUIT))
  const chestAccent = boxMesh(0.35, 0.1, 0.35, SUIT_ACCENT)
  chestAccent.position.y = 0.1
  torso.add(chestAccent)

  const neck = boxMesh(0.14, 0.12, 0.14, SKIN)
  neck.position.y = 0.4
  torso.add(neck)

  const headGeo = new THREE.BoxGeometry(0.36, 0.4, 0.34)
  const head = new THREE.Mesh(headGeo, mat(SKIN))
  head.castShadow = true
  head.position.y = 0.65
  torso.add(head)
  const hairMesh = boxMesh(0.38, 0.18, 0.36, HAIR)
  hairMesh.position.y = 0.13
  head.add(hairMesh)
  // eyes
  const eyeGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22 })
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(-0.08, 0, 0.18)
  head.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.08, 0, 0.18)
  head.add(rightEye)

  const armY = 0.28
  const armX = 0.32
  const leftArm = pivot(armY)
  leftArm.position.x = -armX
  torso.add(leftArm)
  const leftArmMesh = boxMesh(0.14, 0.36, 0.14, SUIT)
  leftArmMesh.position.y = -0.18
  leftArm.add(leftArmMesh)
  const leftForearm = pivot(-0.38)
  leftArm.add(leftForearm)
  const leftForearmMesh = boxMesh(0.13, 0.34, 0.13, SKIN)
  leftForearmMesh.position.y = -0.17
  leftForearm.add(leftForearmMesh)

  const rightArm = pivot(armY)
  rightArm.position.x = armX
  torso.add(rightArm)
  const rightArmMesh = boxMesh(0.14, 0.36, 0.14, SUIT)
  rightArmMesh.position.y = -0.18
  rightArm.add(rightArmMesh)
  const rightForearm = pivot(-0.38)
  rightArm.add(rightForearm)
  const rightForearmMesh = boxMesh(0.13, 0.34, 0.13, SKIN)
  rightForearmMesh.position.y = -0.17
  rightForearm.add(rightForearmMesh)

  const legX = 0.13
  const legY = -0.14
  const leftLeg = pivot(legY)
  leftLeg.position.x = -legX
  hip.add(leftLeg)
  const leftLegMesh = boxMesh(0.18, 0.44, 0.18, SUIT)
  leftLegMesh.position.y = -0.22
  leftLeg.add(leftLegMesh)
  const leftShin = pivot(-0.46)
  leftLeg.add(leftShin)
  const leftShinMesh = boxMesh(0.17, 0.44, 0.17, SUIT)
  leftShinMesh.position.y = -0.22
  leftShin.add(leftShinMesh)
  const leftFoot = boxMesh(0.19, 0.08, 0.28, SUIT_ACCENT)
  leftFoot.position.y = -0.44 - 0.04
  leftFoot.position.z = 0.05
  leftShin.add(leftFoot)

  const rightLeg = pivot(legY)
  rightLeg.position.x = legX
  hip.add(rightLeg)
  const rightLegMesh = boxMesh(0.18, 0.44, 0.18, SUIT)
  rightLegMesh.position.y = -0.22
  rightLeg.add(rightLegMesh)
  const rightShin = pivot(-0.46)
  rightLeg.add(rightShin)
  const rightShinMesh = boxMesh(0.17, 0.44, 0.17, SUIT)
  rightShinMesh.position.y = -0.22
  rightShin.add(rightShinMesh)
  const rightFoot = boxMesh(0.19, 0.08, 0.28, SUIT_ACCENT)
  rightFoot.position.y = -0.44 - 0.04
  rightFoot.position.z = 0.05
  rightShin.add(rightFoot)

  return {
    root,
    parts: {
      hip,
      torso,
      head,
      leftArm,
      rightArm,
      leftForearm,
      rightForearm,
      leftLeg,
      rightLeg,
      leftShin,
      rightShin,
    },
  }
}

export type ClipKey =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'landing'
  | 'attack'
  | 'skidStop'
  | 'takeoff'

export function poseCharacter(char: Character, clip: ClipKey, t: number): void {
  const { parts } = char
  const two = Math.PI * 2

  const resetRot = () => {
    parts.hip.rotation.set(0, 0, 0)
    parts.hip.position.y = 1.05
    parts.torso.rotation.set(0, 0, 0)
    parts.head.rotation.set(0, 0, 0)
    parts.leftArm.rotation.set(0, 0, 0)
    parts.rightArm.rotation.set(0, 0, 0)
    parts.leftForearm.rotation.set(0, 0, 0)
    parts.rightForearm.rotation.set(0, 0, 0)
    parts.leftLeg.rotation.set(0, 0, 0)
    parts.rightLeg.rotation.set(0, 0, 0)
    parts.leftShin.rotation.set(0, 0, 0)
    parts.rightShin.rotation.set(0, 0, 0)
  }
  resetRot()

  if (clip === 'idle') {
    const s = Math.sin(t * two * 0.5) * 0.02
    parts.hip.position.y = 1.05 + s
    parts.torso.rotation.z = Math.sin(t * two * 0.5) * 0.02
    parts.head.rotation.y = Math.sin(t * two * 0.25) * 0.1
    parts.leftArm.rotation.z = 0.08
    parts.rightArm.rotation.z = -0.08
    return
  }
  if (clip === 'walk') {
    const p = (t % 1) * two
    const sw = Math.sin(p)
    parts.leftLeg.rotation.x = sw * 0.5
    parts.rightLeg.rotation.x = -sw * 0.5
    parts.leftShin.rotation.x = Math.max(0, -sw) * 0.6
    parts.rightShin.rotation.x = Math.max(0, sw) * 0.6
    parts.leftArm.rotation.x = -sw * 0.5
    parts.rightArm.rotation.x = sw * 0.5
    parts.leftForearm.rotation.x = -Math.max(0, sw) * 0.2
    parts.rightForearm.rotation.x = -Math.max(0, -sw) * 0.2
    parts.hip.position.y = 1.05 + Math.abs(Math.sin(p * 2)) * 0.04
    parts.torso.rotation.y = sw * 0.1
    return
  }
  if (clip === 'run') {
    const p = (t % 1) * two * 1.6
    const sw = Math.sin(p)
    parts.leftLeg.rotation.x = sw * 0.9
    parts.rightLeg.rotation.x = -sw * 0.9
    parts.leftShin.rotation.x = Math.max(0, -sw) * 1.2 + 0.15
    parts.rightShin.rotation.x = Math.max(0, sw) * 1.2 + 0.15
    parts.leftArm.rotation.x = -sw * 0.9
    parts.rightArm.rotation.x = sw * 0.9
    parts.leftForearm.rotation.x = -1.0
    parts.rightForearm.rotation.x = -1.0
    parts.torso.rotation.x = 0.2
    parts.torso.rotation.y = sw * 0.15
    parts.hip.position.y = 1.03 + Math.abs(Math.sin(p * 2)) * 0.08
    parts.head.rotation.x = -0.05
    return
  }
  if (clip === 'jump') {
    const p = Math.min(1, t)
    const arc = -Math.pow(p * 2 - 1, 2) + 1
    parts.hip.position.y = 1.05 + arc * 0.7
    parts.leftLeg.rotation.x = -0.4 + arc * 0.6
    parts.rightLeg.rotation.x = -0.4 + arc * 0.6
    parts.leftShin.rotation.x = 0.6 - arc * 0.3
    parts.rightShin.rotation.x = 0.6 - arc * 0.3
    parts.leftArm.rotation.x = -1.5 + arc * 0.4
    parts.rightArm.rotation.x = -1.5 + arc * 0.4
    parts.torso.rotation.x = 0.15
    return
  }
  if (clip === 'landing') {
    const p = Math.min(1, t)
    const squish = p < 0.4 ? (p / 0.4) : (1 - (p - 0.4) / 0.6)
    parts.hip.position.y = 1.05 - squish * 0.3
    parts.leftLeg.rotation.x = -0.4 - squish * 0.5
    parts.rightLeg.rotation.x = -0.4 - squish * 0.5
    parts.leftShin.rotation.x = 0.9 + squish * 0.6
    parts.rightShin.rotation.x = 0.9 + squish * 0.6
    parts.leftArm.rotation.x = -0.4
    parts.rightArm.rotation.x = -0.4
    parts.leftArm.rotation.z = 0.3
    parts.rightArm.rotation.z = -0.3
    parts.torso.rotation.x = 0.4 + squish * 0.3
    return
  }
  if (clip === 'attack') {
    const p = Math.min(1, t)
    const swing = Math.sin(p * Math.PI)
    parts.rightArm.rotation.x = -1.6 + p * 3.2
    parts.rightArm.rotation.z = -0.4 + swing * 0.5
    parts.rightForearm.rotation.x = -0.6 - swing * 0.4
    parts.leftArm.rotation.x = -0.6
    parts.leftArm.rotation.z = 0.4
    parts.torso.rotation.y = -0.3 + p * 0.9
    parts.torso.rotation.x = 0.15 - swing * 0.15
    parts.leftLeg.rotation.x = -0.2
    parts.rightLeg.rotation.x = 0.15
    return
  }
  if (clip === 'skidStop') {
    const p = Math.min(1, t)
    parts.leftLeg.rotation.x = -0.5 + p * 0.35
    parts.rightLeg.rotation.x = 0.4 - p * 0.25
    parts.leftShin.rotation.x = 0.15
    parts.rightShin.rotation.x = 0.7 - p * 0.4
    parts.leftArm.rotation.x = -0.4 - p * 0.3
    parts.rightArm.rotation.x = 0.3 + p * 0.3
    parts.torso.rotation.x = 0.15 - p * 0.35
    parts.torso.rotation.y = -0.2 + p * 0.15
    parts.hip.position.y = 1.05 - p * 0.15
    return
  }
  if (clip === 'takeoff') {
    const p = Math.min(1, t)
    parts.leftLeg.rotation.x = -0.7 + p * 0.6
    parts.rightLeg.rotation.x = -0.7 + p * 0.6
    parts.leftShin.rotation.x = 1.1 - p * 0.6
    parts.rightShin.rotation.x = 1.1 - p * 0.6
    parts.leftArm.rotation.x = -1.4 * p
    parts.rightArm.rotation.x = -1.4 * p
    parts.torso.rotation.x = 0.35 - p * 0.2
    parts.hip.position.y = 1.05 - 0.2 + p * 0.4
    return
  }
}
