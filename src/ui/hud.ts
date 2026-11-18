import type { Role } from '../sim/types.ts'
import type { Snapshot } from '../sim/world.ts'
import type { Lobby } from '../net/session.ts'
import { statusLine, t } from '../i18n.ts'

export interface HudNodes {
  hud: HTMLElement
  who: HTMLElement
  order: HTMLElement
  prompt: HTMLElement
  love: HTMLElement
  chaos: HTMLElement
  lobby: HTMLElement
  home: HTMLElement
  hostBox: HTMLElement
  roleBox: HTMLElement
  joining: HTMLElement
  error: HTMLElement
  roomCode: HTMLElement
  roleStatus: HTMLElement
  ready: HTMLButtonElement
  pickBubu: HTMLButtonElement
  pickDudu: HTMLButtonElement
  end: HTMLElement
  endTitle: HTMLElement
  endText: HTMLElement
  down: HTMLElement
  turn: HTMLElement
  controls: HTMLElement
  hostBtn: HTMLButtonElement
}

export function paint(nodes: HudNodes, lobby: Lobby, snapshot: Snapshot, landscape: boolean) {
  nodes.turn.hidden = landscape
  const playing = lobby.phase === 'play' || lobby.phase === 'end'
  nodes.hud.hidden = !playing || !landscape
  nodes.controls.hidden = lobby.phase !== 'play' || !landscape
  nodes.lobby.hidden = playing || lobby.phase === 'down' || !landscape
  nodes.home.hidden = lobby.phase !== 'lobby' && lobby.phase !== 'opening'
  nodes.hostBox.hidden = lobby.phase !== 'hosting'
  nodes.joining.hidden = lobby.phase !== 'joining'
  nodes.roleBox.hidden = lobby.phase !== 'role'
  nodes.end.hidden = lobby.phase !== 'end'
  nodes.down.hidden = lobby.phase !== 'down'
  nodes.hostBtn.disabled = lobby.phase === 'opening'
  nodes.hostBtn.textContent = lobby.phase === 'opening' ? t('btn.opening') : t('btn.host')
  nodes.error.hidden = !lobby.error
  nodes.error.textContent = t(lobby.error)
  nodes.roomCode.textContent = lobby.code
  nodes.roleStatus.textContent = lobby.notice ? t(lobby.notice) : statusLine(lobby.status)
  nodes.ready.disabled = !lobby.role || lobby.ready
  nodes.ready.textContent = lobby.ready ? t('btn.readyDone') : t('btn.ready')
  nodes.pickBubu.disabled = lobby.taken.bubu && lobby.role !== 'bubu'
  nodes.pickDudu.disabled = lobby.taken.dudu && lobby.role !== 'dudu'
  nodes.pickBubu.classList.toggle('is-mine', lobby.role === 'bubu')
  nodes.pickDudu.classList.toggle('is-mine', lobby.role === 'dudu')
  if (!playing) return
  const role: Role | null = lobby.role
  nodes.who.textContent = role === 'bubu' ? t('who.bubu') : role === 'dudu' ? t('who.dudu') : ''
  const count = Math.min(4, snapshot.orderIndex + 1)
  const time = Math.ceil(snapshot.orderTime)
  nodes.order.textContent = snapshot.phase === 'end'
    ? t('order.done')
    : `${t(snapshot.orderName)}  ${count} / 4  ${time} ${t('unit.sec')}`
  nodes.prompt.textContent = t(snapshot.prompt)
  nodes.love.style.width = `${snapshot.harmony}%`
  nodes.chaos.style.width = `${snapshot.chaos}%`
  nodes.endTitle.textContent = snapshot.ending ? t(`ending.${snapshot.ending}.title`) : ''
  nodes.endText.textContent = snapshot.ending ? t(`ending.${snapshot.ending}.text`) : ''
}
