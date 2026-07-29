# pixel-typography Specification

## Purpose

How the pixel display face is obtained, registered, and assigned. Covers the scripted fetch of the upstream TrueType files, registration in a format both target platforms accept with each weight as its own family, the assignment of the face to names, labels and numbers rather than prose, and the recorded fallback for how the font asset is referenced.

## Requirements

### Requirement: Pixel face is registered in a format both platforms accept

The pixel display face SHALL be registered from a TTF or OTF asset. WOFF2 SHALL NOT be used, because the platform's font registration accepts TTF, OTF and TTC on Android while WOFF2 is accepted only on recent iOS versions.

#### Scenario: Registered asset format

- **WHEN** the font registration rules are inspected
- **THEN** every source asset is TTF or OTF and no source asset is WOFF2

#### Scenario: Latin text renders in the pixel face on device

- **WHEN** the screen is opened on a device and a Latin species name is inspected
- **THEN** it renders in the pixel face rather than the system fallback face


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Weights are registered as separate families

Because font registration ignores weight descriptors on this platform, each weight of the pixel face SHALL be registered under its own family name, and styles needing the bold weight SHALL select that family by name rather than by weight declaration.

#### Scenario: Two families for two weights

- **WHEN** the font registration rules are inspected
- **THEN** the regular and bold pixel faces are registered under two distinct family names
- **AND** no registration rule relies on a weight descriptor to select between them

#### Scenario: Bold text selects the bold family

- **WHEN** a style requires the bold pixel weight
- **THEN** it names the bold family directly


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Font assets are obtained by a scripted step

The pixel face assets SHALL be obtained by a scripted fetch step alongside the existing pipeline's source fetching, and SHALL NOT be produced by converting the design document's embedded WOFF2 payloads. The fetched assets SHALL be committed so the application builds without running the fetch step.

#### Scenario: Fetch step retrieves the assets

- **WHEN** the font fetch step runs
- **THEN** it writes the regular and bold TTF assets into the application's font asset directory

#### Scenario: Build succeeds without the fetch step

- **WHEN** the application is built from a fresh checkout with no fetch step run
- **THEN** the font assets are present in version control and the build succeeds


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Font roles are assigned by content kind

The pixel face SHALL be used for names, labels and numbers. Prose-length text SHALL NOT be set in the pixel face. This slice renders no prose-length text, so the reading serif face is out of scope for it.

#### Scenario: Card typography uses the pixel face

- **WHEN** a card's species name, number, form label and type abbreviation are inspected
- **THEN** each is set in the pixel face

#### Scenario: Chinese text falls through to a system face

- **WHEN** Chinese text is rendered in a role assigned to the pixel face
- **THEN** it falls through to the platform's Chinese face, because the pixel face carries no Chinese glyphs
- **AND** it remains legible at the rendered size


<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->

---
### Requirement: Font asset reference strategy has a recorded fallback

The registration SHALL first reference the bundled asset path. If the platform fails to load the face from a bundled asset path, the registration SHALL fall back to a base64 data URI, which the platform documents as supported.

#### Scenario: Bundled asset path succeeds

- **WHEN** the face loads from the bundled asset path on device
- **THEN** the asset path form is kept and the fallback is not applied

#### Scenario: Bundled asset path fails on device

- **WHEN** the face fails to load from the bundled asset path on device
- **THEN** the registration is switched to a base64 data URI and the outcome is recorded in the design handoff document

<!-- @trace
source: port-champions-dex-foundation
updated: 2026-07-29
code:
  - shots/12-native-image-events.png
  - shots/04-cards-pocket-zh.png
  - lynx.config.ts
  - AGENTS.md
  - design/pipeline/f700.txt
  - design/pipeline/template.html
  - design/champions-dex.html
  - design/pipeline/verify_forms.py
  - shots/07-narrow-500.png
  - shots/10-native-pocket.png
  - shots/01-pocket-zh.png
  - src/components/SpeciesCard.vue
  - src/rspeedy-env.d.ts
  - README.md
  - .spectra.yaml
  - src/App.vue
  - src/assets/fonts/OFL.txt
  - src/theme/contrast.ts
  - shots/11-native-modern-upscale.png
  - src/components/TypeGlyph.vue
  - tsconfig.json
  - src/shims-vue.d.ts
  - design/pipeline/build_data3.py
  - src/assets/fonts/Silkscreen-Regular.ttf
  - design/pipeline/parse_learn.py
  - src/theme/glyphSvg.ts
  - design/pipeline/f400.txt
  - package.json
  - design/pipeline/fetch_fonts.sh
  - shots/05-upscale-check.png
  - src/theme/modes.ts
  - src/state/display.ts
  - shots/06-sprite-fallback.png
  - .vscode/extensions.json
  - design/pipeline/parse.py
  - design/pipeline/fetch_sources.sh
  - design/pipeline/run.sh
  - design/pipeline/zh_forms.py
  - design/pipeline/__pycache__/parse_learn.cpython-314.pyc
  - design/pipeline/fetch_learnsets.py
  - design/pipeline/fprose.txt
  - shots/02-pixel-face.png
  - design/pipeline/aggregate.py
  - design/pipeline/resolve_forms.py
  - shots/03-glyphs-pocket.png
  - design/champions-dex.json
  - src/App.css
  - src/tsconfig.json
  - tsconfig.node.json
  - src/data/types.ts
  - pnpm-workspace.yaml
  - design/pipeline/build.py
  - CLAUDE.md
  - design/HANDOFF.md
  - shots/08-modern-1400.png
  - shots/09-user-server-modern.png
  - shots/13-native-svg-probes.png
  - src/assets/fonts/Silkscreen-Bold.ttf
  - src/data/dex.json
  - src/data/dex.ts
  - src/data/i18n.ts
  - src/index.ts
-->