# display-persistence Specification

## Purpose

The boundary between the display state the interface holds in memory and the durable store the host application owns. Covers exactly two settings — the active colour mode and the active language — and the closure of that set against a third, so that every persisted value is one that has been given a validated way back in; restoration completing before the first frame is painted, which is what makes the read synchronous rather than a preference about it; the write being driven by the change to the shared state rather than by the controls that cause it, so a new way of changing either setting persists without being told to, and an inert change writes nothing; validation of a stored value against its domain before it reaches the shared state rather than after, because a mode identifier that no longer exists would otherwise be read directly by every control that marks which mode is active; silent degradation to the defaults wherever the store is unreachable, which is the normal state of the web preview and therefore not a condition worth reporting; and the durable keys being known to this boundary alone, together with the consequence that a mode identifier already in use is an external contract that a rename breaks.

## Requirements

### Requirement: The two display settings survive a relaunch

The active colour mode and the active language SHALL be written to durable storage owned by the host application when either changes, and SHALL be read back when the application next starts, so that a mode or language chosen once stays chosen.

Exactly two settings SHALL be persisted: the active colour mode and the active language. The persisted set SHALL be closed at these two. Adding a third setting is a new decision rather than an addition, because every persisted value becomes state that outlives the code that wrote it and has to be validated on the way back in.

The active tab, the query text, the filter selections, the selected card and the scroll position SHALL NOT be persisted.

#### Scenario: A chosen mode is still in force after a relaunch

- **WHEN** a colour mode other than the default is selected, the application is terminated, and the application is started again
- **THEN** the selected colour mode is the active mode

#### Scenario: A chosen language is still in force after a relaunch

- **WHEN** the language is switched, the application is terminated, and the application is started again
- **THEN** the switched language is the active language

#### Scenario: The two settings are restored independently

- **WHEN** the colour mode is changed but the language is not, and the application is restarted
- **THEN** the restored mode is the changed one and the restored language is whatever it was before

#### Scenario: A first run has no stored settings

- **WHEN** the application starts with nothing in durable storage
- **THEN** the active mode is the first mode of the ordered mode set and the active language is Chinese

#### Scenario: Nothing else is persisted

- **WHEN** the active tab, the query text, a filter selection or the selected card is changed and the application is restarted
- **THEN** each of those returns to its own starting value, unaffected by this capability


<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->

---
### Requirement: Restored settings are in force on the first painted frame

Restoring the two settings SHALL complete before the first frame is painted, so that no frame is ever painted in the default mode or the default language when a stored setting says otherwise.

The read SHALL therefore be synchronous. An asynchronous read that resolves after the first paint SHALL NOT satisfy this requirement, because the observable result is a visible flash from the default mode to the restored one on every launch.

#### Scenario: No default-mode frame precedes the restored mode

- **WHEN** a stored mode other than the default is restored at launch
- **THEN** the first frame painted is in the restored mode, and no frame is painted in the default mode

#### Scenario: The state is already restored when components first read it

- **WHEN** any component reads the shared mode or language state for the first time after launch
- **THEN** the value it reads is the restored value, not the default awaiting replacement


<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->

---
### Requirement: A change writes through, and an inert change writes nothing

Every change to the active mode or the active language SHALL write the new value to durable storage. The write SHALL be driven by the change to the shared state itself rather than by the controls that cause it, so that a new way of changing either setting persists it without being told to.

Setting either value to the value already in force SHALL write nothing, because no change occurred.

#### Scenario: Selecting a mode writes it

- **WHEN** the active mode is set to a different mode
- **THEN** the new mode identifier is written to durable storage

#### Scenario: Switching the language writes it

- **WHEN** the active language is switched
- **THEN** the new language code is written to durable storage and the stored mode is left untouched

#### Scenario: Re-selecting the active mode writes nothing

- **WHEN** the active mode is set to the mode already in force
- **THEN** durable storage receives no write

#### Scenario: A new writer of the shared state persists without extra work

- **WHEN** the shared mode state is changed by any code path
- **THEN** the new value is written to durable storage, whether or not that path knows persistence exists


<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->

---
### Requirement: Stored values are validated against their domain on restore

A value read from durable storage SHALL be validated against its domain before it reaches the shared state, and SHALL be replaced by its default when it falls outside that domain. An unset key, an empty value and an unrecognised value SHALL all be treated as absent.

Validation SHALL happen before the value is written into the shared state, not after. Correcting only the derived token set is insufficient: an invalid mode identifier left in the shared state would still be read directly by the controls that mark which mode is active, and every one of them would fail to match.

#### Scenario: An unrecognised stored mode falls back to the default

- **WHEN** durable storage holds a mode identifier that is not a member of the ordered mode set
- **THEN** the active mode is the first mode of that set

#### Scenario: An unrecognised stored language falls back to the default

- **WHEN** durable storage holds a value that is neither of the two language codes
- **THEN** the active language is Chinese

##### Example: mode identifier restore table

| Stored value | Restored mode | Notes |
| ------------ | ------------- | ----- |
| `POCKET` | `POCKET` | first member of the set |
| `MODERN` | `MODERN` | recognised member |
| `EMERALD` | `EMERALD` | recognised member |
| `RETRO` | `POCKET` | not a member — never existed |
| `pocket` | `POCKET` | identifiers are matched exactly, so case differences are unrecognised |
| `""` | `POCKET` | empty value counts as absent |
| absent | `POCKET` | key never written |

##### Example: language code restore table

| Stored value | Restored language | Notes |
| ------------ | ----------------- | ----- |
| `zh` | `zh` | default, and a recognised value |
| `en` | `en` | recognised value |
| `jp` | `zh` | not one of the two |
| `""` | `zh` | empty value counts as absent |
| absent | `zh` | key never written |


<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->

---
### Requirement: An absent store degrades silently to the defaults

When durable storage is unreachable, reading SHALL report every setting as absent and writing SHALL do nothing. Neither SHALL raise an error, and neither SHALL emit a diagnostic message.

The silence is deliberate. An unreachable store is the normal and expected state of the web preview target, which has no host application behind it; a message on every launch and every mode change there trains readers to ignore the one place a real failure would appear.

#### Scenario: The web preview runs without a store

- **WHEN** the application runs on a target that provides no durable storage
- **THEN** the two settings start at their defaults, switching either one works normally for the session, and nothing is reported

#### Scenario: A relaunch without a store starts fresh

- **WHEN** a mode is selected on a target with no durable storage and the application is reloaded
- **THEN** the active mode is the default

#### Scenario: An error from the store is treated as absence

- **WHEN** reading a setting from durable storage fails
- **THEN** that setting is treated as absent and the default is used


<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->

---
### Requirement: Persisted keys and mode identifiers carry an external contract

The names of the durable storage keys SHALL be known to the persistence boundary alone, so that no other module can read or write the store directly.

A mode identifier written to durable storage SHALL be treated as an external contract. Renaming or removing an identifier that is already in the ordered mode set SHALL be recognised as returning every reader who selected that mode to the default. Adding a new mode to the set SHALL carry no such cost.

#### Scenario: Only the persistence boundary names the keys

- **WHEN** the codebase is inspected for the durable storage key names
- **THEN** they appear only inside the persistence boundary

#### Scenario: Adding a mode leaves stored settings intact

- **WHEN** a new mode is added to the ordered mode set
- **THEN** an identifier already stored for a different mode still restores that mode

#### Scenario: Renaming a mode discards the stored selection

- **WHEN** the identifier of an existing mode is changed
- **THEN** a stored value naming the old identifier is unrecognised and the default mode is restored

<!-- @trace
source: persist-display-settings
updated: 2026-08-14
code:
  - src/ios/Zero Lab/Zero Lab/AppDelegate.swift
  - design/HANDOFF.md
  - ROADMAP.md
  - src/ios/Zero Lab/Zero Lab/ViewController.swift
  - src/state/display.ts
  - src/theme/modes.ts
  - src/platform/settings.ts
  - src/rspeedy-env.d.ts
  - src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift
tests:
  - tests/displayPersistence.test.ts
-->