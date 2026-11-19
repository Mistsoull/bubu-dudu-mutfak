import type { EndingId, Item, ItemKind, World } from './types.ts'

export interface OrderDef {
  id: 'pancake' | 'toasttea' | 'surprise'
  name: string
  seconds: number
  needs: ItemKind[]
}

const PANCAKE: OrderDef = {
  id: 'pancake',
  name: 'order.pancake',
  seconds: 90,
  needs: ['pancake', 'sliced-strawberry'],
}

const TOAST: OrderDef = {
  id: 'toasttea',
  name: 'order.toast',
  seconds: 75,
  needs: ['toast', 'brewed-tea'],
}

const SURPRISE: OrderDef = {
  id: 'surprise',
  name: 'order.surprise',
  seconds: 80,
  needs: ['pancake', 'sliced-strawberry', 'toast'],
}

export function orderDef(world: World): OrderDef {
  if (world.orderIndex <= 0) return PANCAKE
  if (world.orderIndex === 1) return TOAST
  if (world.orderIndex === 2) return SURPRISE
  const repeat = world.chaosOrder1 >= world.chaosOrder2 ? PANCAKE : TOAST
  return {
    ...repeat,
    seconds: 70,
    name: repeat.id === 'pancake' ? 'order.pancakeAgain' : 'order.toastAgain',
  }
}

export function pickEnding(harmony: number, chaos: number): EndingId {
  if (chaos >= 55) return 'kaos'
  if (harmony >= 70 && chaos < 40) return 'uyumlu'
  return 'orta'
}

export const ENDINGS: Record<EndingId, { title: string; text: string }> = {
  uyumlu: {
    title: 'Aynı ritim',
    text: 'Tabaklar zamanında gitti. Bubu yetiştirdi, Dudu yaktırmadı. Mutfak sakin kapandı.',
  },
  kaos: {
    title: 'Güzel bir karışıklık',
    text: 'Un uçtu, bir göz yandı, yine de zil çaldı. Bu mutfakta karışıklık da bir tür kahvaltı.',
  },
  orta: {
    title: 'Tam ikinize göre',
    text: 'Kimi tabak tam kıvamında, kimi son anda yetişti. Servis ikinizin temposunda bitti.',
  },
}

const RAW: Record<OrderDef['id'], ItemKind[]> = {
  pancake: ['flour', 'milk', 'egg', 'strawberry'],
  toasttea: ['bread', 'tea'],
  surprise: ['flour', 'milk', 'egg', 'strawberry', 'bread'],
}

function carried(world: World): Item[] {
  const items = [...world.players.bubu.slots, ...world.players.dudu.slots]
  for (const station of world.stations) {
    items.push(...station.inputs)
    if (station.output) items.push(station.output)
  }
  return items
}

function present(world: World, kind: ItemKind): boolean {
  return carried(world).some((item) => item.kind === kind || item.contents.includes(kind))
}

function satisfied(world: World, raw: ItemKind): boolean {
  if (raw === 'flour' || raw === 'milk' || raw === 'egg') {
    return present(world, raw) || present(world, 'batter') || present(world, 'pancake')
  }
  if (raw === 'strawberry') return present(world, 'strawberry') || present(world, 'sliced-strawberry')
  if (raw === 'bread') {
    return present(world, 'bread') || present(world, 'sliced-bread') || present(world, 'toast')
  }
  if (raw === 'tea') return present(world, 'tea') || present(world, 'brewed-tea')
  return present(world, raw)
}

export function nextMissingRaw(world: World): ItemKind | null {
  if (world.phase !== 'play') return null
  const order = orderDef(world)
  for (const raw of RAW[order.id]) {
    if (!satisfied(world, raw)) return raw
  }
  return null
}

function pancakeStep(world: World): string {
  if (!present(world, 'batter') && !present(world, 'pancake')) return 'step.mix'
  if (!present(world, 'sliced-strawberry')) return 'step.chopBerry'
  if (!present(world, 'pancake')) return 'step.stoveBatter'
  return 'step.platePancake'
}

function toastStep(world: World): string {
  if (!present(world, 'sliced-bread') && !present(world, 'toast')) return 'step.chopBread'
  if (!present(world, 'toast')) return 'step.stoveBread'
  if (!present(world, 'brewed-tea')) return 'step.kettle'
  return 'step.plateToast'
}

export function tutorial(world: World): string {
  if (world.phase !== 'play') return ''
  const order = orderDef(world)
  if (order.id === 'toasttea') return toastStep(world)
  if (order.id === 'surprise') {
    if (!present(world, 'pancake') || !present(world, 'sliced-strawberry')) return pancakeStep(world)
    if (!present(world, 'toast')) return toastStep(world)
    return 'step.plateSurprise'
  }
  return pancakeStep(world)
}

export function sameContents(a: ItemKind[], b: ItemKind[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((kind, index) => kind === right[index])
}
