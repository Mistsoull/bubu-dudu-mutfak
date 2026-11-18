import './style.css'
import { createView } from './render/view.ts'
import { createControls } from './ui/touch.ts'
import { paint } from './ui/hud.ts'
import type { HudNodes } from './ui/hud.ts'
import { createSession } from './net/session.ts'
import { applyDom, setLang, t } from './i18n.ts'
import type { Lang } from './i18n.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#view')
const stick = document.querySelector<HTMLElement>('#stick')
const knob = document.querySelector<HTMLElement>('#knob')
const act = document.querySelector<HTMLButtonElement>('#act')
const extra = document.querySelector<HTMLButtonElement>('#extra')
const swap = document.querySelector<HTMLButtonElement>('#swap')
const quit = document.querySelector<HTMLButtonElement>('#quit')
if (!canvas || !stick || !knob || !act || !extra || !swap || !quit) throw new Error('ekran kurulamadı')

const view = createView(canvas)
const controls = createControls(stick, knob, act, extra, swap, quit)
const session = createSession()

const nodes: HudNodes = {
  hud: must('#hud'),
  who: must('#who'),
  order: must('#order'),
  prompt: must('#prompt'),
  love: must('#love'),
  chaos: must('#chaos'),
  lobby: must('#lobby'),
  home: must('#home'),
  hostBox: must('#host-box'),
  roleBox: must('#role-box'),
  joining: must('#joining'),
  error: must('#error'),
  roomCode: must('#room-code'),
  roleStatus: must('#role-status'),
  ready: mustButton('#ready'),
  pickBubu: mustButton('#pick-bubu'),
  pickDudu: mustButton('#pick-dudu'),
  end: must('#end'),
  endTitle: must('#end-title'),
  endText: must('#end-text'),
  down: must('#down'),
  turn: must('#turn'),
  controls: must('#controls'),
  hostBtn: mustButton('#host'),
}

function must(selector: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(selector)
  if (!node) throw new Error(selector)
  return node
}

function mustButton(selector: string): HTMLButtonElement {
  const node = document.querySelector<HTMLButtonElement>(selector)
  if (!node) throw new Error(selector)
  return node
}

nodes.hostBtn.addEventListener('click', () => session.startHost())
document.querySelector('#join-form')?.addEventListener('submit', (event) => {
  event.preventDefault()
  const field = document.querySelector<HTMLInputElement>('#code')
  const code = (field?.value ?? '').replace(/\D/g, '').slice(0, 6)
  if (field) field.value = code
  if (!/^\d{6}$/.test(code)) {
    session.lobby.error = 'err.code'
    return
  }
  session.startGuest(code)
})
document.querySelector('#code')?.addEventListener('input', (event) => {
  const field = event.target as HTMLInputElement
  field.value = field.value.replace(/\D/g, '').slice(0, 6)
})
document.querySelector('#copy')?.addEventListener('click', async () => {
  const button = document.querySelector('#copy')
  try {
    await navigator.clipboard.writeText(session.lobby.code)
    if (button) button.textContent = t('copy.done')
  } catch {
    if (button) button.textContent = t('copy.fail')
  }
})
document.querySelector('#cancel')?.addEventListener('click', () => session.leave())
document.querySelector('#cancel-join')?.addEventListener('click', () => session.leave())
document.querySelector('#leave-role')?.addEventListener('click', () => session.leave())
document.querySelector('#quit')?.addEventListener('click', () => session.leave())
nodes.pickBubu.addEventListener('click', () => session.pick('bubu'))
nodes.pickDudu.addEventListener('click', () => session.pick('dudu'))
nodes.ready.addEventListener('click', () => session.ready())
document.querySelector('#again')?.addEventListener('click', () => session.again())
document.querySelector('#new-room')?.addEventListener('click', () => session.leave())
document.querySelectorAll<HTMLButtonElement>('#lang button').forEach((button) => {
  button.addEventListener('click', () => {
    const next = button.dataset.lang
    if (next !== 'tr' && next !== 'de') return
    const lang: Lang = next
    setLang(lang)
    applyDom()
    view.relabel()
  })
})
applyDom()
window.addEventListener('resize', () => view.resize())
window.addEventListener('contextmenu', (event) => event.preventDefault())

view.start((dt) => {
  const landscape = window.innerWidth > window.innerHeight
  const input = controls.read()
  const snapshot = session.tick(dt, input)
  const playing = session.lobby.phase === 'play' || session.lobby.phase === 'end'
  view.sync(snapshot, !session.isHost && playing, playing ? session.lobby.role : null)
  paint(nodes, session.lobby, snapshot, landscape)
  if (session.lobby.phase === 'play' && session.lobby.role) {
    controls.setExtra(session.lobby.role === 'bubu' ? 'dash' : 'ping', true)
    const verbKey = snapshot.labels[session.lobby.role] ?? ''
    controls.setAction(verbKey)
    const slots = snapshot.players[session.lobby.role].slots.length
    controls.setSwap(slots >= 2)
  }
})
