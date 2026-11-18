import { makeStations, SPAWN, STOCK } from './layout.ts'
import { ENDINGS, orderDef } from './recipes.ts'
import { refreshLabels, spawnItem, step } from './stations.ts'
import type { EndingId, Input, ItemKind, Player, Role, StationKind, World } from './types.ts'

export interface SnapPlayer {
  x: number
  z: number
  facing: number
  slots: ItemKind[]
  dashing: boolean
}

export interface SnapStation {
  id: string
  kind: StationKind
  x: number
  z: number
  inputs: ItemKind[]
  output: ItemKind | null
  elapsed: number
  burnt: boolean
  worker: Role | null
}

export interface Snapshot {
  t: number
  phase: 'play' | 'end'
  players: Record<Role, SnapPlayer>
  floor: { id: number; kind: ItemKind; x: number; z: number }[]
  stations: SnapStation[]
  orderName: string
  orderIndex: number
  orderTime: number
  orderSeconds: number
  harmony: number
  chaos: number
  prompt: string
  ending: EndingId | null
  endingTitle: string
  endingText: string
  labels: Record<Role, string>
  ping: { x: number; z: number; kind: ItemKind | null } | null
}

function makePlayer(role: Role, x: number, z: number): Player {
  return {
    role,
    x,
    z,
    facing: 0,
    slots: [],
    dashLeft: 0,
    dashCd: 0,
    dashHit: false,
  }
}

export function createWorld(): World {
  const world: World = {
    t: 0,
    players: {
      bubu: makePlayer('bubu', SPAWN.bubu.x, SPAWN.bubu.z),
      dudu: makePlayer('dudu', SPAWN.dudu.x, SPAWN.dudu.z),
    },
    floor: [],
    stations: makeStations(),
    orderIndex: 0,
    orderTime: 90,
    orderSeconds: 90,
    chaosMark: 0,
    chaosOrder1: 0,
    chaosOrder2: 0,
    harmony: 20,
    chaos: 0,
    phase: 'play',
    ending: null,
    prompt: '',
    pingX: 0,
    pingZ: 0,
    pingKind: null,
    pingUntil: 0,
    pingUsed: false,
    nextId: 1,
    rng: 1,
    labels: { bubu: '', dudu: '' },
  }
  for (const [kind, x, z] of STOCK) {
    world.floor.push({ ...spawnItem(world, kind), x, z })
  }
  refreshLabels(world)
  return world
}

export function give(world: World, role: Role, kind: ItemKind) {
  world.players[role].slots.push(spawnItem(world, kind))
}

export function stationById(world: World, id: string) {
  const found = world.stations.find((station) => station.id === id)
  if (!found) throw new Error(id)
  return found
}

function pingSpot(world: World): Snapshot['ping'] {
  if (world.pingUntil <= 0 || world.t > world.pingUntil) return null
  return { x: world.pingX, z: world.pingZ, kind: world.pingKind }
}

export function toSnapshot(world: World): Snapshot {
  const ending = world.ending ? ENDINGS[world.ending] : null
  const order = world.phase === 'play' ? orderDef(world) : null
  return {
    t: world.t,
    phase: world.phase,
    players: {
      bubu: snapPlayer(world.players.bubu),
      dudu: snapPlayer(world.players.dudu),
    },
    floor: world.floor.map((item) => ({ id: item.id, kind: item.kind, x: item.x, z: item.z })),
    stations: world.stations.map((station) => ({
      id: station.id,
      kind: station.kind,
      x: station.x,
      z: station.z,
      inputs: station.inputs.map((item) => item.kind),
      output: station.output?.kind ?? null,
      elapsed: station.elapsed,
      burnt: station.burnt,
      worker: station.worker,
    })),
    orderName: order?.name ?? '',
    orderIndex: world.orderIndex,
    orderTime: Math.max(0, world.orderTime),
    orderSeconds: world.orderSeconds,
    harmony: world.harmony,
    chaos: world.chaos,
    prompt: world.prompt,
    ending: world.ending,
    endingTitle: ending?.title ?? '',
    endingText: ending?.text ?? '',
    labels: { ...world.labels },
    ping: pingSpot(world),
  }
}

function snapPlayer(player: Player): SnapPlayer {
  return {
    x: player.x,
    z: player.z,
    facing: player.facing,
    slots: player.slots.map((item) => item.kind),
    dashing: player.dashLeft > 0,
  }
}

export function tick(world: World, dt: number, inputs: Record<Role, Input>) {
  step(world, dt, inputs)
  return toSnapshot(world)
}

export type { Input, Role }
