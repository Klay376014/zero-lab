## Why

招式表目前是資料的終點之一：讀者只能從某一隻寶可夢的詳情面板看到它會的招式，無法反過來瀏覽這個資料集的 496 個招式本身。招式的說明文字（「有時會讓對手陷入麻痺狀態」「連續攻擊２～５次」）從來沒有進過這個應用 —— 資料集只帶了名稱與六個數值欄位，讀者看得到威力 100、命中 80，卻看不到那一招做了什麼。

同時，量測發現資料集有 8 個招式的中文名是簡體字（其中「虫撲」是簡繁混雜），全部是第九世代招式，來自 PokeAPI 的 zh-Hant 欄位在該世代的污染。這些字現在就顯示在招式表上，而 CJK 被排除在字型檢查之外，所以沒有任何檢查會抓到。

## What Changes

- 新增第二個分頁「招式」，與既有的「圖鑑」並列。切換控制項畫在機殼上（Screen 之外、Shell 之內），讀作裝置的實體按鍵
- 招式分頁列出全部 496 個招式，走既有的可視範圍視窗
- 新增招式詳情層：屬性、傷害類別、威力、命中、PP、雙語說明文字，以及進入學習者清單的入口
- **BREAKING**：詳情面板裡的招式列，tap 目標從學習者清單改為招式詳情。學習者清單改為只從招式詳情進入
- 新增層堆疊規則：每一種層在堆疊裡最多一個實例，開啟一個已在堆疊裡的層是回捲到它並換掉內容，不是再推一層。堆疊上限因此固定為三層
- 資料層新增招式的中文說明、英文說明與 flag 編號三個欄位。中文說明與中文名改以 52poke 招式列表為來源
- 修正 8 個簡體中文招式名
- **BREAKING**：移除 masthead 的四個規模計數（種類／形態／MEGA／招式）。該 Requirement 連同其 Example 表一併從 spec 刪除，理由記入 ROADMAP C 節

## Capabilities

### New Capabilities

- `view-tabs`: 兩個並列分頁與它們的切換控制項，包含控制項畫在機殼而非螢幕上的約束
- `layer-stack`: 覆蓋在分頁之上的三種層，以及「每種層最多一個實例、重入即回捲」的堆疊規則
- `move-index`: 招式分頁的 496 列清單，含列的內容與視窗化
- `move-detail`: 招式詳情層的內容、說明文字的來源約束，以及它與學習者清單的關係

### Modified Capabilities

- `dex-data`: Move 型別新增中文說明、英文說明與 flag 編號三個欄位；provenance 新增第三個上游來源與「外部來源只供文字、不供機制數值」的約束
- `dataset-statements`: 移除「masthead 以四個計數陳述資料集規模」這條 Requirement，並修正另一條 Requirement 中提及四個計數的條文
- `learnset-table`: 招式列這個控制項的目標從學習者清單改為招式詳情
- `move-learners`: 學習者清單新增第二個入口；原本兩條關於「選擇學習者取代選取、關閉後回到網格」的導航規則改由 layer-stack 的回捲規則承接

## Impact

- Affected specs: view-tabs、layer-stack、move-index、move-detail、dex-data、dataset-statements、learnset-table、move-learners
- Affected code:
  - New:
    - src/state/tabs.ts
    - src/state/layerStack.ts
    - src/components/TabDeck.vue
    - src/components/MoveIndex.vue
    - src/components/MoveDetail.vue
    - design/pipeline/fetch_moves_zh.py
    - tests/layer-stack.test.ts
  - Modified:
    - design/pipeline/fetch_sources.sh
    - design/pipeline/aggregate.py
    - design/pipeline/run.sh
    - design/champions-dex.json
    - src/data/dex.json
    - src/data/dex.ts
    - src/data/i18n.ts
    - src/App.vue
    - src/App.css
    - src/components/LearnsetTable.vue
    - src/components/MoveLearners.vue
    - src/state/moveLearners.ts
    - scripts/check-row-heights.mjs
    - ROADMAP.md
  - Removed:
    - masthead 四個規模計數的 computed 與其四條樣式規則（位於 src/App.vue 與 src/App.css，非整檔刪除）
