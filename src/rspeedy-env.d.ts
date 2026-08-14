/// <reference types="@lynx-js/rspeedy/client" />

declare module '@lynx-js/types' {
  interface GlobalProps {
    /**
     * Define your global properties in this interface.
     * These types will be accessible through `lynx.__globalProps`.
     */
  }
}

declare global {
  /**
   * The host application's native modules, registered in `src/ios/Zero Lab/`.
   *
   * `var` so the bare identifier is typed; that it also types `globalThis.NativeModules` is
   * incidental and is not the access path — see §12.30 and `src/platform/settings.ts`.
   *
   * This shape is asserted, not checked: an unmapped selector here is accepted at runtime and
   * simply does nothing.
   */
  var NativeModules:
    | {
        readonly DisplaySettingsModule?: {
          getSetting(key: string): string
          setSetting(key: string, value: string): void
        }
      }
    | undefined
}

export {}
