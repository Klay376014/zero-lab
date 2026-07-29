/**
 * Asserts style invariants that fail silently if broken.
 *
 * Exits non-zero on violation, in the same spirit as the dataset pipeline's stage assertions:
 * the failures worth automating are the ones that do not announce themselves. A wrong colour
 * is visible; a selected control that looks exactly like an unselected one is not.
 *
 *   node scripts/check-styles.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')

/** Every stylesheet the app ships: the sheet plus any single-file component `<style>` block. */
function styleSources() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
        continue
      }
      if (entry.endsWith('.css')) {
        out.push({ path, css: readFileSync(path, 'utf8') })
        continue
      }
      if (entry.endsWith('.vue')) {
        const block = readFileSync(path, 'utf8').match(/<style[^>]*>([\s\S]*?)<\/style>/)
        if (block) out.push({ path, css: block[1] })
      }
    }
  }
  walk(SRC)
  return out
}

/**
 * Collects each class rule's first line and the properties it declares.
 *
 * Deliberately a small line-based reader rather than a CSS parser: adding a parser dependency
 * to check one ordering rule would cost more than the rule protects. It only has to
 * understand the shape this project writes — one selector per rule, one property per line.
 */
function readRules(css) {
  const rules = new Map()
  let current = null
  css.split('\n').forEach((line, i) => {
    const open = line.match(/^\.([A-Za-z0-9]+)\s*\{/)
    if (open) {
      current = open[1]
      if (!rules.has(current)) rules.set(current, { line: i + 1, props: new Set() })
      return
    }
    if (line.trimEnd() === '}') {
      current = null
      return
    }
    if (current) {
      const prop = line.match(/^\s+([a-z-]+)\s*:/)
      if (prop) rules.get(current).props.add(prop[1])
    }
  })
  return rules
}

/**
 * A `.XOn` selected-state rule must appear after the `.X` rule it overrides.
 *
 * Both are single-class selectors, so they carry equal weight and source order decides. A
 * selected rule placed above its base is cancelled by it on every property they share, and
 * the control then renders identically whether or not it is selected — no error, no warning,
 * nothing to notice except that the interface stopped answering. This file exists because
 * that happened to the generation and sort chips.
 */
function checkSelectedStateOrder({ path, css }) {
  const rules = readRules(css)
  const failures = []
  for (const [name, on] of rules) {
    if (!name.endsWith('On')) continue
    const base = rules.get(name.slice(0, -2))
    if (!base) continue
    if (on.line > base.line) continue
    const shared = [...on.props].filter((p) => base.props.has(p))
    if (shared.length === 0) continue
    failures.push(
      `${relative(ROOT, path)}: .${name} (line ${on.line}) sits above `
      + `.${name.slice(0, -2)} (line ${base.line}), which cancels it on `
      + `${shared.join(', ')} — the selected state will not be visible. `
      + 'Move the selected rule below its base.',
    )
  }
  return failures
}

/**
 * No rule may declare an inset box shadow.
 *
 * The platform ignores such a declaration outright — it does not fall back, warn, or fail to
 * build. What is left is a surface missing a hairline frame, which is close to invisible in a
 * screenshot, and the larger fact that a design-document rule was copied rather than ported.
 * Every surface that the design document drew with an inset shadow is a bordered view here.
 *
 * Matches the declaration only. The word appears in this project's prose too — the comments
 * explaining why the bevel is two views — and a check that failed on those would teach people
 * to stop writing the explanation.
 */
function checkNoInsetShadow({ path, css }) {
  const failures = []
  css.split('\n').forEach((line, i) => {
    const declaration = line.match(/^\s*box-shadow\s*:\s*(.+?);?\s*$/)
    if (!declaration) return
    if (!/\binset\b/.test(declaration[1])) return
    failures.push(
      `${relative(ROOT, path)}:${i + 1}: box-shadow declares inset, which the platform `
      + 'silently ignores — the surface will simply have no frame. Draw it with a bordered '
      + 'view instead, as the card bevel does.',
    )
  })
  return failures
}

const CHECKS = [
  { name: 'selected-state rules follow the rules they override', run: checkSelectedStateOrder },
  { name: 'no inset box shadows', run: checkNoInsetShadow },
]

const sources = styleSources()
let failed = 0

for (const check of CHECKS) {
  const failures = sources.flatMap((source) => check.run(source))
  if (failures.length === 0) {
    console.log(`ok    ${check.name}`)
    continue
  }
  failed += failures.length
  console.log(`FAIL  ${check.name}`)
  for (const failure of failures) console.log(`      ${failure}`)
}

console.log(
  `\n${sources.length} stylesheet(s), ${CHECKS.length} check(s), ${failed} violation(s)`,
)
process.exit(failed === 0 ? 0 : 1)
