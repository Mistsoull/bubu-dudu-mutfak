import type { Input } from '../sim/types.ts'
import { t } from '../i18n.ts'
import { IDLE } from '../sim/types.ts'

function icon(body: string) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`
}

const ICONS: Record<string, string> = {
  take: icon('<rect x="7" y="11" width="10" height="8" rx="2" fill="currentColor"/><path d="M12 11V3M8.5 6.2 12 2.8l3.5 3.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  drop: icon('<rect x="7" y="3" width="10" height="8" rx="2" fill="currentColor"/><path d="M12 11v9M8.5 16.4 12 19.8l3.5-3.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  chop: icon('<path fill="currentColor" d="M14.2 2.2 21 4.4l-8.6 12.2-3.4-.8z"/><path d="M3.5 20.5c2.2-.8 4.2-.6 6.2.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
  cook: icon('<path fill="currentColor" d="M12 1.8c.8 3.4-2.2 4.6-2.2 7.6a4.4 4.4 0 0 0 8.8 0c0-2.2-1.2-3.4-1.2-5.4-1.8 1.8-2 3.6-2.8 3.6.8-2.8-.2-4.8-2.6-5.8z"/>'),
  plate: icon('<path fill="currentColor" fill-rule="evenodd" d="M12 7.2c5.8 0 10 2.6 10 5.8s-4.2 5.8-10 5.8S2 16.2 2 13 6.2 7.2 12 7.2zm0 3.2c2.6 0 4.6.9 4.6 2.2S14.6 14.8 12 14.8 7.4 13.9 7.4 12.6 9.4 10.4 12 10.4z"/>'),
  mix: icon('<path fill="currentColor" d="M4.5 9.5h15L17.6 18a5.2 5.2 0 0 1-11.2 0z"/><path d="M12 2.5v6.2M9.4 4.6 12 2.2l2.6 2.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  serve: icon('<path fill="currentColor" d="M6 15.2a6 6 0 0 1 12 0z"/><rect x="4" y="15" width="16" height="2.6" rx="1.2" fill="currentColor"/><circle cx="12" cy="7.2" r="1.5" fill="currentColor"/><rect x="10.8" y="17.6" width="2.4" height="3.2" rx="1" fill="currentColor"/>'),
  wash: icon('<path fill="currentColor" d="M12 2.2s6.4 7.2 6.4 11.2a6.4 6.4 0 0 1-12.8 0C5.6 9.4 12 2.2 12 2.2z"/>'),
  wait: icon('<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 8v4.4l3 1.8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  dash: icon('<path fill="currentColor" d="M3 6.2 11 12 3 17.8zM12 6.2 20 12l-8 5.8z"/>'),
  ping: icon('<path fill="currentColor" d="M4.2 2.6 20.4 11l-7.2 1.6L11.2 20z"/>'),
  swap: icon('<rect x="2.2" y="3.2" width="8" height="7" rx="1.8" fill="currentColor"/><rect x="13.8" y="13.8" width="8" height="7" rx="1.8" fill="currentColor"/><path d="M11 6.4h6.2L15.2 4.2l1.6-1.6 4.2 4.2-4.2 4.2-1.6-1.6 2-1.8H11zM13 17.6H6.8l2-2.2-1.6-1.6-4.2 4.2 4.2 4.2 1.6-1.6-2-1.8H13z" fill="currentColor"/>'),
  quit: icon('<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
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
  swap.disabled = true
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
