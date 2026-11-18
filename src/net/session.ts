import Peer, { type DataConnection } from 'peerjs'
import { ROOM } from '../sim/layout.ts'
import { walkSpeed } from '../sim/stations.ts'
import { createWorld, tick as stepWorld, toSnapshot } from '../sim/world.ts'
import type { Snapshot } from '../sim/world.ts'
import { IDLE } from '../sim/types.ts'
import type { Input, Role } from '../sim/types.ts'
import { ageGuestStick, consumeEdges, idleStick, noteGuestInput } from './guestInput.ts'
import type { GuestStick } from './guestInput.ts'

export interface Lobby {
  phase: 'lobby' | 'opening' | 'hosting' | 'joining' | 'role' | 'play' | 'end' | 'down'
  code: string
  role: Role | null
  error: string
  notice: string
  status: string
  ready: boolean
  taken: { bubu: boolean; dudu: boolean }
}

type Seat = 'host' | 'guest'

interface Meta {
  t: 'meta'
  seq: number
  roles: { bubu: Seat | null; dudu: Seat | null }
  ready: { host: boolean; guest: boolean }
  notice: string
}

export interface Session {
  lobby: Lobby
  isHost: boolean
  tick(dt: number, input: Input): Snapshot
  startHost(): void
  startGuest(code: string): void
  pick(role: Role): void
  ready(): void
  leave(): void
  again(): void
}

export function createSession(): Session {
  const preview = toSnapshot(createWorld())
  const lobby: Lobby = {
    phase: 'lobby',
    code: '',
    role: null,
    error: '',
    notice: '',
    status: '',
    ready: false,
    taken: { bubu: false, dudu: false },
  }
  let peer: Peer | null = null
  let conn: DataConnection | null = null
  let connReady = false
  let generation = 0
  let suppress = false
  let netTimer = 0
  let isHost = false
  let seat: Seat | null = null
  let roles: Meta['roles'] = { bubu: null, dudu: null }
  let readyFlags = { host: false, guest: false }
  let notice = ''
  let metaSeq = 0
  let world = createWorld()
  let snapshot = preview
  let snapAcc = 0
  let sendAcc = 0
  let guestStick: GuestStick = idleStick()
  let ghostX = 0
  let ghostZ = 0
  let ghostFacing = 0
  let ghostReady = false
  let retries = 0

  function roleOf(who: Seat): Role | null {
    if (roles.bubu === who) return 'bubu'
    if (roles.dudu === who) return 'dudu'
    return null
  }

  function paintLobby(phase: Lobby['phase']) {
    lobby.phase = phase
    lobby.notice = notice
    lobby.role = seat ? roleOf(seat) : null
    lobby.ready = seat ? readyFlags[seat] : false
    const mine = lobby.role
    lobby.taken = {
      bubu: roles.bubu !== null && mine !== 'bubu',
      dudu: roles.dudu !== null && mine !== 'dudu',
    }
    const other: Seat | null = seat === 'host' ? 'guest' : seat === 'guest' ? 'host' : null
    const otherRole = other ? roleOf(other) : null
    if (!otherRole) lobby.status = phase === 'role' ? 'status.waiting' : ''
    else if (other && readyFlags[other]) lobby.status = `status.ready.${otherRole}`
    else lobby.status = `status.picked.${otherRole}`
  }

  function destroyNet() {
    generation += 1
    suppress = true
    window.clearTimeout(netTimer)
    const oldConn = conn
    const oldPeer = peer
    conn = null
    connReady = false
    peer = null
    guestStick = idleStick()
    ghostReady = false
    try { oldConn?.close() } catch { /* already closed */ }
    try { oldPeer?.destroy() } catch { /* already gone */ }
    suppress = false
  }

  function send(data: object) {
    if (conn && connReady) conn.send(data)
  }

  function publishMeta() {
    if (!isHost) return
    metaSeq += 1
    send({
      t: 'meta',
      seq: metaSeq,
      roles: { bubu: roles.bubu, dudu: roles.dudu },
      ready: { host: readyFlags.host, guest: readyFlags.guest },
      notice,
    } satisfies Meta)
    paintLobby(lobby.phase === 'play' || lobby.phase === 'end' ? lobby.phase : 'role')
  }

  function publishSnap(force = false) {
    snapshot = toSnapshot(world)
    if (world.phase === 'end') lobby.phase = 'end'
    if (force || snapAcc >= 1 / 30) {
      snapAcc = 0
      send({ t: 'snap', snapshot })
    }
  }

  function begin() {
    world = createWorld()
    guestStick = idleStick()
    ghostReady = false
    snapAcc = 0
    lobby.phase = 'play'
    paintLobby('play')
    publishSnap(true)
  }

  function setRole(who: Seat, role: Role) {
    if (lobby.phase !== 'role') return
    if (roles.bubu === who) roles.bubu = null
    if (roles.dudu === who) roles.dudu = null
    readyFlags[who] = false
    if (roles[role] && roles[role] !== who) notice = 'notice.taken'
    else {
      roles[role] = who
      notice = ''
    }
    publishMeta()
  }

  function setReady(who: Seat) {
    if (lobby.phase !== 'role') return
    if (!roleOf(who)) {
      notice = 'notice.pick'
      publishMeta()
      return
    }
    readyFlags[who] = true
    notice = ''
    if (readyFlags.host && readyFlags.guest && roles.bubu && roles.dudu) begin()
    else publishMeta()
  }

  function resetRoles() {
    roles = { bubu: null, dudu: null }
    readyFlags = { host: false, guest: false }
    notice = 'notice.reset'
    world = createWorld()
    snapshot = toSnapshot(world)
    paintLobby('role')
    publishMeta()
  }

  function onGuest(msg: Record<string, unknown>) {
    if (msg.t === 'hello') {
      paintLobby('role')
      publishMeta()
      return
    }
    if (msg.t === 'role' && (msg.role === 'bubu' || msg.role === 'dudu')) setRole('guest', msg.role)
    else if (msg.t === 'ready') setReady('guest')
    else if (msg.t === 'again') resetRoles()
    else if (msg.t === 'input') guestStick = noteGuestInput(guestStick, msg)
  }

  function onMeta(msg: Meta) {
    if (!seat) seat = 'guest'
    roles = {
      bubu: msg.roles.bubu,
      dudu: msg.roles.dudu,
    }
    readyFlags = { host: !!msg.ready.host, guest: !!msg.ready.guest }
    notice = msg.notice || ''
    if (lobby.phase !== 'play') paintLobby('role')
  }

  function bind(link: DataConnection, gen: number) {
    conn = link
    link.on('data', (data) => {
      if (gen !== generation || !data || typeof data !== 'object') return
      connReady = true
      const msg = data as Record<string, unknown>
      if (isHost) onGuest(msg)
      else if (msg.t === 'meta') onMeta(msg as unknown as Meta)
      else if (msg.t === 'snap' && msg.snapshot) {
        snapshot = msg.snapshot as Snapshot
        lobby.phase = snapshot.phase === 'end' ? 'end' : 'play'
        anchorGhost(snapshot)
        window.clearTimeout(netTimer)
      }
    })
    link.on('open', () => {
      if (gen !== generation) return
      connReady = true
      if (isHost) publishMeta()
      else link.send({ t: 'hello' })
    })
    link.on('close', () => {
      if (gen !== generation || suppress || conn !== link) return
      drop()
    })
  }

  function drop() {
    const playing = lobby.phase === 'play' || lobby.phase === 'end' || lobby.phase === 'role'
    destroyNet()
    if (playing) {
      lobby.phase = 'down'
      lobby.error = 'err.reopen'
    } else {
      lobby.phase = 'lobby'
      lobby.error = lobby.error || 'err.connect'
    }
  }

  function peerCtor() {
    return Peer
  }

  function failSoft(message: string) {
    const code = lobby.code
    destroyNet()
    isHost = false
    seat = null
    lobby.phase = 'lobby'
    lobby.code = code
    lobby.error = message
    lobby.role = null
    lobby.ready = false
  }

  function onPeerError(err: { type?: string }, gen: number) {
    if (gen !== generation) return
    const type = err?.type
    if (type === 'peer-unavailable') {
      failSoft('err.noRoom')
      return
    }
    if (type === 'unavailable-id') return
    if (type === 'browser-incompatible') {
      failSoft('err.browser')
      return
    }
    if (lobby.phase === 'play' || lobby.phase === 'role' || lobby.phase === 'end') {
      destroyNet()
      lobby.phase = 'down'
      lobby.error = 'err.reopen'
      return
    }
    failSoft('err.signal')
  }

  function startHost(retry = false) {
    destroyNet()
    const gen = generation
    if (!retry) retries = 0
    const code = String(Math.floor(100000 + Math.random() * 900000))
    isHost = true
    seat = 'host'
    roles = { bubu: null, dudu: null }
    readyFlags = { host: false, guest: false }
    notice = ''
    lobby.code = code
    lobby.error = ''
    lobby.phase = 'opening'
    peer = new (peerCtor())(`bd${code}`)
    netTimer = window.setTimeout(() => {
      if (gen === generation && lobby.phase === 'opening') failSoft('err.signalLate')
    }, 15000)
    peer.on('open', () => {
      if (gen !== generation) return
      window.clearTimeout(netTimer)
      lobby.phase = 'hosting'
      lobby.code = code
    })
    peer.on('connection', (link) => {
      if (gen !== generation) {
        link.close()
        return
      }
      if (conn) {
        link.close()
        return
      }
      bind(link, gen)
    })
    peer.on('error', (err) => {
      if (gen !== generation) return
      if (err.type === 'unavailable-id' && retries < 4) {
        retries += 1
        startHost(true)
        return
      }
      onPeerError(err, gen)
    })
  }

  function startGuest(code: string) {
    destroyNet()
    const gen = generation
    isHost = false
    seat = 'guest'
    lobby.code = code
    lobby.error = ''
    lobby.phase = 'joining'
    peer = new (peerCtor())()
    netTimer = window.setTimeout(() => {
      if (gen === generation && lobby.phase === 'joining') {
        failSoft('err.joinLate')
      }
    }, 15000)
    peer.on('open', () => {
      if (gen !== generation || !peer) return
      const link = peer.connect(`bd${code}`, { serialization: 'json', reliable: true })
      if (!link) return
      bind(link, gen)
    })
    peer.on('error', (err) => onPeerError(err, gen))
  }

  function anchorGhost(snap: Snapshot) {
    const role = lobby.role
    if (!role) {
      ghostReady = false
      return
    }
    const player = snap.players[role]
    ghostX = player.x
    ghostZ = player.z
    ghostFacing = player.facing
    ghostReady = true
  }

  function predict(dt: number, input: Input): Snapshot {
    const role = lobby.role
    if (!role || !ghostReady || snapshot.phase !== 'play') return snapshot
    let ix = Math.max(-1, Math.min(1, input.x))
    let iz = Math.max(-1, Math.min(1, input.z))
    const mag = Math.hypot(ix, iz)
    if (mag > 1) {
      ix /= mag
      iz /= mag
    }
    if (mag > 0.08) {
      const speed = walkSpeed(role, false)
      ghostX = Math.min(ROOM.w - 0.45, Math.max(0.45, ghostX + ix * speed * dt))
      ghostZ = Math.min(ROOM.d - 0.45, Math.max(0.45, ghostZ + iz * speed * dt))
      const aim = Math.atan2(ix, iz)
      let delta = aim - ghostFacing
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      ghostFacing += Math.sign(delta) * Math.min(Math.abs(delta), 6 * dt)
    }
    const players = {
      bubu: snapshot.players.bubu,
      dudu: snapshot.players.dudu,
    }
    players[role] = { ...players[role], x: ghostX, z: ghostZ, facing: ghostFacing }
    return { ...snapshot, players }
  }

  return {
    lobby,
    get isHost() {
      return isHost
    },
    tick(dt, input) {
      if (!isHost && connReady) {
        sendAcc += dt
        const edged = input.action || input.dash || input.ping || input.swap
        if (edged || sendAcc >= 1 / 30) {
          send({
            t: 'input',
            x: input.x,
            z: input.z,
            action: input.action,
            dash: input.dash,
            ping: input.ping,
            swap: input.swap,
          })
          sendAcc = 0
        }
      }
      if (isHost && (lobby.phase === 'play' || lobby.phase === 'end')) {
        guestStick = ageGuestStick(guestStick, dt)
        const mine = seat ? roleOf(seat) : null
        const inputs = {
          bubu: { ...IDLE },
          dudu: { ...IDLE },
        }
        if (mine) inputs[mine] = input
        const guestRole = roleOf('guest')
        if (guestRole && connReady) inputs[guestRole] = { ...guestStick.input }
        if (lobby.phase === 'play') stepWorld(world, dt, inputs)
        guestStick = consumeEdges(guestStick)
        snapAcc += dt
        publishSnap(false)
        return snapshot
      }
      if (!isHost && (lobby.phase === 'play' || lobby.phase === 'end')) return predict(dt, input)
      return preview
    },
    startHost() {
      startHost(false)
    },
    startGuest,
    pick(role) {
      if (!seat) return
      if (isHost) setRole(seat, role)
      else send({ t: 'role', role })
    },
    ready() {
      if (!seat) return
      if (isHost) setReady(seat)
      else send({ t: 'ready' })
    },
    leave() {
      destroyNet()
      isHost = false
      seat = null
      lobby.phase = 'lobby'
      lobby.role = null
      lobby.ready = false
      lobby.error = ''
      lobby.status = ''
    },
    again() {
      if (lobby.phase !== 'end') return
      if (isHost) resetRoles()
      else send({ t: 'again' })
    },
  }
}
