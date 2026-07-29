## Context

第一個切片（`port-champions-dex-foundation`）落地了資料層、兩個模式的 token、型別字符與單張卡片；第二個（`port-champions-dex-grid`）把 208 張卡片放進 `<scroll-view>` 並在 iOS 實機驗過捲動。兩批都已 archive。

這一批是設計稿裡剩下最大的一塊。設計稿的實作在 `design/champions-dex.html` 的 `openDetail()`（約 100 行手動 DOM 建構）與 `statsSection()` / `abilitiesSection()`，樣式在同檔的 `/* ---------- detail ---------- */` 區段。

三個硬約束，全部來自 `design/HANDOFF.md` §12 的實測：

1. 平台不會自動捲動整頁，捲動是模板的結構決定（§12.12）
2. `box-shadow` 不支援 `inset`（§12.3），詳情面板有四處依賴它
3. 內嵌字型在 Android 只吃 TTF/OTF（§12.2），而設計稿的散文面 Literata 是 WOFF2 且尚未轉換

以及一個未驗事項：覆蓋層。整個移植到目前為止沒有任何脫離正常流的定位，`src/App.css` 全檔只有一處 `position: absolute`（卡片的圖像佔位），零處 `fixed`。

## Goals / Non-Goals

**Goals:**

- 點卡片能打開該形態的詳情，並在裡面切換形態
- 詳情呈現卡片放不下的資料：種族值、特性與說明、陣容與近似圖警語、四項屬性
- 在填滿內容之前先確認覆蓋層在 iOS 實機成立，讓平台風險與呈現工作量分開失敗
- 把因平台而偏離設計稿的每一處都留下理由，讓後人不會把它讀成偏好

**Non-Goals:**

- **招式表不在這批**。它自帶排序與本系篩選兩個狀態、六欄格線、105 列上限，等於第二個 `dex-query`；另開 `port-champions-dex-learnset`
- **Literata（散文面）不在這批**。這批用系統字型佔位，字型本身另案
- **Android 驗證不在這批**。手上沒有裝置，這條掛帳從第一批延續
- 不做鍵盤操作（設計稿的 Esc 與方向鍵切形態）—— 目標是觸控裝置
- 不做 Android 實體返回鍵的關閉路徑
- 不做 `aria-*` 對應物。平台沒有對應的無障礙屬性集，設計稿的 `role="dialog"` / `aria-modal` / `aria-pressed` 無處可去
- 不動資料層、不動 pipeline、不新增 npm 套件

## Decisions

### 覆蓋層是 Root 內的 absolute 兄弟節點，不用 position: fixed

面板與遮罩掛在 `Root` 的直接子層，與 `Shell` 同級，用 `position: absolute` 撐滿。`Root` 已經是最外層節點，所以「相對 Root 撐滿」在視覺上等於設計稿的 `fixed`，卻不依賴一個在這個專案裡零證據的屬性。

替代方案：(a) 直接用 `position: fixed` —— Lynx 文件沒有明確承諾，賭錯的代價是面板被 `Screen` 的 padding 框住，看起來像樣式沒生效；(b) 詳情整頁取代網格 —— 不需要任何定位，但那是資訊架構的改動（失去「詳情疊在圖鑑上」的語意，且回到網格要自己記捲動位置），保留為退路。

**版式是置中對話框，不是底部抽屜。** 第一版做成抽屜（理由是設計稿在 ≤520px 的媒體查詢也是抽屜），但實機上看起來與原稿完全不同 —— 原稿的預設樣貌是 620px 上限的置中對話框，抽屜只是它的窄螢幕變體。改用覆蓋層 `align-items: center` + `justify-content: center` 置中，面板 `width: 100%` 配 `max-width: 620px`；不重現設計稿的 `translate(-50%, -50%)`，那個位移只是因為 viewport-fixed 元素沒有可對齊的父節點。

**遮罩在兩個模式都壓暗網格，並為此在 `retro-theme` 開一個明列的例外。** 設計稿兩個模式都用 `rgba(0, 0, 0, .66)`。

這條決定改過兩次，過程本身值得記下來。最初做成不透明，理由是 `retro-theme` 要求「POCKET 渲染出來的每一個顏色都是四階灰的成員」而半透明疊色必然產生色盤外的中間色；接著改成只有 MODERN 半透明；最後在看到實機畫面後定為**兩個模式都半透明**。不透明的遮罩會讓面板不再讀成「疊在圖鑑上的東西」，而那正是它覆蓋而非取代網格的理由 —— 為了一條顏色數而放棄這個語意，代價付錯了邊。

因此 `retro-theme` 的那條要求改為明列**兩個**例外：sprite 圖像（既有）與詳情遮罩（新增）。措辭把例外限死在這一層 —— 遮罩的顏色是**疊出來的而不是挑出來的**，它畫的是一個色盤色階的減強度版本；其他任何表面用半透明都算違規，不算前例。

實作用 `opacity` 作用在 `var(--bg)` 上，而不是寫死 `rgba(0, 0, 0, .66)`：合成結果相同，但不必在樣式層或元件裡命名一個 theme 層不擁有的顏色。

### 整個面板只有一個捲動容器

面板本體是**一個** `<scroll-view>`，標題列在它外面（不捲動），內容區在它裡面。設計稿的 `.panel{overflow:auto}` 疊 `.mvwrap{max-height:400px;overflow:auto}` 是巢狀同向捲動，這批不重現它 —— 一是招式表本來就不在這批，二是 `dex-grid` spec 已經立下「不得有巢狀捲動容器」這條要求，理由是兩層會搶同一個手勢。

連帶取消面板標題列的 `position: sticky`：標題列改成放在捲動容器外的固定列，效果相同而不依賴 sticky。

**界線放在捲動容器自己身上（`height: 60vh`），不是向上要剩餘空間。** 第一版寫成「面板 `max-height: 88%` + 內容區 `flex: 1`」，實機直接壞掉：面板沒有確定高度，內容區沒有可解析的界線，於是它長到內容高度、什麼都不捲，標題列把整個可見區吃光。這正是 `App.css` 開頭那段註解記過的失敗模式（「a scrolling container whose ancestors are unbounded grows to fit its children and scrolls nothing at all」），網格靠 `Root height:100vh → Shell flex:1 → Screen flex:1` 這條每一節都確定的鏈才成立，而面板斷在第二節。

改成捲動容器自帶 `height: 60vh`（vh 在這個專案已證實可用，`.Root` 就用 `100vh`），面板則由內容決定高度、被它封頂。副作用是資料少的種類（Ditto）在捲動區下方會有空白，而不像設計稿那樣整個對話框縮短 —— 用 `max-height` 才能兩者兼得，但那要再賭一次同一個平台行為。**這是刻意的取捨，不是遺漏。**

### 面板用 v-if 掛載與卸載，不用 v-show

關閉時把整棵深樹從節點樹上移除，而不是留著隱藏。三個好處：§12 要求重新量的「更深節點樹」在關閉後不留成本；「開啟時捲動位置在頂端」不需要程式介入，因為新掛載本來就在頂端；`panelIn` 逐格動畫每次開啟都會重播，這正是設計稿的行為。

代價是每次開啟都重建節點。可接受 —— 面板一次只有一個，不是 208 個。

### 切換形態時捲動位置自然保持，不需要程式介入

設計稿的 `openDetail(sp, i, true)` 要自己存取 `scrollTop`，因為它把面板內容整個重建。Vue 的響應式更新只換掉變動的節點，捲動位置本來就留著，所以這批**不寫任何捲動位置的程式**。

這是移植比原稿簡單的一處，而不是遺漏 —— 記在這裡免得日後有人「補」上去。

### 選取狀態放在模組層級的 selection.ts，觸發綁在網格自己的儲格節點上

新增 `src/state/selection.ts`，沿用 `display.ts` 與 `query.ts` 的模組層級 ref 慣例。它擁有三件事：目前選取的種類、目前形態索引、以及索引的夾限（`0 ≤ i < species.f.length`）。關閉時兩者一起重設。

`@tap` 綁在 `DexGrid` 模板裡的 `DexCell` view 上，**不綁在 `<SpeciesCard>` 元件上**。§12.14 的結論是不要把 class 或 style 綁在元件上然後假設它落到根元素，事件同理；而且 `SpeciesCard` 的檔頭已經宣告它是純呈現元件，形態由呼叫者決定。

替代方案：把選取狀態放進 `query.ts` —— 混淆了兩件不同的事（查詢是集合層面的，選取是單一項目層面的），且 `query.ts` 的 `results` 是純衍生值，加入可變的選取狀態會讓它不再是。

### 詳情拆成四個元件

| 元件 | 職責 | 輸入 |
|---|---|---|
| `SpeciesDetail.vue` | 覆蓋層、遮罩、標題列、大圖與形態標題、屬性清單、警語，並組合下面三者 | `species`、`formIndex` |
| `FormSwitcher.vue` | 分組的形態鈕，發出 `select` 事件 | `species`、`formIndex` |
| `StatBars.vue` | 六列種族值與總和 | `stats`（六元組） |
| `AbilityList.vue` | 特性方塊，含隱藏標記與雙語說明 | `abilities`（特性槽陣列） |

拆的判準是**輸入形狀不同**：`StatBars` 只需要六個數字，`AbilityList` 只需要特性槽，兩者都不需要知道種類或形態的存在。`FormSwitcher` 需要整個 `species`（它要列出所有形態並與基本形態比對型別），所以它與另外兩者不同層級。

不再往下拆（例如把一列種族值再拆一個元件）—— 那一層沒有藏任何東西，會是純轉發。

### 字串表用具名存取器承接新形狀，t() 維持只回字串

`t()` 目前的簽章是 `(key: keyof Strings, lang: Lang) => string`，而詳情面板需要三種新形狀：六個種族值標籤（陣列）、四個形態類別標籤（字典）、以及「第 N 世代」「N 個形態」（帶參數）。

做法是 `Strings` 只收純字串鍵，其餘三種各給具名函式：`statLabels(lang)`、`kindLabel(kind, lang)`、`genOfLabel(gen, lang)`、`formsOfLabel(count, lang)`，另加 `abilityName(ability, lang)` 回既有的 `NamePair` 形狀（與 `speciesName` / `formLabel` 一致）。

替代方案：讓 `t()` 的回傳變成 `string | readonly string[]` —— 每個呼叫點都要型別斷言，`Strings` 介面提供的型別安全就沒了。

### 內凹陰影改為分邊框，格線佈局改為 flex 固定欄寬

`inset` 陰影四處（大圖舞台外框、特性方塊外框、種族值條的凹槽、招式表外框）改用第一批已經驗過的做法：外層 view 一道邊框，需要對角亮暗時內層再包一層並分邊指定顏色（`CardBevel` 的做法）。

設計稿的 `display: grid` 三處（`dl.kv` 的 `auto 1fr`、`.strow` 的 `62px 38px 1fr`、招式表的六欄）改為 flex：`App.css` 現況全是 flex，零處 grid，沒有必要在這批引進一個未驗的佈局模式。屬性清單改成每列一個 row-direction view，標籤固定寬、值 `flex: 1`。

種族值條的填充寬度用百分比（`min(value, 230) / 230`，下限 2%），沿用設計稿的 `STAT_MAX = 230`，不寫死像素 —— 面板寬度是相對的。

### 型別藥丸在 MODERN 填型別色，在 POCKET 只留邊框

沿用設計稿：`mode.typeColor` 為真時藥丸背景是 `typeColor(type)`、文字是 `inkOn(typeColor(type))`、字符表面是 `typechip`；為假時背景不上色、字符表面是 `surface`。`src/theme/modes.ts` 的 `typeColor` 旗標與 `GlyphSurface` 三種表面都已存在，這裡只是使用。

理由不是視覺偏好而是既有不變式：POCKET 的 UI 上色顏色數上限是四階灰，把型別色畫進 POCKET 會直接違反 `retro-theme` 的要求。

### 散文面暫用系統字型

特性說明與兩則警語是這個移植第一次出現的長文。設計稿用 Literata（`Lit`），而它是 WOFF2，Android 不吃（§12.2）；轉成 TTF 體積約兩倍，會直接反映在 bundle。

這批的決定：長文不指名 `Silk` / `SilkBold`，讓它落到系統字型；`pixel-typography` 的要求從「本切片不渲染長文」改成明確記載這個佔位與它造成的驗收缺口。理由是不讓一個字型體積的決定把平台驗證往後推。

### 觸控裝置沒有 hover，所以 title 提示整批移除，圖像預熱也移除

設計稿在四處用 `title`：型別藥丸的型別中文名、形態鈕的型別組合、招式的另一語言名、傷害類別全名。前兩者的資訊在藥丸與鈕的文字上本來就看得到（藥丸在中文模式顯示「草 Grass」），後兩者屬於招式表（批次 B）。所以這批直接不做 title 的替代物，不是延後。

設計稿的 `sp.f.forEach(f => { const i = new Image(); i.src = ... })` 預熱其他形態的圖像 —— 平台沒有 `Image` 建構子，移除。副作用是切換形態時大圖會有一次載入延遲；`SpeciesCard` 已經有的「佔位圖蓋在上面、載入成功才移除」機制同樣用在大圖上，所以延遲期間看到的是型別字符而不是空白。

### 樣式檢查新增一條「不得出現 inset 陰影」

`scripts/check-styles.mjs` 目前只有一條檢查（選中態規則的順序）。這批加第二條：任何 `box-shadow` 宣告含 `inset` 就失敗。

判準與該檔案既有的判準一致 —— 值得自動化的是不會自己叫出來的失敗。Lynx 遇到 `inset` 是靜默忽略整個宣告，畫面上少一道 1px 的內框，在截圖上幾乎看不出來，而它同時代表「有人照抄了設計稿的 CSS」這個更大的問題。

### 實作順序即風險順序：外殼先過裝置驗收，才填內容

`tasks.md` 的順序是刻意的：選取狀態 → 覆蓋層與標題列 → **iOS 實機驗收關卡** → 內容區塊。

理由是 `HANDOFF.md` §10.A 的規矩（「在有答案之前不要展開網格與詳情面板」）以及 §12 每一條平台事實的得法 —— 一次只拿掉一個變數。如果覆蓋層在實機上不成立，退路是「詳情整頁取代網格」，而那個退路影響的是面板外殼，不是裡面的種族值與特性。先填內容再驗覆蓋層，等於把要重做的東西先做完。

## Implementation Contract

**Behavior**

- 點網格上任一張卡片：詳情覆蓋在圖鑑之上，顯示該卡片當時所顯示的那個形態
- 點 ✕ 或點遮罩：詳情關閉，回到網格，網格的捲動位置與查詢狀態不變
- 詳情開啟時，標題列固定在頂端，內容區可捲到最後一個區塊
- 種類有多於一個形態時出現形態切換器；點另一個形態，大圖、形態標題、型別藥丸、屬性清單、種族值、特性全部換成該形態的，而**捲動位置不動**
- 形態鈕只在該形態的型別組合與基本形態不同時，才帶型別字符
- 形態不在當前陣容、或圖像是種類共用圖時，顯示對應警語
- 語言切換與模式切換在詳情開啟時同樣生效，不需要關閉重開

**Interface**

`src/state/selection.ts` 導出：

- `selected`：目前選取的種類，未選取時為 `null`
- `selectedFormIndex`：目前形態索引，未選取時為 `0`
- `openDetail(species, formIndex)`：設定選取，索引夾限到 `[0, species.f.length - 1]`
- `selectForm(index)`：換形態，同樣夾限；未選取時不做事
- `closeDetail()`：清空選取並把索引歸零

`src/data/i18n.ts` 新增：`statLabels(lang)` 回六個標籤、`kindLabel(kind, lang)`、`genOfLabel(gen, lang)`、`formsOfLabel(count, lang)`、`abilityName(ability, lang)` 回 `NamePair`。既有的 `t()` 簽章不變。

`src/data/dex.ts` 新增：`abilityOf(ref)` 從特性槽取出特性物件、`isHidden(ref)` 判斷該槽是否為隱藏特性。兩者都不改既有導出。

元件輸入：`SpeciesDetail` 收 `species` 與 `formIndex`；`FormSwitcher` 收 `species` 與 `formIndex` 並發出 `select`（帶新索引）；`StatBars` 收 `stats`；`AbilityList` 收 `abilities`。

**Failure modes**

- 大圖載入失敗：與卡片一致 —— 佔位（該形態第一型別的字符）從一開始就蓋在上面，圖像 `@load` 才移除。平台的 `@error` 在 native 不會觸發（§12.6），所以不依賴它
- 形態索引越界：夾限而非拋錯。呼叫端的索引來自查詢層的形態比對，越界代表資料與查詢不同步，此時顯示基本形態比讓面板消失好
- 特性缺中文名或缺說明：缺中文名時顯示英文名（`abilityName` 的既有 `NamePair` 規則），缺說明時整段不渲染而非留空框
- 語言為英文時，屬性清單的分類欄位（僅中文資料源有）不渲染

**Acceptance criteria**

- `pnpm run check` 通過，且新的 inset 檢查在故意加一條 `box-shadow: inset ...` 時會失敗（改回來後通過）
- 選中態的 class 命名沿用 `XOn` 慣例（例如形態鈕的 `FormChipOn`），讓既有的順序檢查蓋得到
- iOS 實機：覆蓋層滿版壓在網格上，標題列不隨內容捲動，最後一個區塊可達
- iOS 實機：從第一張卡開啟、關閉、再開啟另一隻，重複若干次後捲動仍流暢；把觀察結果補進 `design/HANDOFF.md` §12（§12 明文要求重新量而非沿用網格結論）
- 邊界案例逐一開啟確認不破版：Vivillon（20 形態，切換器分組要仍可讀）、Floette（無基本形態）、Mega 班基拉斯（種族值 700，條要不溢出）、變隱怪（形態少、資料最稀）
- 四種組合（兩模式 × 兩語系）都無破版、無水平溢出
- POCKET 下詳情面板實際上色的顏色仍在四階灰之內
- 型別字符在詳情藥丸與形態鈕兩個新表面上都可見（用對比計算驗證，不靠目視）

**Scope boundaries**

**In scope**：選取狀態、覆蓋層、標題列、大圖舞台、形態切換器、屬性清單、兩則警語、種族值列、特性列、字串表擴充、`abilityOf` / `isHidden` 兩個資料存取器、inset 樣式檢查、`HANDOFF.md` 與 `README.md` 的狀態更新。

**Out of scope**：招式表及其排序與本系篩選（批次 B）、Literata 內嵌、Android 驗證、鍵盤操作、Android 返回鍵、資料層與 pipeline、新的 npm 依賴。

## Risks / Trade-offs

- 覆蓋層在 iOS 實機上不成立（absolute 沒有撐滿，或被 `Screen` 框住）→ 驗收關卡排在填內容之前，退路是「詳情整頁取代網格」；該退路只動 `SpeciesDetail` 的外層與 `App.vue` 的組合方式，四個內容元件不受影響
- 加深的節點樹讓捲動變慢 → 面板一次只有一個且用 `v-if` 卸載，成本不累積；量測寫進驗收條件，不是等到有人抱怨
- 系統字型讓長文的視覺與設計稿差距明顯 → 這是明知的取捨，掛帳寫進 `pixel-typography` spec 與 `HANDOFF.md`，不是靜默偏離
- Vivillon 的 20 個形態鈕在窄螢幕上塞爆切換器 → 設計稿已經用分組（基本／形態／地區形態／MEGA）處理，分組標籤在窄螢幕上獨佔一列；列進邊界案例逐一目視
- 切換形態時大圖有載入延遲（預熱已移除）→ 佔位字符覆蓋期間有東西可看，且切換是使用者主動觸發的動作，短暫延遲可接受
- 面板開啟時網格仍在下方掛載 → 這是必要的（關閉要回到原捲動位置），代價是兩棵樹同時存在；遮罩是實體節點，會吃掉落在它上面的觸控
