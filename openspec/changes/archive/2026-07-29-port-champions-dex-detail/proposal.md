## Why

`src/` 目前只移植到網格：點一張卡片沒有任何反應。設計稿的詳情面板承載了整份資料集裡卡片放不下的部分 —— 種族值、特性與說明、形態切換、陣容警語 —— 沒有它，208 張卡片只是一個目錄而不是一份圖鑑。

資料層在第一個切片已經全數落地（`src/data/dex.json` 含 496 招式、200 特性、每個形態的種族值與特性槽），所以這批的工作全在呈現層。

現在做的另一個理由是平台不確定性要趁早清掉：詳情面板是這個移植裡第一個需要**覆蓋層**與**更深節點樹**的東西，而 `design/HANDOFF.md` §12 結尾明確要求「詳情面板切片會加入更深的節點樹，屆時要重新量而不是沿用網格的結論」。

## What Changes

- 新增選取狀態模組：哪一隻寶可夢、哪一個形態被打開，以及形態索引的夾限與關閉時的重設
- 新增詳情面板：覆蓋層、標題列（名稱／副名稱／編號・世代・形態數・分類）、192px 大圖與形態標題、型別藥丸與四項屬性清單、陣容與近似圖的警語、種族值列、特性列
- 新增形態切換器：依「基本／形態／地區形態／MEGA」分組，只在該形態改變型別時才在鈕上蓋型別字符
- 網格的卡片變成可點擊，點擊開啟對應形態的詳情
- 字串表擴充：新增詳情面板需要的鍵，並為陣列、字典、帶參數三種新形狀各加具名存取器，`t()` 維持只回字串
- 散文面（特性說明與警語長文）暫用系統字型，Literata 的 TTF 內嵌另案處理
- 樣式檢查新增一條不變式：樣式表不得出現 `inset` 陰影

依平台限制對設計稿的偏離（都會記進 design.md）：巢狀捲動改為單一捲動容器、招式表的黏著表頭與面板的黏著標題列取消、`title` 提示移除、`::after` 的星號改為真節點、其他形態的圖像預熱移除、`inset` 陰影改為分邊框、`display:grid` 改為 flex 固定欄寬。

## Capabilities

### New Capabilities

- `species-detail`: 詳情面板 —— 覆蓋層的構成與開關、標題列、大圖與形態標題、屬性清單、警語、種族值列、特性列、以及「整個面板只有一個捲動容器」這條結構決定
- `form-switcher`: 形態切換器 —— 分組順序、選中態、型別字符只在改變型別時出現的判準、以及切換形態時面板內容與捲動位置的行為

### Modified Capabilities

- `dex-grid`: 卡片新增開啟詳情的觸發，且觸發綁在網格自己的儲格節點上而非卡片元件上
- `pixel-typography`: 原本記載「本切片不渲染長文，散文面不在範圍內」，這批開始渲染長文，需改為記載散文面的佔位決定與其驗收缺口
- `retro-theme`: POCKET 的「渲染的每個顏色都是四階灰成員」要求需要一個明列的例外 —— 詳情遮罩要壓暗網格而不是遮住它，而半透明疊色必然產生色盤外的中間色。既有要求已經把 sprite 圖像列為例外，這裡是第二個

## Impact

- Affected specs: `species-detail`（新）、`form-switcher`（新）、`dex-grid`（修改）、`pixel-typography`（修改）
- Affected code:
  - New:
    - src/state/selection.ts
    - src/components/SpeciesDetail.vue
    - src/components/FormSwitcher.vue
    - src/components/StatBars.vue
    - src/components/AbilityList.vue
  - Modified:
    - src/App.vue
    - src/App.css
    - src/components/DexGrid.vue
    - src/data/i18n.ts
    - src/data/dex.ts
    - scripts/check-styles.mjs
    - design/HANDOFF.md
    - README.md
  - Removed: （無）
- 不影響資料層產出：`src/data/dex.json` 與 `design/pipeline/` 都不動
- 外部依賴不變：不新增任何 npm 套件
