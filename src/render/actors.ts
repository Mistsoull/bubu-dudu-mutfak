import * as THREE from 'three'
import type { ItemKind, Role } from '../sim/types.ts'

const skin = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.02 })

const itemTextures = new Map<ItemKind, THREE.Texture>()
const itemMaterials = new Map<ItemKind, THREE.SpriteMaterial>()
const textureLoader = new THREE.TextureLoader()
const shadowGeo = new THREE.CircleGeometry(0.22, 14)
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x3a2a1c,
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
})

function itemMaterial(kind: ItemKind) {
  let material = itemMaterials.get(kind)
  if (material) return material
  let texture = itemTextures.get(kind)
  if (!texture) {
    texture = textureLoader.load(`${import.meta.env.BASE_URL}items/${kind}.png`)
    texture.colorSpace = THREE.SRGBColorSpace
    itemTextures.set(kind, texture)
  }
  material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  itemMaterials.set(kind, material)
  return material
}

export function createItemBillboard(): THREE.Group {
  const group = new THREE.Group()
  const sprite = new THREE.Sprite(itemMaterial('flour'))
  sprite.name = 'card'
  sprite.center.set(0.5, 0)
  const shadow = new THREE.Mesh(shadowGeo, shadowMat)
  shadow.name = 'shade'
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  group.add(shadow, sprite)
  return group
}

export function paintItem(group: THREE.Group, kind: ItemKind, held: boolean) {
  const sprite = group.getObjectByName('card')
  const shade = group.getObjectByName('shade')
  if (sprite instanceof THREE.Sprite) {
    sprite.material = itemMaterial(kind)
    const size = held ? 0.34 : 0.5
    sprite.scale.set(size, size, 1)
    sprite.position.y = held ? 0.02 : 0.04
  }
  if (shade) shade.visible = !held
}

export function createActor(role: Role): THREE.Group {
  const group = new THREE.Group()
  group.name = role
  const panda = role === 'bubu'
  const body = skin(panda ? 0xf7f7f7 : 0xc4843a)
  const ink = skin(0x1c2428)
  const blush = skin(panda ? 0xffb5a3 : 0xe7a684)
  const snout = skin(0xf3d7b0)
  const add = (mesh: THREE.Mesh, shadow = true) => {
    mesh.castShadow = shadow
    group.add(mesh)
  }
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshBasicMaterial({
    color: 0x2a2118,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }))
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.015
  add(blob, false)
  const legGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.22, 8)
  const legL = new THREE.Mesh(legGeo, body)
  const legR = new THREE.Mesh(legGeo, body)
  legL.position.set(-0.12, 0.12, 0.02)
  legR.position.set(0.12, 0.12, 0.02)
  add(legL)
  add(legR)
  const armGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.28, 8)
  const armL = new THREE.Mesh(armGeo, body)
  const armR = new THREE.Mesh(armGeo, body)
  armL.position.set(-0.36, 0.46, 0.04)
  armR.position.set(0.36, 0.46, 0.04)
  armL.rotation.z = 0.55
  armR.rotation.z = -0.35
  add(armL)
  add(armR)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), body)
  torso.position.y = 0.42
  add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), body)
  head.position.y = 0.92
  add(head)
  const earGeo = new THREE.SphereGeometry(0.12, 12, 10)
  const earMat = panda ? ink : body
  const earL = new THREE.Mesh(earGeo, earMat)
  const earR = new THREE.Mesh(earGeo, earMat)
  earL.position.set(-0.18, 1.14, 0)
  earR.position.set(0.18, 1.14, 0)
  add(earL)
  add(earR)
  if (!panda) {
    const innerGeo = new THREE.SphereGeometry(0.06, 10, 8)
    const innerL = new THREE.Mesh(innerGeo, snout)
    const innerR = new THREE.Mesh(innerGeo, snout)
    innerL.position.set(-0.18, 1.14, 0.04)
    innerR.position.set(0.18, 1.14, 0.04)
    add(innerL)
    add(innerR)
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), snout)
    muzzle.position.set(0, 0.84, 0.18)
    add(muzzle)
  } else {
    const patchGeo = new THREE.SphereGeometry(0.09, 12, 10)
    const patchL = new THREE.Mesh(patchGeo, ink)
    const patchR = new THREE.Mesh(patchGeo, ink)
    patchL.scale.set(1, 1.15, 0.45)
    patchR.scale.set(1, 1.15, 0.45)
    patchL.position.set(-0.1, 0.94, 0.2)
    patchR.position.set(0.1, 0.94, 0.2)
    add(patchL)
    add(patchR)
  }
  const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8)
  const eyeMat = panda ? skin(0xf7f7f7) : ink
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.09, 0.96, 0.24)
  eyeR.position.set(0.09, 0.96, 0.24)
  add(eyeL)
  add(eyeR)
  const cheekGeo = new THREE.SphereGeometry(0.045, 8, 8)
  const cheekL = new THREE.Mesh(cheekGeo, blush)
  const cheekR = new THREE.Mesh(cheekGeo, blush)
  cheekL.position.set(-0.16, 0.84, 0.18)
  cheekR.position.set(0.16, 0.84, 0.18)
  add(cheekL)
  add(cheekR)
  const nose = new THREE.Mesh(new THREE.SphereGeometry(panda ? 0.035 : 0.04, 8, 8), panda ? ink : skin(0xc47a62))
  nose.position.set(0, panda ? 0.88 : 0.84, panda ? 0.26 : 0.28)
  add(nose)
  const hold = new THREE.Group()
  hold.name = 'hold'
  hold.position.set(0.28, 0.7, 0.2)
  group.add(hold)
  return group
}
