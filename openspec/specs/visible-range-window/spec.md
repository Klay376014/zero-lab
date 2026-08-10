# visible-range-window Specification

## Purpose

How a long sequence is rendered without materialising every item. Covers which sequences are windowed and which are short enough to be rendered in full, the pure derivation of a visible index range from scroll offset, visible height, item height, items per row, total and buffer, the two spacer elements that preserve the scrollable extent rather than altering the scrolling container, the index-granular update that neither re-renders on every scroll event nor is paced by a timer, the clamping that follows a sequence changing length under a filter, a sort or a language change without calling any scrolling API or storing a scroll position, the single declared item height asserted against the stylesheet by a check that runs outside the application, and the device measurement of the platform's scroll reporting that must precede converting any sequence.

## Requirements

### Requirement: A long sequence materialises only the range that can be seen, plus a buffer

A sequence whose length is set by the dataset or by a query result SHALL materialise only the items within the scrolling container's visible range, extended by a buffer of whole screens before and after. Items outside that range SHALL NOT exist as elements.

The platform charges the cost of a screen per element created, measured at roughly one and a third milliseconds per element and independent of what the element is. The number of elements a screen holds is therefore the quantity that governs how long it takes to appear, and a sequence that materialises every item pays for items the viewer cannot see.

Windowing SHALL be applied only to sequences whose length is not bounded by a small constant. A sequence of at most a handful of items SHALL be rendered in full, because the fixed cost of deriving and maintaining a range exceeds the cost of the elements it would save.

#### Scenario: Only the visible range and its buffer exist

- **WHEN** a windowed sequence of two hundred items is rendered and the container is scrolled to the top
- **THEN** the elements present are those of the visible range plus the buffer before and after it
- **AND** no element exists for an item beyond that range

#### Scenario: A short sequence is not windowed

- **WHEN** a sequence's length is bounded by a small constant
- **THEN** every item is rendered and no range derivation is applied to it


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: The range is derived by a pure function of scroll offset and sequence shape

The visible range SHALL be produced by a function whose inputs are the scroll offset, the visible height, the height of one item, the number of items per row, the total number of items, and the buffer size in screens, and whose outputs are the first index to render, the last index to render, and the two spacer heights. That function SHALL NOT read global state, SHALL NOT touch elements, and SHALL NOT depend on the platform.

Deriving the range SHALL be the only place the boundary arithmetic lives, so that the three sequences this applies to cannot each grow their own edge handling.

The derivation SHALL work in rows rather than items, because a sequence laid out more than one item to a row scrolls by rows. With `rowsTotal` the number of rows the sequence occupies and `bufferRows` the buffer expressed in whole rows, the outputs SHALL be:

- `bufferRows` is the buffer size in screens times the visible height, divided by the item height, rounded up
- `firstRow` is the scroll offset divided by the item height, rounded down, less `bufferRows`, and not below zero
- `lastRow` is the scroll offset plus the visible height, divided by the item height, rounded down, plus `bufferRows`, and not above the last row
- the first index is `firstRow` times the items per row
- the last index is one past `lastRow` times the items per row, less one, and not above the last item
- the leading spacer is `firstRow` times the item height, and the trailing spacer is the rows after `lastRow` times the item height

#### Scenario: The derivation is independent of the platform

- **WHEN** the range derivation is exercised outside the application runtime
- **THEN** it produces ranges without a scrolling container, without elements, and without platform APIs

#### Scenario: One derivation serves every windowed sequence

- **WHEN** the windowed sequences are inspected
- **THEN** each obtains its range from the same derivation rather than computing its own

##### Example: a two-column grid of 208 items, 96px rows, 480px visible, one screen of buffer

| Scroll offset | First index | Last index | Leading spacer | Trailing spacer |
| ------------- | ----------- | ---------- | -------------- | --------------- |
| 0             | 0           | 21         | 0              | 8928            |
| 480           | 0           | 31         | 0              | 8448            |
| 960           | 10          | 41         | 480            | 7968            |
| 9600          | 190         | 207        | 9120           | 0               |

##### Example: a single-column list of 105 items, 24px rows, 240px visible, one screen of buffer

| Scroll offset | First index | Last index | Leading spacer | Trailing spacer |
| ------------- | ----------- | ---------- | -------------- | --------------- |
| 0             | 0           | 20         | 0              | 2016            |
| 240           | 0           | 30         | 0              | 1776            |
| 1200          | 40          | 70         | 960            | 816             |
| 2280          | 85          | 104        | 2040           | 0               |


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: Scroll height is preserved by spacers, not by altering the container

The space the unrendered items would have occupied SHALL be held by one empty element before the rendered range and one after it, each sized to the number of items it stands for. The scrolling container's own declarations SHALL NOT be altered to compensate.

The scrollable extent SHALL therefore be the same as it would be with every item rendered, so that the scroll position corresponding to a given item does not change when windowing is engaged.

#### Scenario: Scrollable extent is unchanged by windowing

- **WHEN** a windowed sequence and the same sequence rendered in full are compared
- **THEN** the total scrollable extent is the same

#### Scenario: Spacers carry no content

- **WHEN** the spacer elements are inspected
- **THEN** each has no child elements


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: The range updates on a change of first index, not on every scroll event

A scroll event whose derived first index equals the current one SHALL NOT cause a re-render. The update granularity SHALL be the index rather than the pixel.

The update SHALL NOT be paced by a timer. Waiting a fixed number of milliseconds after an event has been measured to be unreliable on this platform, and index granularity already bounds how often a re-render can occur.

#### Scenario: Scrolling within one item's height does not re-render

- **WHEN** the container scrolls by less than the height of one item and the derived first index is unchanged
- **THEN** no re-render occurs

#### Scenario: No timer paces the update

- **WHEN** the windowing implementation is inspected
- **THEN** it contains no timer scheduling the range update


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: A sequence that changes length clamps the range without commanding the container

When the sequence changes length — under a filter, a sort, or a language change — the derived range SHALL be clamped to the new length, so that no index beyond the last item is rendered and no gap appears.

Clamping SHALL be part of the derivation, which already takes the total as an input. The implementation SHALL NOT call any scrolling API to reposition the container, and SHALL NOT store and restore a scroll position. A reactive update already leaves the scroll position alone, and writing code to manage it has been rejected for this project.

#### Scenario: A shorter sequence clamps the range

- **WHEN** a filter reduces a windowed sequence from two hundred items to twelve while the container is scrolled far down
- **THEN** the rendered range names only indices that exist
- **AND** no element remains from an index beyond the new length

#### Scenario: No scrolling API is called

- **WHEN** the windowing implementation is inspected
- **THEN** it calls no method that scrolls, and it neither stores nor restores a scroll position


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: Item height is declared once and asserted against the stylesheet

The height of one item SHALL be declared in exactly one place in the source, and the stylesheet SHALL express the same value. A check that runs outside the application SHALL assert the two agree and SHALL exit non-zero when they do not.

A disagreement between the declared height and the rendered height produces items that drift out of place or gaps that open at the edges. It raises nothing and renders nothing broken-looking, so it belongs to the class of failure this project guards with checks rather than with review.

#### Scenario: The declared height and the stylesheet agree

- **WHEN** the height check runs against a stylesheet whose item height matches the declared constant
- **THEN** the check passes

#### Scenario: A drifted height fails the check

- **WHEN** the stylesheet's item height is changed without the declared constant changing
- **THEN** the check exits non-zero and names the item whose heights disagree


<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->

---
### Requirement: The scroll offset source is adjudicated on a physical device before any sequence is windowed

Whether the platform's scrolling container reports a usable scroll offset SHALL be measured on a physical device before any sequence is converted, including whether the report carries an absolute offset or only deltas, and how far the container can travel between two reports.

The measurement SHALL carry a control that fires for an unrelated reason on the same container, so that a binding written incorrectly is distinguishable from a platform that does not report. When only deltas are reported, the derivation's offset input SHALL be an accumulated value and the accumulation SHALL be corrected at the top of the container.

The buffer size SHALL be set from the measured maximum travel between reports rather than chosen. The outcome SHALL be recorded in the design handoff document.

#### Scenario: Reporting is measured before conversion

- **WHEN** no device measurement of the container's scroll reporting exists
- **THEN** no sequence is converted to a windowed one

#### Scenario: The control distinguishes a wrong binding from a silent platform

- **WHEN** the measurement runs
- **THEN** an unrelated event bound to the same container is observed alongside the scroll reporting
- **AND** the absence of scroll reports is only concluded when that control fired

#### Scenario: The buffer follows the measured travel

- **WHEN** the maximum travel between two consecutive reports is measured
- **THEN** the buffer is at least that travel
- **AND** the measured figure is recorded in the design handoff document

<!-- @trace
source: window-visible-range
updated: 2026-08-10
code:
  - src/App.css
  - src/state/visibleRange.ts
  - ROADMAP.md
  - package.json
  - src/App.vue
  - src/components/MoveLearners.vue
  - src/components/LearnsetTable.vue
  - scripts/check-row-heights.mjs
  - src/state/viewport.ts
  - design/HANDOFF.md
  - src/state/rowMetrics.ts
  - src/components/DexGrid.vue
tests:
  - tests/visible-range.test.ts
-->