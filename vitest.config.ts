import { defineConfig } from 'vitest/config'

/**
 * Tests run in plain Node against the real modules — no Lynx runtime, no browser, no mocks of
 * the code under test.
 *
 * That is possible because `vue-lynx` re-exports Vue's reactivity, and reactivity has no
 * platform dependency: `ref` and `computed` behave here exactly as they do on device. So
 * `src/state/*` — where every filter, sort and derivation lives — is testable directly. This
 * matters more than it sounds: the alternative is a test that re-implements the predicate it
 * claims to check, which passes when the transcription is faithful rather than when the code
 * is correct.
 *
 * What this cannot reach: anything needing a Lynx element tree or native measurement. Card
 * layout, gesture routing, font metrics and the platform facts in design/HANDOFF.md §12 stay
 * device-acceptance work. A green test run is not a substitute for that.
 */
export default defineConfig({
  define: {
    // `vue-lynx` reads this global, which its bundler normally substitutes at build time.
    // Importing it in Node without this throws `__DEV__ is not defined` before any test runs.
    // False rather than true so the modules under test take the same branches they ship with.
    __DEV__: 'false',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
