import { describe, expect, it } from 'vitest'
import { IDLE } from '../sim/types.ts'
import { createWorld, tick } from '../sim/world.ts'
import { ageGuestStick, noteGuestInput, STICK_TIMEOUT } from './guestInput.ts'

describe('guest stick', () => {
  it('keeps the stick until the timeout', () => {
    let stick = noteGuestInput({ input: { ...IDLE }, age: 0 }, { x: 1, z: -0.4 })
    stick = ageGuestStick(stick, STICK_TIMEOUT - 0.01)
    expect(stick.input.x).toBe(1)
    expect(stick.input.z).toBe(-0.4)
  })

  it('zeroes a stale stick so the bear stops', () => {
    let stick = noteGuestInput({ input: { ...IDLE }, age: 0 }, { x: 1, z: 0 })
    stick = ageGuestStick(stick, STICK_TIMEOUT + 0.01)
    expect(stick.input.x).toBe(0)
    const world = createWorld()
    const x = world.players.dudu.x
    tick(world, 1 / 60, { bubu: { ...IDLE }, dudu: stick.input })
    expect(world.players.dudu.x).toBe(x)
  })
})
