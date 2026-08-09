/**
 * Draws the iOS shell's app icon, and the candidates it was chosen from.
 *
 * The icon is generated rather than hand-drawn so it stays in step with the app's own palette:
 * every colour here is copied from `src/theme/modes.ts` and `src/data/types.ts`, and the marks
 * are the same 8x8 plots `TypeGlyph` renders. A hand-exported PNG would drift the first time a
 * token changed.
 *
 * Output is PNG colour type 2 — truecolour RGB with no alpha channel at all — plus an sRGB
 * chunk. That is not decoration: the asset catalog's default (light) slot must not carry alpha,
 * and an untagged PNG has no defined colour space. Producing a conforming file is cheaper than
 * detecting a non-conforming one, so the encoder simply cannot emit alpha.
 *
 * Art is plotted on a 32x32 logical grid and scaled 32x by nearest neighbour, for the same
 * reason `TypeGlyph` insists on whole multiples of its 8px grid: any other ratio lands cells on
 * fractional pixels and the mark stops being sharp.
 *
 * Re-running with no arguments overwrites the shipped icon with identical bytes, so a clean
 * tree stays clean — the same property the dataset pipeline has.
 *
 *   node scripts/make-app-icons.mjs              # write the shipped icon to the asset catalog
 *   node scripts/make-app-icons.mjs --all <dir>  # write every candidate to <dir> for comparison
 *
 * Verifying what actually shipped is not as simple as opening the built app's PNG: Xcode's
 * `actool` runs `--compress-pngs`, which emits Apple's private CgBI variant that ordinary
 * decoders reject. Convert first — `sips -s format png <in> --out <out>`.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ICON_PATH = join(
  ROOT,
  'src/ios/Zero Lab/Zero Lab/Assets.xcassets/AppIcon.appiconset/icon-1024.png',
)

/** Which candidate is the app's icon. The rest are kept so the choice can be revisited. */
const SHIPPED = 'fire-solid'

const GRID = 32
const SCALE = 32 // 32 * 32 = 1024, the only size the modern single-size appiconset needs

// ── the project's own palette ────────────────────────────────────────────────────────────────
/** POCKET's four-tone ramp, darkest first. Copied from MODES in src/theme/modes.ts. */
const POCKET = ['#0d0d0d', '#4f4f4f', '#a1a1a1', '#e8e8e8']

/** The MODERN tokens this script draws with. Copied from the same table. */
const MODERN = { bg: '#0b0d10' }

/** Series colours, copied from TYPE_COLORS in src/data/types.ts. */
const TYPE_COLORS = {
  Fire: '#E62829', Water: '#2980EF', Electric: '#FAC000', Grass: '#3FA129',
  Psychic: '#EF4179', Dragon: '#5060E1', Steel: '#60A1B8', Fairy: '#EF70EF',
  Ghost: '#9060A0',
}

/** 8x8 marks, copied from GLYPHS in src/data/types.ts. */
const GLYPHS = {
  Fire: ['...##...', '..####..', '..####..', '.######.', '.######.', '##.##.##', '#..##..#', '.######.'],
  Water: ['...##...', '...##...', '..####..', '..####..', '.######.', '.######.', '.######.', '..####..'],
  Electric: ['.....##.', '....##..', '...##...', '..#####.', '.####...', '...##...', '..##....', '.##.....'],
  Grass: ['......##', '....####', '..######', '.#####..', '.####.#.', '.###..#.', '##...#..', '#...#...'],
  Psychic: ['..####..', '.#....#.', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '.#....#.', '..####..'],
  Dragon: ['......##', '....####', '..######', '.#####..', '######..', '.####...', '..##.#..', '.#...##.'],
  Steel: ['.#.##.#.', '.######.', '###..###', '##....##', '##....##', '###..###', '.######.', '.#.##.#.'],
  Fairy: ['...#....', '...#....', '..###...', '#######.', '..###...', '...#....', '...#....', '........'],
  Ghost: ['..####..', '.######.', '##.##.##', '########', '########', '########', '#.#.#.#.', '........'],
}

/** 5x7 letters, for the wordmark candidate. */
const LETTERS = {
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
}

// ── drawing ─────────────────────────────────────────────────────────────────────────────────
function canvas(fill) {
  return Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => fill))
}

function rect(c, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx
      const py = y + dy
      if (px >= 0 && px < GRID && py >= 0 && py < GRID) c[py][px] = color
    }
  }
}

/** Plot an on/off bitmap at `scale` logical pixels per source pixel. */
function bitmap(c, rows, x, y, scale, color) {
  rows.forEach((row, ry) => {
    [...row].forEach((cell, rx) => {
      if (cell === '#') rect(c, x + rx * scale, y + ry * scale, scale, scale, color)
    })
  })
}

function rgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * Black or white, whichever stays legible on `hex`. The same job `theme/contrast.ts` does for
 * glyphs on type chips, restated here because this script must not import from `src/` — those
 * modules are TypeScript and pull in `vue-lynx`.
 */
function inkOn(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? POCKET[0] : '#ffffff'
}

// ── PNG encoding ────────────────────────────────────────────────────────────────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(c) {
  const side = GRID * SCALE
  // Each scanline is one filter byte (0 = None) followed by RGB triplets.
  const stride = side * 3 + 1
  const raw = Buffer.alloc(stride * side)
  for (let y = 0; y < side; y++) {
    const row = c[Math.floor(y / SCALE)]
    let o = y * stride
    raw[o++] = 0
    for (let x = 0; x < side; x++) {
      const [r, g, b] = rgb(row[Math.floor(x / SCALE)])
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(side, 0)
  ihdr.writeUInt32BE(side, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type 2 = truecolour RGB. No alpha is representable.
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('sRGB', Buffer.from([0])), // rendering intent: perceptual
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── the candidates ──────────────────────────────────────────────────────────────────────────
const designs = {
  /**
   * The shipped icon: the Fire mark reversed out of the Fire series colour.
   *
   * This is one cell of `grid-modern` filling the whole icon. It was chosen over the marks
   * below because a lone 8x8 mark on a plain field is unreadable at icon size — those plots are
   * designed to be read beside a type name, and without that context the Dragon mark is just a
   * diagonal blob. Reversing a mark out of its saturated series colour is how a selected type
   * chip is already painted, so the icon borrows a treatment the app owns. The two notches at
   * the mark's foot are what make it read as flame rather than as a silhouette; do not lose
   * them by scaling the mark up further.
   */
  'fire-solid': () => {
    const fill = TYPE_COLORS.Fire
    const c = canvas(fill)
    bitmap(c, GLYPHS.Fire, 4, 4, 3, inkOn(fill))
    return c
  },

  /** Nine marks as a grid — legible, but needs a hand-drawn tinted variant: iOS 18 derives the
   *  tinted appearance by desaturating, which collapses nine series colours into one tone. */
  'grid-modern': () => {
    const c = canvas(MODERN.bg)
    const picks = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Dragon', 'Steel', 'Fairy', 'Ghost']
    const at = [0, 11, 22]
    picks.forEach((type, i) => {
      const x = at[i % 3]
      const y = at[Math.floor(i / 3)]
      const fill = TYPE_COLORS[type]
      rect(c, x, y, 10, 10, fill)
      bitmap(c, GLYPHS[type], x + 1, y + 1, 1, inkOn(fill))
    })
    return c
  },

  /** POCKET's conceit made literal: a handheld shell with a mark on its screen. */
  'shell-pocket': () => {
    const c = canvas(POCKET[1])
    rect(c, 4, 3, 24, 19, POCKET[0]) // bezel
    rect(c, 5, 4, 22, 17, POCKET[3]) // screen
    bitmap(c, GLYPHS.Dragon, 8, 5, 2, POCKET[0])
    rect(c, 5, 25, 5, 5, POCKET[0]) // left control
    rect(c, 22, 25, 5, 5, POCKET[0]) // right control
    rect(c, 13, 27, 6, 2, POCKET[2]) // centre bar
    return c
  },

  /** A lone mark, POCKET. Kept as the record of what did not work — see `fire-solid`. */
  'mark-pocket': () => {
    const c = canvas(POCKET[3])
    bitmap(c, GLYPHS.Dragon, 4, 4, 3, POCKET[0])
    return c
  },

  /** The same, MODERN — the mode allowed to spend series colour. Same legibility problem. */
  'mark-modern': () => {
    const c = canvas(MODERN.bg)
    bitmap(c, GLYPHS.Dragon, 4, 4, 3, TYPE_COLORS.Dragon)
    return c
  },

  /** A pixel wordmark. Legible at every size, but names no subject. */
  'zl-pocket': () => {
    const c = canvas(POCKET[3])
    bitmap(c, LETTERS.Z, 5, 9, 2, POCKET[0])
    bitmap(c, LETTERS.L, 17, 9, 2, POCKET[0])
    return c
  },
}

// ── entry point ─────────────────────────────────────────────────────────────────────────────
const [flag, dir] = process.argv.slice(2)

if (flag === '--all') {
  const out = dir ?? '.'
  mkdirSync(out, { recursive: true })
  for (const [name, build] of Object.entries(designs)) {
    const path = join(out, `${name}.png`)
    writeFileSync(path, encodePng(build()))
    console.log(`wrote ${path}${name === SHIPPED ? '  (shipped)' : ''}`)
  }
} else if (flag) {
  console.error(`unknown argument: ${flag}\n\n  node scripts/make-app-icons.mjs [--all <dir>]`)
  process.exit(1)
} else {
  writeFileSync(ICON_PATH, encodePng(designs[SHIPPED]()))
  console.log(`wrote ${ICON_PATH}`)
}
