## Context

主題層目前有兩個模式：POCKET 從四階灰推導十個 token，MODERN 直接宣告十個 token 並允許花用型別色。
`src/state/display.ts` 以一個索引加取餘數輪替，`App.vue` 的 masthead 按鈕呼叫 `cycleMode()`。
`src/theme/modes.ts` 的 `glyphOn` 與 `glyphBackdrop` 決定型別字符的填色與它底下的背景，
`scripts/check-contrast.mjs` 以文字解析這個檔案並重新實作那兩個函式來量測每個組合的對比。

三項既有約束框住這次的設計：

- `retro-theme` spec 要求 POCKET 畫面上不得出現四階灰以外的顏色，只放行寶可夢圖像與詳細頁遮罩，
  並明文寫這個例外**不構成先例**。ROADMAP.md C 節同一條再記一次。
- ROADMAP.md C 節記著 `@media` 整個到不了本平台（建置期連內容一起丟掉），所以樣式不得出現任何 media query。
- `src/state/rowMetrics.ts` 的列距是實機量測值而非推導值；`scripts/check-row-heights.mjs`
  只斷言它與樣式表的保留高度一致，量不到實際繪製高度。

## Goals / Non-Goals

**Goals:**

- 第三個模式 `EMERALD` 與前兩個共用同一組十個 token 的契約，不新增第十一個 token。
- 亮底面板上每個型別字符都量得到 2.5 以上，且不放棄型別的顏色識別。
- 模式切換的控制項在選項變多之後仍然說出「有哪些」與「現在是哪一個」。
- 三個模式共用同一個選單控制項，POCKET 也不例外。

**Non-Goals:**

- 林蔭（深綠）版 EMERALD。已量測可行（只有毒系掉到 2.34），否決理由是 MODERN 已佔走深色，
  再一個深色主題切換時的差別小到不值得多一個模式。
- 單色字符（字符一律填 `ink`）。對比最高、改動最小，但等於做了一個彩色主題卻把型別的顏色收回去。
- 暗化型別色（把十八個型別色壓暗到能站在亮底上）。要在主題層新增第二套型別色表，
  `check-contrast.mjs` 與 spec 的 Example 表都要跟著長大，而且十八個顏色會一起掉進同一個暗調帶。
- 選單列的色塊預覽。見下方對應決策。
- MODERN 與 POCKET 的字符外觀不變。這次不重新開啟它們已量測過的排列。
- 鍵盤操作。裝置沒有鍵盤，ROADMAP.md C 節已記。

## Decisions

### EMERALD 的十個 token 從地圖取樣而不是自行調色

十個值：`bg #15301F`、`shell #266047`、`panel #E1CF95`、`surface #F0E7C6`、`surface2 #C2BE8E`、
`ink #15301F`、`ink2 #3D5A2F`、`line #15301F`、`accent #E37C31`、`accentInk #15301F`，`typeColor: true`。

`shell`（樹冠）、`panel`（走出來的沙土路）、`surface2`（路面陰影）、`accent`（寶可夢中心屋頂）
是地圖區塊的平均色原值；`bg`／`ink`／`line` 是樹冠壓暗、`surface` 是外牆提亮、`ink2` 是草綠壓暗。
取樣區塊、原始像素與量測值留在 design/theme-emerald-mock.html。

量到的文字對比：`ink` 在 `panel` 上 9.20、在 `surface` 上 11.50；`ink2` 在 `surface` 上 6.27；
`accentInk` 在 `accent` 上 4.88。與 POCKET／MODERN 同一個量級。

替代方案：自行調一組綠色系。否決理由不是美感而是可討論性 —— 取樣值有出處可以指，調出來的值只能爭論。

### 亮底的型別字符改用底板，而不是單色或暗化型別色

MODERN 讓字符直接填型別色，這依賴「型別色比面板亮」。亮底把這個關係翻過來，而且救不回來：
電系 `#FAC000` 的相對亮度已高到畫在純白上只有 1.67，而白是亮色面板的上限。這一版面板實測
10/18 個型別在 `surface` 上、13/18 在 `panel` 上、15/18 在 `surface2` 上低於 2.5。

改用底板：字符畫在一塊自己的型別色上，填色取 `inkOn(型別色)`。這是既有 `typechip` 那個排列
（型別色底、反相墨色字符）搬到中性面板上，所以量測值就是 spec 已記錄的 4.47（火）到 11.42（電），
不新增顏色、不新增底線、不新增第二套型別色表。

底板只套在 `surface`、`panel`、`surface2` 三個中性面；`typechip` 與 `accent` 已經自帶背景色，不變。
POCKET 不受影響 —— 它的字符仍然取灰階色階，四色契約不動。

### 底板由字符元件自己畫，呼叫端不動

九個呼叫點分佈在卡片、學習集表格、招式索引、招式詳情、學習者清單、形態切換與兩條篩選列。
底板若由呼叫端畫，這九處都要各自判斷模式，而「不得在元件樣式裡寫死顏色」的規則會逼每一處都去問主題層 ——
等於把同一個判斷抄九遍。

改為主題層回報、`TypeGlyph` 自己畫：新增 `glyphPaint(mode, type, surface)` 回傳 `{ fill, plate? }`
取代 `glyphOn`。一個函式同時回答填色與底板，兩者不可能各說各話；`glyphBackdrop` 在有底板時回報底板色，
量測才會對著字符真正坐著的那個背景 —— spec 已經明文警告過「只擴充填色會量到字符不在的背景」。

底板是 1 像素內距的外層 view，所以字符自身的 16 像素格線不動（點陣只能整數倍縮放）。
代價是佔位由 16 變 18 像素，見風險一節。

### 模式改以識別字選定，`cycleMode` 移除

`setMode(id: ModeId)` 取代 `cycleMode()`，`modeIndex` 與取餘數一併移除。`mode` 改為以識別字查表。
輪替在三個以上的選項下不成立：控制項不說出有幾個選項，回到上一個要按 N-1 次。

替代方案：留著 `cycleMode` 給選單以外的路徑用。否決 —— 沒有第二條路徑，留著就是一個沒人呼叫的匯出，
而這個專案已經被「沒人讀的 computed 與四條死樣式規則」咬過一次（ROADMAP.md C 節 masthead 計數那條）。

### 選單只有名稱，不附色塊預覽

每列附一排該主題的 token 色塊，可以在選之前就看到，但在 POCKET 上會讓螢幕出現四階灰以外的顏色，
而 spec 明文寫詳細頁遮罩那個例外不構成先例。要放就得為它寫第三個例外。

否決理由：選一下就整個畫面換色而且不重掛元件（`retro-theme` 已保證），預覽只有一次點擊的距離，
不值得為它動 POCKET 的契約。被否決的樣子留在 design/theme-emerald-mock.html 的開關裡。

### 選單畫在覆蓋層帶，位置由執行期量測決定

實作時量到兩件事，兩件都改了原本的打算。

**一：選單不能掛在 masthead 裡。** 掛在觸發鈕下面的選單會被查詢列畫在上面 —— 查詢列是 `.Screen`
裡比較後面的兄弟節點，而這個移植版的疊層一路只靠 document order，`src/App.css` 零處 z-index。
把它疊上去要引入 z-index，而那在本平台從未量測過（ROADMAP.md C 節的失敗形狀就是這種）。
所以選單改畫在 `.Root` 的覆蓋層帶，和詳細頁面板同一層 —— 那是本專案唯一量過的絕對定位。

**二：位置也不能取自量測 —— 但那是量完才知道的。** 原本的做法是取觸發鈕的執行期 rect（vue-lynx 的
ref 轉給 Lynx SelectorQuery 的 `fields`），因為觸發鈕的 x 在結果計數後面、而「208 / 208 種類」的
寬度隨數字與語言改變，y 又取決於樣式表沒宣告的行高。這也是其他平台的下拉做法：畫在最上層容器、
位置跟著 anchor 的量測跑。

**那條路已實作、實測、然後移除。** callback 在 web target 與 iOS 實機都不回來，兩邊都沒有任何錯誤
（§12.28）—— 所以「量到就校正位置」那段程式一次都沒跑過。留著它就是留一條沒人驗過的分支，
等平台哪天開始回應時才第一次執行；這比沒有更糟。移除，位置改用樣式表宣告的偏移（機身 9 + 螢幕 12），
讀起來是蓋在 masthead 上的面板。開選單因此不依賴任何量測。

替代方案一：z-index。視覺是原本想要的下拉，但押的是未量測行為，失敗時選單被查詢列吃掉一半，
且攔截層做不出來（排在選單後面會吃掉列的點擊）。已否決。
替代方案二：把位置寫成常數放在觸發鈕底下。已否決 —— 一篩選結果數字就變窄，鈕跟著左移，常數立刻錯。
三種排列的實測畫面與各自的代價留在 design/theme-menu-variants.html。

### 選單以再按一次關閉，攔截層完全透明

半透明遮罩會合成出四階灰以外的顏色，遮罩那個例外只給詳細頁。所以選單不得有遮罩。

關閉的主要機制是再按一次觸發按鈕，這條只依賴既有的 tap 綁定。額外加一層完全透明、
不宣告任何背景色的攔截層，讓點畫面別處也能關 —— 它畫不出任何顏色，所以不算半透明表面。
透明 view 收不收得到觸控在本平台尚未量測，所以它是加值而不是唯一依賴：量到收不到就只留「再按一次」。

### 開選單的箭頭畫成 8×8 點陣而不是字元

像素字型沒有 `▾` 這類字元，會掉回系統字型並破格 —— 與 `.CardFormCount` 不用方框字元同一條理由。
箭頭沿用 `buildGlyphSvg` 那條已在實機驗證過的 SVG 路徑，8×8 點陣、16 像素、整數倍。

### `check-contrast.mjs` 改讀所有模式

現在 `EXPECTED.modernTokens` 與 `tokens:\s*\{[^}]+}` 是非全域比對，只讀得到第一個 `tokens` 區塊。
加第三個模式時它會照樣印 ok，而新模式完全沒被量到 —— 正是這個專案最常見的失敗形狀。

改為解析所有模式（識別字、`tones` 或 `tokens`、`typeColor`）組出 `MODE_LIST`，並把重新實作的
`glyphPaint`／`glyphBackdrop` 與主題層的底板規則對齊。`EXPECTED` 改為斷言「解析到的宣告 token 的模式數」
與每個模式十個 token，這樣第四個模式漏掉時也會失敗。

## Implementation Contract

**行為（使用者看得到的）**

- masthead 原本顯示模式名稱的按鈕，右側多一個向下的箭頭，按下開啟選單。
- 選單列出三個模式的名稱，目前生效的那一列以 `accent` 底、`accentInk` 字呈現，其餘為 `surface` 底、`ink` 字。
- 選一列即切換配色：畫面上每個表面、框線與文字顏色改變，且沒有任何元件被重掛（捲動位置與展開狀態留著）。
- 選單以再按一次觸發按鈕關閉；選定任一列後也關閉。
- 在 `EMERALD` 下，卡片、學習集表格、招式索引、招式詳情、學習者清單與形態鈕上的型別字符，
  各自坐在一塊自己的型別色底板上；篩選列的型別晶片與選中狀態的外觀不變。
- POCKET 與 MODERN 的畫面除了模式按鈕多一個箭頭以外，外觀不變。

**介面**

- `src/theme/modes.ts`：`ModeId` 新增 `'EMERALD'`；`MODES` 新增第三個項目；
  `glyphPaint(mode, type, surface)` 回傳 `{ fill: string, plate?: string }` 並取代 `glyphOn`；
  `glyphBackdrop(mode, type, surface)` 在該組合有底板時回傳底板色。
- `src/state/display.ts`：匯出 `setMode(id: ModeId)`、`themeMenuOpen`、`openThemeMenu()`、
  `closeThemeMenu()`；移除 `cycleMode` 與 `modeIndex`。
- `src/components/ThemeMenu.vue`：不收 props，只畫觸發按鈕；掛在 masthead 列。
- `src/components/ThemeMenuList.vue`：不收 props，畫選單的列；由 `App.vue` 掛在覆蓋層帶，
  位置由 `.ThemeMenuPanel` 宣告。
- `src/components/TypeGlyph.vue`：對外的 props 不變（`type`／`surface`／`size`）；
  記憶化鍵仍是模式、型別與面的組合。

**失敗模式**

- 主題層對某個組合不回報底板時，字符就直接畫在該面上 —— 這是 POCKET 與 MODERN 的常態，不是錯誤。
- 透明攔截層若在實機上收不到觸控，選單仍可用觸發按鈕關閉；此時移除攔截層，不留無效宣告。
- 選單的位置不取自任何量測，所以沒有「量不到」這個失敗模式。位置是樣式表的字面值，
  蓋在 masthead 上；那是最終的樣子，不是退路。

**驗收條件**

- `pnpm run check` 通過，且 `check-contrast.mjs` 的輸出列出三個模式的組合（不是兩個），
  EMERALD 三個中性面的最低值等於底板排列的 4.47。
- `pnpm run typecheck`（`vue-tsc`）通過。
- `pnpm test` 通過，含新增的主題測試：`setMode` 對三個識別字各自生效、`MODES` 三個項目都解出十個
  token、底板排列在四個面各自量到 4.47–11.42、選單在有／沒有量測位置兩種情況都開得起來。
- 實機驗收（LynxExplorer 桌面版畫不出 SVG，必須用實體裝置）：
  三個模式各切一輪、選單開合各一次、EMERALD 下捲完整個卡片序列與一段學習集表格不出現空白列。
  **已完成（2026-08-13）**：選單開在 masthead 上（量測不回應，見 §12.28，量測路徑已移除），
  透明攔截層收得到觸控，卡片列距重量後仍為 201px，其餘各項通過。
- 卡片列距重量：底板讓 16 像素字符變 18 像素，`.DexCell` 的 201px 是實機量測值。
  重量後若變了，`src/state/rowMetrics.ts`、`src/App.css` 的保留高度與 `visible-range-window`
  spec 的 Example 表一起更新；沒變則在裝置驗收記錄裡寫明「重量後仍為 201px」。

**範圍邊界**

- 在範圍內：主題層的第三個模式與底板規則、模式狀態的選定方式、選單控制項、
  `check-contrast.mjs` 的多模式解析、上述 spec 的 delta。
- 在範圍外：MODERN／POCKET 的字符外觀、型別色表本身、語系切換、其他控制項的樣式、
  ROADMAP.md（沒有對應條目）、`design/champions-dex.html` 與 `design/pipeline/`（設計稿不追這個新模式）。

## Risks / Trade-offs

- **底板把字符佔位從 16 變成 18 像素，可能推動卡片列距** → `.MoveRow` 的 24px 保留高度扣掉 3px 上下內距
  剛好剩 18px，`.MoveIndexRow`（34px）與 `.LearnersRow`（53.84px）餘裕充足；
  `.DexCell` 的 201px 是實機量測值，必須重量而不是推算。上面的驗收條件把兩種結果都寫成動作。
- ~~**平台可能永遠不回報觸發鈕的位置**~~ → **已結清（§12.28）：兩個 target 都不回報。**
  量測那條路已移除，位置改用宣告的偏移。選單開在 masthead 上，這是最終的樣子而不是退路。
- **完全透明的 view 是否收得到觸控** → **已結清：web preview 與 iOS 實機都收得到**，
  且點擊不會穿透到底下的卡片。攔截層保留。
- **選中列的樣式規則可能被自己的基底規則取消** → `.ThemeMenuRowOn` 必須緊接在 `.ThemeMenuRow` 之後，
  兩者都是單一類別選擇器、後者勝出。`scripts/check-styles.mjs` 已經在斷言這件事，新規則照它的順序寫。
- **樣式不得使用任何 media query** → ROADMAP.md C 節記著 `@media` 整個到不了平台。
  選單寬度以內容與 `min-width` 決定，不做斷點。
- **三個模式讓「切換模式」的實機驗收成本變成 1.5 倍** → 接受。選單本身就是為了讓這個成本不隨主題數線性成長。
