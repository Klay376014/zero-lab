## Why

設計稿的篩選能力有三項在移植時縮水，其中兩項連 i18n 鍵都沒有留下 —— 畫面上沒有任何東西指出功能不見了（`HANDOFF.md` §12.18 記的正是這個機制的另一半）。

- **屬性篩選從多選縮為單選。** 設計稿的 `state.types` 是 `Set`，移植版是 `TypeName | null`。`dex-query` spec 通篇用單數，所以不違規 —— 但這是**行為縮減**，沒有任何一處寫它是刻意的
- **`★ 僅 MEGA` 與 `僅多形態` 兩顆鈕整個不存在。** 設計稿的 `state.mega` / `state.multi`，移植版零出現

ROADMAP A4 與 A5。兩項合成一個 change，因為都動 `src/state/query.ts` 與 `src/components/QueryBar.vue` —— 分開做要碰兩次同樣的檔案、寫兩次 spec delta，而且第二次會踩到第一次剛改完的版面。

## What Changes

- 屬性篩選改為可多選。多個屬性之間是 **OR（任一命中）**，依設計稿 `match()` 的語意
- 新增兩顆布林篩選鈕：`★ 僅 MEGA`（只留有 Mega 形態的物種）與 `僅多形態`（只留形態數大於一的物種）
- 兩顆新鈕與屬性篩選、搜尋之間一律是 **AND** —— 每個篩選各自縮小結果集，這與現有的「搜尋與屬性篩選同時成立才入選」一致
- 查詢列從兩列**增為三列**，第三列放兩顆新鈕
- 卡片顯示哪個形態的規則多一條：屬性篩選命中改為「第一個帶有**任一**選中屬性的形態」；當 `★ 僅 MEGA` 開啟且屬性規則沒命中時，顯示第一個 Mega 形態
- i18n 補三個鍵：`megaOnly`、`multiOnly`，以及兩顆鈕的英文標籤

## Non-Goals

- **不加世代篩選。** 它是 `optimize-query-bar` 刻意移除的，理由寫在 `dex-query` spec 裡。本次不翻案
- **不加第三種排序。** 名稱排序是 ROADMAP A6，且它的成本在排序控制項的版面，與本次無關
- **不改搜尋語料。** 搜尋能不能搜到 `mega` 這類詞是 `widen-dex-query-search` 的範圍
- **不加無障礙屬性。** 設計稿的兩顆鈕帶 `aria-pressed`，但平台的 accessibility 屬性尚未查證，那是 ROADMAP B 節的獨立項目。在這裡加孤例會讓該項目更難收斂
- **不做「僅 Mega」與「僅多形態」的互斥。** 兩者可同時開啟，結果是兩個條件都成立的物種

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `dex-query`: 四條需求改變。查詢狀態從三項擴為五項；屬性篩選改為集合且多值之間為 OR；卡片形態選擇規則加入多屬性與 Mega 分支；查詢列從兩列改為三列

## Impact

- Affected specs: `dex-query`
- Affected code:
  - Modified:
    - src/state/query.ts
    - src/components/QueryBar.vue
    - src/data/i18n.ts
    - src/App.css
  - New: (none)
  - Removed: (none)

### 一項與既有理由的張力，須明確記錄

`dex-query` spec 兩度用同一個理由拒絕增加列數：世代篩選被移除是因為「那九顆鈕佔掉一整列，而那列的垂直空間對卡片網格的價值高於該篩選對讀者的價值」；排序不做成一鈕一成員也是同一句話。**本次增加第三列與那個理由方向相反。**

這是經過權衡的決定，不是疏漏。差別在於：被移除的是九顆鈕承載最少用的篩選，新增的是兩顆鈕承載設計稿本來就有的篩選。但代價是真的 —— 卡片網格會少露出一部分。這一段存在的目的，是讓日後有人讀到那兩句理由時，知道它已經被重新權衡過，而不是被忽略了。
