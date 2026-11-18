import * as THREE from 'three'
import { createActor, createItemBillboard, paintItem } from './actors.ts'
import { buildHouse, relabelStations, sceneBackground } from './furniture.ts'
import { meterOf } from '../sim/stations.ts'
import type { Snapshot } from '../sim/world.ts'
import type { ItemKind, Role } from '../sim/types.ts'

export interface View {
  sync(snapshot: Snapshot, remoteSmooth: boolean, local: Role | null): void
  resize(): void
  relabel(): void
  start(onFrame: (dt: number) => void): void
}

export function createView(canvas: HTMLCanvasElement): View {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0xe7c49a)

  const scene = new THREE.Scene()
  scene.background = sceneBackground()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  camera.position.set(8, 18, 20)
  camera.lookAt(8, 0, 6.2)

  const hemi = new THREE.HemisphereLight(0xfff6e4, 0xb08968, 1.15)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfffaf3, 2.35)
  sun.position.set(4, 14, 8)
  sun.castShadow = true
  sun.shadow.bias = -0.0008
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -12
  sun.shadow.camera.right = 12
  sun.shadow.camera.top = 12
  sun.shadow.camera.bottom = -12
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 36
  scene.add(sun)

  const bars = buildHouse(scene)
  const bubu = createActor('bubu')
  const dudu = createActor('dudu')
  scene.add(bubu, dudu)
  const loose = new THREE.Group()
  scene.add(loose)
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0xe25b32, roughness: 0.35, metalness: 0.2 })
  const ping = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.46, 8), arrowMat)
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 12), arrowMat)
  head.rotation.x = Math.PI
  head.position.y = -0.36
  shaft.position.y = 0.02
  ping.add(shaft, head)
  ping.visible = false
  scene.add(ping)

  const pool: THREE.Group[] = []
  let used = 0

  const take = (parent: THREE.Object3D, kind: ItemKind, x: number, y: number, z: number, held: boolean) => {
    let group = pool[used]
    if (!group) {
      group = createItemBillboard()
      pool.push(group)
    }
    used += 1
    paintItem(group, kind, held)
    group.visible = true
    group.position.set(x, y, z)
    if (group.parent !== parent) parent.add(group)
  }

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }
  resize()

  let shown = false
  let framed = false
  const focus = new THREE.Vector3(8, 0, 6.2)
  const sync = (snapshot: Snapshot, remoteSmooth: boolean, local: Role | null) => {
    moveActor(bubu, snapshot.players.bubu, snapshot.t, 0, remoteSmooth && shown && local !== 'bubu')
    moveActor(dudu, snapshot.players.dudu, snapshot.t, 1.4, remoteSmooth && shown && local !== 'dudu')
    const player = local ? snapshot.players[local] : null
    const goalX = player ? Math.min(13.2, Math.max(2.8, player.x)) : 8
    const goalZ = player ? Math.min(11.2, Math.max(2.6, player.z)) : 6.2
    const height = player ? 12.5 : 18
    const back = player ? 9.6 : 13.8
    if (!framed || !player) focus.set(goalX, 0, goalZ)
    else focus.lerp(new THREE.Vector3(goalX, 0, goalZ), 0.12)
    camera.position.set(focus.x, height, focus.z + back)
    camera.lookAt(focus.x, 0, focus.z)
    framed = true
    used = 0
    const bubuHold = bubu.getObjectByName('hold')
    const duduHold = dudu.getObjectByName('hold')
    if (bubuHold) snapshot.players.bubu.slots.forEach((kind, index) => take(bubuHold, kind, index * 0.2, 0.12, 0, true))
    if (duduHold) snapshot.players.dudu.slots.forEach((kind, index) => take(duduHold, kind, index * 0.2, 0.12, 0, true))
    for (const item of snapshot.floor) take(loose, item.kind, item.x, 0, item.z, false)
    for (const station of snapshot.stations) {
      const bar = bars.get(station.id)
      if (bar) {
        const amount = meterOf(station.kind, station.elapsed, station.worker, station.burnt)
        bar.scale.x = Math.max(0.001, amount)
        bar.visible = amount > 0.02 || station.burnt
      }
      station.inputs.forEach((kind, index) => take(loose, kind, station.x - 0.22 + index * 0.22, 1.02, station.z, false))
      if (station.output) take(loose, station.output, station.x, 1.08, station.z, false)
    }
    for (let index = used; index < pool.length; index += 1) {
      const extra = pool[index]
      if (extra) extra.visible = false
    }
    if (snapshot.ping) {
      ping.visible = true
      ping.position.set(snapshot.ping.x, 1.55 + Math.sin(snapshot.t * 5) * 0.08, snapshot.ping.z)
    } else {
      ping.visible = false
    }
    shown = true
  }

  let last = performance.now()
  const start = (onFrame: (dt: number) => void) => {
    renderer.setAnimationLoop((now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      onFrame(dt)
      renderer.render(scene, camera)
    })
  }

  return { sync, resize, relabel: relabelStations, start }
}

function moveActor(
  group: THREE.Group,
  player: { x: number; z: number; facing: number; dashing: boolean },
  time: number,
  phase: number,
  smooth: boolean,
) {
  const bob = Math.sin(time * (player.dashing ? 14 : 7) + phase) * (player.dashing ? 0.08 : 0.035)
  const y = 0.02 + bob
  if (Number.isFinite(player.x) && Number.isFinite(player.z)) {
    if (!smooth) group.position.set(player.x, y, player.z)
    else {
      group.position.x += (player.x - group.position.x) * 0.35
      group.position.z += (player.z - group.position.z) * 0.35
      group.position.y = y
    }
  }
  group.rotation.set(0, Number.isFinite(player.facing) ? player.facing : 0, 0)
}
