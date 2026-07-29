## Why

第一個垂直切片把資料層、兩個色彩模式、型別字符與單張種類卡搬上了 Vue Lynx，但 App.vue 目前是驗證載具而不是產品畫面：它只渲染七張手挑的邊界案例卡，沒有網格、沒有捲動、沒有搜尋與篩選。208 種類的資料集已經在 bundle 裡，使用者卻只看得到其中七筆。

同時有兩筆帳掛在第一個切片上，兩筆都會被網格放大，所以要在展開之前結清：

- 型別字符的原生渲染從未被驗證過。macOS 桌面版 LynxExplorer 完全畫不出 SVG（HANDOFF §12.10），而真機掃碼實測尚未執行 —— 這代表 type-glyph 的五條需求目前沒有任何原生證據。字符會出現在網格的每一張卡與每一個篩選鈕上，錯的實作方式在 208 張卡上的修改成本遠高於現在。
- retro-theme 需求 2 的散文寫 POCKET 渲染顏色數「SHALL remain three」，但它自己的 scenario 允許到四、tasks 明寫「上限 4，非固定 3」、HANDOFF §12.7 也記載三是舊數字。網格切片是氛圍層抖動的落地位置，而抖動的作用正是引入額外色階，所以這條矛盾會直接誤導實作判斷。

## What Changes

**前置（結清第一個切片的未決事項，在動網格之前完成）**

- 在 iOS 實機以現有驗證載具重跑 HANDOFF §11 的驗收表，並重跑 §12.10 的四種字符寫法對照，判定 svg 元素的 content 屬性在 iOS 上是否可用；結論與實際採用的寫法回寫 design/HANDOFF.md。若 content 不成立，改用 image 元素指向 SVG 資產搭配 tint-color，改動範圍限於 TypeGlyph 元件與字符字串產生模組
- 修正 retro-theme 需求 2：POCKET 渲染的相異顏色數上限為四，不是固定三
- 填掉五份既有規格的 Purpose 佔位字串

**網格**

- 新增網格元件承載 208 張種類卡，卡片區有自己的捲動容器
- 建立整頁捲動結構 —— Lynx 不會像瀏覽器那樣自動捲動整頁（HANDOFF §12.12），任何超過一屏的內容必須自己包捲動容器
- 容器選 scroll-view 而非 list 元素：實作期讀 vue-lynx 原始碼發現 list 的框架綁定只實作尾端追加（插入忽略指定位置，回報給 native 的 remove 與 update action 恆為空），所以篩選與排序在它上面無法正確運作。0.5.1 行為相同，升級不是出路。理由與重新評估的觸發條件一併寫進交接文件
- 卡片階梯揭示：僅在首次載入時播放一次，動態全部使用 steps() 而非平滑 easing，延遲索引上限 26

**查詢**

- 新增查詢狀態模組，持有搜尋字串、型別篩選、世代篩選與排序方式，與既有的顯示狀態模組同一個模式（模組層級 refs，不透過 props 貫穿）
- 搜尋永遠跨語系比對，不隨主導語言改變比對範圍
- 排序鍵取species最強形態的種族值總和，重用資料層既有的衍生存取器；取基本形態會把所有 MEGA 埋在低數值下面
- 篩選命中時，卡片顯示的是命中該篩選的形態而非固定的基本形態 —— 否則篩「龍」會用火／飛行的圖回答，看起來像壞掉

## Capabilities

### New Capabilities

- `dex-grid`: 208 張種類卡的捲動容器與換行排版、整頁捲動結構、卡片身分的組成、首次載入的階梯揭示，以及網格在無命中結果時的呈現
- `dex-query`: 搜尋、型別／世代篩選與排序的共享狀態，跨語系比對規則，排序鍵的取值，以及每張卡在當前篩選下該顯示哪個形態的推導

### Modified Capabilities

- `retro-theme`: POCKET 渲染的相異顏色數上限由「固定三」更正為「不超過四」，與 scenario、tasks 及實測值一致
- `type-glyph`: 新增一條渲染策略的實測退路需求 —— 先採用 svg 元素的 content 屬性，若裝置實測不成立則退回 image 元素指向 SVG 資產搭配 tint-color，並把實測結果記錄到交接文件

## Impact

- Affected specs: `dex-grid`（新增）、`dex-query`（新增）、`retro-theme`（修改）、`type-glyph`（修改）
- Affected code:
  - New:
    - `src/components/DexGrid.vue`
    - `src/state/query.ts`
    - `src/assets/glyphs/`（僅在 iOS 實測判定 content 不成立時才建立，十八個單色 SVG）
  - Modified:
    - `src/App.vue`（驗證載具換成網格畫面；必須在 iOS 驗收完成之後才動）
    - `src/App.css`
    - `src/data/i18n.ts`（補上網格與查詢列的字串，來源是設計稿的 I18N 表）
    - `src/components/TypeGlyph.vue`（僅在退路啟用時）
    - `src/theme/glyphSvg.ts`（僅在退路啟用時）
    - `design/HANDOFF.md`
    - `openspec/specs/dex-data/spec.md`
    - `openspec/specs/pixel-typography/spec.md`
    - `openspec/specs/retro-theme/spec.md`
    - `openspec/specs/species-card/spec.md`
    - `openspec/specs/type-glyph/spec.md`
  - Removed: （無）
- Dependencies: 不新增任何 runtime 依賴，也不升級 vue-lynx（0.5.1 的 list 綁定行為與 0.4.0 相同，升級不解決問題）。scroll-view 是 Lynx 內建元素
- `species-card` 不需修改：卡片的輸入契約已經是 species 加 form index，篩選替換形態是由網格傳入不同的 index 達成，不是卡片自己的行為
