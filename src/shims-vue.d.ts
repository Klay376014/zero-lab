declare module '*.vue' {
  import type { Component } from 'vue-lynx'

  const component: Component
  export default component
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.ttf' {
  const src: string
  export default src
}

// Deliberately `unknown` rather than enabling `resolveJsonModule`: the dex dataset is
// ~195 KB, and letting the compiler infer a literal type for it makes type checking
// unusable. src/data/dex.ts is the one place that narrows it, guarded by the
// load-time invariant assertions.
declare module '*.json' {
  const value: unknown
  export default value
}
