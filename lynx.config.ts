import { defineConfig } from '@lynx-js/rspeedy'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginVueLynx } from 'vue-lynx/plugin'

export default defineConfig({
  environments: {
    lynx: {},
    web: {},
  },
  output: {
    // Inline the pixel face into the bundle as a data URI rather than emitting it as a
    // separate asset. Measured reason: with the default 2kB threshold, the CSS `url()` for
    // the 30kB fonts becomes `webpack:///static/font/…ttf` in a production build — a scheme
    // nothing can fetch — and during dev it becomes an absolute dev-server URL that dies
    // with the server. A data URI is the form Lynx's @font-face documents as supported and
    // is the only one that survives without an asset host.
    dataUriLimit: 64 * 1024,
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true`
      },
    }),
    pluginVueLynx({
      optionsApi: false,
      enableCSSInlineVariables: true,
      enableCSSInheritance: true,
    }),
  ],
})
