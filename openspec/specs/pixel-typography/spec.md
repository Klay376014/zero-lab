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

The pixel face SHALL be used for names, labels and numbers. Prose-length text SHALL NOT be set in the pixel face.

Prose-length text SHALL be set in the reading serif face the design document uses, registered from an embedded asset. The system-face placeholder that stood while the detail panel was ported SHALL be removed, and with it the recorded gap against the design document's verification item for the division of typographic labour.

Chinese prose SHALL continue to fall through to a system serif face, because the reading face carries no CJK glyphs. That fall-through is the design document's own behaviour and SHALL NOT be treated as a gap.

#### Scenario: Card typography uses the pixel face

- **WHEN** a card's species name, number, form label and type abbreviation are inspected
- **THEN** each is set in the pixel face

#### Scenario: Chinese text falls through to a system face

- **WHEN** Chinese text is rendered in a role assigned to the pixel face
- **THEN** it falls through to the platform's Chinese face, because the pixel face carries no Chinese glyphs
- **AND** it remains legible at the rendered size

#### Scenario: Prose is set in the reading face

- **WHEN** an ability description, a warning paragraph, or the empty-result text is inspected
- **THEN** its Latin text is set in the embedded reading serif face
- **AND** it is not set in the pixel face

##### Example: which face each role gets

| Content                   | Kind   | Face                     |
| ------------------------- | ------ | ------------------------ |
| Species name              | name   | pixel face               |
| Base-stat label and value | label  | pixel face               |
| National number           | number | pixel face               |
| Ability name              | name   | pixel face               |
| Ability description       | prose  | reading serif face       |
| Roster warning            | prose  | reading serif face       |
| Empty-result text         | prose  | reading serif face       |

#### Scenario: Chinese prose reaches a system serif

- **WHEN** Chinese prose is rendered
- **THEN** it falls through the declared stack to a system serif face rather than to the platform's default sans face


<!-- @trace
source: embed-prose-face
updated: 2026-07-29
code:
  - scripts/check-styles.mjs
  - design/HANDOFF.md
  - src/App.css
  - src/assets/fonts/Literata-Prose.ttf
  - src/assets/fonts/OFL.txt
  - design/pipeline/fetch_fonts.sh
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

---
### Requirement: The reading face is embedded as a static instance, not as a variable font

The reading face SHALL be embedded as a single static instance rather than as the variable font its upstream distributes. The instance SHALL fix the weight at the one the design document uses for prose, and SHALL fix the optical size at the value a browser resolves for the size prose is rendered at.

Embedding the variable font SHALL be rejected on two grounds: it is more than twenty times the size of the static subset, and it depends on variable-axis support the platform makes no documented promise about. Where that support is absent the font renders at its own default optical size, which differs from the design document's rendering and reports no error — a silent divergence rather than a visible failure.

The optical-size declaration SHALL NOT appear in the stylesheet, because the optical size is baked into the asset and a declaration that no longer does anything reads as one that does.

#### Scenario: The asset is a static instance

- **WHEN** the embedded reading face asset is inspected
- **THEN** it carries no variable-font axis table

#### Scenario: One weight, one family name

- **WHEN** the font registration rules are inspected
- **THEN** the reading face is registered under a single family name with a single asset
- **AND** no registration rule relies on a weight descriptor

#### Scenario: No optical-size declaration remains

- **WHEN** every stylesheet the application ships is inspected
- **THEN** none declares optical sizing

##### Example: what each step of the derivation costs

| Step                                     | Size    |
| ---------------------------------------- | ------- |
| Upstream variable font, the only form offered | 933 KB  |
| Static instance at the prose weight and optical size | 264 KB  |
| That instance subset to the needed range | 35 KB   |
| Each existing pixel-face asset, for comparison | 30–32 KB |


<!-- @trace
source: embed-prose-face
updated: 2026-07-29
code:
  - scripts/check-styles.mjs
  - design/HANDOFF.md
  - src/App.css
  - src/assets/fonts/Literata-Prose.ttf
  - src/assets/fonts/OFL.txt
  - design/pipeline/fetch_fonts.sh
-->

---
### Requirement: The reading face is subset to a declared range, and its coverage is asserted

The reading face SHALL be subset to a declared Unicode range rather than shipped whole, and SHALL NOT be subset to only the characters the current dataset happens to use. A dataset-derived subset is smaller, but any character a later dataset introduces would render as a missing-glyph box.

The declared range SHALL cover visible ASCII, the Latin-1 supplement, dashes, quotation marks and the ellipsis, because those are what the prose corpus draws on. Kerning SHALL be retained; other layout features SHALL be dropped.

A check SHALL assert that every character of the prose corpus is present in the asset's character map, and SHALL exit non-zero naming the missing characters when any is absent. The corpus SHALL be derived from the dataset and the string table rather than written out by hand, because a hand-written list drifts from the data it is meant to describe.

The corpus SHALL exclude CJK characters, which the reading face is not responsible for and which fall through to a system serif by design. Including them would make the check fail on correct behaviour.

A missing glyph SHALL NOT be handled at runtime by substituting another face. Substitution returns the failure to silence, which is what this check exists to prevent.

#### Scenario: Coverage holds for the current corpus

- **WHEN** the coverage check runs against the shipped asset
- **THEN** every character of the prose corpus is present in the asset's character map
- **AND** the check exits zero

#### Scenario: An uncovered character fails the check

- **WHEN** the prose corpus contains a character outside the asset's character map
- **THEN** the check exits non-zero and names the missing characters

#### Scenario: The corpus is derived, not listed

- **WHEN** the coverage check's source is inspected
- **THEN** it reads the prose corpus from the dataset and the string table
- **AND** it contains no hand-written list of expected characters

#### Scenario: CJK is outside the corpus

- **WHEN** the corpus is assembled from sources that contain Chinese text
- **THEN** the Chinese characters are excluded from it
- **AND** the check does not report them as missing

#### Scenario: A missing asset fails rather than skips

- **WHEN** the coverage check runs and the font asset is absent
- **THEN** it exits non-zero and names the step that produces the asset


<!-- @trace
source: embed-prose-face
updated: 2026-07-29
code:
  - scripts/check-styles.mjs
  - design/HANDOFF.md
  - src/App.css
  - src/assets/fonts/Literata-Prose.ttf
  - src/assets/fonts/OFL.txt
  - design/pipeline/fetch_fonts.sh
-->

---
### Requirement: Deriving the reading face is a scripted step outside the application build

The instancing and subsetting SHALL be performed by the same scripted step that fetches the pixel faces, and its output SHALL be committed so that the application builds without it. That step SHALL remain outside the dataset pipeline's main run, because it is needed only when the face itself is refreshed.

The step SHALL depend on a font-manipulation toolchain, and that dependency SHALL NOT reach the application build, continuous integration, or anyone who only builds the application. When the toolchain is absent the step SHALL exit non-zero with the command needed to install it, rather than failing with an interpreter error.

The step SHALL verify that what it downloaded is a font before deriving from it, in the same manner as the existing pixel-face fetch — a error page saved under a font's name fails at render time rather than at download time.

#### Scenario: Application builds without the toolchain

- **WHEN** the application is built from a fresh checkout with no font toolchain installed
- **THEN** the reading-face asset is present in version control and the build succeeds

#### Scenario: Missing toolchain is reported usefully

- **WHEN** the derivation step runs without the font toolchain installed
- **THEN** it exits non-zero and prints the command that installs it

#### Scenario: A non-font download is caught

- **WHEN** the upstream URL returns something that is not a font
- **THEN** the step exits non-zero before deriving anything from it

#### Scenario: The step stays out of the pipeline's main run

- **WHEN** the dataset pipeline's main run is inspected
- **THEN** it does not invoke the font derivation step

<!-- @trace
source: embed-prose-face
updated: 2026-07-29
code:
  - scripts/check-styles.mjs
  - design/HANDOFF.md
  - src/App.css
  - src/assets/fonts/Literata-Prose.ttf
  - src/assets/fonts/OFL.txt
  - design/pipeline/fetch_fonts.sh
-->