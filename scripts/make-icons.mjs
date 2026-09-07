// Generates the PWA icons from the wordmark: paper ground, the three gender
// bars (der / die / das), and the ledger rule under them. Geometry only, so it
// renders identically everywhere and needs no image library.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const PAPER = [0xfb, 0xfb, 0xf9]
const INK = [0x19, 0x1b, 0x1e]
const BARS = [
  [0x2f, 0x62, 0xc4], // der  — blue
  [0xc4, 0x32, 0x7a], // die  — pink
  [0x2e, 0x7d, 0x5b], // das  — green
]

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function png(size, draw) {
  const stride = size * 3
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = draw(x, y)
      const i = rowStart + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** `inset` is the fraction of the canvas kept clear, for maskable safe zones. */
function icon(size, inset) {
  const pad = Math.round(size * inset)
  const box = size - pad * 2
  const gap = Math.round(box * 0.09)
  const barW = Math.round((box - gap * 2) / 3)
  const barTop = pad + Math.round(box * 0.06)
  const barBottom = pad + Math.round(box * 0.78)
  const ruleTop = pad + Math.round(box * 0.88)
  const ruleBottom = ruleTop + Math.max(2, Math.round(box * 0.055))

  return png(size, (x, y) => {
    if (y >= ruleTop && y < ruleBottom && x >= pad && x < pad + box) return INK
    if (y >= barTop && y < barBottom) {
      for (let i = 0; i < 3; i++) {
        const left = pad + i * (barW + gap)
        if (x >= left && x < left + barW) return BARS[i]
      }
    }
    return PAPER
  })
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192, 0.14))
writeFileSync('public/icons/icon-512.png', icon(512, 0.14))
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.22))

writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#fbfbf9"/>
  <rect x="5" y="5" width="6" height="17" fill="#2f62c4"/>
  <rect x="13" y="5" width="6" height="17" fill="#c4327a"/>
  <rect x="21" y="5" width="6" height="17" fill="#2e7d5b"/>
  <rect x="5" y="24" width="22" height="3" fill="#191b1e"/>
</svg>
`,
)

console.log('icons written')
