## Context

design/ 已有一份可重現的 CHAMPIONS DEX 設計稿：單檔 HTML（含內嵌 WOFF2 字型與資料）、完整資料集，以及 8 階段 pipeline。src/ 則仍是 Vue Lynx starter 的 flappy 範例，尚無任何 commit。

本切片的定位是**地基驗證**，不是功能交付。查證 Lynx 官方 CSS / 元素文件後，設計稿有三處寫法在 Lynx 不成立，且都屬於「一旦展開 208 張卡片才發現就得全部重做樣式」的類型：

- image-rendering 支援 pixelated，但文件明確寫「只作用於元素本身，不作用於子元素」，也不支援 inherit。設計稿是在 .card 上宣告一次由子孫繼承。
- 三個內嵌字型都是 WOFF2（檔頭 d09GMg 確認）。Lynx 的 font-face 在 Android 只支援 TTF / OTF / TTC；且 font-face 不支援 font-weight，設計稿以同一個 Silk 家族掛 400 / 700 兩筆的作法無法成立。
- box-shadow 文件明文列 inset 為不支援。卡片斜角、螢幕內框、MODERN 屬性鈕按下態三處都靠 inset。

另外 Lynx 元素清單沒有 canvas，設計稿的屬性字符、抖動 tile、sprite 佔位圖三者都由 canvas 產生。

專案的 lynx.config.ts 已開啟 enableCSSInlineVariables 與 enableCSSInheritance，模式 token 走 CSS 變數這條路不需要額外設定。

## Goals / Non-Goals

**Goals:**

- 資料層在 src/ 可用，且與 design/ 的產物同源、可偵測漂移
- POCKET 與 MODERN 兩組 token 可切換，卡片在兩個模式 × 兩個語系下都正確
- 屬性字符不靠 canvas 也能呈現，且在卡片表面與選中表面都可見
- 像素字型在 Lynx 註冊成功，名稱／標籤／數字維持像素字型分工
- 上述三個平台事實在 web 與 LynxExplorer 各實測一次，結果回寫 design/HANDOFF.md

**Non-Goals:**

- 208 張卡片的網格。需要 list 元素與回收行為，屬下一個切片
- 詳情面板、形態切換器、種族值條、招式表
- 篩選、排序、搜尋。本切片不建立 state.q / gens / types 這組篩選狀態
- 氛圍層的有序抖動。它依賴 canvas 產生 background-image tile，且 Lynx 的 background-image 也受 image-rendering 逐元素規則影響，留待網格切片一併處理
- Literata（Lit）襯線體。它只服務特性說明與 footer 長文，兩者都在詳情面板切片
- claude-design 設計系統沉澱（HANDOFF §10.B）
- 招式與學習表的存取器。資料集會完整帶入，但本切片不寫 moves / sec 的讀取邏輯

## Decisions

### 資料集由 pipeline 產生 src/data/dex.json，不手抄也不跨界匯入

design/pipeline/build.py 已從 dex3.json 產生 design/champions-dex.json（indent=1，392KB）。再讓它多寫一份 src/data/dex.json（compact separators，約 200KB）。

替代方案與否決理由：從 src/ 直接匯入 design/champions-dex.json —— 讓 src 依賴 design 目錄，且把 392KB 的縮排版本打進 bundle。手抄一份到 src/data/ —— 違反 HANDOFF「不要直接改產物」的原則，且無法偵測與上游資料的漂移。

src/data/dex.json 進版控，讓 src/ 不跑 pipeline 也能建置；並以「重跑 pipeline 後檔案位元相同」作為漂移偵測手段。

### JSON 邊界不啟用 resolveJsonModule，屬性責任收在資料層並以載入期斷言把關

200KB JSON 若交給 resolveJsonModule，TypeScript 會為它推導巨大的字面量屬性，屬性檢查時間不可接受。改以 *.json 的模組宣告回傳 unknown，由 src/data/dex.ts 斷言後匯出具名屬性。

屬性安全的實質保障不在 tsc 而在載入期斷言：種類數、形態條目數、Mega 數、地區形態數、招式數、特性數六項對上 HANDOFF「資料層的驗證不變式」的值。斷言失敗直接丟錯，不做靜默降級 —— 資料集是建置期產物，執行期對不上代表 pipeline 或版控出了問題。

### image-rendering: pixelated 逐元素宣告，並在驗證載具放大兩倍才看得出差異

Lynx 文件：pixelated 走 nearest-neighbour，適用於 image 元素與 view 的 background-image，且只作用於元素本身。因此每個要放大的 image 都必須自己帶這條宣告，不能靠容器繼承。

另一個要留意的點：PokeAPI sprite 原生就是 96×96，卡片也顯示 96px，是 1:1 —— **在卡片上根本看不出 pixelated 有沒有生效**。所以驗證載具必須額外放一張 192px（2 倍）的同一張圖，才能觀察最近鄰放大是否成立。這是本切片存在的主要理由之一，若在詳情面板切片才發現，整個放大策略要重做。

退路（實測不成立時）：詳情大圖改用原生 96px，或在 pipeline 預先產生 2 倍的 PNG。

### 像素字型改用 TTF 並拆成 Silk / SilkBold 兩個家族

Silkscreen 是 OFL，官方即提供 TTF，不需要在專案裡引入 woff2 轉檔工具。新增 design/pipeline/fetch_fonts.sh 抓取 TTF 到 src/assets/fonts/。

Lynx 的 font-face 不支援 font-weight，所以無法用一個家族名承載兩個粗細。Silkscreen Regular 註冊為 Silk，Bold 註冊為 SilkBold；設計稿裡 font-weight:700 的節點改為指定 SilkBold 家族。

src 用 base64 data URI 或打包後的資源路徑兩者 Lynx 都宣稱支援；優先用資源路徑（bundle 較小、可被快取），若實測不成立則退回 base64 —— 這是文件沒有明確保證的一點，列入實測項。

### 立體斜角改用巢狀 view 的分邊框線，取代不支援的 inset 陰影

設計稿的卡片斜角是兩道 inset 陰影：左上打 --panel（亮）、右下打 --surface2（暗），效果是「不多花一個顏色就得到立體感」。Lynx 不支援 inset。

改法：卡片外層 view 保留 1px --line 外框，內層再包一層 view，該層 border 1px、上／左邊框色為 --panel、下／右邊框色為 --surface2。分邊框色（border-top-color 等）是 Lynx 支援的屬性，且效果與原本的 inset 陰影在視覺上等價 —— 都是 1px 的亮暗對角。

POCKET 的四色階契約不受影響：兩個顏色都取自現有色階，沒有引入新顏色。

### 屬性字符改用 SVG 方塊網格，取代 canvas

Lynx 的 svg 元素接受 content 屬性（SVG XML 字串）或 src，並在背景執行緒解析、繪成單一 native view。文件沒有保證可以把 rect 當成 Vue 模板的子節點寫，所以 TypeGlyph 由程式組出 SVG 字串再餵給 content，而不是在模板裡展開 64 個 rect。

8×8 點陣以水平連續段合併成 rect，字串長度可控。viewBox 為 0 0 8 8，元素固定 16px —— 維持設計稿「字符固定 16px 不隨字級縮放」的決定，因為 8×8 只有整數倍才能在最近鄰放大下保持銳利。

填色沿用 glyphOn(type, bg) 的三種表面語意（surface / accent / typechip）。字符是繪製時就把顏色烘進去，不能繼承 currentColor —— 這個限制在 SVG content 字串下同樣成立，因為顏色是寫在字串裡的。以 (模式, 屬性, 表面) 為鍵記憶化字串。

### 模式 token 以根節點 inline CSS 變數注入

設計稿是把 token 寫到 documentElement.style。Lynx 沒有 documentElement，改為在 App.vue 最外層 view 綁 :style，值由 src/theme/modes.ts 依當前模式算出的 token map 來。lynx.config.ts 的 enableCSSInlineVariables 已開啟。

POCKET 的 token 由四階灰（tones）推導而來、MODERN 直接給定 token —— 這個不對稱沿用設計稿的 MODES 結構，不改成兩邊都寫死，因為 tones 同時也是未來抖動層與佔位圖的色源。

### 對比度決定墨色的判定原樣移植，不改成亮度門檻

inkOn 是比較 #101010 與 #ffffff 對「該背景」的實際 WCAG 對比值再取高者，不是拿亮度比固定門檻。HANDOFF 記錄岩石的 #AFA981 正好落在交界，固定門檻會判給白色（對比 2.33），而黑色其實是 9.0。relLum / contrast / inkOn 三個函式邏輯不動地搬到 src/theme/contrast.ts。

### sprite 載入失敗改用屬性字符替代圖塊

sprite 是唯一的外部依賴（raw.githubusercontent.com）。設計稿的 canvas 佔位圖無法移植，改為：載入失敗時顯示一個 --surface2 底、中央放 48px 屬性字符的 view。

Lynx 的 image 錯誤事件在原生層是 binderror，但 Vue Lynx 的綁定寫法文件未明載，列入實測項；若實測無法取得錯誤事件，本切片改以「預設先顯示替代圖塊、載入成功事件到達後才換成 sprite」的反向策略達成同樣的可觀察行為。

### 本切片以 App.vue 作為驗證載具，不建立網格

App.vue 改成一個縱向排列的驗證畫面：模式切換、語系切換、三到四張卡片（挑邊界案例）、一組 18 個屬性字符的色板、以及 96px 與 192px 並排的同一張 sprite。

挑選的卡片要能踩到卡片契約的邊界：一個雙屬性且有多形態與 MEGA 的（#3 妙蛙花）、一個名稱最長的（Crabominable / 赫拉克羅斯）、一個單屬性無形態的。

這個載具不是產品畫面，是本切片的驗收介面；網格切片會取代它。同時移除 starter 的 flappy 範例（useFlappy、lib/flappy 與三個 logo 素材），避免留下無人引用的死程式。

## Implementation Contract

**行為（完成後可觀察到什麼）**

啟動 app 後看到一個像素風驗證畫面。切換模式鈕會讓整個畫面在 POCKET（四階灰介面 + 全彩 sprite）與 MODERN（深色介面 + 屬性色）之間換色；切換語系鈕會讓卡片的主要名稱在中英之間互換，而另一個語言始終留在畫面上。卡片顯示編號、世代羅馬數字、MEGA 星號徽章、96px sprite、主／副名稱、形態標籤、屬性字符與縮寫、形態數徽章。18 個屬性字符在卡片表面與選中（accent）表面都清晰可見。並排的 96px / 192px sprite 呈現銳利的像素格而非模糊插值。

**介面與資料形狀**

- src/data/dex.ts 匯出 Dex / Species / Form / Move / Ability 屬性與 dex 實例。Species 欄位沿用資料集鍵名：d（全國編號）、m / mz（英／中種類名）、gz（中文分類）、g（世代）、f（形態陣列）、sec（學習表段落引用）。Form 欄位：l / lz（英／中形態名，基本形態為空字串）、k（base | other | regional | mega）、t（屬性陣列）、s（sprite 檔名）、st（六項種族值陣列）、ab（特性引用，第二元素存在表示隱藏特性）、si（學習表段落索引）
- src/data/dex.ts 匯出衍生存取器：bst(form)、bestBst(species)、allTypes(species)、hasMega(species)
- src/data/types.ts 匯出 TYPE_ORDER、TYPE_COLORS、TYPE_ZH、TYPE_ABBR、GLYPHS，鍵為 18 個英文屬性名
- src/data/i18n.ts 匯出 I18N（zh / en 兩組）與 t(key)，範圍限本切片畫面用到的鍵
- src/theme/contrast.ts 匯出 relLum(hex)、contrast(a, b)、inkOn(bgHex)
- src/theme/modes.ts 匯出 MODES 與 tokensOf(mode)，後者回傳 bg / shell / panel / surface / surface2 / ink / ink2 / line / accent / accentInk 十個鍵；另匯出 glyphOn(type, bg)，bg 為 surface | accent | typechip
- src/state/display.ts 匯出響應式的模式索引與語系，以及對應的 token map
- src/components/TypeGlyph.vue 接受 type 與 surface 兩個 prop，渲染 16px 見方的 svg
- src/components/SpeciesCard.vue 接受 species 與 formIndex 兩個 prop

**失敗模式**

- 資料集不合六項不變式：src/data/dex.ts 在載入期丟錯並印出「哪一項、期望值、實際值」。不靜默降級
- sprite 載入失敗：顯示屬性字符替代圖塊，不顯示破圖、不留空白。此路徑不視為錯誤，console 不報錯
- 未知屬性名：GLYPHS 與 TYPE_COLORS 皆回退到 Normal / ink，與設計稿一致
- 字型註冊失敗：文字會落到系統字型。這一項不可靜默通過 —— 驗收要求目視確認拉丁字是像素字型

**驗收條件**

- 執行 npm run build 成功，且 TypeScript 無錯誤
- 執行 npm run dev，在 web 環境確認：console 零錯誤、兩個模式 × 兩個語系四種組合的卡片無破版、192px sprite 為銳利像素格、拉丁字為像素字型
- 以 LynxExplorer 掃碼開啟同一份，逐項重跑上述 web 檢查表，並額外確認斜角在原生渲染下可見
- 18 個屬性字符 × 兩種表面 = 36 個組合逐一目視可見；卡片表面與 accent 表面各至少檢查一個深色與一個淺色屬性
- 三個平台事實的實測結果（成立／不成立／退路是否啟用）寫入 design/HANDOFF.md
- 重跑 design/pipeline 的資料產生步驟後 src/data/dex.json 位元不變

**範圍邊界**

在範圍內：src/data、src/theme、src/state、src/components 四個目錄的新增；App.vue 與 App.css 改寫為驗證載具；design/pipeline/build.py 增加一個輸出；新增字型抓取腳本；移除 flappy 範例；HANDOFF 回寫。

在範圍外：list 網格、scroll-view 面板、招式表、篩選排序搜尋、抖動氛圍層、Literata、canvas 佔位圖的等價複刻、任何形態切換互動。卡片的 formIndex 由載具以固定值傳入，不做切換。

## Risks / Trade-offs

- [Lynx 4.0 文件與本專案引擎版本不一致] → 專案用 vue-lynx 0.4.0 / rspeedy 0.13.5，查到的 CSS 文件掛在 4.0 路徑下。所有三項平台事實都以 LynxExplorer 實測為準，文件只作為預期值；實測與文件不符時記錄實際行為並啟用退路
- [image 錯誤事件在 Vue Lynx 的綁定寫法未經文件確認] → 已在決策中準備反向策略（預設替代圖塊、載入成功才換圖），兩條路都能達成同樣可觀察行為
- [字型以資源路徑而非 base64 註冊可能在原生失敗] → 退回 base64 data URI，文件明確列為支援；代價是 bundle 變大，本切片只需 Silk 兩個字重，影響有限
- [200KB 資料集全量打進 bundle 影響首屏] → 本切片刻意不切分，避免與 pipeline 產物分家。首屏影響在只有數張卡片的載具上不明顯，真正的判斷點在網格切片；屆時若需切分，以 moves 與 sec 兩個大欄位為切割線
- [驗證載具會被下一個切片丟掉] → 這是刻意的成本。它換到的是三個平台事實在只有一張卡片的成本下就被驗證，而不是在 208 張卡片的樣式都寫完之後
- [分邊框線的斜角與 inset 陰影不完全等價] → 巢狀 view 多了一層節點，且內層的 padding 需重新分配。若原生渲染下 1px 邊框有半像素問題，退路是斜角只做左上亮邊一道

## Open Questions

- LynxExplorer 的引擎版本是否已包含 image-rendering 支援？實測前無法確定，這正是本切片的第一項任務要回答的
- Vue Lynx 對 image 的 binderror 事件如何綁定？決策已備反向策略，但實測後應把正確寫法記入 HANDOFF
- Lynx 的 font-face 能否引用 Rspeedy 打包後的資源路徑，或只接受 base64？影響 bundle 大小，不影響行為
