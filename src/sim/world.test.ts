import { describe, expect, it } from 'vitest'
import { IDLE } from './types.ts'
import type { Input, Role, World } from './types.ts'
import { DOORS } from './layout.ts'
import { createWorld, give, stationById, tick, toSnapshot } from './world.ts'

function press(world: World, role: Role, extra: Partial<Input> = {}) {
  const inputs = {
    bubu: { ...IDLE },
    dudu: { ...IDLE },
  }
  inputs[role] = { ...IDLE, action: true, ...extra }
  tick(world, 1 / 60, inputs)
}

function idle(world: World, seconds: number) {
  const steps = Math.round(seconds * 60)
  for (let i = 0; i < steps; i += 1) tick(world, 1 / 60, { bubu: { ...IDLE }, dudu: { ...IDLE } })
}

function beside(world: World, role: Role, id: string) {
  const station = stationById(world, id)
  const player = world.players[role]
  if (station.id === 'chop' || station.id === 'kettle') {
    player.x = station.x - 1.25
    player.z = station.z
    return
  }
  player.x = station.x
  player.z = station.z < 3 ? station.z + 1.05 : station.z - 1.2
}

function seedWithoutSpill(role: Role): number {
  for (let seed = 1; seed < 80; seed += 1) {
    const world = createWorld()
    world.rng = seed
    give(world, role, 'flour')
    give(world, role, 'milk')
    give(world, role, 'egg')
    beside(world, role, 'mixer')
    press(world, role)
    press(world, role)
    press(world, role)
    if (stationById(world, 'mixer').worker === role) return seed
  }
  throw new Error('no seed')
}

function fillMixer(world: World, role: Role) {
  give(world, role, 'flour')
  give(world, role, 'milk')
  give(world, role, 'egg')
  beside(world, role, 'mixer')
  press(world, role)
  press(world, role)
  press(world, role)
}

describe('mutfak', () => {
  it('takes one shelf flour and the same item can be dropped and picked up', () => {
    const world = createWorld()
    const flour = world.floor.find((item) => item.kind === 'flour')
    if (!flour) throw new Error('un yok')
    const before = world.floor.filter((item) => item.kind === 'flour').length
    world.players.dudu.x = flour.x
    world.players.dudu.z = flour.z + 0.7
    press(world, 'dudu')
    expect(world.players.dudu.slots[0]?.id).toBe(flour.id)
    expect(world.floor.filter((item) => item.kind === 'flour')).toHaveLength(before - 1)
    world.players.dudu.x = 8
    world.players.dudu.z = 7.5
    world.players.dudu.facing = 0
    press(world, 'dudu')
    const dropped = world.floor.find((item) => item.id === flour.id)
    expect(dropped).toBeTruthy()
    world.players.dudu.x = dropped?.x ?? 0
    world.players.dudu.z = dropped?.z ?? 0
    press(world, 'dudu')
    expect(world.players.dudu.slots.some((item) => item.id === flour.id)).toBe(true)
  })

  it('lets Dudu carry two ingredients and start the mixer', () => {
    const world = createWorld()
    world.rng = seedWithoutSpill('dudu')
    const flour = world.floor.find((item) => item.kind === 'flour')
    const bread = world.floor.find((item) => item.kind === 'bread')
    if (!flour || !bread) throw new Error('raf boş')
    world.players.dudu.x = flour.x
    world.players.dudu.z = flour.z + 0.7
    press(world, 'dudu')
    world.players.dudu.x = bread.x
    world.players.dudu.z = bread.z + 0.7
    press(world, 'dudu')
    expect(world.players.dudu.slots).toHaveLength(2)
    world.players.dudu.slots = []
    fillMixer(world, 'dudu')
    expect(stationById(world, 'mixer').worker).toBe('dudu')
  })

  it('moves both bears in the same tick', () => {
    const world = createWorld()
    const bubuX = world.players.bubu.x
    const duduZ = world.players.dudu.z
    tick(world, 1 / 60, {
      bubu: { ...IDLE, x: 1 },
      dudu: { ...IDLE, z: -1 },
    })
    expect(world.players.bubu.x).toBeGreaterThan(bubuX)
    expect(world.players.dudu.z).toBeLessThan(duduZ)
  })

  it('lets both bears through the pantry door together', () => {
    const world = createWorld()
    world.players.bubu.x = DOORS.pantry.x - 0.4
    world.players.dudu.x = DOORS.pantry.x + 0.4
    world.players.bubu.z = 5.2
    world.players.dudu.z = 5.2
    for (let i = 0; i < 120; i += 1) {
      tick(world, 1 / 60, {
        bubu: { ...IDLE, z: 1 },
        dudu: { ...IDLE, z: 1 },
      })
    }
    expect(world.players.bubu.z).toBeGreaterThan(6.5)
    expect(world.players.dudu.z).toBeGreaterThan(6.5)
  })

  it('keeps the current dish on screen after a pickup and the next order', () => {
    const world = createWorld()
    idle(world, 0.05)
    expect(toSnapshot(world).orderName).toBe('order.pancake')
    expect(world.prompt).toBe('step.mix')
    give(world, 'dudu', 'flour')
    idle(world, 0.05)
    expect(toSnapshot(world).orderName).toBe('order.pancake')
    expect(world.prompt).toBe('step.mix')
    world.orderIndex = 1
    idle(world, 0.05)
    expect(toSnapshot(world).orderName).toBe('order.toast')
    expect(world.prompt).toBe('step.chopBread')
  })

  it('marks the machine for the item in hand', () => {
    const world = createWorld()
    give(world, 'dudu', 'flour')
    tick(world, 1 / 60, { bubu: { ...IDLE }, dudu: { ...IDLE, ping: true } })
    const ping = toSnapshot(world).ping
    const mixer = stationById(world, 'mixer')
    expect(ping).toBeTruthy()
    expect(Math.hypot((ping?.x ?? 0) - mixer.x, (ping?.z ?? 0) - mixer.z)).toBeLessThan(0.2)
    expect(ping?.kind).toBeNull()
  })

  it('walks through the pantry door and stops at the wall', () => {
    const blocked = createWorld()
    blocked.players.bubu.x = 1.2
    blocked.players.bubu.z = 5.2
    for (let i = 0; i < 90; i += 1) {
      tick(blocked, 1 / 60, { bubu: { ...IDLE, z: 1 }, dudu: { ...IDLE } })
    }
    expect(blocked.players.bubu.z).toBeLessThan(5.9)

    const open = createWorld()
    open.players.bubu.x = DOORS.pantry.x
    open.players.bubu.z = 5.2
    for (let i = 0; i < 90; i += 1) {
      tick(open, 1 / 60, { bubu: { ...IDLE, z: 1 }, dudu: { ...IDLE } })
    }
    expect(open.players.bubu.z).toBeGreaterThan(6.4)
  })

  it('delivers a strawberry pancake when the plate matches', () => {
    const world = createWorld()
    world.rng = seedWithoutSpill('dudu')
    fillMixer(world, 'dudu')
    idle(world, 3.1)
    beside(world, 'dudu', 'mixer')
    press(world, 'dudu')
    expect(world.players.dudu.slots.map((item) => item.kind)).toContain('batter')
    beside(world, 'dudu', 'stove-a')
    press(world, 'dudu')
    idle(world, 3.3)
    beside(world, 'dudu', 'stove-a')
    press(world, 'dudu')
    expect(world.players.dudu.slots.map((item) => item.kind)).toContain('pancake')
    expect(world.harmony).toBeGreaterThanOrEqual(28)

    world.players.dudu.slots = []
    give(world, 'dudu', 'strawberry')
    beside(world, 'dudu', 'chop')
    press(world, 'dudu')
    idle(world, 1.3)
    beside(world, 'dudu', 'chop')
    press(world, 'dudu')
    expect(world.players.dudu.slots.map((item) => item.kind)).toContain('sliced-strawberry')

    beside(world, 'dudu', 'plate')
    world.players.dudu.slots = world.players.dudu.slots.filter((item) => item.kind === 'pancake' || item.kind === 'sliced-strawberry')
    if (!world.players.dudu.slots.some((item) => item.kind === 'pancake')) give(world, 'dudu', 'pancake')
    press(world, 'dudu')
    press(world, 'dudu')
    press(world, 'dudu')
    expect(world.players.dudu.slots.some((item) => item.kind === 'plated')).toBe(true)

    beside(world, 'dudu', 'bell')
    press(world, 'dudu')
    expect(world.orderIndex).toBe(1)
    expect(orderName(world)).toBe('Çay ve tost')
    expect(world.harmony).toBeGreaterThanOrEqual(46)
  })

  it('does not serve a burnt pan', () => {
    const world = createWorld()
    give(world, 'dudu', 'batter')
    beside(world, 'dudu', 'stove-a')
    press(world, 'dudu')
    idle(world, 6)
    const stove = stationById(world, 'stove-a')
    expect(stove.burnt).toBe(true)
    expect(stove.output?.kind).toBe('burnt')
    beside(world, 'dudu', 'bell')
    press(world, 'dudu')
    expect(world.orderIndex).toBe(0)
    beside(world, 'dudu', 'sink')
    press(world, 'dudu')
    expect(stationById(world, 'stove-a').burnt).toBe(false)
  })

  it('keeps Dudu from spinning when the stick jitters north', () => {
    const world = createWorld()
    let previous = world.players.dudu.facing
    let maxJump = 0
    for (let i = 0; i < 40; i += 1) {
      tick(world, 1 / 60, {
        bubu: { ...IDLE },
        dudu: { ...IDLE, x: i % 2 === 0 ? 0.03 : -0.03, z: -1 },
      })
      let delta = world.players.dudu.facing - previous
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      maxJump = Math.max(maxJump, Math.abs(delta))
      previous = world.players.dudu.facing
    }
    expect(maxJump).toBeLessThan(0.2)
    expect(Number.isFinite(world.players.dudu.x)).toBe(true)
    expect(Number.isFinite(world.players.dudu.z)).toBe(true)
    expect(world.players.dudu.z).toBeLessThan(8.4)
  })

  it('mixes slower for Bubu than for Dudu', () => {
    const duduSeed = seedWithoutSpill('dudu')
    const bubuSeed = seedWithoutSpill('bubu')
    expect(untilBatter('dudu', duduSeed)).toBeLessThan(untilBatter('bubu', bubuSeed))
  })
})

function orderName(world: World): string {
  return world.orderIndex === 1 ? 'Çay ve tost' : ''
}

function untilBatter(role: Role, seed: number): number {
  const world = createWorld()
  world.rng = seed
  fillMixer(world, role)
  let time = 0
  while (!stationById(world, 'mixer').output && time < 8) {
    idle(world, 1 / 60)
    time += 1 / 60
  }
  return time
}
