/**
 * Asserts that the engine's JS objects are reached the one way that works.
 *
 * Two rules, both guarding a failure that produces no error and no message:
 *
 *   1. `globalThis.NativeModules` and friends are `undefined` on device — the engine's objects are
 *      bindings in the scope wrapping the bundle, not properties of the global (§12.30). Read
 *      through `globalThis` and the value is silently absent forever.
 *   2. `NativeModules?.x` throws `ReferenceError` wherever the identifier genuinely does not exist,
 *      which is the web preview's normal state. Optional chaining does not protect an undeclared
 *      identifier; `typeof x === 'undefined'` does.
 *
 * Rule 1 cost five rounds of device probes to find, because the wrong access path is
 * indistinguishable from the store simply being absent — and absent is a state the code is
 * designed to tolerate in silence.
 *
 * Scoped to `src/`. Tests legitimately assign `globalThis.NativeModules` to install a fake store:
 * in Node the bare identifier resolves to the global object, so that is the correct way to drive
 * the boundary from a test, and it is not what this check is about.
 *
 *   node scripts/check-platform-access.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')

/**
 * The identifiers the engine provides to the bundle's scope.
 *
 * `measured` says what is known about reading it through `globalThis`: `absent` was observed to be
 * `undefined` on device, `unproven` has not been read the right way yet. Both are violations —
 * writing the unproven form is how §12.27 concluded `SystemInfo` was unavailable when the only
 * thing established was that it is not a global property.
 */
const ENGINE_GLOBALS = [
  { name: 'NativeModules', measured: 'absent' },
  { name: 'lynx', measured: 'absent' },
  { name: 'SystemInfo', measured: 'unproven' },
  { name: 'lynxCoreInject', measured: 'unproven' },
  { name: '__CreatePage', measured: 'unproven' },
  { name: '__FlushElementTree', measured: 'unproven' },
]

/** Every TypeScript module and single-file component under `src/`. */
function sources() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        // `src/ios/` is the native host: Swift, Pods and a copied bundle, none of it JS.
        if (entry !== 'ios') walk(path)
        continue
      }
      if (entry.endsWith('.ts') || entry.endsWith('.vue')) {
        out.push({ path, text: readFileSync(path, 'utf8') })
      }
    }
  }
  walk(SRC)
  return out
}

/**
 * Blanks out comments so the checks read code only.
 *
 * Necessary rather than tidy: the correct access path is documented next to itself, and both rules
 * name the wrong form in prose to explain it. A check that flagged its own documentation would be
 * removed within the week.
 *
 * Lines are preserved so reported numbers stay true.
 */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n')
}

function checkNoGlobalThisAccess({ path, text }) {
  const failures = []
  withoutComments(text).split('\n').forEach((line, i) => {
    for (const { name, measured } of ENGINE_GLOBALS) {
      if (!new RegExp(`globalThis\\s*(\\?\\.|\\.)\\s*${name}\\b`).test(line)) continue
      const reason = measured === 'absent'
        ? 'measured undefined on device'
        : 'never read the right way, so absence through globalThis proves nothing'
      failures.push(
        `${relative(ROOT, path)}:${i + 1} reads globalThis.${name} (${reason}). `
        + `Read the bare identifier behind typeof ${name} === 'undefined' instead — §12.30.`,
      )
    }
  })
  return failures
}

function checkNoOptionalChainOnEngineGlobal({ path, text }) {
  const failures = []
  withoutComments(text).split('\n').forEach((line, i) => {
    for (const { name } of ENGINE_GLOBALS) {
      // Only the bare identifier: `globalThis?.lynx` is rule 1's business, and a property named
      // the same thing (`foo.lynx?.bar`) is not an identifier at all.
      if (!new RegExp(`(^|[^.\\w$])${name}\\s*\\?\\.`).test(line)) continue
      failures.push(
        `${relative(ROOT, path)}:${i + 1} optional-chains ${name}?. — that throws ReferenceError `
        + `where the identifier does not exist, as in the web preview. Guard with `
        + `typeof ${name} === 'undefined' first — §12.30.`,
      )
    }
  })
  return failures
}

const CHECKS = [
  { name: 'engine objects are not read through globalThis', run: checkNoGlobalThisAccess },
  { name: 'engine objects are guarded by typeof, not optional chaining', run: checkNoOptionalChainOnEngineGlobal },
]

const files = sources()
let failed = 0

for (const check of CHECKS) {
  const failures = files.flatMap((file) => check.run(file))
  if (failures.length === 0) {
    console.log(`ok    ${check.name}`)
    continue
  }
  failed += failures.length
  console.log(`FAIL  ${check.name}`)
  for (const failure of failures) console.log(`      ${failure}`)
}

console.log(
  `\n${files.length} module(s), ${ENGINE_GLOBALS.length} engine object(s), ${failed} violation(s)`,
)
process.exit(failed === 0 ? 0 : 1)
