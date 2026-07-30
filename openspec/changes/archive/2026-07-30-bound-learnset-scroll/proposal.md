## Why

詳情面板由內容決定高度，招式表 105 列全部展開在面板既有的捲動容器裡。艾路雷朵（#475）的面板因此極長，而要掃讀招式表得先捲過 192px 大圖、四項屬性、六列種族值與最多三個特性方塊 —— 招式表是面板裡最長也最需要來回比較的一段，卻是最難到達的一段。

設計稿用 `.mvwrap{max-height:400px;overflow:auto}` 解決這件事。移植時被 `species-detail` 的「面板內恰好一個捲動容器」需求排除，代價明白記在 `design/HANDOFF.md` §12.16（「資料多的物種面板很長 —— 面板由內容決定高度，長內容就是長內容」）。本變更推翻那條禁令：代價已經付了一批，判斷是它不值得。

## What Changes

- **BREAKING（對 spec）**：`species-detail` 的「面板恰好一個捲動容器」改為有界而非唯一 —— 面板自身一個，招式表一個，且招式表是唯一的例外
- 招式表取得自己的高度上限與垂直捲動容器
- 高度上限**不照抄設計稿的 400px 字面值**。面板的捲動區是固定 `height: 60vh`（手機約 420px），一個 400px 的內層會吃掉整個可見區，等於把面板變成只有招式表。上限改以相對於面板捲動區的比例表述，並以「表頭加可見列數」作為驗收條件
- 招式表的欄位表頭從流內第一列移到內層捲動容器**之外**。這是內層捲動同時帶來的機會與義務：不移出去，捲到第 50 列時六個欄位就沒有標籤了。做法沿用面板標題列 —— 放在捲動容器外面，不用 sticky
- 巢狀同向捲動的手勢仲裁列為**必須實機驗收**的項目並附明文退路。`<scroll-view>` 的屬性表沒有 `enable-nested-scroll`（那是 `<list>` 的屬性，預設 `true`、內層先捲），所以兩層垂直捲動誰吃手勢在本平台**未經實測**
- `openspec/specs/learnset-table/spec.md` 的 Purpose 目前是 archive 留下的 `TBD - created by archiving change ...`，本變更既然改這份 spec，一併補正

## Non-Goals

- **不動 `dex-grid` 的同名禁令。** 那條需求說的是網格的捲動容器不得嵌在另一個捲動容器內，而網格不在面板裡，兩者只是理由的措辭相同
- **不用 `<list>` 實作內層。** `<list>` 有 `enable-nested-scroll` 很吸引人，但 §12.13 已確立 vue-lynx 只實作尾端追加，而招式表有三種排序與本系篩選 —— 序列會變動，`<list>` 上不成立
- **不重新引入設計稿的 sticky 表頭。** 表頭移到捲動容器之外達到同樣結果，不必賭平台支不支援 sticky
- **不改招式表既有的欄寬、三種排序、本系篩選、單列截斷與星號行為。** 本變更只加一層捲動與一個高度上限
- **不改面板自身的 60vh 捲動區。** 那個高度有它自己的理由（§12.16：只有 `max-height` 時捲動容器沒有界線可解析）
- **Android 不在驗收範圍**，沿用專案當前決定

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `species-detail`: 捲動容器的需求從「恰好一個、任何後代都不得是捲動容器」改為「面板自身一個，加上招式表一個明列的例外」，並移除專門禁止招式表宣告高度上限與捲動區的 scenario
- `learnset-table`: 新增三條需求 —— 招式表自帶高度上限與垂直捲動容器、表頭固定於該容器之外、巢狀捲動的實機驗收與退路；並補正 archive 留下的 TBD Purpose

## Impact

- Affected specs: `species-detail`、`learnset-table`
- Affected code:
  - Modified:
    - src/components/LearnsetTable.vue
    - src/App.css
    - design/HANDOFF.md
    - ROADMAP.md
  - New: (none)
  - Removed: (none)
