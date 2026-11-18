import * as THREE from 'three'
import { t } from '../i18n.ts'
import { DOORS, ROOMS, STATION_SEEDS, WALLS } from '../sim/layout.ts'
import type { StationKind } from '../sim/types.ts'

const WALL_H = 1.7

const mats = new Map<string, THREE.MeshStandardMaterial>()

function mat(color: number, roughness = 0.78, metalness = 0.04) {
  const key = `${color}:${roughness}:${metalness}`
  let material = mats.get(key)
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    mats.set(key, material)
  }
  return material
}

function canvasTex(draw: (pen: CanvasRenderingContext2D, size: number) => void, repeatX = 1, repeatY = 1) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const pen = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  if (!pen) return texture
  draw(pen, size)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function woodTexture(plank: string, seam: string) {
  return canvasTex((pen, size) => {
    pen.fillStyle = plank
    pen.fillRect(0, 0, size, size)
    pen.strokeStyle = seam
    pen.lineWidth = 4
    for (let y = 0; y <= size; y += 32) {
      pen.beginPath()
      pen.moveTo(0, y)
      pen.lineTo(size, y)
      pen.stroke()
    }
    pen.globalAlpha = 0.18
    pen.strokeStyle = '#6b4a2a'
    for (let x = 18; x < size; x += 54) {
      pen.beginPath()
      pen.moveTo(x, 0)
      pen.lineTo(x + 6, size)
      pen.stroke()
    }
  }, 3, 3)
}

function tileTexture() {
  return canvasTex((pen, size) => {
    pen.fillStyle = '#f3e2c4'
    pen.fillRect(0, 0, size, size)
    pen.strokeStyle = '#d9c09a'
    pen.lineWidth = 8
    for (let i = 0; i <= 4; i += 1) {
      pen.beginPath()
      pen.moveTo(i * 64, 0)
      pen.lineTo(i * 64, size)
      pen.stroke()
      pen.beginPath()
      pen.moveTo(0, i * 64)
      pen.lineTo(size, i * 64)
      pen.stroke()
    }
  }, 4, 3)
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function addCyl(
  parent: THREE.Object3D,
  r: number,
  h: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function addSphere(parent: THREE.Object3D, r: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

const stationSprites: Array<{ kind: StationKind; sprite: THREE.Sprite }> = []

function paintLabel(sprite: THREE.Sprite, text: string) {
  const material = sprite.material
  if (!(material instanceof THREE.SpriteMaterial) || !material.map) return
  const image = material.map.image
  if (!(image instanceof HTMLCanvasElement)) return
  const pen = image.getContext('2d')
  if (!pen) return
  pen.clearRect(0, 0, image.width, image.height)
  pen.fillStyle = 'rgba(42, 33, 24, 0.78)'
  pen.fillRect(18, 8, 220, 48)
  pen.fillStyle = '#fff8ee'
  pen.font = '700 26px Segoe UI, Trebuchet MS, sans-serif'
  pen.textAlign = 'center'
  pen.textBaseline = 'middle'
  pen.fillText(text, 128, 34)
  material.map.needsUpdate = true
}

function stationLabel(kind: StationKind) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
  sprite.scale.set(0.86, 0.22, 1)
  sprite.position.set(0, 1.72, 0)
  stationSprites.push({ kind, sprite })
  paintLabel(sprite, t(`station.${kind}`))
  return sprite
}

export function relabelStations() {
  for (const entry of stationSprites) paintLabel(entry.sprite, t(`station.${entry.kind}`))
}

function dressStation(kind: StationKind, group: THREE.Group) {
  const y = 0.96
  const steel = mat(0xd7dbe0, 0.35, 0.45)
  const dark = mat(0x2c3138, 0.55, 0.2)
  if (kind === 'stove') {
    addBox(group, 0.92, 0.16, 0.7, dark, 0, y, 0)
    addCyl(group, 0.16, 0.03, mat(0x6a7380, 0.4, 0.5), -0.2, y + 0.1, 0)
    addCyl(group, 0.16, 0.03, mat(0x6a7380, 0.4, 0.5), 0.2, y + 0.1, 0)
    addCyl(group, 0.18, 0.1, mat(0x4a4038, 0.5), 0, y + 0.16, 0.02)
    addSphere(group, 0.07, mat(0xc47a3a, 0.45), 0, y + 0.24, 0.02)
  } else if (kind === 'mixer') {
    addBox(group, 0.16, 0.42, 0.16, mat(0xc9c4bc, 0.5), -0.18, y + 0.28, -0.04)
    addCyl(group, 0.2, 0.16, mat(0xf0d56a, 0.45), 0.08, y + 0.12, 0.06)
    addSphere(group, 0.08, mat(0xe7a04a, 0.4), 0.08, y + 0.28, 0.06)
  } else if (kind === 'chop') {
    addBox(group, 0.62, 0.05, 0.42, mat(0xe6c48a, 0.55), 0, y + 0.04, 0.02)
    addBox(group, 0.04, 0.08, 0.28, steel, 0.16, y + 0.1, 0)
    addBox(group, 0.12, 0.03, 0.08, mat(0x8d5a32, 0.5), 0.22, y + 0.1, 0)
    addSphere(group, 0.07, mat(0xd9414a, 0.45), -0.16, y + 0.1, 0.06)
  } else if (kind === 'kettle') {
    addCyl(group, 0.16, 0.22, mat(0xf4f7f8, 0.35, 0.35), -0.04, y + 0.16, 0)
    addBox(group, 0.16, 0.04, 0.06, mat(0x8aa0a8, 0.4, 0.3), 0.16, y + 0.2, 0)
    addCyl(group, 0.08, 0.06, mat(0xf7f1e6, 0.4), 0.2, y + 0.08, 0.12)
  } else if (kind === 'sink') {
    addBox(group, 0.7, 0.08, 0.46, mat(0x8fb8bc, 0.35, 0.2), 0, y + 0.02, 0)
    addBox(group, 0.42, 0.06, 0.28, mat(0x6f98a0, 0.3, 0.25), 0, y + 0.04, 0.02)
    addCyl(group, 0.025, 0.28, steel, 0, y + 0.2, -0.12)
    addSphere(group, 0.05, mat(0xf2e27a, 0.4), 0.24, y + 0.08, 0.1)
  } else if (kind === 'plate') {
    addCyl(group, 0.28, 0.035, mat(0xfff8ee, 0.4), 0, y + 0.04, 0)
    addCyl(group, 0.24, 0.035, mat(0xf3efe6, 0.45), 0, y + 0.08, 0)
    addCyl(group, 0.2, 0.035, mat(0xfff8ee, 0.4), 0, y + 0.12, 0)
    addBox(group, 0.16, 0.02, 0.12, mat(0xf4efe4, 0.6), 0.28, y + 0.06, 0.08)
  } else if (kind === 'bell') {
    addCyl(group, 0.12, 0.16, mat(0x8d6a45, 0.55), 0, y + 0.1, 0)
    addCyl(group, 0.16, 0.03, dark, 0, y + 0.2, 0)
    addSphere(group, 0.14, mat(0xe25b32, 0.35, 0.25), 0, y + 0.32, 0)
    addSphere(group, 0.035, mat(0xf4efe4, 0.4), 0, y + 0.46, 0)
  }
  group.add(stationLabel(kind))
}

function floorMaterial(name: string) {
  if (name === 'Mutfak') return new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.82, metalness: 0.02 })
  if (name === 'Kiler') return new THREE.MeshStandardMaterial({ map: woodTexture('#8d6240', '#6e4b30'), roughness: 0.86 })
  if (name === 'Yemek') return new THREE.MeshStandardMaterial({ map: woodTexture('#c89662', '#a87448'), roughness: 0.8 })
  return new THREE.MeshStandardMaterial({ map: woodTexture('#e4c79a', '#c9a56e'), roughness: 0.84 })
}

function skyTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 256
  const pen = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  if (!pen) return texture
  const grade = pen.createLinearGradient(0, 0, 0, 256)
  grade.addColorStop(0, '#f6d7b2')
  grade.addColorStop(1, '#e7c49a')
  pen.fillStyle = grade
  pen.fillRect(0, 0, 8, 256)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function windowAt(scene: THREE.Scene, x: number, z: number, w: number) {
  const frame = mat(0xf7f1e6, 0.7)
  const glass = mat(0x9ec7d4, 0.15, 0.05)
  addBox(scene, w, 0.62, 0.06, glass, x, 1.05, z)
  addBox(scene, w + 0.12, 0.08, 0.1, frame, x, 1.38, z)
  addBox(scene, w + 0.12, 0.08, 0.1, frame, x, 0.72, z)
  addBox(scene, 0.08, 0.7, 0.1, frame, x - w / 2, 1.05, z)
  addBox(scene, 0.08, 0.7, 0.1, frame, x + w / 2, 1.05, z)
}

function doorFrame(scene: THREE.Scene, x: number, z: number) {
  const trim = mat(0xd7b48a, 0.62)
  const half = 1.2
  addBox(scene, 0.12, WALL_H, 0.28, trim, x - half, WALL_H / 2, z)
  addBox(scene, 0.12, WALL_H, 0.28, trim, x + half, WALL_H / 2, z)
  addBox(scene, half * 2 + 0.12, 0.12, 0.28, trim, x, WALL_H - 0.06, z)
  addBox(scene, half * 2, 0.04, 0.36, mat(0xc4a574, 0.7), x, 0.02, z)
}

function shelfUnit(scene: THREE.Scene, x: number, z: number, w: number) {
  const wood = mat(0xb88958, 0.62)
  const board = mat(0xd7b48a, 0.58)
  addBox(scene, 0.08, 1.45, 0.42, wood, x - w / 2, 0.78, z)
  addBox(scene, 0.08, 1.45, 0.42, wood, x + w / 2, 0.78, z)
  for (const y of [0.38, 0.82, 1.26]) addBox(scene, w, 0.05, 0.4, board, x, y, z)
  const jar = mat(0xe7d7b0, 0.4)
  const lid = mat(0x6f8f72, 0.45)
  addCyl(scene, 0.08, 0.16, jar, x - w * 0.28, 0.5, z)
  addCyl(scene, 0.07, 0.04, lid, x - w * 0.28, 0.6, z)
  addBox(scene, 0.16, 0.14, 0.12, mat(0xc47a3a, 0.6), x + w * 0.2, 0.92, z)
}

function counterRun(scene: THREE.Scene, x: number, z: number, w: number, d: number) {
  const body = mat(0xf4efe6, 0.72)
  const top = mat(0xfff8ee, 0.42, 0.08)
  const toe = mat(0xc4a574, 0.6)
  addBox(scene, w, 0.72, d, body, x, 0.46, z)
  addBox(scene, w + 0.06, 0.08, d + 0.08, top, x, 0.86, z)
  addBox(scene, w, 0.08, 0.06, toe, x, 0.08, z + d / 2)
}

function fridge(scene: THREE.Scene, x: number, z: number) {
  const body = mat(0xf7f4ef, 0.45, 0.08)
  addBox(scene, 1.35, 1.62, 0.72, body, x, 0.84, z)
  addBox(scene, 1.22, 0.02, 0.02, mat(0xd7d3cc, 0.4, 0.2), x, 1.05, z + 0.36)
  addBox(scene, 0.06, 0.28, 0.04, mat(0xc9c4bc, 0.35, 0.4), x + 0.48, 1.28, z + 0.38)
  addBox(scene, 0.06, 0.22, 0.04, mat(0xc9c4bc, 0.35, 0.4), x + 0.48, 0.62, z + 0.38)
}

function chair(scene: THREE.Scene, x: number, z: number, rot: number) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rot
  const wood = mat(0xb88958, 0.6)
  addBox(group, 0.36, 0.06, 0.36, mat(0xd7b48a, 0.55), 0, 0.46, 0)
  addBox(group, 0.06, 0.46, 0.06, wood, -0.14, 0.23, -0.14)
  addBox(group, 0.06, 0.46, 0.06, wood, 0.14, 0.23, -0.14)
  addBox(group, 0.06, 0.46, 0.06, wood, -0.14, 0.23, 0.14)
  addBox(group, 0.06, 0.46, 0.06, wood, 0.14, 0.23, 0.14)
  addBox(group, 0.36, 0.4, 0.06, wood, 0, 0.72, -0.16)
  scene.add(group)
}

function diningSet(scene: THREE.Scene) {
  const wood = mat(0xc48a4a, 0.55)
  const top = mat(0xe6c48a, 0.5)
  addBox(scene, 2.3, 0.08, 1.15, top, 8.2, 0.74, 10.85)
  addBox(scene, 0.1, 0.7, 0.1, wood, 7.25, 0.36, 10.4)
  addBox(scene, 0.1, 0.7, 0.1, wood, 9.15, 0.36, 10.4)
  addBox(scene, 0.1, 0.7, 0.1, wood, 7.25, 0.36, 11.3)
  addBox(scene, 0.1, 0.7, 0.1, wood, 9.15, 0.36, 11.3)
  chair(scene, 8.2, 10.15, 0)
  chair(scene, 8.2, 11.55, Math.PI)
  chair(scene, 7.15, 10.85, Math.PI / 2)
  chair(scene, 9.25, 10.85, -Math.PI / 2)
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.02, 2.3),
    mat(0xc45c4a, 0.9),
  )
  rug.position.set(8.2, 0.02, 10.9)
  rug.receiveShadow = true
  scene.add(rug)
}

function painting(scene: THREE.Scene) {
  addBox(scene, 0.9, 0.55, 0.04, mat(0x8d5a32, 0.6), 8.2, 1.15, 13.82)
  addBox(scene, 0.72, 0.38, 0.02, mat(0x7f9a78, 0.7), 8.2, 1.15, 13.78)
}

export function sceneBackground() {
  return skyTexture()
}

export function buildHouse(scene: THREE.Scene) {
  for (const room of ROOMS) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(room.w, 0.2, room.d), floorMaterial(room.name))
    floor.position.set(room.x, -0.1, room.z)
    floor.receiveShadow = true
    scene.add(floor)
  }

  const plaster = mat(0xf7f1e6, 0.9)
  const board = mat(0xc4a574, 0.68)
  for (const wall of WALLS) {
    addBox(scene, wall.hw * 2, WALL_H, wall.hd * 2, plaster, wall.x, WALL_H / 2, wall.z)
    const alongX = wall.hw > wall.hd
    addBox(
      scene,
      alongX ? wall.hw * 2 : wall.hw * 2 + 0.04,
      0.12,
      alongX ? wall.hd * 2 + 0.04 : wall.hd * 2,
      board,
      wall.x,
      0.06,
      wall.z,
    )
  }

  doorFrame(scene, DOORS.pantry.x, DOORS.pantry.z)
  doorFrame(scene, DOORS.kitchen.x, DOORS.kitchen.z)
  doorFrame(scene, DOORS.dining.x, DOORS.dining.z)
  windowAt(scene, 11.2, 0.2, 2.2)
  windowAt(scene, 14.3, 0.2, 1.3)
  shelfUnit(scene, 2.6, 1.05, 4.2)
  shelfUnit(scene, 2.2, 2.7, 2.4)
  addBox(scene, 0.55, 0.32, 0.4, mat(0x8d5a32, 0.65), 4.5, 0.16, 4.2)
  fridge(scene, 7.6, 1.15)
  counterRun(scene, 12.3, 1.05, 5.6, 0.78)
  counterRun(scene, 14.85, 4.05, 0.78, 3.1)
  counterRun(scene, 7.5, 5.15, 1.3, 0.7)
  counterRun(scene, 8.4, 13.35, 7.2, 0.62)
  diningSet(scene)
  painting(scene)

  const bars = new Map<string, THREE.Mesh>()
  const barMat = mat(0xd7a15a, 0.35, 0.45)
  for (const seed of STATION_SEEDS) {
    const props = new THREE.Group()
    props.position.set(seed.x, 0, seed.z)
    dressStation(seed.kind, props)
    scene.add(props)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.035, 0.05), barMat)
    bar.position.set(seed.x, 1.22, seed.z + 0.4)
    bar.scale.x = 0.001
    bar.castShadow = false
    scene.add(bar)
    bars.set(seed.id, bar)
  }
  return bars
}
