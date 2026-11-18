import { IDLE } from '../sim/types.ts'
import type { Input } from '../sim/types.ts'

export const STICK_TIMEOUT = 0.12

export interface GuestStick {
  input: Input
  age: number
}

export function idleStick(): GuestStick {
  return { input: { ...IDLE }, age: 0 }
}

export function noteGuestInput(prev: GuestStick, msg: Record<string, unknown>): GuestStick {
  const x = Number(msg.x)
  const z = Number(msg.z)
  return {
    age: 0,
    input: {
      x: Number.isFinite(x) ? x : 0,
      z: Number.isFinite(z) ? z : 0,
      action: prev.input.action || msg.action === true,
      dash: prev.input.dash || msg.dash === true,
      ping: prev.input.ping || msg.ping === true,
      swap: prev.input.swap || msg.swap === true,
    },
  }
}

export function ageGuestStick(state: GuestStick, dt: number): GuestStick {
  const age = state.age + dt
  if (age < STICK_TIMEOUT) return { input: state.input, age }
  return {
    age,
    input: { ...state.input, x: 0, z: 0 },
  }
}

export function consumeEdges(state: GuestStick): GuestStick {
  return {
    age: state.age,
    input: {
      ...state.input,
      action: false,
      dash: false,
      ping: false,
      swap: false,
    },
  }
}
