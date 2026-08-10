## Why

`design/HANDOFF.md` §12.24 用五刀單變數對照量出了畫面等待的成因：**平台按元素計價，約 1.3ms 一個，與那些元素
是什麼無關**。網路、圖片快取、屬性字符、文字塑形、主線程觸控綁定全部逐一排除。

| 情境 | 元素數 | 量到 |
|---|---|---|
| 詳情面板 #475 艾路雷朵（105 招式列 × 8.5） | ~890 | **897ms** |
| 同樣 105 列砍到每列 4 個元素 | ~420 | **285ms** |
| 未篩選網格（208 卡 × 約 20） | ~4000 | 最慢 sprite **2327ms** |

所以降低等待只有兩個槓桿：減少每個項目的元素數，或**減少同時存在的項目數**。後者的槓桿大一個數量級，
而且 `dex-grid` spec 從一開始就保留了這條退路，明文寫「node growth 不可接受時，啟用自管的可視範圍視窗
並記錄」——**它的觸發條件現在有數字支持了**。

## What Changes

- **新增一個共用的可視範圍推導**：給定捲動位移、項目高度、項目總數與緩衝量，算出應該渲染的索引區間。
  純函式、無平台相依，因此可在 node 下驗證。
- **網格只渲染區間內的卡片**，目標可視卡約 **10 張**（雙欄，即約 5 列），前後各加緩衝。
  區間外以上下兩個佔位 view 撐住捲動高度，使捲動範圍與未視窗化時相同。
- **招式表只渲染區間內的列**。它已經有自己的捲動容器（`bound-learnset-scroll`，高度 36vh、列數 > 12 才套），
  所以可視列數本來就有界。
- **學習者清單只渲染區間內的列**。它是全專案最大的序列 —— 單一招式最多 **225 個學習者**（中位數 15），
  每列兩個物種，元素數比網格還糟。它與另外兩處共用同一個推導，多做的只有接線與驗收。
- **視窗化必須自己寫**：§12.13 已確立 vue-lynx 的 `<list>` 只實作尾端追加，篩選與排序在它上面不成立；
  `dex-grid` spec 亦明文禁止引入第三方虛擬捲動套件。**該結論已於 2026-08-10 重新複驗並仍然成立**
  —— npm 現行 latest 0.5.1 的 list-apply 與本專案裝的 0.4.0 位元組相同、1.0.0 是零程式碼的佔位套件、
  且重建整個 list 的退路仍會讓以 list id 為鍵的內部 Map 無界成長。細節記在 §12.13。
- **卡片與列的識別鍵不變**（物種編號 + 形態索引 / 招式名），所以篩選與排序的正確性不因視窗化改變。

## Capabilities

### New Capabilities

- `visible-range-window`: 可視範圍的推導與呈現契約——區間如何從捲動位移算出、緩衝量、捲動高度如何維持、
  區間變動的觸發時機，以及在項目序列改變（篩選、排序、語系切換）時區間如何重新解析

### Modified Capabilities

- `dex-grid`: 卡片改為只渲染可視範圍內的部分，啟用該 spec 既有的「自管可視範圍視窗」退路
- `learnset-table`: 招式列改為只渲染可視範圍內的部分
- `move-learners`: 學習者列改為只渲染可視範圍內的部分
- `species-card`: 名稱列比照既有的兩個列保留高度，使所有卡片等高——這是網格能視窗化的前提，
  因為區間推導需要一個單一的列高。換行行為不變，不引入任何截斷

## Impact

- Affected specs: `visible-range-window`（新增）、`dex-grid`、`learnset-table`、`move-learners`、`species-card`
- Affected code:
  - New:
    - src/state/visibleRange.ts
    - tests/visible-range.test.ts
  - Modified:
    - src/components/DexGrid.vue
    - src/components/LearnsetTable.vue
    - src/components/MoveLearners.vue
    - src/App.css
    - design/HANDOFF.md
    - ROADMAP.md
  - Removed: (none)
- **前置未知（第一項任務就是量它）**：`<scroll-view>` 在本平台送不送得出帶可用位移的捲動事件，
  以及事件頻率是否足以驅動區間更新。整個方案壓在這一項上，而它目前**零證據**——`design/HANDOFF.md`
  全文沒有任何一節提到捲動事件。
