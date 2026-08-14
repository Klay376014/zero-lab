## MODIFIED Requirements

### Requirement: Active language and active mode are shared reactive state

The active mode and the active language SHALL be held as shared reactive state readable by any component without prop threading. Both SHALL be switchable at runtime.

The initial value of each SHALL come from the settings restored at launch by `display-persistence` rather than from a fixed default. The fixed defaults — the first mode of the ordered mode set, and Chinese — SHALL remain the value used when nothing is restored, so a first run and a run with an unreadable store both start where the application has always started.

A change to either value SHALL be persisted. The shared state layer SHALL NOT decide when to write: it is the layer whose change triggers the write, and the durable storage keys, their value domains and the writing itself belong to `display-persistence`. This keeps a new way of changing either value persistent without that code path knowing persistence exists.

The active mode SHALL be set by naming a mode, not by advancing a position in the mode set. No operation that advances the active mode to the next member SHALL be exposed, because a control built on it states neither how many modes exist nor which one is in force, and the set is expected to grow.

Setting the active mode to the mode already in force SHALL leave the interface unchanged and SHALL persist nothing.

The identifier of a mode already present in the ordered mode set SHALL be treated as carrying an external contract, because it is what gets stored. Adding a mode to the set carries no such cost; renaming one returns every reader who had selected it to the default mode.

#### Scenario: Two components observe the same switch

- **WHEN** the active mode changes
- **THEN** every component reading the shared state re-renders with the new mode

#### Scenario: Language and mode switch independently

- **WHEN** the active language changes
- **THEN** the active mode is unaffected

#### Scenario: The mode is selected by name

- **WHEN** a mode is set by naming it
- **THEN** the active mode becomes that mode, whatever its position in the ordered set

#### Scenario: Setting the active mode again is inert

- **WHEN** the active mode is set to the mode already in force
- **THEN** no token value changes, no component is remounted, and nothing is written to durable storage

#### Scenario: The initial values come from the restored settings

- **WHEN** the shared state is first read after launch and durable storage holds a mode and a language
- **THEN** the active mode and the active language are the stored ones rather than the fixed defaults

#### Scenario: The fixed defaults survive as the fallback

- **WHEN** the shared state is first read after launch and nothing is restored
- **THEN** the active mode is the first mode of the ordered mode set and the active language is Chinese

#### Scenario: A change to either value is persisted

- **WHEN** the active mode or the active language changes
- **THEN** the new value is written to durable storage without the changing code path referring to persistence
