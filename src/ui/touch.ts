import type { Input } from '../sim/types.ts'
import { t } from '../i18n.ts'
import { IDLE } from '../sim/types.ts'

export interface Controls {
  read(): Input
  setExtra(kind: 'dash' | 'ping', enabled: boolean): void
  setAction(label: string): void
}

export function createControls(
  stick: HTMLElement,
  knob: HTMLElement,
  act: HTMLButtonElement,
  extra: HTMLButtonElement,
  swap: HTMLButtonElement,
): Controls {
  const analog = { x: 0, z: 0 }
  const edges = { action: false, dash: false, ping: false, swap: false }
  const keys = new Set<string>()
  let pointer = -1

  const radius = () => Math.max(36, stick.clientWidth / 2 - 8)

  const placeKnob = (x: number, z: number) => {
    const span = radius()
    knob.style.transform = `translate(${x * span}px, ${z * span}px)`
  }

  stick.addEventListener('pointerdown', (event) => {
    pointer = event.pointerId
    stick.setPointerCapture(pointer)
    moveStick(event)
  })
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer) return
    moveStick(event)
  })
  const release = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return
    pointer = -1
    analog.x = 0
    analog.z = 0
    placeKnob(0, 0)
  }
  stick.addEventListener('pointerup', release)
  stick.addEventListener('pointercancel', release)

  function moveStick(event: PointerEvent) {
    const rect = stick.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const span = radius()
    const mag = Math.hypot(dx, dy) || 1
    const scale = Math.min(1, mag / span)
    analog.x = (dx / mag) * scale
    analog.z = (dy / mag) * scale
    placeKnob(analog.x, analog.z)
  }

  act.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    edges.action = true
  })
  swap.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    edges.swap = true
  })
  extra.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    if (extra.dataset.kind === 'dash') edges.dash = true
    if (extra.dataset.kind === 'ping') edges.ping = true
  })

  window.addEventListener('keydown', (event) => {
    keys.add(event.code)
    if (event.code === 'KeyE') edges.action = true
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') edges.dash = true
    if (event.code === 'KeyQ') edges.ping = true
    if (event.code === 'KeyF') edges.swap = true
  })
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code)
  })

  return {
    read() {
      let x = analog.x
      let z = analog.z
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1
      if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1
      const input: Input = {
        x,
        z,
        action: edges.action,
        dash: edges.dash,
        ping: edges.ping,
        swap: edges.swap,
      }
      edges.action = false
      edges.dash = false
      edges.ping = false
      edges.swap = false
      return input
    },
    setExtra(kind: 'dash' | 'ping', enabled: boolean) {
      extra.hidden = !enabled
      extra.textContent = t(kind === 'dash' ? 'verb.dash' : 'verb.ping')
      extra.dataset.kind = kind
    },
    setAction(label: string) {
      act.textContent = label || '...'
      act.disabled = !label
    },
  }
}

export function idleInput(): Input {
  return { ...IDLE }
}
