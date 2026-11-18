import { DOORS, ROOM, SHELVES, WALLS } from './layout.ts'
import { nextMissingRaw, orderDef, pickEnding, sameContents, tutorial } from './recipes.ts'
import type { Box, FloorItem, Input, Item, ItemKind, Player, Role, Station, StationKind, World } from './types.ts'

const REACH = 1.4
const BODY = 0.34

export function slotMax(_role: Role): number {
  return 2
}

export function spawnItem(world: World, kind: ItemKind, messy = false, contents: ItemKind[] = []): Item {
  world.nextId += 1
  return { id: world.nextId, kind, messy, contents: [...contents] }
}

function rand(world: World): number {
  world.rng = (Math.imul(world.rng, 1664525) + 1013904223) >>> 0
  return world.rng / 4294967296
}

function addHarmony(world: World, amount: number) {
  world.harmony = Math.max(0, Math.min(100, world.harmony + amount))
}

function addChaos(world: World, amount: number) {
  world.chaos = Math.max(0, Math.min(100, world.chaos + amount))
}

function dist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz)
}

export function nearestStation(world: World, x: number, z: number, reach = REACH): Station | null {
  let best: Station | null = null
  let bestDist = reach
  for (const station of world.stations) {
    const gap = dist(x, z, station.x, station.z)
    if (gap <= bestDist) {
      best = station
      bestDist = gap
    }
  }
  return best
}

function nearestFloor(world: World, x: number, z: number): FloorItem | null {
  let best: FloorItem | null = null
  let bestDist = 1.2
  for (const item of world.floor) {
    const gap = dist(x, z, item.x, item.z)
    if (gap <= bestDist) {
      best = item
      bestDist = gap
    }
  }
  return best
}

function freeSlot(player: Player): boolean {
  return player.slots.length < slotMax(player.role)
}

function takeFromHand(player: Player, item: Item) {
  player.slots = player.slots.filter((slot) => slot.id !== item.id)
}

function held(player: Player): Item | null {
  return player.slots[0] ?? null
}

function cookTimes(role: Role) {
  if (role === 'dudu') return { open: 2.9, close: 4.3, burn: 4.7 }
  return { open: 3.4, close: 3.8, burn: 4.1 }
}

function processTime(station: Station): number {
  const role = station.worker ?? 'dudu'
  if (station.kind === 'mixer') return role === 'dudu' ? 3 : 5
  if (station.kind === 'chop') return role === 'dudu' ? 1.2 : 2.4
  return 0
}

function cooking(station: Station): boolean {
  return (station.kind === 'stove' || station.kind === 'kettle') && !!station.worker && !station.burnt && !station.output
}

function inWindow(station: Station): boolean {
  if (!cooking(station) || !station.worker) return false
  const times = cookTimes(station.worker)
  return station.elapsed >= times.open && station.elapsed < times.burn
}

function perfect(station: Station): boolean {
  if (!station.worker) return false
  const times = cookTimes(station.worker)
  return station.elapsed >= times.open && station.elapsed <= times.close
}

function resetStation(station: Station) {
  station.inputs = []
  station.output = null
  station.elapsed = 0
  station.worker = null
  station.burnt = false
}

function finishMixer(world: World, station: Station) {
  station.output = spawnItem(world, 'batter')
  station.inputs = []
  station.worker = null
  station.elapsed = 0
}

function finishChop(world: World, station: Station) {
  const source = station.inputs[0]
  const kind: ItemKind = source?.kind === 'bread' ? 'sliced-bread' : 'sliced-strawberry'
  let messy = false
  if (station.worker === 'bubu' && rand(world) < 0.25) {
    messy = true
    addChaos(world, 6)
  }
  station.output = spawnItem(world, kind, messy)
  station.inputs = []
  station.worker = null
  station.elapsed = 0
}

export function tickStations(world: World, dt: number) {
  for (const station of world.stations) {
    if ((station.kind === 'mixer' || station.kind === 'chop') && station.worker && !station.output) {
      station.elapsed += dt
      if (station.elapsed >= processTime(station)) {
        if (station.kind === 'mixer') finishMixer(world, station)
        else finishChop(world, station)
      }
    }
    if (cooking(station) && station.worker) {
      station.elapsed += dt
      const times = cookTimes(station.worker)
      if (station.elapsed >= times.burn) {
        station.burnt = true
        station.output = spawnItem(world, 'burnt')
        station.inputs = []
        station.worker = null
        station.elapsed = 0
        addChaos(world, 14)
      }
    }
  }
}

function notePing(world: World, role: Role, kind: ItemKind) {
  if (role !== 'bubu' || !world.pingKind || world.pingUsed) return
  if (kind !== world.pingKind || world.t > world.pingUntil) return
  world.pingUsed = true
  addHarmony(world, 4)
}

function takeOutput(world: World, player: Player, station: Station): boolean {
  if (!freeSlot(player)) return false
  if (station.output && station.output.kind !== 'burnt') {
    player.slots.push(station.output)
    station.output = null
    return true
  }
  if (!inWindow(station)) return false
  const source = station.inputs[0]
  if (!source || !station.worker) return false
  const made: ItemKind = station.kind === 'kettle'
    ? 'brewed-tea'
    : source.kind === 'batter'
      ? 'pancake'
      : 'toast'
  if (perfect(station)) addHarmony(world, 8)
  player.slots.push(spawnItem(world, made))
  resetStation(station)
  return true
}

function insert(_world: World, player: Player, station: Station, item: Item): boolean {
  takeFromHand(player, item)
  station.inputs.push(item)
  station.worker = player.role
  station.elapsed = 0
  station.output = null
  station.burnt = false
  return true
}

function placeInto(world: World, player: Player, station: Station): boolean {
  const item = held(player)
  if (!item || !heldFits(world, station, item)) return false
  insert(world, player, station, item)
  if (station.kind === 'mixer') {
    if (station.inputs.length === 3) {
      if (player.role === 'bubu' && rand(world) < 0.2) {
        addChaos(world, 10)
        station.inputs.pop()
        station.worker = null
        return true
      }
      station.worker = player.role
      station.elapsed = 0
    } else {
      station.worker = null
    }
  }
  if (station.kind === 'plate') {
    const kinds = station.inputs.map((slot) => slot.kind)
    if (sameContents(kinds, orderDef(world).needs)) {
      station.output = spawnItem(world, 'plated', false, kinds)
      station.inputs = []
      station.worker = null
    }
  }
  return true
}

function heldFits(world: World, station: Station, item: Item): boolean {
  if (station.kind === 'mixer') {
    if (station.worker || station.output) return false
    if (item.kind !== 'flour' && item.kind !== 'milk' && item.kind !== 'egg') return false
    return !station.inputs.some((have) => have.kind === item.kind)
  }
  if (station.kind === 'chop') {
    if (station.worker || station.output || station.inputs.length) return false
    return item.kind === 'strawberry' || item.kind === 'bread'
  }
  if (station.kind === 'stove') {
    if (station.burnt || station.worker || station.output || station.inputs.length) return false
    return item.kind === 'batter' || item.kind === 'bread' || item.kind === 'sliced-bread'
  }
  if (station.kind === 'kettle') {
    if (station.burnt || station.worker || station.output || station.inputs.length) return false
    return item.kind === 'tea'
  }
  if (station.kind === 'plate') {
    if (station.output) return false
    const needs = orderDef(world).needs
    return needs.includes(item.kind) && !station.inputs.some((have) => have.kind === item.kind)
  }
  return false
}

function wash(world: World, player: Player): boolean {
  const burnt = held(player)?.kind === 'burnt' ? held(player) : null
  if (burnt) takeFromHand(player, burnt)
  const stove = world.stations.find((station) => station.burnt)
  if (!stove && !burnt) return false
  if (stove) resetStation(stove)
  return true
}

function clearSpot(world: World, player: Player): { x: number; z: number } {
  for (let step = 0; step < 8; step += 1) {
    const angle = player.facing + step * 0.4
    const x = player.x + Math.sin(angle) * 0.75
    const z = player.z + Math.cos(angle) * 0.75
    if (!blocked(x, z, blocksFor(world))) return { x, z }
  }
  return { x: player.x, z: player.z }
}

function dropItem(world: World, player: Player) {
  const item = held(player)
  if (!item) return
  takeFromHand(player, item)
  const spot = clearSpot(world, player)
  const dropped: FloorItem = { ...item, x: spot.x, z: spot.z }
  world.floor.push(dropped)
}

function deliver(world: World) {
  const gained = world.chaos - world.chaosMark
  if (world.orderIndex === 0) world.chaosOrder1 = gained
  if (world.orderIndex === 1) world.chaosOrder2 = gained
  if (world.orderTime <= 15) {
    addHarmony(world, 10)
    addChaos(world, 4)
  } else {
    addHarmony(world, 18)
  }
  advance(world)
}

function expire(world: World) {
  const gained = world.chaos - world.chaosMark
  addChaos(world, 16)
  if (world.orderIndex === 0) world.chaosOrder1 = gained + 16
  if (world.orderIndex === 1) world.chaosOrder2 = gained + 16
  advance(world)
}

function advance(world: World) {
  world.orderIndex += 1
  if (world.orderIndex >= 4) {
    world.phase = 'end'
    world.orderTime = 0
    world.prompt = ''
    world.ending = pickEnding(world.harmony, world.chaos)
    return
  }
  const order = orderDef(world)
  world.orderTime = order.seconds
  world.orderSeconds = order.seconds
  world.chaosMark = world.chaos
  world.pingKind = null
  world.pingUntil = 0
  world.pingUsed = false
}

type Intent =
  | { kind: 'deliver' }
  | { kind: 'wash' }
  | { kind: 'place' }
  | { kind: 'take-output' }
  | { kind: 'take-floor'; id: number }
  | { kind: 'drop' }
  | { kind: 'wait' }
  | { kind: 'none' }

function intent(world: World, role: Role): Intent {
  if (world.phase !== 'play') return { kind: 'none' }
  const player = world.players[role]
  const item = held(player)
  const station = nearestStation(world, player.x, player.z)
  const loose = nearestFloor(world, player.x, player.z)
  if (station?.kind === 'bell' && item?.kind === 'plated' && sameContents(item.contents, orderDef(world).needs)) {
    return { kind: 'deliver' }
  }
  if (station?.kind === 'sink' && (item?.kind === 'burnt' || world.stations.some((entry) => entry.burnt))) {
    return { kind: 'wash' }
  }
  if (station && item && heldFits(world, station, item)) return { kind: 'place' }
  if (station && freeSlot(player) && ((station.output && station.output.kind !== 'burnt') || inWindow(station))) {
    return { kind: 'take-output' }
  }
  if (loose && freeSlot(player)) return { kind: 'take-floor', id: loose.id }
  if (item) return { kind: 'drop' }
  if (station && cooking(station) && !inWindow(station)) return { kind: 'wait' }
  return { kind: 'none' }
}

function placeLabel(world: World, role: Role): string {
  const station = nearestStation(world, world.players[role].x, world.players[role].z)
  if (!station) return 'verb.drop'
  if (station.kind === 'chop') return 'verb.chop'
  if (station.kind === 'stove' || station.kind === 'kettle') return 'verb.cook'
  if (station.kind === 'plate') return 'verb.plate'
  if (station.kind === 'mixer' && station.inputs.length === 2) return 'verb.mix'
  return 'verb.drop'
}

export function verb(world: World, role: Role): string {
  const next = intent(world, role)
  if (next.kind === 'deliver') return 'verb.serve'
  if (next.kind === 'wash') return 'verb.wash'
  if (next.kind === 'place') return placeLabel(world, role)
  if (next.kind === 'take-output' || next.kind === 'take-floor') return 'verb.take'
  if (next.kind === 'drop') return 'verb.drop'
  if (next.kind === 'wait') return 'verb.wait'
  return ''
}

export function applyAction(world: World, role: Role) {
  if (world.phase !== 'play') return
  const player = world.players[role]
  const next = intent(world, role)
  if (next.kind === 'deliver') {
    const dish = held(player)
    if (!dish) return
    takeFromHand(player, dish)
    deliver(world)
    return
  }
  if (next.kind === 'wash') {
    wash(world, player)
    return
  }
  if (next.kind === 'place') {
    const station = nearestStation(world, player.x, player.z)
    if (station) placeInto(world, player, station)
    return
  }
  if (next.kind === 'take-output') {
    const station = nearestStation(world, player.x, player.z)
    if (station) takeOutput(world, player, station)
    return
  }
  if (next.kind === 'take-floor') {
    const item = world.floor.find((entry) => entry.id === next.id)
    if (!item || !freeSlot(player)) return
    world.floor = world.floor.filter((entry) => entry.id !== item.id)
    player.slots.push({ id: item.id, kind: item.kind, messy: item.messy, contents: item.contents })
    notePing(world, role, item.kind)
    return
  }
  if (next.kind === 'drop') dropItem(world, player)
}

export function walls(): Box[] {
  return WALLS
}

function hits(x: number, z: number, radius: number, box: Box): boolean {
  const dx = Math.abs(x - box.x) - box.hw
  const dz = Math.abs(z - box.z) - box.hd
  if (dx > radius || dz > radius) return false
  if (dx <= 0 || dz <= 0) return true
  return dx * dx + dz * dz <= radius * radius
}

function blocked(x: number, z: number, blocks: Box[]): boolean {
  return blocks.some((box) => hits(x, z, BODY, box))
}

function slide(x: number, z: number, dx: number, dz: number, blocks: Box[]) {
  let nx = x + dx
  let nz = z
  if (blocked(nx, nz, blocks)) nx = x
  nz = z + dz
  if (blocked(nx, nz, blocks)) nz = z
  return { x: nx, z: nz }
}

function blocksFor(world: World): Box[] {
  return [
    ...WALLS,
    ...SHELVES,
    ...world.stations.map((station) => ({ x: station.x, z: station.z, hw: station.hw, hd: station.hd })),
  ]
}

function movePlayer(world: World, role: Role, input: Input, dt: number) {
  const player = world.players[role]
  let ix = Math.max(-1, Math.min(1, input.x))
  let iz = Math.max(-1, Math.min(1, input.z))
  const mag = Math.hypot(ix, iz)
  if (mag > 1) {
    ix /= mag
    iz /= mag
  }
  if (role === 'bubu' && input.dash && player.dashCd <= 0 && world.phase === 'play') {
    player.dashLeft = 0.35
    player.dashCd = 1.1
    player.dashHit = false
  }
  player.dashLeft = Math.max(0, player.dashLeft - dt)
  player.dashCd = Math.max(0, player.dashCd - dt)
  const speed = walkSpeed(role, player.dashLeft > 0)
  if (mag > 0.08 && world.phase === 'play') {
    const aim = Math.atan2(ix, iz)
    player.facing = turnToward(player.facing, aim, dt)
    const next = slide(player.x, player.z, ix * speed * dt, iz * speed * dt, blocksFor(world))
    player.x = Math.min(ROOM.w - 0.45, Math.max(0.45, next.x))
    player.z = Math.min(ROOM.d - 0.45, Math.max(0.45, next.z))
  }
}

function turnToward(current: number, target: number, dt: number) {
  let delta = target - current
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  const step = Math.min(Math.abs(delta), 6 * dt)
  let next = current + Math.sign(delta) * step
  if (!Number.isFinite(next)) return 0
  while (next > Math.PI) next -= Math.PI * 2
  while (next < -Math.PI) next += Math.PI * 2
  return next
}

function nearDoor(x: number, z: number) {
  return Object.values(DOORS).some((door) => Math.abs(x - door.x) < 1.35 && Math.abs(z - door.z) < 0.75)
}

export function walkSpeed(role: Role, dashing: boolean) {
  return dashing ? 7.5 : role === 'bubu' ? 4.2 : 2.6
}

function separate(world: World) {
  const a = world.players.bubu
  const b = world.players.dudu
  const dx = b.x - a.x
  const dz = b.z - a.z
  const gap = Math.hypot(dx, dz) || 0.0001
  const min = nearDoor(a.x, a.z) || nearDoor(b.x, b.z) ? 0.5 : 0.74
  if (gap >= min) return
  const push = (min - gap) / 2
  const nx = dx / gap
  const nz = dz / gap
  const blocks = blocksFor(world)
  const ax = a.x - nx * push
  const az = a.z - nz * push
  const bx = b.x + nx * push
  const bz = b.z + nz * push
  if (!blocked(ax, az, blocks)) {
    a.x = ax
    a.z = az
  }
  if (!blocked(bx, bz, blocks)) {
    b.x = bx
    b.z = bz
  }
  if (a.dashLeft > 0 && !a.dashHit) {
    a.dashHit = true
    addChaos(world, 5)
  }
}

export function meterOf(kind: Station['kind'], elapsed: number, worker: Role | null, burnt: boolean): number {
  if (burnt) return 1
  if (!worker) return 0
  if (kind === 'mixer') return Math.min(1, elapsed / (worker === 'bubu' ? 5 : 3))
  if (kind === 'chop') return Math.min(1, elapsed / (worker === 'bubu' ? 2.4 : 1.2))
  if (kind === 'stove' || kind === 'kettle') return Math.min(1, elapsed / 4.7)
  return 0
}

export function refreshLabels(world: World) {
  world.labels.bubu = verb(world, 'bubu')
  world.labels.dudu = verb(world, 'dudu')
  world.prompt = tutorial(world)
}

function machineFor(kind: ItemKind): StationKind | null {
  if (kind === 'flour' || kind === 'milk' || kind === 'egg') return 'mixer'
  if (kind === 'strawberry' || kind === 'bread') return 'chop'
  if (kind === 'batter' || kind === 'sliced-bread') return 'stove'
  if (kind === 'tea') return 'kettle'
  if (kind === 'sliced-strawberry' || kind === 'pancake' || kind === 'toast' || kind === 'brewed-tea') return 'plate'
  if (kind === 'plated') return 'bell'
  if (kind === 'burnt') return 'sink'
  return null
}

function closestStation(stations: Station[], x: number, z: number): Station | null {
  let best: Station | null = null
  let bestDist = Infinity
  for (const station of stations) {
    const gap = dist(x, z, station.x, station.z)
    if (gap < bestDist) {
      best = station
      bestDist = gap
    }
  }
  return best
}

function stationForHeld(world: World, player: Player, item: Item): Station | null {
  const wanted = machineFor(item.kind)
  const fitting = world.stations.filter((station) => heldFits(world, station, item))
  const preferred = fitting.filter((station) => station.kind === wanted)
  const pool = preferred.length
    ? preferred
    : fitting.length
      ? fitting
      : world.stations.filter((station) => station.kind === wanted)
  return closestStation(pool, player.x, player.z)
}

function placePing(world: World) {
  const player = world.players.dudu
  const item = held(player)
  if (item) {
    const station = stationForHeld(world, player, item)
    if (!station) return
    world.pingX = station.x
    world.pingZ = station.z
    world.pingKind = null
    world.pingUntil = world.t + 5
    world.pingUsed = false
    return
  }
  const kind = nextMissingRaw(world)
  if (!kind) return
  let best: FloorItem | null = null
  let bestDist = Infinity
  for (const loose of world.floor) {
    if (loose.kind !== kind) continue
    const gap = dist(player.x, player.z, loose.x, loose.z)
    if (gap < bestDist) {
      best = loose
      bestDist = gap
    }
  }
  if (!best) return
  world.pingX = best.x
  world.pingZ = best.z
  world.pingKind = kind
  world.pingUntil = world.t + 5
  world.pingUsed = false
}

export function step(world: World, dt: number, inputs: Record<Role, Input>) {
  if (world.phase === 'end') return
  world.t += dt
  tickStations(world, dt)
  movePlayer(world, 'bubu', inputs.bubu, dt)
  movePlayer(world, 'dudu', inputs.dudu, dt)
  separate(world)
  for (const role of ['bubu', 'dudu'] as const) {
    const player = world.players[role]
    if (inputs[role].swap && player.slots.length >= 2) {
      const first = player.slots[0]
      const second = player.slots[1]
      if (first && second) player.slots = [second, first]
    }
  }
  if (inputs.dudu.ping) placePing(world)
  if (inputs.bubu.action) applyAction(world, 'bubu')
  if (inputs.dudu.action) applyAction(world, 'dudu')
  if (world.phase === 'play') {
    world.orderTime -= dt
    if (world.orderTime <= 0) expire(world)
  }
  if (world.phase === 'play') refreshLabels(world)
  else if (!world.ending) world.ending = pickEnding(world.harmony, world.chaos)
}
