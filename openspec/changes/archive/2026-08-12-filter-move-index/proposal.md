## Why

招式分頁一次列出 496 列，是這個應用最長的固定序列，而它沒有任何查詢控制項 —— 讀者要找一個招式只能滑。`move-index` 當初刻意寫下「The move index carries no query controls」，理由是那一批的目的是**到得了**一個招式，而每個條件都要付自己的狀態、結果計數敘述與與可視範圍視窗的互動成本。那個判斷在只有 496 列可滑時成立；一旦讀者的實際問題是「水屬性的物理招有哪些」，滑動就不是答案。

現在補這三個條件的時機，是因為成本可以攤在同一批控制項上，而且述詞與樣式都有可直接沿用的來源：屬性晶片與 OR 語義來自 `dex-query`，空狀態敘述與計數形狀來自 `learnset-table`，序列變短時夾住範圍的規範 `visible-range-window` 已經寫好且明文涵蓋篩選。

## What Changes

- 招式分頁新增篩選列，三個條件：**名稱搜尋**、**屬性多選**、**傷害類別多選**。
- 屬性與傷害類別各自多值時為 **OR**（第二個選擇放寬結果），三個條件之間為 **AND**。
- 搜尋語料**只收招式的中英名稱**，不收屬性名、不收說明文字，逐筆記憶化。
- 招式分頁的 masthead 副標由資料集常數改為**結果計數**（例如 31 / 496 個招式）。字串表的 `moveCountLabel` 因此失去唯一呼叫點並被移除，改為兩個數字的形式。
- 篩選後無結果時以句子敘述，沿用 `learnset-table` 立下的形狀，但用招式分頁自己的字串鍵。
- **BREAKING（spec 層）**：`move-index` 的「The move index carries no query controls」requirement 被改寫。「招式分頁不渲染圖鑑分頁的查詢列」那半句保留 —— 查詢列仍然只屬於圖鑑分頁，招式分頁得到的是自己的篩選列。
- 招式分頁的可視範圍視窗高度常數因篩選列而重新評估。
- `openspec/LANGUAGE.md` 新增一筆詞彙，收斂「篩選／過濾／查詢」三種說法。

## Capabilities

### New Capabilities

- `move-query`: 招式分頁被要求什麼、以及它答什麼。涵蓋三個條件的共用反應式狀態與各自可獨立設定、清除操作、多值 OR 與條件之間 AND 的組合規則、只收名稱的搜尋語料與其記憶化、兩個語言同時比對、以及推導出的結果序列。

### Modified Capabilities

- `move-index`: 「不帶任何查詢控制項」改為「帶自己的篩選列、但不渲染圖鑑分頁的查詢列」；新增篩選後無結果的敘述；視窗高度常數隨篩選列重新評估。
- `dataset-statements`: 結果計數的 requirement 由「物種數」推廣到「招式分頁的招式數」，兩者形狀相同（相符數、總數、被計數的單位、隨語系重述）。同時記錄 `moveCountLabel` 是被取代而非漏失，避免下一批把缺鍵讀成未交付的功能。

## Impact

- Affected specs: `move-query`（新增）、`move-index`（修改）、`dataset-statements`（修改）
- Affected code:
  - New:
    - src/state/moveQuery.ts
    - src/components/MoveFilterBar.vue
    - tests/move-query.test.ts
  - Modified:
    - src/components/MoveIndex.vue
    - src/App.vue
    - src/App.css
    - src/data/i18n.ts
    - src/data/dex.ts
    - src/state/rowMetrics.ts
    - openspec/LANGUAGE.md
    - ROADMAP.md
    - tests/i18n.test.ts
  - Removed: （無檔案刪除；`src/data/i18n.ts` 內的 `moveCountLabel` 函式被取代）
