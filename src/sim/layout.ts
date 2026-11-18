import type { Box, ItemKind, Station, StationKind } from './types.ts'

export const ROOM = { w: 16, d: 14 }

export interface StationSeed {
  id: string
  kind: StationKind
  x: number
  z: number
}

export const DOORS = {
  pantry: { x: 3.2, z: 6 },
  kitchen: { x: 10.2, z: 6 },
  dining: { x: 7.7, z: 9 },
}

function box(x: number, z: number, hw: number, hd: number): Box {
  return { x, z, hw, hd }
}

export const WALLS: Box[] = [
  box(8, 0, 8.2, 0.18),
  box(8, 14, 8.2, 0.18),
  box(0, 7, 0.18, 7.2),
  box(16, 7, 0.18, 7.2),
  box(6, 3, 0.16, 3),
  box(1, 6, 1, 0.16),
  box(6.7, 6, 2.3, 0.16),
  box(13.7, 6, 2.3, 0.16),
  box(3.25, 9, 3.25, 0.16),
  box(12.45, 9, 3.55, 0.16),
]

export const SHELVES: Box[] = [
  box(2.6, 1.05, 2.2, 0.32),
  box(2.2, 2.7, 1.3, 0.28),
  box(7.6, 1.15, 0.7, 0.42),
]

export const STOCK: Array<[ItemKind, number, number]> = [
  ['flour', 1.35, 1.7],
  ['flour', 2.15, 1.7],
  ['bread', 3.15, 1.7],
  ['bread', 4.05, 1.7],
  ['tea', 1.6, 3.2],
  ['tea', 2.7, 3.2],
  ['milk', 7.15, 1.85],
  ['milk', 8.05, 1.85],
  ['egg', 7.15, 2.35],
  ['egg', 8.05, 2.35],
  ['strawberry', 7.55, 2.7],
  ['strawberry', 8.35, 2.7],
]

export const STATION_SEEDS: StationSeed[] = [
  { id: 'stove-a', kind: 'stove', x: 10.4, z: 1.2 },
  { id: 'stove-b', kind: 'stove', x: 12.2, z: 1.2 },
  { id: 'mixer', kind: 'mixer', x: 14.2, z: 1.2 },
  { id: 'chop', kind: 'chop', x: 14.7, z: 3.3 },
  { id: 'kettle', kind: 'kettle', x: 14.7, z: 4.8 },
  { id: 'sink', kind: 'sink', x: 7.5, z: 5.2 },
  { id: 'plate', kind: 'plate', x: 6.2, z: 12.3 },
  { id: 'bell', kind: 'bell', x: 10.6, z: 12.3 },
]

export function makeStations(): Station[] {
  return STATION_SEEDS.map((seed) => ({
    id: seed.id,
    kind: seed.kind,
    x: seed.x,
    z: seed.z,
    hw: 0.5,
    hd: 0.48,
    inputs: [],
    output: null,
    elapsed: 0,
    worker: null,
    burnt: false,
  }))
}

export const SPAWN = {
  bubu: { x: 7.2, z: 7.5 },
  dudu: { x: 9.0, z: 7.5 },
}

export const ROOMS = [
  { name: 'Kiler', x: 3, z: 3, w: 5.6, d: 5.6, color: 0xd7b48a },
  { name: 'Mutfak', x: 11, z: 3, w: 9.6, d: 5.6, color: 0xe7c48a },
  { name: 'Koridor', x: 8, z: 7.5, w: 15.6, d: 2.6, color: 0xecd7b0 },
  { name: 'Yemek', x: 8, z: 11.5, w: 15.6, d: 4.6, color: 0xe6d2b4 },
]
