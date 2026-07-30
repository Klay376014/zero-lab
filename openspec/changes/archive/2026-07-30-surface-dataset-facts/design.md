## Context

移植版交付了設計稿的七項主要功能，但畫面上關於**資料集本身**的兩處陳述從未被排進任何一批：
footer 的來源與版權說明，以及 masthead 的四個規模計數。兩者都缺 `src/data/i18n.ts` 的鍵，
所以畫面上沒有任何東西指出功能不見了（ROADMAP 開頭已診斷這個失效機制）。

⚠️ 交付範圍在實作途中縮減：footer 只留字型／版權一段，五段來源說明不做。決策與代價見下方
「footer 只留字型／版權一段」。這份文件其餘部分已依該決定更新。

現況三件事值得先講清楚，因為它們決定了下面的決策：

1. `src/data/dex.json` 的 `meta` 區塊已經帶著全部需要的數字（`species` 208、`formEntries` 360、
   `megas` 75、`moves` 496）以及 `roster` 標示與 `source` 敘述。`src/data/dex.ts` 的 `Dex` 介面
   已宣告 `meta`，`dex` 也已匯出 —— 但 `dex-data` spec 從未要求 meta 可讀，等於這個曝露沒有契約。
3. `src/App.vue` 的 masthead 印 `results.length / 208`，其中 `208` 是字面值。`src/data/dex.ts`
   的載入期不變式斷言同一個數字，等於同一個事實在樹裡有兩份。

## Goals / Non-Goals

**Goals:**

- 畫面上出現字型授權與著作權聲明。
- masthead 印出設計稿的四個規模計數，數值全部來自資料集自身。
- 移除 `208` 這個字面值，讓資料集的數字在樹裡只有一份出處。
- footer 的敘述必須對移植版為真，而不是對設計稿為真。

**不再是 Goal（實作途中縮減）**：畫面上出現資料來源聲明，以及使 `design/HANDOFF.md` §8 那句
「已在 footer 誠實說明」成立。兩者都靠五段來源說明，而那五段不做了。

**Non-Goals:**

- **不做五段來源說明**（陣容與形態、招式、種族值與特性、中文名稱、圖像）。
- 不做整批離線探測（ROADMAP A10）。
- 不新增建置期步驟或建置期資產。
- 不做 ROADMAP A4／A5／A6（多選篩選、`★ 僅 MEGA` 與 `僅多形態`、名稱排序）。它們同樣缺 i18n 鍵，
  但不屬於「關於資料集的陳述」，混進來會讓這個 change 橫跨兩個無關的子系統。
- 不新增字型面，也不改 footer 以外任何地方的字型分工。
- 不改 `design/HANDOFF.md` 與 `design/pipeline/`。設計稿是交接紀錄，不隨移植版變動。

## Decisions

### 資料集的數字一律從 meta 讀，不接受字面值

四個計數與結果計數的分母全部取自 `dex.meta`。這條約束寫進 `dataset-statements` spec，
而不是只寫進 `dex-data`，因為它約束的是**畫面**而不是資料層。

替代方案是讓元件各自數一遍（`dex.species.length`、跨物種累加形態數等）。不採用：那會把
`src/data/dex.ts` 載入期已經斷言過的六個數字重新算一次，而算法一旦與 pipeline 的定義分歧，
畫面會顯示一個沒有任何斷言保護的數字。`meta` 是 pipeline 的輸出，斷言比對的也是它。

### footer 只留字型／版權一段，五段來源說明不做

討論後決議：footer 只陳述字型授權與著作權，不陳述資料來源。設計稿的另外五段（陣容與形態、招式、
種族值與特性、中文名稱、圖像）不移植。

**這個決定的代價要寫下來，因為它推翻了本提案自己的兩條動機：**

1. 移植版畫面上**仍然沒有**任何資料來源聲明。`README.md` 有，但使用者看不到。ROADMAP A2 因此
   只被部分交付，不能整項移走 —— 剩下的部分要重寫為「五段來源說明，已決議不做」並移入 C 節，
   或保留為待辦。
2. `design/HANDOFF.md` §8 那句「第六世代之後是渲染圖，**已在 footer 誠實說明**」靠的是圖像段。
   圖像段不做，這句話在移植版**仍然不成立**。這是本提案 Why 的第一句，現在只達成一半。

連帶取消的一項決策：roster 標示原本要在執行期從 `dex.meta.roster` 插入第一段。第一段不存在了，
沒有東西需要插值，該需求從 spec 移除（它從未進過現行 spec，所以是刪除而非 REMOVED delta）。
`dex.meta.roster` 仍由 `dex-data` 獨立要求曝露，日後要重新加回來時從那裡讀。

### footer 的兩處敘述改寫為對移植版為真

| 設計稿說 | 移植版的事實 | 改寫後 |
|---|---|---|
| Silkscreen（OFL）已內嵌 | Silkscreen Regular、Silkscreen Bold、Literata-Prose 三個檔案，兩個字型家族 | Silkscreen 與 Literata（皆 OFL）已內嵌 |
| 本頁為非商業設計稿 | 這是移植版，不是設計稿 | 本作品為非商業用途 |

原本還有第三處：圖像段的離線敘述（設計稿寫「連不到外部圖像時改用程式繪製的像素佔位圖」，
移植版是逐張型別標記佔位）。圖像段整段不做了，該改寫連同該段一起取消。同段那句
「以最近鄰放大保持像素銳利」原本判定為真而保留，現在也一併消失。

替代方案是照抄設計稿原文。不採用 —— 那正是這個 change 要修的問題：文件承諾未交付的東西。

### footer 放在網格的捲動容器內，不放在 masthead 之外的固定區

footer 是頁尾長文，必須能捲到。移植版的可捲區只有 `DexGrid` 的捲動容器（masthead 與查詢列
刻意留在容器外，不隨卡片捲走）。footer 因此放進該容器、卡片之後。

替代方案是給 footer 自己的捲動容器。不採用：`species-detail` spec 已立下「巢狀同向捲動只給招式表
一層例外，不是前例」，而網格這一側同樣沒有理由開第二個。

### footer 的字型分工沿用既有規則，不新增規則

標題走 `Silk`（像素面），內文走 `Lit`（散文面）。這與特性說明長文的分工相同，
`design/HANDOFF.md` §9 已定，`pixel-typography` spec 已規範，不需要新需求。

⚠️ 內文含 CJK。散文面不帶 CJK 字符，中文自然穿透到系統面 —— 這是既有行為，不是這個 change 引入的。
`pnpm run check` 的散文語料檢查會讀新增的字串。

⚠️ 該檢查有一個盲區：它以 `/'([^'\\\n]*)'|"([^"\\\n]*)"/g` 從 `src/data/i18n.ts` 蒐集字面值，
**只吃單引號與雙引號，不吃反引號**。用模板字串寫的字串會整段逃過檢查而檢查照樣顯示通過。
footer 的字串因此必須維持單引號。修掉這個盲區不在本 change 範圍內。

## Implementation Contract

**Behavior** — 使用者觀察到的：

- masthead 出現四個計數區塊，依序為種類／形態／MEGA／招式，數值 208／360／75／496，
  每個區塊上方是數字、下方是標籤。
- masthead 的結果計數從裸斜線變成本地化字串：中文「n / 208 種類」、英文「n / 208 species」。
  分母隨資料集，不是字面值。
- 網格捲到底之後出現 footer，一段字型／版權，帶一個標題與一段內文。
- 切換語言時，四個標籤、結果計數與 footer 全部換語言。切換模式時 footer 的顏色跟著換。

**Interface / data shape**：

- `src/data/i18n.ts` 的 `Strings` 介面新增四個 tally 標籤鍵。`footer` 與 `count` 不放進 `Strings`
  —— `Strings` 的契約是「只有純字串，`t()` 因此回傳純字串」。footer 是結構化的「標題＋內文」
  序列，結果計數帶兩個數字，兩者各自走一個具名存取器，與 `statLabels`、`formsOfLabel`
  等既有存取器同一個模式。
- footer 存取器回傳序列而非單一物件，雖然目前只有一段：序列是元件渲染的形狀，日後增段時
  兩邊都不必改。不做任何插值。
- `dex-data` 曝露 meta：`Dex` 介面上的 `meta` 已存在，本次補的是 spec 需求，不是新程式介面。

**Failure modes**：

- meta 的六個計數已由載入期不變式斷言（`assertCount`），數字對不上會在載入時拋錯並指向
  `design/HANDOFF.md`。footer 與 tally 不需要自己的防禦。
- footer 不讀取資料集的任何欄位，所以沒有資料相關的失效模式。`roster` 與 `source` 仍由
  `dex-data` 要求曝露且不受斷言保護，但畫面上已無消費者。

**Acceptance criteria**：

- `pnpm run check` 四項不變式全過。散文語料檢查是唯一會因為新增字串而失敗的一項 —— 但只在
  字串以單引號寫成時才看得到它們（見上方盲區）。
- `npm exec tsc -- --noEmit -p src/tsconfig.json` 無錯。
- 樹裡搜不到 `208` 這個字面值出現在 `src/App.vue`。
- 手動驗收：中英各切一次，確認四個標籤、結果計數與 footer 都換語言；POCKET／MODERN 各切一次，
  確認 footer 顏色隨模式。
- 裝置驗收：footer 內文的 Latin 字寬在 web 預覽不可信（散文面在預覽不載入，見 §12），
  換行結果必須在 LynxExplorer 或實機上看。

**Scope boundaries**：

- In scope：`src/data/i18n.ts` 新增鍵與存取器、`src/data/dex.ts` 補 meta 的載入期斷言、
  `src/App.vue` 的 masthead tally、`src/components/DexFooter.vue`（新增）、
  `src/components/DexGrid.vue`（在既有捲動容器內渲染 footer 元件，僅此一處）、
  `src/App.css` 的 tally 與 footer 樣式、`dex-data` spec 補一條 meta 需求、
  新增 `dataset-statements` spec。

  ⚠️ 這份清單原本漏了 `DexGrid.vue`，與上面「footer 放在網格的捲動容器內」的決策矛盾 ——
  那個容器就在該檔案裡。footer 以獨立元件而非 `<slot />` 注入：這個 codebase 目前零元件使用
  slot，而未經量測的平台特性正是 §12 反覆記載的失效來源，不在這個 change 裡開第一次。
- Out of scope：ROADMAP A1／A3／A4／A5／A6／A8／A9／A10 的任何一項；`design/` 底下任何檔案；
  離線行為的改動；新的捲動容器；新的字型面。

## Risks / Trade-offs

- **[散文語料檢查已實測通過]** → 內文的 `©`、`（）`、`／` 等字元都在子集面內。已用植入
  `♠`／`ʧ` 的陽性對照確認檢查真的在讀這些字串並會指名缺字。
- **[畫面上沒有資料來源聲明]** → 這是決策的直接後果，不是疏漏。任何文件若宣稱移植版有來源說明
  都是錯的，包括 `design/HANDOFF.md` §8。ROADMAP A2 只被部分交付。
- **[Latin 字寬在 web 預覽不可信]** → §12 已記。字型／版權段的 Latin 比既有畫面的長，
  驗收必須在 native。
