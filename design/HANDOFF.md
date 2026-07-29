# CHAMPIONS DEX — 交接文件

> 寶可夢 Champions 圖鑑設計稿。像素風格、雙語、雙色彩模式。
> 最後更新：2026-07-29（第一個移植切片完成，見 §12）

---

## 1. 先講清楚：claude-design 裡沒有任何產出物

這件事最容易被誤解，所以放在最前面。

本次工作**完全沒有在 claude-design 建立任何東西**。`/design-login` 的授權有生效、工具可用，但只做了登入確認與清單查詢。所有產出都是本地檔案。

交接時的帳號盤點：

| 項目 | 狀態 |
|---|---|
| claude-design 一般專案 | **0 個** |
| 可寫的設計系統專案 | 2 個：`Athena Design System`（owner: jessie，預設）、`Athena Design System_2.0`（owner: Athena） |
| 可用的設計系統 | 7 個（含 Industry / Nocturne / Classical / Organic / Modernist 五個內建風格） |
| 本次建立 / 修改 | **無** |

**為什麼沒用它**：claude-design 的能力面是設計系統的雲端託管 —— 專案檔案讀寫、`render_preview` 預覽、`list_comments` 留言回饋、成員與分享，加上 `DesignSync` 同步本地元件庫。它**沒有任何程式碼轉換能力**，不能把 HTML 變成 Vue。本次需求是「做一份設計稿」，單檔 HTML 是更直接的載體。

**如果要開始用它**，見 §10。

---

## 2. 交付物

```
design/
  champions-dex.html    319K  單檔自足，雙擊即可開啟
  champions-dex.json    384K  完整資料集（208 種類 / 360 形態 / 496 招式 / 200 特性）
  pipeline/                   重建管線（見 §4）
  HANDOFF.md                  本文件
```

檔案含兩套內嵌字型（Silkscreen 8KB + Literata 62KB base64），這是 319K 的主要來源。

`champions-dex.html` 唯一的外部依賴是 sprite 圖庫（`raw.githubusercontent.com`）。字型、資料、樣式、程式全部內嵌，**零外部 CSS / JS / 字型請求**。連不到網路時會自動改用程式繪製的像素佔位圖。

---

## 3. 功能概要

- **208 張種類卡片**，每張可展開詳情面板
- **形態切換器**：基本 / 形態 / 地區形態 / MEGA 分組，共 360 個形態條目。點擊或左右方向鍵切換，圖像／屬性／種族值／特性／招式全部連動
- **種族值**：六項條圖 + 總和，最高項標記
- **特性**：中英名稱 + 說明 + 隱藏特性標記
- **可學會招式**：Champions 專屬學習表，可依名稱／威力／屬性排序，可篩選本系招式
- **兩種色彩模式**：`POCKET`（灰階 4 色介面 + 全彩 sprite）、`MODERN`（深色介面 + 18 個官方型別色）
- **中英雙語切換**：切換的是「哪個語言主導」，另一個永遠留在畫面上。搜尋永遠跨語系
- **逐格動態**：載入時卡片階梯揭示、面板開啟、sprite 切換，全部用 `steps()` 而非平滑 easing
- **字型配對**：名稱／標籤／數字用 Silkscreen 像素字型，句子用 Literata 襯線體
- **氛圍層**：外框周圍的有序抖動（ordered dither）暈影，密度往外緣遞增；卡片有 1px 立體斜角

---

## 4. 如何重建

```bash
cd design/pipeline
./run.sh          # 抓取來源 → 8 個階段 → 產出 ../champions-dex.html
```

耗時約 3–5 分鐘（含 208 頁 Bulbapedia 抓取與 355 個 sprite 路徑的 HTTP 驗證）。所有抓取都有磁碟快取，重跑很快；刪掉檔案即可強制重抓。

**已驗證**：管線曾從乾淨狀態重跑並與當時交付版本 md5 位元相同，證明可重現。
當前產物 md5：`02a5a268f4aaad672e186a5ebbd82090`（改動 template.html 後此值會變，屬正常）。

管線階段：

| # | 腳本 | 產出 |
|---|---|---|
| 0 | `fetch_sources.sh` | 陣容 wikitext、學習表頁面清單、13 個 PokeAPI CSV |
| 1 | `parse.py` | `champions.json` — 陣容表解析 |
| 2 | `resolve_forms.py` | `forms_resolved.json` — 每個形態的 sprite 候選路徑 |
| 3 | `verify_forms.py` | `forms_verified.json` — HTTP 驗證後挑出可用路徑 |
| 4 | `fetch_learnsets.py` | `learnsets/*.wiki` — 208 份學習表 |
| 5 | `aggregate.py` | `learn.json` — 共用招式表 + 各段學習表 |
| 6 | `zh_forms.py` | `zh_names.json` — 中文種類名 / 形態名 |
| 7 | `build_data3.py` | `dex3.json` — 合併種族值、特性、學習表 |
| 8 | `build.py` | `../champions-dex.html` — 內嵌字型與資料；同時寫出 `../champions-dex.json`（縮排版）與 `../../src/data/dex.json`（compact，Vue Lynx app 讀的那份） |
| — | `fetch_fonts.sh` | `../../src/assets/fonts/*.ttf` — 像素字型的 TTF（**不在 run.sh 流程內**，需要更新字型時才手動跑；見 §12.2） |

`template.html` 是 HTML 的**真正原始碼**（樣式 + 程式 + I18N 表）。要改設計就改它，然後跑 `python3 build.py`。不要直接改 `champions-dex.html`，那是產物。

`src/data/dex.json` 同樣是產物 —— 由 `build.py` 從 `dex3.json` 產生，與 `champions-dex.json` 同一份序列化來源，所以兩者不可能各自漂移。**不要手改它**；改完 pipeline 重跑即可，重跑後位元不變是一項檢查（見 §11）。

---

## 5. 資料來源：各自的權威範圍

這個切分是刻意的，不要混用。

| 資料 | 來源 | 理由 |
|---|---|---|
| 陣容、形態清單 | Bulbapedia《List of Pokémon in Pokémon Champions》原始 wikitext | 唯一有 Champions 陣容的來源 |
| **招式的威力／命中／PP** | Bulbapedia 各寶可夢的 `/Champions learnset` 頁（208 頁） | **Champions 自身數值**。本傳數值不同，不可代用 |
| 種族值、特性 | PokeAPI 原始 CSV | 以各形態的 PokeAPI **variety id** 對應 |
| 中文種類名、分類 | PokeAPI（`language_id=4` 為 zh-Hant） | 208/208 全覆蓋 |
| 中文形態名 | 三種來源，見 §7 | PokeAPI 只覆蓋 80/168 |
| sprite 圖像 | PokeAPI/sprites | 每個路徑都經 HTTP 實測 |
| 字型 | Silkscreen（OFL）+ Literata（OFL），皆已 base64 內嵌 | 像素字型負責名稱／標籤／數字，襯線體負責句子 |

**注意**：搜尋引擎摘要在這個主題上不可靠。開發過程中摘要曾聲稱「Gholdengo 不在陣容」，但原始 wikitext 顯示 #1000 是收錄的。**永遠回原始 wikitext。**

---

## 6. 資料層的驗證不變式

每個階段都有斷言。**在放寬任何一條之前先讀這節** —— 它們大多是為了偵測上游變動，不是為了通過測試。

| 不變式 | 目前值 | 若失敗代表 |
|---|---|---|
| 學習表分類成員數 | **208** | 遊戲更新了陣容 → 整份資料需重新檢視 |
| 可操作種類數 | **208** | 同上 |
| 形態條目數 | **360** | 新增／移除形態 |
| Mega 進化數 | **75** | 新增 Mega |
| 地區形態數 | **16** | |
| 招式機制衝突數 | **0** | 同一招式在不同頁有不同數值 → 解析錯誤或上游筆誤 |
| Mega 中文命名規則不符數 | **0**（對 41 個 PokeAPI 實例） | 命名慣例變了 → §7 的推導不可再信任 |
| 地區形態規則驗證 | 重現 PokeAPI 的阿羅拉／伽勒爾 | 同上 |
| 每個形態的種族值完整度 | 6/6 | PokeAPI 缺資料 |
| 每個形態都有 sprite | 168/168 | 圖庫改路徑 |

**已排除**：`#923 Pawmot` 存在於遊戲資料中但不可操作（只出現在選單的「對戰」圖示上），刻意排除。這是 Bulbapedia 自稱 208 而解析出 209 的差異來源。

---

## 7. 推導規則：不要天真地「修正」

中文形態名 PokeAPI 只給了 80/168。缺口用三種方式補，**每種都有驗證機制**：

**Mega（34 個）** — 規則是 `超級` + 種類中文名（+ 全角Ｘ/Ｙ）。腳本會先對 PokeAPI 已localise 的 41 個 Mega 全部重算比對，**零不符才允許使用**。妙蛙花頁面沒有 Mega 的 langtable，推導是唯一途徑。

**地區形態（11 個）** — PokeAPI 對洗翠／帕底亞形態一筆中文都沒有（實測 0 筆）。地區名從 Bulbapedia 地區頁面取得，套用 `<地區>的樣子` 規則 —— 而這條規則會先用阿羅拉與伽勒爾驗證，組合結果必須與 PokeAPI 實際值一致。

**性別形態（2 個）** — 沿用 PokeAPI 在貓鼬斬／火炎獅／愛管侍三個物種一致使用的 `雄性的樣子 / 雌性的樣子`。

**沒有任何名稱是憑記憶編的。** 若要新增譯名，請沿用同樣的模式：先找到可驗證的規則或來源，再寫進腳本。

### 兩個 tokenizer 的陷阱

`resolve_forms.py` 有兩套 tokenizer，**不要合併**：

- `toks()` 用於 Bulbapedia 標籤：去掉通用詞（`form`/`pattern`/`trim`/`flower`…）、套用同義詞（`hisuian`→`hisui`）
- `itoks()` 用於 PokeAPI 識別字：**原樣保留**

原因：`flower` 在「Red Flower」裡是噪音，但在 Alcremie 的 `vanilla-cream-flower-sweet`（花朵糖飾）裡是有意義的。曾經合併過，結果非預設形態因為 token 較少而擊敗了真正的預設形態。

### 學習表與形態的對應

同屬性的形態（貓鼬斬公母、鬃岩狼人三形態）在 Bulbapedia 的區段標頭完全相同，第 4 個參數是**引入世代**不是形態索引，所以只能靠**文件順序**對應。

這個推論用判別招式驗證過：鬃岩狼人 [0] 有急襲無雙倍奉還（白晝）、[1] 有雙倍奉還無急襲（黑夜）、[2] 兩者都有（黃昏）；貓鼬斬 [0] 有黑色目光（公限定）、[1] 有精神強念（母限定）。完全符合形態特徵。

Mega 沿用基本形態的學習表（`si` 回退到 0），但**本系加成隨形態重算** —— 噴火龍基本形態 19 個本系招式（火／飛行），Mega X 是 20 個（火／龍）。

---

## 8. 已知限制

| 限制 | 影響 | 現況處理 |
|---|---|---|
| PokeAPI 沒有 Polteageist Antique 與 Sinistcha Masterpiece 的獨立圖像 | 2 個形態顯示種類共用圖 | 面板明確標註「PokeAPI 未收錄此形態的獨立圖像」 |
| `Syrup Bomb`、`Matcha Gotcha` 沒有繁中名 | 2 個招式顯示英文 | 遞補英文 |
| 19 個特性沒有繁中說明 | 顯示英文說明 | 遞補英文（英文 200/200 全覆蓋） |
| 第六世代之後的 sprite 是渲染圖不是點陣圖 | 與一至五世代的 BW 手繪圖畫風不同 | 已在 footer 誠實說明。曾用 4 階量化吸收此落差，但依需求移除了 |
| `#1019 蜜集大蛇` 等新種類沒有分類名 | 中文模式副標少一段 | 留空 |
| 詳情面板的 hover 提示（型別名、另一語言的招式名） | 觸控裝置無 hover | 移植到 Lynx 時需改為點擊展開 |

---

## 9. 設計決策：為什麼這樣寫

這些都有非顯而易見的理由，改動前請先讀。

| 決策 | 理由 |
|---|---|
| 型別字符的填色**依所在背景**決定（`glyphOn(type, bg)`） | 字符是 canvas bitmap，顏色繪製時就烘進去了，**無法繼承 `currentColor`**。曾把字符與 MODERN 的型別鈕底色都設為型別色，導致字符完全隱形 |
| `inkOn()` **比較兩種墨色的實際對比值**，不用固定亮度門檻 | 岩石的 `#AFA981` 落在交界處，固定門檻判給白色（對比 2.33），黑色其實是 9.0。改後最差對比從 2.38 → 4.47 |
| 種族值最高項的 class 叫 `.peak` 而**不是** `.top` | `.top` 已屬於 masthead，其 `display:flex` + `border-bottom:3px` + `margin-bottom:9px` 會套到種族值列上，造成 28px vs 18px 的高度跳動 |
| 字型平滑規則綁在 `body.lang-en` 上 | 名稱欄的語言隨切換而變。關閉平滑讓拉丁像素字銳利，但 11px 中文關閉平滑會變粗糙。現在 CJK 在兩個語系下都不會被關閉平滑 |
| 型別字符固定 **16px**，不隨字級放大 | 8×8 點陣圖只有整數倍才能在最近鄰放大下保持銳利。18px 是 2.25 倍會讓像素格不均勻 |
| 種族值條基準用 **230**（實際最大值）而非 255 | 用理論上限會讓所有條擠在左三分之一，比較功能失效 |
| 網格排序取**最強形態**的種族值總和 | 取基本形態會把所有 Mega 埋在低數值下面 |
| 篩選時卡片會**替換顯示的形態** | 否則篩「龍」會用火／飛行的圖回答，看起來像壞掉 |
| 切換鈕的型別字符**只在該形態改變屬性時**出現 | Vivillon 20 種花紋全是蟲／飛行，逐個標上去是 40 個重複字符零資訊 |
| `font-size` 重映射用**單次 regex 遍歷** | 逐條字串替換會把剛產生的值再套一次（8→10 之後 10→12，原本的 8px 變成 12px） |
| 招式表只留一欄名稱 | 90 列 × 兩種語言太吵。另一語言移到 hover |
| 所有動態用 **`steps()`** 而非 easing | 該年代掌機沒有補間，畫面逐格推進；平滑 easing 會讀成錯的年代。hover 刻意保持瞬間切換 |
| 卡片階梯揭示只在**載入時**跑一次，index 上限 26 | 每次篩選都重播會讓操作感覺變慢；208 × 14ms 會讓最後一張等 3 秒 |
| 字型分工依**種類**而非尺寸 | 名稱／標籤／數字用 Silkscreen，句子用 Literata。像素字型讀長段落會累 —— frontend-design skill 明確要求 display / body 配對 |
| 窄螢幕面板改用 `sheetIn` 動畫 | 桌機版有 `translate(-50%,-50%)` 置中位移必須保留，底部抽屜沒有，所以改為上升 |
| 氛圍用**有序抖動**而非漸層或雜訊 | 抖動就是這款硬體假造漸層與陰影的方式，用它等於用年代自己的語彙做深度 |
| 抖動層**只在裝置外框之外**（`body::before`，`z-index:0`，外框 `z-index:1`） | 先前的 LCD 網格是蓋在畫面內容上，把每張 sprite 都弄髒了 —— 這是那次被移除的真正原因 |
| 抖動 tile 用 **canvas 生成**而非 CSS 漸層棋盤 | CSS 漸層在非整數裝置像素上會反鋸齒糊掉；canvas 保證點落在精確像素，且顏色只取自當前模式色盤 |
| 卡片斜角用**現有色階**（`--panel` / `--surface2`）做 inset | 不額外花一個顏色就得到立體感，POCKET 的 4 色階契約不被破壞 |

---

## 10. 下一步

### A. 移植到 Vue Lynx（`src/`）

這是**移植不是轉檔**。查過 `vue.lynxjs.org/llms.txt`（AGENTS.md 指定），兩個有出處的硬限制：

> 「Lynx does not scroll arbitrary nodes the way the Web does」—— 捲動是模板的結構決定，不是 CSS 屬性

元素清單裡**沒有 canvas**（但有 `<svg>`、`<input>`、`<textarea>`）。

**可直接搬**（最貴的部分已完成）：`champions-dex.json`、I18N 字串表、POCKET/MODERN token 組（`lynx.config.ts` 已開 `enableCSSInlineVariables`）、TYPE_COLORS、型別縮寫、8×8 字符點陣、篩選／排序／本系判定邏輯。HTML 的 302KB 裡：資料 179KB + 內嵌字型 69KB + **程式與樣式僅 53KB**。要重寫的只有最後那一塊。

**必須改寫**：

| 現況 | Lynx 做法 |
|---|---|
| `div`/`span`/`img`/`button` | `view`/`text`/`image`，文字必須包在 `<text>` 內 |
| 208 張卡片的 `overflow:auto` | ~~`<list>`~~ → **`<scroll-view>`**。原本的判斷是 `<list>`（遠超三個螢幕，`scroll-view` 不回收），但 `<list>` 在 vue-lynx 只支援尾端追加，篩選與排序在它上面無法正確運作 —— **見 §12.13** |
| 招式表（最多 105 列） | 同樣受 §12.13 影響。招式表有排序與本系篩選，所以也不能用 `<list>` |
| 詳情面板捲動 | `<scroll-view>` |
| canvas 產生型別字符 | 改用 `<svg>` 畫 8×8 方塊，或建置期預先產生 |
| `.mvrow.stab .mn::after` 的 ★ | 真的 `<text>` 節點 |
| `title` 提示 | 移除或改點擊展開 |
| DOM 手動建構 | Vue 模板（最大宗但最機械） |

**要最先驗證的一件事**：`image-rendering: pixelated` 在 Lynx 的 `<image>` 上是否支援 —— 這件事**已經查到並實測**，結論見 §12。整個像素風格建立在最近鄰放大上；若不支援，192px 詳情大圖會變成模糊插值。退路是詳情圖也用原生 96px，或建置期預先放大成 PNG。

**建議切法**：先做垂直切片 —— (1) 資料層落地 `src/data/` (2) `<TypeGlyph>` SVG 版 + 一張卡片，在 web 與 LynxExplorer 各跑一次順便驗 pixelated (3) 確認後才展開網格與面板。

**第一個切片已完成**（openspec change `port-champions-dex-foundation`，已 archive）：資料層、兩個模式的 token、對比墨色判定、`<TypeGlyph>` SVG 版、單張卡片、像素字型註冊。過程中查證與實測出的平台事實在 §12，**展開網格與面板之前請先讀那一節** —— 其中好幾件事與本文件原本的假設不同。

#### ⚠️ 下一階段開工前必須先確認的兩件事

兩項都**只能在 iOS Simulator 或 Android 上驗**，macOS 桌面版答不了。在有答案之前不要展開網格與詳情面板，因為兩者都會放大錯誤的成本。

| # | 要確認什麼 | 狀態 | 怎麼驗 | 若失敗要怎麼做 |
|---|---|---|---|---|
| 1 | `<svg content="…">` 在 iOS / Android 畫不畫得出來 | **✅ iOS 已結清（2026-07-29）**：正常渲染，36 格全部畫得出來，兩個模式都確認。`TypeGlyph` 不動，退路不啟用。見 §12.10。**Android 仍未驗** | 跑載具，看「型別字符」色板 36 格有沒有東西 | 改用 `<image src>` 指向 SVG **檔案**，配 `<image>` 的 `tint-color` 依 `glyphOn()` 上色 —— 18 個單色 SVG 就夠。**data URI 是死路** |
| 2 | 像素字型在 **Android** 載不載得起來 | 仍掛帳 —— 手上沒有 Android 裝置。影響範圍限於樣式表的字型註冊規則，且失敗模式明顯可見（拉丁文字落回系統字型），不會靜默通過 | 在 Android 上看拉丁名稱是不是像素字（不是系統字） | 檢查 `output.dataUriLimit` 是否生效、或改用 `local()` 註冊 |

**iOS 實機已結清的項目（2026-07-29）**：型別字符的 `<svg content>`（§12.10）、`image-rendering: pixelated`（§12.1）、`<image>` 的 `@load` 事件（§12.6）。**Android 完全未驗** —— 字型註冊與字符渲染在該平台都還沒有證據。

已經在 native 定案、不需要重驗的：像素字型（macOS）、PNG sprite、`image-rendering: pixelated`（量化驗證，§12.1）、卡片斜角、`@load`/`@error` 事件差異（§12.6）、資產 URL（§12.8）。

### B. 如果要用 claude-design

它不做轉檔，但適合把這份設計稿**沉澱成設計系統**：色彩 token（兩組模式）、18 個型別字符、元件清單（卡片／面板／形態切換器／種族值條／招式表）。

具體第一步：
1. `mcp__claude-design__create_project` 建立新專案，或推進既有的 `Athena Design System_2.0`
2. `get_claude_design_prompt` 載入該設計系統的規範
3. `finalize_plan` 鎖定要寫入的路徑（會顯示結構化清單供人工核准）
4. `write_files` 上傳，`render_preview` 產生預覽卡
5. `list_comments` 收團隊回饋

`DesignSync` 適合日後把 `src/components/` 的元件庫逐個同步上去，**不要整批覆蓋**。

---

## 11. 驗證方式（沿用）

改動後請至少確認：

- `console` 零錯誤（Chrome DevTools）
- 兩個語系 × 兩個模式的網格與詳情面板都無破版
- 桌機（≥1400px）與窄螢幕（500px）**零水平溢出**
- 最長名稱不被截斷（中文「赫拉克羅斯」、英文「Crabominable」）
- 邊界案例：變隱怪（1 招 / 288）、艾路雷朵（105 招）、Vivillon（20 形態）、Floette（無基本形態）、Mega 班基拉斯（700）
- 型別字符在**所有五種表面**都可見：篩選鈕、卡片型別、形態切換鈕、詳情藥丸、招式列
- 動態全為 `steps()`（cardIn steps(2) / panelIn steps(3) / veilIn steps(2) / swap steps(2)），且 `prefers-reduced-motion: reduce` 會全部關閉
- 階梯延遲有上限（index 26 與 100 都應是 0.364s），`booting` 移除後回到 `animation:none`
- 字型分工未跑偏：卡片名稱／面板標題／特性名／招式名四處應仍是 `Silk`，特性說明與 footer 長文應為 `Lit`（中文自然穿透到 PingFang）
- 抖動 tile 為 4×4、單一顏色、密度 2/16 與 8/16，且該顏色必須已在當前模式色盤內
- **POCKET 的 UI 顏色數仍為 3** —— 加氛圍層後若變成 4 以上，代表抖動引入了色盤外的顏色
- 氛圍層 `pointer-events:none`、`z-index` 低於外框，內容區不被覆蓋

字符可見性建議用程式驗證而非目視 —— 把填色與所在表面的有效背景算 WCAG 對比。

### 移植後新增的檢查項（第一個切片）

- 資料層六項不變式在載入期斷言，違反時丟錯而非靜默降級（208 種類 / 360 形態 / 75 Mega / 16 地區形態 / 496 招式 / 200 特性）
- 重跑 pipeline 後 `src/data/dex.json` 位元不變（與 `design/champions-dex.json` 同源）
- **POCKET 所有實際上色的顏色都落在四階灰之內（上限 4，不是固定 3）** —— 超出代表引入了色盤外的顏色
- 字符對比實測值（本切片重算）：POCKET surface / accent 皆 15.86；MODERN surface **2.95（毒）～9.71（電）**；MODERN accent 15.97；型別鈕 4.47（火）～11.42（電）。下限 2.9
  - 註：本文件原記的「MODERN 4.89–11.42」對應的是**型別鈕**表面，不是卡片表面。MODERN 把型別色畫在卡片表面時，毒／龍／幽靈／惡四個型別的對比在 3.5 以下 —— 這是「MODERN 就是要花顏色」的刻意取捨，不是缺陷
- `image-rendering` 宣告必須寫在每個 `image` 元素本身（不繼承，見 §12.1）
- 樣式中不得出現 `inset` 陰影（Lynx 不支援，見 §12.3）
- 卡片高度在「有／無形態標籤」「有／無副名稱」「sprite 成功／失敗」三組情況下都相同
- 1400px 與 500px 兩個寬度零水平溢出；四種（模式 × 語系）組合都無破版

---

## 12. Lynx 平台事實（第一個切片實測）

本節記錄移植第一個垂直切片時，**查證文件 + 在 web 目標實測**得到的平台行為。每一項都標了驗證程度：`文件` = 有官方文件、`web 實測` = 在 `npm run dev` 的 web 目標量到、`待裝置` = 仍需在 LynxExplorer 確認。

**未完成**：LynxExplorer 真機實測尚未執行（需要實機掃碼）。下面凡標「待裝置」者，都還沒有真機證據。

### 12.1 `image-rendering: pixelated` —— 支援，但**不繼承**

| | |
|---|---|
| 狀態 | `文件` + `web 實測` 成立 |
| 文件 | Lynx CSS 有 `image-rendering`，值為 `auto \| crisp-edges \| pixelated`；`crisp-edges` 目前不支援。適用於 `image` 元素與 view 的 `background-image` |
| 關鍵限制 | 文件明寫「**只作用於元素本身，不作用於子元素**」，也不支援 `inherit` / `unset` |
| 對設計稿的影響 | 設計稿在 `.card` 上宣告一次讓子孫繼承，**這個寫法在 Lynx 無效**。每個要放大的 `image` 都必須自己帶宣告 |
| web 實測 | 有宣告的 192px 圖呈現銳利方格；同一張圖不帶宣告（對照組）呈現平滑插值。兩者並排在載具的「放大檢查」區塊 |
| **native 實測（macOS，量化）** | **成立**。對截圖三個區域數不同顏色數：原生 96px = **15 色**；192px 有宣告 = **15 色**（與來源完全相同 → 純最近鄰，沒有產生任何中間色）；192px 無宣告 = **3104 色**（雙線性插值造出 200 倍的中間色）。這比目視可靠，建議 iOS/Android 沿用同一招驗收 |
| **iOS 實機實測（2026-07-29）** | **成立**。192px 有宣告呈現銳利方格，同一張圖無宣告呈現模糊插值，兩者並排目視差異明顯。與 macOS 的量化結論一致，`pixelated` 在 iOS 上生效，不需要啟用退路 |
| 另一個陷阱 | 卡片的 sprite 是 96px 原圖顯示 96px，**1:1 下最近鄰與雙線性看起來完全一樣**。只有整數倍放大看得出差別 —— 所以載具刻意放了 96/192/192(無宣告) 三張對照 |
| 退路（未啟用） | 詳情大圖改用原生 96px，或 pipeline 預先產生 2 倍 PNG |

### 12.2 內嵌字型是 WOFF2 —— Android 不吃

| | |
|---|---|
| 狀態 | `文件` 確立；`web 實測` 見 12.5 |
| 文件 | Lynx `@font-face` 支援 `url()`（含 base64）與 `local()`。格式：**Android 只支援 TTF / OTF / TTC**；iOS 才支援 WOFF / WOFF2（iOS 10+） |
| 第二個限制 | Lynx 的 `@font-face` **不支援 `font-style` / `font-weight` / `font-variant` 描述子** |
| 對設計稿的影響 | 設計稿三個內嵌字型都是 WOFF2（檔頭 `d09GMg` 已確認），且用同一個 `Silk` 家族掛 400 / 700 兩筆 —— **兩點都不成立** |
| 已採行 | `design/pipeline/fetch_fonts.sh` 抓 Silkscreen 官方 TTF 到 `src/assets/fonts/`（已進版控）；Regular 註冊為 `Silk`、Bold 註冊為 `SilkBold` 兩個獨立家族名，需要粗體的樣式直接指名 `SilkBold` |
| 尚未處理 | Literata（`Lit`）也是 WOFF2，詳情面板切片要一併換成 TTF/OTF。注意 Literata TTF 比 WOFF2 大約兩倍，會直接反映在 bundle |

### 12.3 `box-shadow` 不支援 `inset`

| | |
|---|---|
| 狀態 | `文件` 確立；`web 實測` 斜角可見 |
| 文件 | Lynx `box-shadow`「Temporarily not support values like inherit、initial、revert、unset、**inset**」 |
| 對設計稿的影響 | 三處依賴 inset：卡片 1px 立體斜角、`.screen` 內框、MODERN 型別鈕按下態。**全部要改寫** |
| 已採行（卡片斜角） | 外層 view 保留 1px `--line` 外框，內層再包一層 view：`border-top-color` / `border-left-color` 取 `--panel`，`border-bottom-color` / `border-right-color` 取 `--surface2`。分邊框色是支援的，視覺上與原本的 inset 對角亮暗等價 |
| 副作用 | 卡片多一層節點；內層負責 padding |
| 尚未處理 | `.screen` 內框與 MODERN 型別鈕按下態（都在後續切片） |

### 12.4 `<svg>` 吃的是 `content` 字串，不是子節點

| | |
|---|---|
| 狀態 | `文件` + `web 實測` 成立 |
| 文件 | Lynx `<svg>` 接受 `content`（SVG XML 字串）或 `src`，在背景執行緒解析並繪成**單一 native view**。支援 17 個 SVG 標籤（含 `rect`）與 40 多個屬性 |
| 實作 | `TypeGlyph` 由程式組出 SVG 字串餵給 `content`，**不在 Vue 模板裡展開 `rect` 子節點**。每列連續填滿的像素合併成一個 `rect`（最多的字符 18 個 rect，未合併會是 64 個） |
| web 實測 | 18 字符 × 2 表面 = 36 格全部渲染，每格實測 16×16 |
| 注意 | 填色是寫在字串裡的，**無法繼承 `currentColor`** —— 與設計稿的 canvas 版限制相同，仍必須依所在表面決定填色 |

### 12.5 web 目標的 `@font-face` 是惰性的（只影響預覽，不影響真機）

| | |
|---|---|
| 狀態 | `web 實測`；native 行為 `待裝置` |
| 現象 | Lynx web 目標把元件 CSS 注入 `lynx-view` 的 **shadow root**，而 shadow tree 內的 `@font-face` 依規範不生效。實測：`document.fonts` 為空，shadow root 內文字寬度與 `sans-serif` 完全相同（22px 下 186.45） |
| 交叉驗證 | 同樣兩條規則放進 **document** 就會載入，而且**會作用到 shadow root 內部**（Silk 206.25 / SilkBold 239.25 vs sans 186.45）。所以問題是**作用範圍，不是資產路徑或 base64** |
| 已排除的假線索（**僅限 web 這一項**） | 從 `localhost` 開預覽時 `src` 是 `webpack:///static/font/…`；改從 LAN IP 開就是正常絕對 URL 且 HTTP 200。**但兩種情況 web 都一樣沒載入** —— 對 web 而言 URL scheme 是無關變數，唯一原因是 shadow root 作用範圍。⚠️ 但**對 lynx／native 而言 URL scheme 才是關鍵**，見 §12.8 |
| 為什麼不能用 shim 修 | app 程式碼不在瀏覽器環境執行（rsbuild 自己會印 "Running in non-browser environment"），拿不到 `document`。改走 `runOnMainThread` 的 main thread function 也一樣拿不到 —— 兩個執行緒都不在 browser context |
| **web 預覽要看像素字型的做法** | 在 devtools 把同樣兩條 `@font-face` 注入 host document：`/static/font/Silkscreen-Regular.*.ttf` 與 `-Bold.*.ttf`（雜湊檔名見 `dist/static/font/`）。這會驗到「TTF 有效 + 樣式選對家族 + 像素字型下的版面／換行」，但**驗不到 Lynx 自己的 font-face 管線**——那只有真機能驗 |
| 真機預期 | native 沒有 shadow DOM，走引擎自己的字型註冊，`App.css` 的兩條規則應該直接生效。`待裝置` |

### 12.6 `<image>` 的錯誤事件在 Vue Lynx 綁 `@error`

| | |
|---|---|
| 狀態 | 三個目標**行為不同**，三邊都已實測 |
| web | `@error` **會觸發**、`@load` 會觸發 |
| **native（macOS 桌面版）** | `@error` **不會觸發** —— 同一個 404 只是靜靜留下空白框。`@load` **會觸發** |
| **native（iOS 實機，2026-07-29）** | `@error` **會觸發**、`@load` 也會觸發。**與 macOS 相反** |
| 結論 | **`@load` 是三個目標的交集，`@error` 不是。** 所以反向策略不是為某一個 build 的權宜，而是唯一在三處都成立的機制 —— 這個結論在拿到 iOS 證據之後比原本更強，不是更弱 |
| 反向策略（已採行） | 不靠失敗事件，靠成功事件：替代圖塊**一開始就蓋在圖上**，`@load` 到達才移除。三個目標達到同樣的可觀察狀態，而且慢速載入時看到的是型別字符而不是空框 |
| 不要做的事 | **不要因為 iOS 會觸發 `@error` 就改回失敗驅動。** 那會在 macOS 桌面版上靜默失效，而那是目前唯一能讀原生診斷日誌的環境 |
| 實作細節 | `<image>` 必須**始終掛在樹上**才會發出請求，所以替代圖塊是 `position: absolute` 疊在上面、載入後移除，不是用 `v-if` 互換 |
| 教訓 | **不要用 web 的事件行為推論 native。** 這一項如果只驗 web 就會做出在真機上永遠不會生效的錯誤處理 |

### 12.7 其他實作層面的坑（都已踩過）

| 坑 | 說明 |
|---|---|
| CSS 變數名會被 hyphenate | `:style` 綁 `--accentInk` 會以 `--accent-ink` 落到元素上，CSS 裡寫 `var(--accentInk)` 會靜默解析不到（症狀：accent 底上的文字變同色隱形）。**token 一律用 kebab-case** |
| `moduleResolution: "Bundler"` 會隱含開啟 `resolveJsonModule` | 195KB 的 dex.json 被推導出字面量型別，型別檢查會爆。`src/tsconfig.json` 已明確設 `"resolveJsonModule": false`，改由 `*.json` 的 `unknown` 宣告 + `src/data/dex.ts` 一處收斂 |
| `src/tsconfig.json` 原本沒設 `target` | 預設落到 ES5 lib，`includes` / `flatMap` / `Object.entries` 全部不存在。已設 `"target": "ES2019"`（貼近 Lynx 引擎，不是隨手挑最新） |
| POCKET 的「介面顏色數 3」是舊數字 | 實測靜止狀態是 **4** —— 卡片斜角的 `--surface2` 邊在靜止時就會上色。§11 的檢查項已改為「所有上色顏色都落在四階灰之內，上限 4」，這才是真正的不變式（防的是引入色盤外的顏色） |
| console 有兩筆非本專案的錯誤 | `NYI: profileStart` / `NYI: profileEnd`，訊息自己標明 "This is an issue of lynx-core"。web 預覽的環境噪音，不是 app 的錯誤 |
| `<input>` 的輸入事件把值放在 `e.value`，**不是** `e.detail.value` | 官方文件寫明 `e.value`；照 web 慣例讀 `e.detail.value` 會拿到 `undefined`。失敗模式見下一列 —— 它不會像 web 那樣只是「搜尋沒反應」 |
| **一個拋錯的 computed 在 Lynx 上表現成「畫面壞掉」，不是錯誤訊息** | 上一列那個 bug 讓 `search.value` 變成 `undefined`，於是 `undefined.trim()` 在 computed 裡拋錯。症狀是**深色模式下輸入框文字變白看不見、樣式沒套上、計數不更新** —— 完全不像一個 TypeError。當時我據此推論「`background-color` 不適用於原生文字欄」，結果是錯的（A/B/C 三種上色方式實測全部有效）。**教訓：在 Lynx 上看到無法解釋的樣式異常，先懷疑 render 期間有 exception，不要先推論平台不支援某個屬性。** 也順帶確立：CSS class 與 inline style 對 `<input>` 都有效，`background-color` 有效 |
| 症狀出現的**時機**要拿來分辨成因 | 同一輪報了兩個 bug（沒有動畫、白字），看起來像一件事。但動畫在首次繪製就沒有，那時搜尋字串還是 `''`、computed 不會拋錯；白字只在打字後出現。時序對不上就是兩個獨立成因 —— 合著查會兩個都查不出來 |
| `box-sizing` 預設是 `border-box`，不是 `content-box` | 文件明寫「Default value is `border-box` in Lynx, while `content-box` in web」。所有從設計稿搬過來的寬度算式都要重算 —— 設計稿的 `.card` 是 `width:164px` 加 1px 邊框，在 web 上外圍 166px，在 Lynx 上就是 164px。另外 `box-sizing` **不影響 `flex-basis` 的解讀**（web 會）。好處是百分比寬度變得可用：`width:50%` 已含邊框，兩張卡正好 100% 不會溢出 |
| 設計稿的 164px 卡片寬度是為 500px 瀏覽器調的，手機放不下兩欄 | 水平 chrome padding 是 `Root 12 + Shell 9 + Screen 12 = 33` 每側共 66px。一張卡外圍 `164 + 6 margin = 170`，兩張需 340px。iPhone 邏輯寬度 375／390／393 的可用寬度是 309／324／327，**全部放不下兩欄**；只有 430（Plus / Pro Max）的 364 放得下。目標是手機，所以卡片寬度改成百分比、由容器分欄 |
| bundle 大小 | 帶入資料集後 web bundle 由 88.6KB 跳到 331KB（資料集 compact 後 195KB）。本切片刻意不切分以免與 pipeline 產物分家；真正的判斷點在網格切片，屆時以 `moves` 與 `sec` 兩個大欄位為切割線 |

### 12.8 CSS `url()` 資產在 lynx bundle 裡會變成抓不到的 URL（**已修**）

| | |
|---|---|
| 狀態 | `native 實測` 確立；已在 `lynx.config.ts` 修掉 |
| 現象 | `App.css` 寫 `src: url('./assets/fonts/Silkscreen-Regular.ttf')`，但打包後 lynx bundle 裡的實際 URL 是：**production build → `webpack:///static/font/…ttf`**（沒有任何東西能 fetch 這個 scheme）；**dev build → `http://<LAN-IP>:<port>/static/font/…ttf`**（絕對 URL，dev server 一關就死）|
| 後果 | native 實測時**完全沒有發出字型請求**（自架 server 全程零 `.ttf` request）—— 字型靜默落回系統字型。這正是 §12.2 想避免的失敗，只是原因不是格式而是 URL |
| 修法（已採行） | `lynx.config.ts` 設 `output.dataUriLimit: 64 * 1024`，讓 30KB 的 TTF 以 `data:font/ttf;base64` 內嵌進 bundle。實測：bundle 內出現 2 筆 `data:font/ttf;base64`、`webpack:///` 歸零、`dist/static/font/` 不再產生獨立資產 |
| 代價 | lynx bundle 331KB → 386KB（兩個字型 base64 約 +55KB）。若日後要改回外部資產，就必須設 `output.assetPrefix` 指向真實可達的 base URL —— **不要只依賴預設值** |
| 這也回答了 spec 的退路情境 | `pixel-typography` 那條「bundled asset path 不成立時退回 base64 data URI」**已啟用**。base64 是這個專案該用的形式，不是備案 |

### 12.9 macOS 桌面版 LynxExplorer：能跑 bundle、能畫 PNG，但**畫不出 SVG**

有桌面模擬器可用，不需要 Xcode / Android Studio。LynxExplorer 4.0.0 release 附：
`LynxExplorer-macos-arm64.app.tar.gz`（Apple Silicon）、`-macos-x64`（Intel）、`-windows-x64/x86`、`LynxExplorer-arm64.app.tar.gz`（iOS Simulator，要 Xcode）、`LynxExplorer-noasan-release.apk`（Android）。

用法（不需要 QR code）：

```bash
LynxExplorer.app/Contents/MacOS/LynxExplorer --url='http://<host>:<port>/main.lynx.bundle?fullscreen=true'
```

直接跑執行檔而不是 `open`，stdout 會吐出完整的 native 診斷日誌 —— 這是桌面版最大的價值。

**它能回答什麼**：bundle 是否載入與執行（QuickJS 初始化、template assemble、layout 都有日誌）、`device_pixel_ratio`（實測 2，等同 retina 手機）、CSS / 資產 URL 是否抓得到（配自架 server 看 request log，§12.8 就是這樣抓出來的）。

**已在 macOS 上得到答案的**：

- **像素字型（base64 內嵌）成立** —— 畫面上 `CHAMPIONS DEX` 是 SilkBold、`VENUSAUR` 是 Silk、中文自然落到系統字型。§12.8 的修法在 native 確認有效
- **PNG sprite 正常解碼並顯示**（七張卡片的圖都畫出來了）

**同理，Android 只吃 TTF/OTF 那條也只有 Android 能驗**（§12.2）—— macOS 走的是另一套字型註冊。

**它不能用來驗型別字符。** iOS 實機證實 `<svg content>` 正常（§12.10），所以桌面版畫不出 SVG 是這個 build 自己的缺陷，不是 Lynx 的行為。用它來判斷字符會得到假的失敗。它仍可用來驗 bundle 載入與執行、資產 URL、PNG sprite 與字型註冊。

### 12.10 ✅ `<svg content>` 在 iOS 實機**正常** —— macOS 桌面版是唯一的例外（已結清）

**結論（iOS 實機實測，2026-07-29）**：`content` 屬性在 iOS 上正常渲染。十八個字符乘兩種表面的三十六格色板全部畫得出來，POCKET 與 MODERN 兩個模式都確認過。

因此：**`TypeGlyph` 的現行實作不動**，`<image src>` 加 `tint-color` 的退路**不啟用**，十八個單色 SVG 資產**不需要產生**。當初「先不要據此改寫」的判斷是對的 —— 若當時照 macOS 的證據改寫，就會用一個平台的缺陷污染實作。

**macOS 桌面版從此標記為「不能用來驗型別字符」**，見 §12.9。它仍可用來驗 bundle 載入、資產 URL、PNG sprite 與字型註冊。

下面保留當初的 macOS 實測記錄，因為它仍然是那個平台的事實。

---

原標題：⚠️ `<svg content>` 在 macOS 桌面版**完全不渲染** —— 型別字符的最大未解風險

實測（LynxExplorer 4.0.0 macOS arm64）：字符的**容器**正常（背景色、邊框、下方縮寫都在），但**方塊一個都沒畫出來**。日誌對應 `Failed to create ImageDescriptor`（所以 Lynx 是把 svg 走影像管線）。

四種寫法的對照實測：

| 寫法 | macOS 桌面版 |
|---|---|
| `<svg :content="<svg …>">`（**目前的實作**） | **空白** ✗ |
| `<svg src="http://…/glyph.svg">` | **空白** ✗（server log 顯示檔案確實被抓走了，HTTP 200 —— 抓到但畫不出來） |
| `<image src="http://…/glyph.svg">` | **正常顯示且銳利** ✓ |
| `<image src="data:image/svg+xml;base64,…">` | **空白** ✗ |

當時的判斷是「先不要據此改寫 `TypeGlyph`」，理由是這只是**單一平台**的證據，而 `content` 是官方文件寫明的用法 —— 很可能是 macOS desktop build 的 service 層缺 SVG 支援。**iOS 實測證明這個判斷是對的**：問題只存在於 macOS 桌面版。

未啟用的退路仍記在此，以備 Android 實測失敗時使用：改用 `<image src>` 指向 SVG 檔。**不要**為 18 型別 × 3 表面 × 2 模式產生 108 個檔案：`<image>` 有 `tint-color`（對非透明像素上色），所以 18 個單色 SVG + 依 `glyphOn()` 給的 `tint-color` 就夠。注意 data URI 這條在 macOS 是死路，必須是真實 URL / 打包資產。

### 12.11 前一版本節的更正

§12.9 原先寫「macOS 桌面版沒有 image codec、一張圖都畫不出來」，**這是錯的**。PNG sprite 在 macOS 上完全正常。當時看到的 `Failed to create ImageDescriptor` 是**SVG** 失敗，不是 PNG —— 那批錯誤數量與畫面上的字符數對得上，與 sprite 無關。判斷錯誤的原因是只看日誌沒看畫面（當時還沒有螢幕錄製權限）。教訓：**`Failed to create ImageDescriptor` 要先確認是哪一類資源，不要直接推論成「影像管線壞了」**。

### 12.12 載具在 native 上只看得到第一屏（`<scroll-view>` 的必要性）

macOS 桌面版視窗固定 800×600 且只有 `--url` / `--remote-debug` 兩個參數。載具內容約三屏高，而 **Lynx 不會像瀏覽器那樣自動捲動整頁** —— 所以字符色板與放大檢查在 native 上**完全到不了**，不是被裁掉而是沒有捲動機制。

驗收時的做法：臨時把要看的區塊移到最上面重新建置。這也預告了網格切片的第一件事 —— 任何超過一屏的內容都必須自己包 `<scroll-view>` 或 `<list>`，這條在 web 上不會暴露出來。

順帶一個踩到的坑：`pkill` 後立刻用視窗 ID 截圖，可能抓到**上一個 instance 還沒消失的視窗**，看起來像「改動沒生效」。截圖前確認視窗 ID 有變，或在畫面上放一行 debug 值（我用 `DBG idx=… id=… lang=…` 才確認狀態其實是對的）。

### 12.14 ✅ `@keyframes` 與 `steps()` 在 iOS 成立

| | |
|---|---|
| 狀態 | `iOS 實機實測`（2026-07-29） |
| 為什麼要驗 | §9 記的「所有動態用 `steps()` 而非 easing」是這份設計的年代語彙本身，不是可選的潤飾。若 Lynx 忽略 `animation`，整條要換機制或承認做不到 |
| 驗法 | 在畫面上放一個無條件、無限循環的方塊：`animation: probeSlide 1s steps(4) infinite`，向右移 60px。**判別的重點是「有沒有在動」與「是跳格還是平滑」** —— 一個從未落到元素上的綁定，看起來與一個被平台忽略的 timing function 完全一樣 |
| 結果 | **方塊會動，且是跳格**。所以 `@keyframes`、`animation` 簡寫、`steps()`、`transform: translateX` 在 iOS 都成立 |

#### 階梯揭示為什麼原本不播（已解決，iOS 實機確認逐格出現）

動畫本身既然支援，成因就在綁定。逐一拿掉變數之後定位到**兩個**，而不是一個：

**1. `已證實` 用計時器關閉「開機旗標」的做法不成立。** 設計稿在 boot 後 `26 * 14 + 260` ms 移除 `body.booting`，移植時照搬成 `onMounted` 裡的 `setTimeout`。在 Lynx 上這個窗口太短 —— **佈局 208 個儲格並發出 208 個圖像請求，可以比任何這種固定窗口都久**，於是 Vue 在平台真正畫出任何東西之前就把 class 拿掉了，畫面上是「完全沒有動態」。

改成不依賴時間的判準：**監看查詢結果，第一次改變時才關閉旗標**。揭示屬於啟動，而啟動在使用者動了任何控制項的那一刻結束 —— 這句話與首次繪製要多久無關。副作用是那個「動畫時長」常數連同它與 CSS 的耦合一起消失了，時長只剩樣式表一處來源。

> **這條是通則，不只關於這個動畫**：任何「在 mount 後等 N 毫秒」的邏輯在 Lynx 上都要重新檢查。208 張卡的首次繪製比直覺慢得多。

**2. `已繞過，未單獨證實` 靜態 `class` 與綁定 `:class` 併用。** 原本寫 `class="DexCell"` 加 `:class="booting ? 'CardReveal' : undefined"`，改成單一運算式 `:class="booting ? 'DexCell CardReveal' : 'DexCell'"`。**兩個修正是同一輪做的，所以無法判斷第 2 項本身是否也是成因。** 沒有回頭拆開驗證，因為單一運算式在任何情況下都不會更差。若日後需要知道 vue-lynx 是否正確合併兩者，這是還沒有答案的問題。

**另外附帶確立**：`animation-delay` 透過 `:style` 綁定**有效** —— 逐格錯開看得出來，所以每張卡拿到的是不同的延遲值。

無論上述如何，較安全的寫法都是：**不要把 class 或 style 綁在元件上然後假設它會落到根元素**（原本是綁在 `<SpeciesCard>` 上靠 attribute fall-through），綁在自己寫的元素上，落點才是確定的。

### 12.13 ⚠️ `<list>` 在 vue-lynx 只支援尾端追加 —— 會變動的序列不能用它

| | |
|---|---|
| 狀態 | `原始碼實測` 確立（讀 `node_modules/vue-lynx/main-thread/`，不是讀文件） |
| 版本 | 專案裝的 0.4.0，與 npm `latest` 的 0.5.1 **行為一字不差**（抓 tarball 逐段比對）。`1.0.0` 的 tarball 只有 171 bytes，是佔位 stub 不是真套件 |

三個位置合起來造成這個限制：

| 位置 | 行為 |
|---|---|
| `insertListItem` | 只做尾端 `push`，**忽略傳入的 anchor** → 無法插入到指定位置 |
| `flushListUpdates` | `removeAction` 與 `updateAction` **硬編為空陣列**；只回報索引 ≥ 已回報數的新項目；已回報數 (`listItemsReported`) **永不遞減** |
| `ops-apply.js` 的 `OP.REMOVE` | 呼叫 `__RemoveElement` 移除原生元素，但**不把該項目從 `listItems` 移除** |

**後果**：`v-for` 跑在會變動的陣列上時 `<list>` 不會正確更新。序列因篩選變短 → `flushListUpdates` 的 `if (items.length <= reported) continue` 直接跳過，畫面留著舊項目；排序改變順序 → `listItems` 永遠是插入順序，格子與內容錯配。

**文件與程式碼不一致**：官方 guide 的 scroll-view / list 比較頁描述了 LIS 移動偵測與 remove／reorder 支援，**出貨的程式碼沒有那些東西**。該頁同時自己註明 framework-side cell recycling「still open」（vue-lynx issue #302）。**以程式碼為準。**

**因此網格切片改用 `<scroll-view>`**。原本選 `<list>` 的理由是「scroll-view 不回收」，但 vue-lynx 也沒有真的交付回收 —— 所以選 `<list>` 換不到回收，還要賠掉篩選與排序的正確性，取捨的兩邊都是負的。208 筆是有界的已知集合，記憶體改成在裝置上實測而不是靠元素選擇來假設。

**重新評估的觸發條件**：vue-lynx 實作了 `removeAction` 與 `updateAction`。屆時 `<scroll-view>` 換回 `<list>` 的改動範圍限於網格元件一處。**這是「當時 list 不能用」，不是「這個專案偏好 scroll-view」** —— 不要把它讀成後者。

已排除的替代方案：每次查詢改變就重建整個 `<list>`（內部狀態以 list 的 id 為鍵存在 `Map` 裡且沒有對應的清理路徑，每次按鍵都會留下一份 → 記憶體無界成長）；打 patch 自己實作 `removeAction`（要摸索 native 的 `update-list-info` 協定，只有在裝置上才驗得出來）。

#### `<scroll-view>` 承載 208 張卡的實測結果（iOS 實機，2026-07-29）

**可接受，退路不啟用。** 從第一張捲到第 208 張，全程無空白卡、無錯配內容、無明顯卡頓。

所以「208 筆不回收會不會太重」這個問題的答案是不會 —— 卡片結構淺（兩層 view、七個文字節點、一張圖），sprite 是外部資源不佔 bundle。設計時準備的視窗化退路（以捲動位移推算可見區間、只渲染區間加前後各一屏）**不需要啟用**，記在這裡以備資料集日後變大時參考。

注意這個結論綁在「208 筆、這個卡片結構」上。詳情面板切片會加入更深的節點樹，屆時要重新量而不是沿用這個結論。
