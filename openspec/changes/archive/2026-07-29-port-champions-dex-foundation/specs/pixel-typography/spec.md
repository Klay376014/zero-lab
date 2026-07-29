## ADDED Requirements

### Requirement: Pixel face is registered in a format both platforms accept

The pixel display face SHALL be registered from a TTF or OTF asset. WOFF2 SHALL NOT be used, because the platform's font registration accepts TTF, OTF and TTC on Android while WOFF2 is accepted only on recent iOS versions.

#### Scenario: Registered asset format

- **WHEN** the font registration rules are inspected
- **THEN** every source asset is TTF or OTF and no source asset is WOFF2

#### Scenario: Latin text renders in the pixel face on device

- **WHEN** the screen is opened on a device and a Latin species name is inspected
- **THEN** it renders in the pixel face rather than the system fallback face

### Requirement: Weights are registered as separate families

Because font registration ignores weight descriptors on this platform, each weight of the pixel face SHALL be registered under its own family name, and styles needing the bold weight SHALL select that family by name rather than by weight declaration.

#### Scenario: Two families for two weights

- **WHEN** the font registration rules are inspected
- **THEN** the regular and bold pixel faces are registered under two distinct family names
- **AND** no registration rule relies on a weight descriptor to select between them

#### Scenario: Bold text selects the bold family

- **WHEN** a style requires the bold pixel weight
- **THEN** it names the bold family directly

### Requirement: Font assets are obtained by a scripted step

The pixel face assets SHALL be obtained by a scripted fetch step alongside the existing pipeline's source fetching, and SHALL NOT be produced by converting the design document's embedded WOFF2 payloads. The fetched assets SHALL be committed so the application builds without running the fetch step.

#### Scenario: Fetch step retrieves the assets

- **WHEN** the font fetch step runs
- **THEN** it writes the regular and bold TTF assets into the application's font asset directory

#### Scenario: Build succeeds without the fetch step

- **WHEN** the application is built from a fresh checkout with no fetch step run
- **THEN** the font assets are present in version control and the build succeeds

### Requirement: Font roles are assigned by content kind

The pixel face SHALL be used for names, labels and numbers. Prose-length text SHALL NOT be set in the pixel face. This slice renders no prose-length text, so the reading serif face is out of scope for it.

#### Scenario: Card typography uses the pixel face

- **WHEN** a card's species name, number, form label and type abbreviation are inspected
- **THEN** each is set in the pixel face

#### Scenario: Chinese text falls through to a system face

- **WHEN** Chinese text is rendered in a role assigned to the pixel face
- **THEN** it falls through to the platform's Chinese face, because the pixel face carries no Chinese glyphs
- **AND** it remains legible at the rendered size

### Requirement: Font asset reference strategy has a recorded fallback

The registration SHALL first reference the bundled asset path. If the platform fails to load the face from a bundled asset path, the registration SHALL fall back to a base64 data URI, which the platform documents as supported.

#### Scenario: Bundled asset path succeeds

- **WHEN** the face loads from the bundled asset path on device
- **THEN** the asset path form is kept and the fallback is not applied

#### Scenario: Bundled asset path fails on device

- **WHEN** the face fails to load from the bundled asset path on device
- **THEN** the registration is switched to a base64 data URI and the outcome is recorded in the design handoff document
