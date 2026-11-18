export type Role = 'bubu' | 'dudu'

export type ItemKind =
  | 'flour'
  | 'milk'
  | 'egg'
  | 'strawberry'
  | 'bread'
  | 'tea'
  | 'batter'
  | 'sliced-strawberry'
  | 'sliced-bread'
  | 'pancake'
  | 'toast'
  | 'brewed-tea'
  | 'burnt'
  | 'plated'

export type StationKind =
  | 'mixer'
  | 'chop'
  | 'stove'
  | 'kettle'
  | 'sink'
  | 'plate'
  | 'bell'

export type EndingId = 'uyumlu' | 'kaos' | 'orta'

export interface Item {
  id: number
  kind: ItemKind
  messy: boolean
  contents: ItemKind[]
}

export interface FloorItem extends Item {
  x: number
  z: number
}

export interface Input {
  x: number
  z: number
  action: boolean
  dash: boolean
  ping: boolean
  swap: boolean
}

export const IDLE: Input = { x: 0, z: 0, action: false, dash: false, ping: false, swap: false }

export interface Player {
  role: Role
  x: number
  z: number
  facing: number
  slots: Item[]
  dashLeft: number
  dashCd: number
  dashHit: boolean
}

export interface Station {
  id: string
  kind: StationKind
  x: number
  z: number
  hw: number
  hd: number
  inputs: Item[]
  output: Item | null
  elapsed: number
  worker: Role | null
  burnt: boolean
}

export interface World {
  t: number
  players: Record<Role, Player>
  floor: FloorItem[]
  stations: Station[]
  orderIndex: number
  orderTime: number
  orderSeconds: number
  chaosMark: number
  chaosOrder1: number
  chaosOrder2: number
  harmony: number
  chaos: number
  phase: 'play' | 'end'
  ending: EndingId | null
  prompt: string
  pingX: number
  pingZ: number
  pingKind: ItemKind | null
  pingUntil: number
  pingUsed: boolean
  nextId: number
  rng: number
  labels: Record<Role, string>
}

export interface Box {
  x: number
  z: number
  hw: number
  hd: number
}
