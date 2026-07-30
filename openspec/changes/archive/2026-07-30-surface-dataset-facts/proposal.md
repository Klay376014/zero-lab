## Why

畫面上目前沒有任何一處說明可否商用、著作權屬誰、內嵌字型的授權為何。`README.md` 有，
但使用者看不到。

⚠️ **範圍在實作途中縮減**：footer 只留字型／版權一段，設計稿的五段來源說明不做。因此
`design/HANDOFF.md:171` 那句「第六世代之後的 sprite 是渲染圖 —— 已在 footer 誠實說明」
在移植版**仍然不成立**，而畫面上仍然沒有資料來源聲明。ROADMAP A2 只被部分交付，
剩下的部分要另行處置。決策與代價見 design.md。

masthead 也只印 `results.length / 208`，設計稿的四個計數（種類 208／形態 360／MEGA 75／招式 496）
一個都沒有。那個 `208` 還是 `src/App.vue` 裡的字面值，與 `src/data/dex.ts` 載入期斷言的同一個數字
各寫了一份。

兩者是同一條線：**畫面上關於這份作品與其資料集的陳述** —— footer 講授權與版權，tally 講規模。
兩者也共用同一個失效機制（ROADMAP 開頭已診斷）：`src/data/i18n.ts` 缺 `footer`、`count` 與四個
tally 鍵，字串跟著實作一起消失，於是畫面上沒有任何東西指出功能不見了。

## What Changes

- `src/data/i18n.ts` 新增六個鍵：`footer`（字型／版權一段，標題＋內文）、`count`（帶兩個數字的
  本地化字串）、`tSpecies`／`tForms`／`tMega`／`tMoves`。中英兩份。
- masthead 印四個計數，數值全部取自 `dex.meta`，不再有字面值。`results.length / 208` 改用 `count` 鍵，
  分母取 `dex.meta.species`。
- 詳情面板之外、`DexGrid` 捲動容器之內新增 footer 區塊，一段字型授權與版權說明。
- `字型／版權`段的兩處敘述在移植版不成立，改寫而非照抄（見 design.md）：字型面數量
  （移植版內嵌兩個面，非一個）與作品性質（移植版不是設計稿）。
- 資料層曝露 `dex.meta`：`src/data/dex.ts` 已在 `Dex` 介面上有 `meta`，但 `dex-data` spec 從未
  要求它，等於沒有契約。補一條需求。

## Non-Goals

- **不做五段來源說明**（陣容與形態、招式、種族值與特性、中文名稱、圖像）。
- **不做整批離線探測**（ROADMAP A10）。
- **不新增建置期步驟或建置期資產。**
- **不做 A4／A5／A6**（多選篩選、兩顆篩選鈕、名稱排序）。它們也缺 i18n 鍵，但不屬於「關於資料集的陳述」。
- **不動 footer 以外的字型分工**。footer 標籤走 Silk、內文走 Lit，沿用既有規則，不新增字型面。

## Capabilities

### New Capabilities

- `dataset-statements`: 畫面上關於資料集本身的陳述 —— masthead 的四個規模計數與結果計數，
  以及 footer 的字型授權與版權說明。含畫面上的資料集數字必須取自資料集自身而非字面值這條約束。

### Modified Capabilities

- `dex-data`: 新增一條需求，要求資料層曝露資料集的 meta 區塊（六個計數、roster 標示、來源敘述），
  並要求畫面上出現的資料集數字取自該區塊而非字面值。現行 spec 只在不變式表裡提過 roster 一次，
  從未要求 meta 可讀。

## Impact

- Affected specs: `dataset-statements`（新增）、`dex-data`（修改）
- Affected code:
  - Modified:
    - `src/data/i18n.ts`
    - `src/data/dex.ts`
    - `src/App.vue`
    - `src/App.css`
    - `src/components/DexGrid.vue`
  - New:
    - `src/components/DexFooter.vue`
  - Removed: （無）
