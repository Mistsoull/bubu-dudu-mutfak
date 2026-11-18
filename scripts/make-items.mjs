import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const W = 96
const H = 96

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([len, name, data, tail])
}

function png(pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((W * 4 + 1) * H)
  for (let y = 0; y < H; y += 1) {
    raw[(W * 4 + 1) * y] = 0
    pixels.copy(raw, (W * 4 + 1) * y + 1, y * W * 4, (y + 1) * W * 4)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function canvas() {
  const pixels = Buffer.alloc(W * H * 4)
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 4
    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
    pixels[i + 3] = a
  }
  const fill = (r, g, b) => {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
      pixels[i + 3] = 0
    }
  }
  const rect = (x, y, w, h, r, g, b) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) set(xx, yy, r, g, b)
    }
  }
  const ellipse = (cx, cy, rx, ry, r, g, b) => {
    for (let yy = cy - ry; yy <= cy + ry; yy += 1) {
      for (let xx = cx - rx; xx <= cx + rx; xx += 1) {
        const nx = (xx - cx) / rx
        const ny = (yy - cy) / ry
        if (nx * nx + ny * ny <= 1) set(xx, yy, r, g, b)
      }
    }
  }
  fill(0, 0, 0)
  return { pixels, set, rect, ellipse }
}

const art = {
  flour(c) {
    c.ellipse(48, 58, 26, 30, 244, 239, 228)
    c.rect(36, 22, 24, 16, 232, 224, 208)
    c.rect(40, 40, 16, 8, 196, 164, 116)
  },
  milk(c) {
    c.rect(30, 18, 36, 64, 247, 251, 255)
    c.rect(30, 18, 36, 16, 90, 164, 214)
    c.rect(42, 40, 12, 22, 217, 232, 242)
  },
  egg(c) {
    c.ellipse(48, 52, 22, 28, 243, 226, 176)
    c.ellipse(42, 44, 6, 4, 255, 248, 230)
  },
  strawberry(c) {
    c.ellipse(48, 56, 22, 24, 217, 65, 74)
    c.rect(42, 24, 12, 12, 63, 140, 72)
    c.set(40, 50, 255, 230, 120)
    c.set(56, 58, 255, 230, 120)
    c.set(48, 66, 255, 230, 120)
  },
  bread(c) {
    c.ellipse(48, 54, 30, 22, 217, 161, 90)
    c.ellipse(48, 50, 22, 12, 230, 190, 120)
    c.rect(28, 58, 40, 6, 176, 112, 58)
  },
  tea(c) {
    c.rect(28, 22, 40, 56, 63, 107, 69)
    c.rect(36, 34, 24, 16, 232, 214, 160)
    c.rect(34, 18, 28, 8, 196, 164, 90)
  },
  batter(c) {
    c.ellipse(48, 58, 28, 16, 240, 213, 106)
    c.ellipse(48, 52, 18, 8, 255, 236, 160)
    c.rect(34, 28, 8, 22, 201, 196, 188)
  },
  'sliced-strawberry'(c) {
    c.ellipse(34, 50, 14, 16, 226, 91, 106)
    c.ellipse(62, 54, 14, 16, 217, 65, 74)
    c.rect(28, 34, 8, 8, 63, 140, 72)
  },
  'sliced-bread'(c) {
    c.rect(22, 30, 22, 36, 230, 196, 138)
    c.rect(52, 34, 22, 36, 217, 176, 110)
    c.rect(24, 58, 18, 4, 176, 112, 58)
  },
  pancake(c) {
    c.ellipse(48, 54, 30, 14, 231, 160, 74)
    c.ellipse(48, 50, 22, 8, 243, 196, 110)
    c.ellipse(48, 40, 6, 4, 217, 65, 74)
  },
  toast(c) {
    c.rect(26, 28, 44, 40, 196, 122, 58)
    c.rect(32, 34, 32, 22, 217, 161, 90)
  },
  'brewed-tea'(c) {
    c.ellipse(48, 58, 20, 22, 196, 138, 58)
    c.ellipse(48, 50, 14, 10, 230, 186, 96)
    c.rect(66, 48, 12, 8, 244, 247, 248)
  },
  burnt(c) {
    c.ellipse(48, 56, 26, 16, 42, 36, 32)
    c.ellipse(40, 50, 8, 6, 90, 70, 50)
  },
  plated(c) {
    c.ellipse(48, 58, 32, 12, 255, 248, 238)
    c.ellipse(48, 52, 16, 8, 231, 160, 74)
    c.ellipse(40, 48, 5, 4, 217, 65, 74)
  },
}

const dir = path.resolve('public/items')
fs.mkdirSync(dir, { recursive: true })
for (const [name, draw] of Object.entries(art)) {
  const c = canvas()
  draw(c)
  fs.writeFileSync(path.join(dir, `${name}.png`), png(c.pixels))
}
console.log('items', Object.keys(art).length)
