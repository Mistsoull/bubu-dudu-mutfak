import type { Input } from '../sim/types.ts'
import { t } from '../i18n.ts'
import { IDLE } from '../sim/types.ts'

const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

function icon(body: string) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" ${stroke}>${body}</svg>`
}

const ICONS: Record<string, string> = {
  take: icon('<path d="M12 3v11"/><path d="M8 10l4 4 4-4"/><path d="M5 21h14"/>'),
  drop: icon('<path d="M12 14V3"/><path d="M8 7l4-4 4 4"/><path d="M5 21h14"/>'),
  chop: icon('<path d="M4 20L15 5"/><path d="M14 6l5 2-3 4"/>'),
  cook: icon('<path d="M12 21c4 0 6-3 6-6 0-4-3-5-3-8 0 3-2 4-3 4s-3-1-3-4c0 3-3 4-3 8 0 3 2 6 6 6z"/>'),
  plate: icon('<ellipse cx="12" cy="13" rx="8" ry="4"/><ellipse cx="12" cy="13" rx="4" ry="2"/>'),
  mix: icon('<path d="M12 4v6"/><circle cx="12" cy="15" r="5"/><path d="M9 15h6"/>'),
  serve: icon('<path d="M6 16a6 6 0 0 1 12 0"/><path d="M5 16h14"/><path d="M12 16v4"/><path d="M9 20h6"/>'),
  wash: icon('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
  wait: icon('<circle cx="12" cy="13" r="7"/><path d="M12 10v4l3 2"/>'),
  dash: icon('<path d="M13 3L5 14h7l-1 7 8-11h-7l1-7z"/>'),
  ping: icon('<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2"/>'),
  swap: icon('<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>'),
  quit: icon('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
}

export interface Controls {
  read(): Input
  setExtra(kind: 'dash' | 'ping', enabled: boolean): void
  setAction(key: string): void
  setSwap(ready: boolean): void
}

export function createControls(
  stick: HTMLElement,
  knob: HTMLElement,
  act: HTMLButtonElement,
  extra: HTMLButtonElement,
  swap: HTMLButtonElement,
  quit: HTMLButtonElement,
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

  swap.innerHTML = ICONS.swap ?? ''
  quit.innerHTML = ICONS.quit ?? ''

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
      extra.dataset.kind = kind
      extra.innerHTML = ICONS[kind] ?? ''
      extra.setAttribute('aria-label', t(kind === 'dash' ? 'verb.dash' : 'verb.ping'))
    },
    setAction(key: string) {
      const name = key.startsWith('verb.') ? key.slice(5) : ''
      act.innerHTML = ICONS[name] ?? ''
      act.disabled = !name
      act.setAttribute('aria-label', name ? t(key) : '')
    },
    setSwap(ready: boolean) {
      swap.disabled = !ready
      swap.setAttribute('aria-label', t('btn.swap'))
    },
  }
}

export function idleInput(): Input {
  return { ...IDLE }
}
