# CHAMPIONS DEX — 交接文件

> 寶可夢 Champions 圖鑑設計稿。像素風格、雙語、雙色彩模式。
> 最後更新：2026-07-30（招式表改為自帶捲動區，§12.16 兩列已翻案 —— 見 §12.19，iOS 實機驗收已結清 —— 巢狀同向捲動成立。先前：招式表切片完成 —— 設計稿七項功能全部移植完畢，iOS 實機驗收已結清。
> 本批的平台事實見 §12.17，偏離清單見 §12.16。搜尋範圍的缺陷與修法見 §12.18）

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
- **兩種色彩模式**：`POCKET`（灰階 4 色介面 + 全彩 sprite）、`MODERN`（深色介面 + 18 個官方屬性色）
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
| 第六世代之後的 sprite 是渲染圖不是點陣圖 | 與一至五世代的 BW 手繪圖畫風不同 | 設計稿已在 footer 誠實說明。曾用 4 階量化吸收此落差，但依需求移除了。⚠️ **移植版沒有做這件事，且已決定永久不做**：footer 只留字型／版權一段，設計稿的五段來源說明（含說明這條落差的圖像段）不移植，所以移植版畫面上沒有任何地方交代這個畫風差異。見 §12.21 |
| `#1019 蜜集大蛇` 等新種類沒有分類名 | 中文模式副標少一段 | 留空 |
| 詳情面板的 hover 提示（屬性名、另一語言的招式名、傷害類別全名） | 觸控裝置無 hover | **移植版已全部處理完畢，做法與這裡原本的預期不同**：屬性名與形態鈕的屬性直接寫進藥丸與鈕本身（中文模式的藥丸顯示「草 Grass」），不做點擊展開 —— 為兩個詞加一個展開狀態不划算。招式的另一語言名與傷害類別全名**移除且不補替代物**：前者透過語系鈕就整表切換，後者是三值封閉集合且同一列已有屬性字符。見 §12.16 |

---

## 9. 設計決策：為什麼這樣寫

這些都有非顯而易見的理由，改動前請先讀。

| 決策 | 理由 |
|---|---|
| 屬性字符的填色**依所在背景**決定（`glyphOn(type, bg)`） | 字符是 canvas bitmap，顏色繪製時就烘進去了，**無法繼承 `currentColor`**。曾把字符與 MODERN 的屬性鈕底色都設為屬性色，導致字符完全隱形 |
| `inkOn()` **比較兩種墨色的實際對比值**，不用固定亮度門檻 | 岩石的 `#AFA981` 落在交界處，固定門檻判給白色（對比 2.33），黑色其實是 9.0。改後最差對比從 2.38 → 4.47 |
| 種族值最高項的 class 叫 `.peak` 而**不是** `.top` | `.top` 已屬於 masthead，其 `display:flex` + `border-bottom:3px` + `margin-bottom:9px` 會套到種族值列上，造成 28px vs 18px 的高度跳動 |
| 字型平滑規則綁在 `body.lang-en` 上 | 名稱欄的語言隨切換而變。關閉平滑讓拉丁像素字銳利，但 11px 中文關閉平滑會變粗糙。現在 CJK 在兩個語系下都不會被關閉平滑 |
| 屬性字符固定 **16px**，不隨字級放大 | 8×8 點陣圖只有整數倍才能在最近鄰放大下保持銳利。18px 是 2.25 倍會讓像素格不均勻 |
| 種族值條基準用 **230**（實際最大值）而非 255 | 用理論上限會讓所有條擠在左三分之一，比較功能失效 |
| 網格排序取**最強形態**的種族值總和 | 取基本形態會把所有 Mega 埋在低數值下面 |
| 篩選時卡片會**替換顯示的形態** | 否則篩「龍」會用火／飛行的圖回答，看起來像壞掉 |
| 切換鈕的屬性字符**只在該形態改變屬性時**出現 | Vivillon 20 種花紋全是蟲／飛行，逐個標上去是 40 個重複字符零資訊 |
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

**可直接搬**（最貴的部分已完成）：`champions-dex.json`、I18N 字串表、POCKET/MODERN token 組（`lynx.config.ts` 已開 `enableCSSInlineVariables`）、TYPE_COLORS、屬性縮寫、8×8 字符點陣、篩選／排序／本系判定邏輯。HTML 的 302KB 裡：資料 179KB + 內嵌字型 69KB + **程式與樣式僅 53KB**。要重寫的只有最後那一塊。

**必須改寫**：

| 現況 | Lynx 做法 |
|---|---|
| `div`/`span`/`img`/`button` | `view`/`text`/`image`，文字必須包在 `<text>` 內 |
| 208 張卡片的 `overflow:auto` | ~~`<list>`~~ → **`<scroll-view>`**。原本的判斷是 `<list>`（遠超三個螢幕，`scroll-view` 不回收），但 `<list>` 在 vue-lynx 只支援尾端追加，篩選與排序在它上面無法正確運作 —— **見 §12.13** |
| 招式表（最多 105 列） | 同樣受 §12.13 影響。招式表有排序與本系篩選，所以也不能用 `<list>` |
| 詳情面板捲動 | `<scroll-view>` |
| canvas 產生屬性字符 | 改用 `<svg>` 畫 8×8 方塊，或建置期預先產生 |
| `.mvrow.stab .mn::after` 的 ★ | 真的 `<text>` 節點 |
| `title` 提示 | 移除或改點擊展開 —— **實際結論是全部移除且不補替代物**，見 §12.16 |
| DOM 手動建構 | Vue 模板（最大宗但最機械） |

**要最先驗證的一件事**：`image-rendering: pixelated` 在 Lynx 的 `<image>` 上是否支援 —— 這件事**已經查到並實測**，結論見 §12。整個像素風格建立在最近鄰放大上；若不支援，192px 詳情大圖會變成模糊插值。退路是詳情圖也用原生 96px，或建置期預先放大成 PNG。

**建議切法**：先做垂直切片 —— (1) 資料層落地 `src/data/` (2) `<TypeGlyph>` SVG 版 + 一張卡片，在 web 與 LynxExplorer 各跑一次順便驗 pixelated (3) 確認後才展開網格與面板。

**移植已全部完成**，分五批，每批都是一個 openspec change：

| 批次 | 交付 | 平台事實 |
|---|---|---|
| `port-champions-dex-foundation` | 資料層、兩個模式的 token、對比墨色判定、`<TypeGlyph>` SVG 版、單張卡片、像素字型註冊 | §12.1–12.12 |
| `port-champions-dex-grid` | 208 筆網格、查詢列（搜尋／屬性／世代／排序）、階梯揭示 | §12.13、§12.14 |
| `port-champions-dex-detail` | 覆蓋層、標題列、192px 大圖、屬性藥丸、警語、種族值、特性、形態切換器 | §12.15、§12.16 |
| `embed-prose-face` | Literata 釘靜態實例 + subset，35.8 KB | §12.2 |
| `port-champions-dex-learnset` | 招式表：六欄、三種排序、本系篩選 | §12.17 |

**動任何一塊之前請先讀 §12** —— 其中好幾件事與本文件前半原本的假設不同，而每一項都附了「若失敗要怎麼做」。

#### Android 的兩筆掛帳 —— 不阻擋開工（2026-08-08 定調）

**這一節原本的標題是「⚠️ 下一階段開工前必須先確認的兩件事」，是阻擋性的。已改。** 兩件事讓那個語氣不再成立：第 1 筆的 iOS 側在 2026-07-29 結清，而 §12.17 末尾記下「Android 依專案當前決定不在範圍內」—— 於是同一份文件既說阻擋又說不在範圍，而專案早已出過五批以上，Android 從未真的擋住任何一批。**權威是 §12.17：Android 不在範圍內。** 下面兩筆保留成「Android 若日後納入範圍時要驗的事」，不是開工前提。

兩項都**只能在 iOS Simulator 或 Android 上驗**，macOS 桌面版答不了。第 1 筆的 iOS 側已結清，剩下的都是 Android 側。

| # | 要確認什麼 | 狀態 | 怎麼驗 | 若失敗要怎麼做 |
|---|---|---|---|---|
| 1 | `<svg content="…">` 在 iOS / Android 畫不畫得出來 | **✅ iOS 已結清（2026-07-29）**：正常渲染，36 格全部畫得出來，兩個模式都確認。`TypeGlyph` 不動，退路不啟用。見 §12.10。**Android 仍未驗** | 跑載具，看「屬性字符」色板 36 格有沒有東西 | 改用 `<image src>` 指向 SVG **檔案**，配 `<image>` 的 `tint-color` 依 `glyphOn()` 上色 —— 18 個單色 SVG 就夠。~~**data URI 是死路**~~ ⚠️ **這句的範圍是「macOS 桌面版 + SVG 酬載」，不是通則 —— 見 §12.24 第三段** |
| 2 | 像素字型在 **Android** 載不載得起來 | 仍掛帳 —— 手上沒有 Android 裝置。影響範圍限於樣式表的字型註冊規則，且失敗模式明顯可見（拉丁文字落回系統字型），不會靜默通過 | 在 Android 上看拉丁名稱是不是像素字（不是系統字） | 檢查 `output.dataUriLimit` 是否生效、或改用 `local()` 註冊 |

**iOS 實機已結清的項目（2026-07-29）**：屬性字符的 `<svg content>`（§12.10）、`image-rendering: pixelated`（§12.1）、`<image>` 的 `@load` 事件（§12.6）。**Android 完全未驗** —— 字型註冊與字符渲染在該平台都還沒有證據。

已經在 native 定案、不需要重驗的：像素字型（macOS）、PNG sprite、`image-rendering: pixelated`（量化驗證，§12.1）、卡片斜角、`@load`/`@error` 事件差異（§12.6）、資產 URL（§12.8）。

### B. 如果要用 claude-design

它不做轉檔，但適合把這份設計稿**沉澱成設計系統**：色彩 token（兩組模式）、18 個屬性字符、元件清單（卡片／面板／形態切換器／種族值條／招式表）。

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
- 屬性字符在**所有五種表面**都可見：篩選鈕、卡片屬性、形態切換鈕、詳情藥丸、招式列
- 動態全為 `steps()`（cardIn steps(2) / panelIn steps(3) / veilIn steps(2) / swap steps(2)），且 `prefers-reduced-motion: reduce` 會全部關閉
- 階梯延遲有上限（index 26 與 100 都應是 0.364s），`booting` 移除後回到 `animation:none`
- 字型分工未跑偏：卡片名稱／面板標題／特性名／招式名四處應仍是 `Silk`，特性說明與 footer 長文應為 `Lit`（中文自然穿透到 PingFang）
- 抖動 tile 為 4×4、單一顏色、密度 2/16 與 8/16，且該顏色必須已在當前模式色盤內
- **POCKET 的 UI 顏色數仍為 3** —— 加氛圍層後若變成 4 以上，代表抖動引入了色盤外的顏色
- 氛圍層 `pointer-events:none`、`z-index` 低於外框，內容區不被覆蓋

字符可見性建議用程式驗證而非目視 —— 把填色與所在表面的有效背景算 WCAG 對比。

### 移植後新增的檢查項

- 資料層六項不變式在載入期斷言，違反時丟錯而非靜默降級（208 種類 / 360 形態 / 75 Mega / 16 地區形態 / 496 招式 / 200 特性）
- 重跑 pipeline 後 `src/data/dex.json` 位元不變（與 `design/champions-dex.json` 同源）
- **POCKET 所有實際上色的顏色都落在四階灰之內（上限 4，不是固定 3）** —— 超出代表引入了色盤外的顏色
- **字符對比不再靠人工計算 —— `pnpm run check` 有一條檢查算完九個組合並在低於下限時非零退出**（`scripts/check-contrast.mjs`，見 §12.17）。它從主題原始碼讀調色盤，且在 `GlyphSurface` 新增成員時會拒絕靜默略過。目前下限 **2.5**（MODERN surface2 的毒 2.53），完整表格在 §12.17
- 樣式表不得出現 `font-variant-numeric`（不會生效，見 §12.17）；招式表的數值欄以固定欄寬 + 右對齊對齊
- 表格類的列高必須一致：招式名單列截斷不折行（與卡片的物種名相反，理由在 §12.17）
  - 註：本文件原記的「MODERN 4.89–11.42」對應的是**屬性鈕**表面，不是卡片表面。MODERN 把屬性色畫在卡片表面時，毒／龍／幽靈／惡四個屬性的對比在 3.5 以下 —— 這是「MODERN 就是要花顏色」的刻意取捨，不是缺陷
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
| 散文面（已完成，2026-07-29） | Literata 已內嵌為 `Lit`。**但不是「抓官方 TTF」那麼簡單，也不是本文件原先估計的「約兩倍」** —— 見以下各列 |
| ⚠️ 原先的體積估計是錯的 | 本節原本寫「Literata TTF 比 WOFF2 大約兩倍」。實測**不是兩倍，是二十倍**：上游 Google Fonts 只提供可變字型 `Literata[opsz,wght].ttf`，**955,132 B（933 KB）**，而設計稿內嵌的 WOFF2 只有 46,568 B —— 那是已經 subset 過的 latin 子集，拿它跟完整可變字型比本來就不對等 |
| 實際的處理步驟 | 兩步，都在 `fetch_fonts.sh` 裡：①**釘一個靜態實例** `wght=400 opsz=13`（264 KB）—— 400 因為散文只有一個字重，13 因為設計稿的散文是 13px 配 `font-optical-sizing: auto`，瀏覽器在該尺寸解析到的就是 13；不用可變字型是因為 Lynx 對可變字軸沒有承諾，缺支援時會拿到字型自己的預設 `opsz=12` 而且**不會有任何錯誤訊息**。②**subset 成宣告的範圍**（可見 ASCII、Latin-1 補充、破折號、引號、刪節號、角分號），得到 **35,788 B**，與 Silkscreen 的 32,220 / 30,632 B 同級 |
| 需要 fonttools，但只有這個腳本需要 | 實例化與 subset 用 `python3 -m fontTools.varLib.instancer` 與 `python3 -m fontTools.subset`。缺它時腳本會非零退出並印出安裝指令。**應用建置、CI、任何只跑 `pnpm run build` 的人都不需要 Python** —— 資產已進版控 |
| ⚠️ bundle 成本是檔案大小的 4/3，不是檔案大小 | `lynx.config.ts` 設了 `dataUriLimit: 64 * 1024`，低於此值的字型會被內嵌成 base64 data URI（這正是 §12.8 的修法）。所以 35,788 B 的資產進 bundle 是 46.6 KB。lynx bundle 從 405.6 KB 變成 453.6 KB（+11.8%），三個字型都是內嵌的 |
| ⚠️ 這給 subset 範圍訂了上限 | 資產一旦超過 64 KB 就不再內嵌，會退回成 lynx bundle 抓不到的 URL —— **字型靜默失效**。目前 35.8 KB 餘裕很大，但日後放寬 subset 範圍時要一起確認 |
| subset 的風險由不變式擋住 | `pnpm run check` 新增第三條檢查 `prose face covers the prose corpus`：把散文語料（資料集的特性說明與種類備註 + 字串表的所有字面值，排除東亞文字）逐字比對資產的 cmap，缺任何一個就非零退出並列出缺哪些。豆腐字是「畫面上有東西、console 乾淨、建置成功」的典型靜默失敗 |
| 這條檢查第一次跑就抓到一個真的 bug | 中文的 `notePrefix` 與兩則中文警語用 `※`（U+203B）。它在 General Punctuation 而不是 CJK 區塊，所以範圍檢查漏掉它 —— 而**上游 Literata 根本沒有這個字**，放寬 subset 範圍也拿不到。它跟著它前綴的中文一起穿透到系統襯線體，這是對的行為，已寫成有理由的排除 |
| §11 的驗收項恢復可驗 | 「字型分工未跑偏」不再是紅的：三處長文（特性說明、兩則警語、網格空結果）都指名 `Lit` 開頭的完整堆疊，中文仍穿透到系統襯線體。**樣式表不得出現 `font-optical-sizing`** —— 光學尺寸已烘進資產，留著一行不再起作用的宣告會誤導後人 |
| ✅ iOS 實機已確認（2026-07-29） | 三處長文的拉丁文字都是襯線體，與同畫面的像素面（特性名、種族值標籤）明顯有別；中文落在系統**襯線**體而非預設無襯線；`※` 正常顯示不是方框。**退路不啟用** —— subset 過的 TTF 在 Lynx 上正常，不需要退回「只實例化不 subset」的 264 KB 版本 |
| 順帶確立 | Lynx 吃**subset 過**的 TTF。這件事事前沒有證據 —— 一個被裁掉大半表格的字型有可能被平台拒收，而拒收的樣子與「字型沒載到」一樣是靜默落回系統面。現在知道保留 `cmap` / `glyf` / `hmtx` / `kern` / `name` / `head` / `hhea` / `maxp` / `post` 這組表就夠 |
| 字元穿透是逐字的，不是整段的 | `※` 與它前綴的中文在同一個 `<text>` 節點裡，但 `※` 不在 Literata 的 cmap 內，所以平台是**逐字**往字型堆疊後面找，而不是整段換一個字型。這也是為什麼那條覆蓋檢查只需要管「Literata 該畫的字」，不必管整段文字 |

### 12.3 `box-shadow` 不支援 `inset`

| | |
|---|---|
| 狀態 | `文件` 確立；`web 實測` 斜角可見 |
| 文件 | Lynx `box-shadow`「Temporarily not support values like inherit、initial、revert、unset、**inset**」 |
| 對設計稿的影響 | 三處依賴 inset：卡片 1px 立體斜角、`.screen` 內框、MODERN 屬性鈕按下態。**全部要改寫** |
| 已採行（卡片斜角） | 外層 view 保留 1px `--line` 外框，內層再包一層 view：`border-top-color` / `border-left-color` 取 `--panel`，`border-bottom-color` / `border-right-color` 取 `--surface2`。分邊框色是支援的，視覺上與原本的 inset 對角亮暗等價 |
| 副作用 | 卡片多一層節點；內層負責 padding |
| 尚未處理 | `.screen` 內框與 MODERN 屬性鈕按下態（都在後續切片） |

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
| 反向策略（已採行） | 不靠失敗事件，靠成功事件：替代圖塊**一開始就蓋在圖上**，`@load` 到達才移除。三個目標達到同樣的可觀察狀態，而且慢速載入時看到的是屬性字符而不是空框 |
| 不要做的事 | **不要因為 iOS 會觸發 `@error` 就改回失敗驅動。** 那會在 macOS 桌面版上靜默失效，而那是目前唯一能讀原生診斷日誌的環境 |
| 實作細節 | `<image>` 必須**始終掛在樹上**才會發出請求，所以替代圖塊是 `position: absolute` 疊在上面、載入後移除，不是用 `v-if` 互換 |
| 教訓 | **不要用 web 的事件行為推論 native。** 這一項如果只驗 web 就會做出在真機上永遠不會生效的錯誤處理 |

### 12.7 其他實作層面的坑（都已踩過）

| 坑 | 說明 |
|---|---|
| CSS 變數名會被 hyphenate | `:style` 綁 `--accentInk` 會以 `--accent-ink` 落到元素上，CSS 裡寫 `var(--accentInk)` 會靜默解析不到（症狀：accent 底上的文字變同色隱形）。**token 一律用 kebab-case** |
| `moduleResolution: "Bundler"` 會隱含開啟 `resolveJsonModule` | 195KB 的 dex.json 被推導出字面量屬性，屬性檢查會爆。`src/tsconfig.json` 已明確設 `"resolveJsonModule": false`，改由 `*.json` 的 `unknown` 宣告 + `src/data/dex.ts` 一處收斂 |
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

**它不能用來驗屬性字符。** iOS 實機證實 `<svg content>` 正常（§12.10），所以桌面版畫不出 SVG 是這個 build 自己的缺陷，不是 Lynx 的行為。用它來判斷字符會得到假的失敗。它仍可用來驗 bundle 載入與執行、資產 URL、PNG sprite 與字型註冊。

### 12.10 ✅ `<svg content>` 在 iOS 實機**正常** —— macOS 桌面版是唯一的例外（已結清）

**結論（iOS 實機實測，2026-07-29）**：`content` 屬性在 iOS 上正常渲染。十八個字符乘兩種表面的三十六格色板全部畫得出來，POCKET 與 MODERN 兩個模式都確認過。

因此：**`TypeGlyph` 的現行實作不動**，`<image src>` 加 `tint-color` 的退路**不啟用**，十八個單色 SVG 資產**不需要產生**。當初「先不要據此改寫」的判斷是對的 —— 若當時照 macOS 的證據改寫，就會用一個平台的缺陷污染實作。

**macOS 桌面版從此標記為「不能用來驗屬性字符」**，見 §12.9。它仍可用來驗 bundle 載入、資產 URL、PNG sprite 與字型註冊。

下面保留當初的 macOS 實測記錄，因為它仍然是那個平台的事實。

---

原標題：⚠️ `<svg content>` 在 macOS 桌面版**完全不渲染** —— 屬性字符的最大未解風險

實測（LynxExplorer 4.0.0 macOS arm64）：字符的**容器**正常（背景色、邊框、下方縮寫都在），但**方塊一個都沒畫出來**。日誌對應 `Failed to create ImageDescriptor`（所以 Lynx 是把 svg 走影像管線）。

四種寫法的對照實測：

| 寫法 | macOS 桌面版 |
|---|---|
| `<svg :content="<svg …>">`（**目前的實作**） | **空白** ✗ |
| `<svg src="http://…/glyph.svg">` | **空白** ✗（server log 顯示檔案確實被抓走了，HTTP 200 —— 抓到但畫不出來） |
| `<image src="http://…/glyph.svg">` | **正常顯示且銳利** ✓ |
| `<image src="data:image/svg+xml;base64,…">` | **空白** ✗ |

當時的判斷是「先不要據此改寫 `TypeGlyph`」，理由是這只是**單一平台**的證據，而 `content` 是官方文件寫明的用法 —— 很可能是 macOS desktop build 的 service 層缺 SVG 支援。**iOS 實測證明這個判斷是對的**：問題只存在於 macOS 桌面版。

未啟用的退路仍記在此，以備 Android 實測失敗時使用：改用 `<image src>` 指向 SVG 檔。**不要**為 18 屬性 × 3 表面 × 2 模式產生 108 個檔案：`<image>` 有 `tint-color`（對非透明像素上色），所以 18 個單色 SVG + 依 `glyphOn()` 給的 `tint-color` 就夠。注意 **SVG 酬載的** data URI（`data:image/svg+xml`）在 **macOS 桌面版**是死路，那條退路必須是真實 URL / 打包資產。**這個限制不涵蓋 PNG 酬載，也不涵蓋 iOS** —— `data:image/png` 在 iOS 實機已實測成立（§12.24 第四段），本專案的字符現在就走那條。

> ⚠️ **上一段最後那句的範圍要讀清楚**（2026-08-10 補）：這張表量的是 macOS 桌面版，而失敗的那一列
> 酬載是 **SVG**。本節自己的結論是該 build 畫不出任何 SVG，所以那一列不能推廣成「data URI 在這個
> 平台不能用」—— **PNG 酬載與 iOS 都是零證據**，兩邊都沒被這張表回答。詳見 §12.24 第三段。

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

**2. `已排除` 靜態 `class` 與綁定 `:class` 併用。** 當時把 `class="DexCell"` 加 `:class="booting ? 'CardReveal' : undefined"` 改寫成單一運算式，兩個修正同一輪做，所以無法判斷這一項是否也是成因，記為待查。

**後續一個 bug 排除了它。** 世代與排序鈕的選中狀態完全看不出來，成因查出來是**普通的 CSS 級聯順序** —— `.ChipOn` 寫在 `.Chip` 上面，兩者同為單一 class 選擇器、權重相等，於是後者的 `background-color` 蓋掉前者。（屬性鈕之所以正常，純粹因為那一對的順序剛好是對的。）

關鍵在於這個推論本身：**一條規則要能「被後面的規則覆蓋」，前提是它真的套到元素上了**。若 vue-lynx 沒有合併靜態與綁定 class，`ChipOn` 根本不會出現在元素上，那麼調整 CSS 順序就不可能改變任何結果 —— 而調整順序確實修好了它。所以**合併是正常的**，`class` 與 `:class` 併用可以放心寫。

因此揭示動畫不播的成因**只有第 1 項**，也就是計時器。單一運算式的寫法保留著，因為它仍然少一個間接層，但不是必要的。

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

> **可視範圍視窗已於 2026-08-10 啟用**（`window-visible-range`，§12.27）。`<scroll-view>` 仍然是容器，
> 但三處長序列不再把全部項目掛上去——這正是本節結尾說的「設計時準備的視窗化退路」，它的觸發條件由
> §12.24 的成本模型滿足。**這不改變本節對 `<list>` 的結論**：視窗化必須自己寫，正因為 `<list>` 不能用。

**因此網格切片改用 `<scroll-view>`**。原本選 `<list>` 的理由是「scroll-view 不回收」，但 vue-lynx 也沒有真的交付回收 —— 所以選 `<list>` 換不到回收，還要賠掉篩選與排序的正確性，取捨的兩邊都是負的。208 筆是有界的已知集合，記憶體改成在裝置上實測而不是靠元素選擇來假設。

**重新評估的觸發條件**：vue-lynx 實作了 `removeAction` 與 `updateAction`。屆時 `<scroll-view>` 換回 `<list>` 的改動範圍限於網格元件一處。**這是「當時 list 不能用」，不是「這個專案偏好 scroll-view」** —— 不要把它讀成後者。

#### ✅ 觸發條件已複驗一次：仍未成立（2026-08-10）

因為有人提議「改用原生虛擬列表 `<list>` / `<list-item>` 做 Native 層回收」而重驗。**結論不變，而且證據更明確：**

| 查了什麼 | 結果 |
|---|---|
| 上面三個位置對**目前安裝的 0.4.0** 逐條複驗 | **三條全部一致**，一字未改 |
| npm 現行 `latest` = **0.5.1** 的 `list-apply.js` | 與 0.4.0 **位元組相同**（`diff` 無輸出）。版本號跳了，這個檔案沒動 |
| `1.0.0` | tarball **171 bytes**，解開只有一個 `package.json`、**零程式碼**。是佔位不是發行 |
| 「每次查詢改變就重建 `<list>`」這條退路 | 仍然行不通。`resetListState()` **只被 `resetMainThreadState()` 呼叫**，那是整頁重置（連 element registry 都清空、page id 歸 1），**不是元素卸載時的清理路徑**。四個以 list id 為鍵的 Map 在頁面生命期內只增不減 |
| vue-lynx 有沒有把回收相關的東西傳給原生 | 有：`reuse-identifier`、`recyclable` 會以 platform-info 屬性傳下去。**所以能回收的是原生 list，不是 vue-lynx** —— 但框架只送得出 `insertAction`，原生永遠收不到移除與更新，序列一變短或重排就對不上 |

**所以「用 `<list>` 換 Native 回收」在本專案目前不成立**，理由不是偏好、不是沒試過，而是框架綁定只實作了尾端追加。
下次再有人提，先跑上表第二列（比對 npm latest 的 `list-apply.js`）—— 那一列變了，整條結論才需要重開。

已排除的替代方案：每次查詢改變就重建整個 `<list>`（內部狀態以 list 的 id 為鍵存在 `Map` 裡且沒有對應的清理路徑，每次按鍵都會留下一份 → 記憶體無界成長）；打 patch 自己實作 `removeAction`（要摸索 native 的 `update-list-info` 協定，只有在裝置上才驗得出來）。

#### `<scroll-view>` 承載 208 張卡的實測結果（iOS 實機，2026-07-29）

**⚠️ 這一段的結論已於 2026-08-10 被數字修正。** 當時目視判定「無明顯卡頓」，而後來量到未篩選網格最慢
sprite 是 **2327ms**（§12.24）——目視看不出兩秒的等待是因為卡片是逐張出現的。視窗化已啟用（§12.27），
下面這段保留為當時的判斷紀錄。

**可接受，退路不啟用。** 從第一張捲到第 208 張，全程無空白卡、無錯配內容、無明顯卡頓。

所以「208 筆不回收會不會太重」這個問題的答案是不會 —— 卡片結構淺（兩層 view、七個文字節點、一張圖），sprite 是外部資源不佔 bundle。設計時準備的視窗化退路（以捲動位移推算可見區間、只渲染區間加前後各一屏）**不需要啟用**，記在這裡以備資料集日後變大時參考。

注意這個結論綁在「208 筆、這個卡片結構」上。詳情面板切片會加入更深的節點樹，屆時要重新量而不是沿用這個結論。

### 12.15 ✅ 覆蓋層用 `Root` 內的 absolute 兄弟節點成立（詳情面板切片）

| | |
|---|---|
| 狀態 | `實測`（2026-07-29，詳情面板外殼切片） |
| 為什麼要驗 | 整個移植到此為止沒有任何脫離正常流的定位（`App.css` 全檔只有一處 `position: absolute`，是卡片的圖像佔位），而 Lynx 對 `position: fixed` 沒有明確承諾。詳情面板是第一個需要覆蓋層的東西，賭錯的代價是面板被 `Screen` 的 12px padding 框住 —— 看起來像樣式沒生效，而不是像定位不支援 |
| 驗法 | 面板與遮罩掛在 `Root` 的直接子層（與 `Shell` 同級），四個位移全部歸零；`Root` 加 `position: relative` 當包含塊。點卡片開啟，看覆蓋層有沒有蓋過 `Screen` 的 padding |
| 結果 | **滿版成立**。絕對定位的子節點從 padding 邊起算，所以 `Root` 的 12px padding 也被蓋住。`position: fixed` 完全不需要，退路（詳情整頁取代網格）**不啟用** |

一併確立的三件事：

| 項目 | 結果 |
|---|---|
| 標題列放在 `<scroll-view>` **外面**取代 `position: sticky` | 成立。內容捲動時標題列不動，而且不必知道 Lynx 是否支援 sticky |
| `@keyframes` + `steps()` 用在覆蓋層（`veilIn` / `sheetIn`） | 跳格可見，與 §12.14 在網格上的結論一致 |
| 面板用 `v-if` 掛載／卸載而非 `v-show` | 開關重複多次無異狀。捲動位置「每次開啟都在頂端」因此不需要任何程式介入 —— 新掛載本來就在頂端 |

**遮罩不沿用設計稿的 `rgba(0, 0, 0, .66)`**：半透明疊在網格上會合成出四階灰以外的顏色，違反 §11 的「POCKET 的 UI 顏色數」不變式。改用不透明的 `var(--bg)`（POCKET 是 tone 0、MODERN 是既有背景色），顏色數不變。代價是網格不再從遮罩後方透出來。**這不是簡化，不要改回半透明。**

注意這一節只答了外殼。**面板裝滿內容後的節點樹深度與捲動流暢度仍要重新量** —— §12.13 結尾那句話對這個切片依然有效。

### 12.16 詳情面板與設計稿的偏離清單（每一項都有平台原因）

移植不是轉檔。下面每一列都是平台迫使的改寫，不是簡化或偏好 —— **在改回設計稿的寫法之前先讀這一列的理由**。

| 設計稿 | 這裡的做法 | 為什麼 |
|---|---|---|
| `.panel{overflow:auto}` 疊 `.mvwrap{max-height:400px;overflow:auto}` | 面板本體一個 `<scroll-view>`，**招式表一個**（`bound-learnset-scroll` 批次翻案，見 §12.19） | 原本記的是「面板只有一個」，理由是巢狀同向捲動會搶同一個手勢。**這一列已被推翻**：例外給了招式表，其餘區段仍然一個都不准。禁令的出處也記錯了 —— 面板內的那條在 `species-detail` 的 spec，`dex-grid` 那條說的是網格不得嵌在別的捲動容器內，兩者只是措辭相同 |
| 標題列 `position: sticky` | 標題列放在捲動容器**外面** | 效果相同，且不必賭 Lynx 是否支援 sticky |
| `.veil{background:rgba(0,0,0,.66)}` | `var(--bg)` + `opacity: 0.66`，**兩個模式都一樣** | 合成結果與原稿相同，但用 `opacity` 而非寫死 `rgba`，不必命名 theme 層不擁有的顏色。**這讓 POCKET 疊出四階灰以外的中間色，所以 §11 的顏色數不變式已明列例外**（sprite 圖像 + 詳情遮罩兩項，見 `retro-theme` spec）。曾經做成不透明、又改成只有 MODERN 半透明，最後定為兩個模式都壓暗 —— 不透明的遮罩會讓面板不再讀成「疊在圖鑑上」，而那是它覆蓋而非取代網格的理由。**例外只給這一層，其他表面用半透明算違規不算前例** |
| 面板 `max-height: min(92vh, 900px)` + 內容 `flex: 1` | **捲動容器自帶 `height: 60vh`**，面板由內容決定高度 | 只有 `max-height` 時面板沒有確定高度，捲動容器沒有界線可解析 → 長到內容高度、什麼都不捲、標題列吃滿可見區。**這是本文件開頭那條高度鏈的同一個失敗模式，第二次踩到。** 代價：資料少的種類捲動區下方會有空白 |
| `position: fixed` 的面板與遮罩 | `Root` 內的 absolute 兄弟節點 | 見 §12.15。已實測成立 |
| `.panel{top:50%;left:50%;transform:translate(-50%,-50%)}` | 覆蓋層 `align-items/justify-content: center`，面板 `max-width: 620px` | 置中改用佈局而非位移 —— 設計稿的 `translate` 只是因為 viewport-fixed 元素沒有可對齊的父節點。**曾經誤做成底部抽屜**（理由是設計稿 ≤520px 的媒體查詢是抽屜），但那是原稿的窄螢幕變體不是它的樣貌，實機看起來完全不像。已改回置中對話框 |
| 各方框邊框 `var(--px)` = **3px**、面板外框 `calc(var(--px)*2)` = **6px** | 同值 | **曾經全部寫成 1px**，結果是細線卡片而不是粗邊像素方框 —— 這是「移植版整體視覺不對」的主因。`--px` 是 3px，移植版不用基底單位而寫字面像素，所以每個值都要自己乘完再寫 |
| 四處 `box-shadow: inset`（大圖舞台、特性方塊、種族值凹槽、招式表外框） | 全部改為有邊框的 view | §12.3。**`pnpm run check` 現在會擋下任何 inset 陰影** |
| 三處 `display: grid`（`dl.kv`、`.strow`、招式列） | flex + 固定欄寬 | `App.css` 零處 grid，沒有必要在這批引進未驗的佈局模式。標籤固定寬、值 `flex: 1`，對齊結果相同 |
| 四處 `title` 提示（屬性中文名、形態鈕屬性、招式另一語言名、傷害類別全名） | 前兩者：資訊直接寫進藥丸與鈕（藥丸中文模式顯示「草 Grass」）。後兩者屬招式表 | 觸控裝置沒有 hover。**不是延後做替代物，是不需要** |
| `sp.f.forEach(f => new Image().src = …)` 預熱其他形態 | 移除 | 平台沒有 `Image` 建構子。切換形態時大圖會有一次載入延遲，期間顯示的是屬性字符佔位而不是空白 |
| `.mvwrap{max-height:400px;overflow:auto}` 招式表自帶捲動區 | **已改為自帶捲動區**，但高度是 `36vh` 而非設計稿的 400px，且只在顯示列數 > 12 時才套（`bound-learnset-scroll` 批次，見 §12.19） | 原本記的是「不設高度上限、不設捲動容器，105 列全部展開」，代價寫成「資料多的物種面板很長」。**那句代價的描述本身也不精確**：面板捲動區是固定 `60vh`，面板從來沒有變長，長的是它的捲動內容（#475 實測 3600px）。翻案的真正理由與量到的數字都在 §12.19 |
| `.mvrow.hd{position:sticky;top:0}` 黏著表頭 | 表頭放在招式表捲動容器**外面**（原本是流內的第一列） | 招式表有了自己的捲動區之後，表頭留在流內會在捲到第 50 列時變成六個沒有標籤的欄位。做法沿用面板標題列，不用 sticky。共用 class 仍是欄位對齊的來源 —— 跨捲動邊界之後唯一會破壞它的是捲軸佔寬，實測沒有發生（§12.19） |
| `.mvrow{display:grid;grid-template-columns:18px 1fr 28px 44px 44px 34px}` | flex + 固定欄寬（字符 18／名稱 `flex:1`／類 28／威力 44／命中 44／PP 34） | §12.16 既有的同一條理由：`App.css` 零處 grid。web 實測 63 列的六欄左緣完全一致 |
| `.mvrow .num{font-variant-numeric:tabular-nums}` | **移除**，改以固定欄寬 + 右對齊 | 見 §12.17。像素字型的數字本來就不等寬，而平台的字型註冊不吃 font-variant 描述子 —— 留著一行不會生效的宣告會讓後人以為對齊已經處理好了 |
| `.mvrow .dash{color:var(--ink2);opacity:.6}` | 只用 `var(--ink2)`，**不加 opacity** | 半透明疊在有色表面上會合成出四階灰以外的值。詳情遮罩是唯一被允許這樣做的一層（§12.16 該列），破折號不在例外內 |
| `.mvrow.stab .mn::after{content:"★"}` | 真的 `<text>` 節點，放在名稱之後 | 平台沒有 `content` 屬性。名稱欄是 `flex:1`，所以星號的寬度被它吸收，有星號與無星號的列**數值欄仍然對齊**（web 實測：兩種列的六欄左緣同為 195/223/267/311） |
| 招式列 `img.title = typeName(...)`、`.mn` 的另一語言名、`.dc` 的傷害類別全名三處 hover 提示 | **全部移除，不補替代物** | 觸控裝置沒有 hover。另一語言名透過既有的語系鈕就整表切換（web 實測：切換後 72 個名稱全換、列數欄數列高欄左緣全部不變），而設計稿選擇單一名稱欄的理由正是兩種語言在長表上太吵；傷害類別是三值封閉集合且同一列已有屬性字符。**不是延後做替代物，是不需要** |
| `.mvrow.stab .mn::after{content:"★"}` | 真的 `<text>` 節點（形態鈕的 MEGA 星號已照此做） | 平台沒有 `content` 屬性，偽元素的星號根本不會出現 |
| `openDetail(sp, i, true)` 自己存取 `scrollTop` | **不寫任何捲動位置的程式** | Vue 的響應式更新只換掉變動的節點，捲動位置本來就留著。設計稿要存取是因為它把內容整個重建。**不要「補」上去** |
| `form.n`（每個形態的備註） | 只讀種類層級的 `species.n`，且只在基本形態顯示 | 屬性裡沒有這個欄位，360 個形態也一筆都沒有 —— 設計稿是在防禦它自己的 pipeline 從不產出的形狀 |
| Literata（`Lit`）散文面 | **已內嵌**（`embed-prose-face` 批次）| 詳情面板切片時是系統字型佔位，現已改為釘住的靜態實例 + subset，35.8 KB。處理步驟、正確的體積數字、以及 `※` 那個 bug 都在 §12.2 |

一併記下一個**靜默失效的 bug 與它的成因**：形態鈕的 MEGA 星號原本用 `var(--ink)`，而 POCKET 的 `--accent` 與 `--ink` 都是 tone 0 —— 選中的鈕上，星號與背景同色，星號直接消失。修法是給它 `FormChipStarOn`（`var(--accent-ink)`），與標籤的做法一致。

**注意 `check-styles.mjs` 看不到這一類問題**：它檢查的是「`.XOn` 有沒有被寫在 `.X` 上面而被取消」，而這裡的問題是**根本沒有 `.XOn` 規則**。缺一條規則與順序寫錯是兩件事。凡是會出現在 accent 背景上的文字或字符，都要自己確認有對應的 `On` 規則。

### 12.17 招式表切片的平台事實（2026-07-30）

移植的最後一塊。三件事在動手前量過並改變了做法，一件事被新的檢查接管，一項驗收掛帳。

#### 像素字型的數字**不是等寬**，所以 tabular-nums 這條路本來就不存在

| | |
|---|---|
| 狀態 | `資產實測` 確立（直接讀兩個 TTF 的 `hmtx`） |
| 量到什麼 | Silkscreen 的數字 advance 有**兩種值**：Regular 是 625／750，Bold 是 750／875（`1` 比其他數字窄）。不是等寬字型 |
| 設計稿怎麼處理 | `font-variant-numeric: tabular-nums` |
| 為什麼搬不過來 | §12.2 已確立平台的 `@font-face` **不支援 font-variant 描述子**。所以那條宣告在這裡不會生效 |
| 已採行 | 三個數值欄各給固定寬度並右對齊。對齊的是**每一欄的右緣**，那正是掃讀一欄數字時眼睛跟的線；數字內部不逐位對齊，三位數以內看不出來 |
| ⚠️ 不要「補」回去 | 留著一行不會生效的宣告，會讓後人以為對齊已經處理好了。這與散文面那批移除 `font-optical-sizing` 的理由相同 —— **樣式表不得出現 `font-variant-numeric`** |

#### 單列截斷成立，而且比預期寬鬆得多

| | |
|---|---|
| 狀態 | `web 實測`；`iOS 實機` 掛帳（見表末） |
| 怎麼做的 | 名稱元素的 `text-maxline="1"` **屬性** + 樣式表的 `overflow: hidden` 與 `text-overflow: ellipsis`。一開始寫成 CSS 的 `text-maxline: 1`，那是無效的，見下 |
| 為什麼與卡片相反 | 卡片的物種名**折行**（`species-card` spec 明文要求）。表格不能折 —— 105 列掃讀依賴列高一致，一列變兩列會讓眼睛在欄之間跳位 |
| ⚠️ web 實測作廢 | 原本這裡記著「375px 下 `Stomping Tantrum` 147px、`Burning Jealousy` 131px，兩者都沒被截斷」。**那組數字是用系統字型量的，不成立** —— web 預覽載不到 Silkscreen，見下面「web 預覽量不到文字寬度」。實機回報 `Burning Jealousy` 會折行 |
| 為什麼是它先出問題 | 它是本系招式，所以名稱後面多一個星號；名稱欄是 `flex:1`，星號吃掉約 16px，於是它比不帶星號的 `Stomping Tantrum` 先撞到上限。**星號不是成因** —— 成因是單列限制從未生效，見下 |
| 所以截斷是邊界情況不是常態 | 面板是 `width:100%` 上限 620px，名稱欄拿到的空間遠比卡片多。截斷路徑在這個資料集上幾乎不會走到 |
| 退路（**未採用，已量過並否決**） | 「名稱欄字級縮小」這條退路實際上不成立：把最寬的名稱塞進當時那個被餓死的 131px 欄位需要 **9.8px**，比同列每個數字都小。真正的修法是加寬欄位，見下 |

#### 星號被 `flex:1` 的名稱欄吸收，所以數值欄仍然對齊

| | |
|---|---|
| 狀態 | `web 實測` |
| 疑慮 | 星號是名稱之後的第七個節點，直覺上會把後面的欄位往右推，害有星號與無星號的列對不齊 |
| 實測 | 不會。名稱欄是 `flex:1`，它吸收星號的寬度。63 列（16 有星號、47 無）加表頭，六欄左緣**完全一致**（類 195／威力 223／命中 267／PP 311），PP 右緣同為 345。這一項不受字型影響 —— 量的是固定欄寬的位置而不是文字寬度，所以系統字型下的結果仍然成立 |
| 為什麼 | 固定欄寬的總和不變，`flex:1` 的那一欄承擔全部差額。這是選 flex 而不是 grid 順帶得到的性質 |

#### 字符對比從「文件記載」升級為「機械守門」

| | |
|---|---|
| 狀態 | 已接進 `pnpm run check` |
| 為什麼要做 | 本批把字符的目標背景從三個擴充為五個（新增面板底色與次表面）。§9 的「字符填色依所在背景決定」一直是靠文件與人工計算撐著，而漏改的症狀是**字符消失**，不是報錯 |
| 新增什麼 | `scripts/check-contrast.mjs`。它**從主題原始碼讀出調色盤**（18 個屬性色、4 階灰、10 個 MODERN token），不另存一份副本 —— 副本會漂移，而讀到過期副本的檢查比沒有檢查更糟 |
| 三道防線 | ①解析數量不符就非零退出（regex 悄悄少抓等於什麼都沒檢查）②`GlyphSurface` 宣告的成員與檢查已知的集合不一致就非零退出（**新增第六個背景時不會被靜默略過** —— 最新的那個最可能是錯的）③任一組合低於下限 2.5 就非零退出並印出填色與背景值 |
| 只算真的會渲染的組合 | POCKET × typechip **被排除**：屬性鈕只在准許花屬性色的模式下存在，POCKET 的篩選鈕維持平面表面、字符走 `surface`。量一個介面不會渲染的組合，與量錯背景是同一種不誠實 |
| 已驗證它會失敗 | 把毒的屬性色改暗 → 三個組合各自被指名（含填色與背景 hex）；在 `GlyphSurface` 加一個假成員 → 被指名為未量測。兩項都在改回後恢復通過 |
| 目前的九個組合 | 見下表。與 `retro-theme` spec 的表格逐格相符 |

| Mode | Surface | 下限 | 上限 |
|---|---|---|---|
| POCKET | surface | 15.86 | 15.86 |
| POCKET | panel | 15.86 | 15.86 |
| POCKET | surface2 | **7.52** | 7.52 |
| POCKET | accent | 15.86 | 15.86 |
| MODERN | surface | 2.95（毒） | 9.71（電） |
| MODERN | panel | **3.39（毒）** | 11.18（電） |
| MODERN | surface2 | **2.53（毒）** | 8.34（電） |
| MODERN | accent | 15.97 | 15.97 |
| MODERN | typechip | 4.47（火） | 11.42（電） |

**下限從 2.9 降為 2.5，這是刻意的。** 本系列的底色是次表面，MODERN 在它上面有三個屬性低於舊下限：毒 2.53、龍 2.71、幽靈 2.89。這延續 §11 已載明的取捨（MODERN 把屬性色畫在卡片表面時，毒／龍／幽靈／惡四個屬性在 3.5 以下，那是「MODERN 就是要花顏色」的選擇），而**星號是不依賴顏色的第二訊號**，所以本系與否在對比最差的屬性上仍讀得出來。要改回 2.9 就得拿掉本系列的底色，而底色是「一眼掃出哪些是本系」的來源。

#### `★`（U+2605）沒有任何內嵌字型帶它 —— 而這是對的

| | |
|---|---|
| 狀態 | `資產實測` |
| 怎麼發現的 | 本系標籤 `★ 本系` 進了字串表，`pnpm run check` 的散文面覆蓋檢查立刻失敗 |
| 量到什麼 | Silkscreen Regular／Bold（各 226 字）與 subset 後的 Literata（205 字）**都沒有 U+2605** |
| 為什麼不是 bug | 形態鈕的 MEGA 星號早就走同一條路，而它在前批的 iOS 驗收裡是可見的。§12.2 已確立**字元穿透是逐字的**，所以星號穿透到系統字型、旁邊的像素字名稱不受影響 |
| 已採行 | 把它寫成有理由的排除，與 `※` 同一處。但**沒有塞進 `isEastAsian`** —— 星號既不是東亞字也不是參考標記，那個函式已經因為 `※` 而名不符實。改為獨立的 `isUncoveredMark`，一個條目就是一句對某個字元的主張加它的理由，而範圍檢查沒辦法帶理由 |
| 教訓 | 那條覆蓋檢查的語料是「字串表的**所有**字面值」，刻意寬於散文。所以它會對非散文字元誤報 —— 誤報時的正確處理是**判斷該字元是否真的由散文面繪製**，不是反射性地放寬 subset 範圍（星號放寬也拿不到，上游 Literata 沒有它） |

#### `text-maxline` 是**屬性**不是 CSS property（實機回報後才發現）

| | |
|---|---|
| 狀態 | `文件` + `iOS 實機回報` 確立 |
| 症狀 | 招式表最長的名稱在手機上**折行**，儘管樣式表寫著 `text-maxline: 1` |
| 真相 | 官方文件一律寫成 `<text text-maxline="1">` —— 它是**元素屬性**，而且要同時設 `overflow: hidden`。寫在 CSS 裡是一條**靜默無效**的宣告 |
| 為什麼 web 沒抓到 | 見下一節。web 預覽用系統字型畫拉丁字，比 Silkscreen 窄，所以在我量的寬度下沒有任何名稱需要截斷 —— 那條無效宣告根本沒被考驗 |
| 已採行 | 屬性移到模板的 `<text>` 上，樣式表只留 `overflow: hidden` 與 `text-overflow: ellipsis`，並在註解裡寫明「限制不在這裡」 |
| 這是第三次踩同一類坑 | §12.7 的 CSS 變數名被 hyphenate（`--accentInk` 落成 `--accent-ink`）、§12.8 的字型 URL 變成抓不到的 scheme，加上這一條。**共同點是宣告寫得下去、看起來合理、平台不報錯、行為就是沒有發生。** 凡是「宣告了但沒效果」的懷疑，先確認它是不是根本不屬於這一層 |

#### 名稱欄被固定欄餓死（實機回報截斷後才算清楚）

| | |
|---|---|
| 狀態 | `web 實測`（載入真字型）+ `iOS 實機回報` |
| 症狀 | 單列限制改成屬性之後生效了，但最長的本系招式名變成 `BURNING JEALO…` —— 截斷比折行更難讀 |
| 為什麼 | 設計稿的欄寬 `44/44/34`（威力／命中／PP）加類別欄 28px 共 150px，是為**不窄於 500px 的瀏覽器**調的。手機上那些餘裕直接從名稱欄扣掉 |
| 實需 vs 給定 | 每個固定欄最寬的內容都是**表頭**而不是數值（沒有招式威力超過三位數、PP 超過兩位數）：`PH` 16.5、`PWR` 26.1、`ACC` 24.8、`PP` 16.5（11px 下量測）。150px 裡浪費了約 52px |
| 已採行 | 收緊為 `22/32/32/24` 共 110px，名稱欄從 147px（有星號 131px）變成 **187px（有星號 171px）**。名稱字級**維持設計稿的 12px** |
| 結果 | 全部 496 筆招式名在四種目標寬度、最壞情況（有星號的列）下**零筆溢出**。最窄的 375px 餘裕 10.5px。截斷宣告保留當守門，但現在沒有東西會碰到它 |
| ⚠️ 我第一次算錯了寬度鏈 | 原本估名稱欄有 171px（有星號 155px），實際是 147px／131px —— **漏算了 Root 的 12px padding 會從覆蓋層透出來**（§12.15 記過絕對定位子節點從 padding 邊起算，但我沒把它算進寬度）。正確的鏈是：螢幕 − Root padding 12×2 − 面板邊框 6×2 − 區塊 padding 12×2 = 列寬。**改欄寬之前先量 DOM，不要只推算** |

#### ⚠️ web 預覽量不到文字寬度 —— 它用的是系統字型

| | |
|---|---|
| 狀態 | `web 實測` |
| 為什麼要單獨記 | §12.5 已經記了 web 的 `@font-face` 在 shadow root 裡不生效，但那節的結論是「影響預覽不影響真機」。**還有一個後果沒寫到：任何在 web 上量到的文字寬度、換行位置、截斷與否都是錯的**，因為畫的是系統字型 |
| 實測差距 | 同一個 `Crabominable`，web 預設下名稱高度 18px（單列）；把 `@font-face` 注入 host document 之後變成 **32px（兩列）**。折行與不折行的差別 |
| 正確做法 | 按 §12.5 的指示先把三條 `@font-face` 注入 host document（可從 shadow root 的 `<style>` 抓出來，字型是 base64 內嵌的），`await document.fonts.ready`，**再**量任何寬度 |
| 教訓 | 「在 web 上量到 X 沒問題」對排版問題不是證據。這一條讓招式名截斷與卡片名折行兩個問題都在 web 上顯示為正常 |

#### flex 屬性在 web 目標會被改寫成沒人消費的自訂屬性

| | |
|---|---|
| 狀態 | `web 實測` |
| 現象 | 樣式表寫 `flex: 1` 或 `flex-grow: 1`，注入 shadow root 的 CSS 裡變成 `--flex: 1` / `--flex-grow: 1`。對某些元素有規則把它讀回去（`.DexGrid` 的 computed flex 是 `1 1 0%`），對 `.Card` 與 `.CardBevel` **沒有** —— 全檔搜不到任何 `flex-grow: var(...)` 的消費規則，computed 值是 `0` |
| 也就是說 | `.DexCell` 既有的 `flex-shrink: 0` 在 web 上同樣是無效的。它沒出問題純粹因為 `width: 50%` 本來就精確 |
| 已採行 | 卡片填滿儲格改用 `height: 100%` 而不是 flex 成長。**非 flex 屬性是原樣通過的**（`width: 50%`、`padding: 3px` 都在），所以普通屬性可靠 |
| ⚠️ 驗證方式 | 不要看樣式表就相信 flex 生效了。**量 computed 值**，或者量實際版面。這一條與上面兩條是同一類：宣告寫得下去而效果沒有發生 |
| 未驗 | native 是否也如此。Lynx 在原生自己解析 CSS，`flex-grow` 是有文件的，所以很可能只有 web 目標這樣。但 `height: 100%` 兩邊都成立，沒必要為此分岔 |

#### 同列卡片高度不齊（實機回報，已修）

| | |
|---|---|
| 狀態 | `web 實測`（載入真字型後）+ `iOS 實機回報` |
| 症狀 | 名稱折行的卡片（英文主導下的 `Crabominable` #740、`Meowscarada` #908）比同列鄰居高，而**鄰居不會跟著拉高** —— 較短那張的下緣與被拉高的儲格之間留一段空隙 |
| 成因 | `.Cards` 是 `flex-wrap: wrap`，預設 `align-items: stretch` 所以**儲格有被拉高**；但 `.Card` 沒有高度、在欄向 flex 容器裡不會成長，於是卡在自己的內容高度 |
| 量到什麼 | 375px、英文、真字型下：#740 卡片 209px、#745 卡片 193px，下緣差 **16px**。全 104 列有 3 列不齊 |
| 已採行 | `.Card` 與 `.CardBevel` 都給 `height: 100%`（不用 flex，理由見上一節），`.DexCell` 明確宣告 `display: flex; flex-direction: column` 而不倚賴平台預設。修後全 104 列零不齊，#740 與 #745 同為 209px |
| 折行本身不動 | `species-card` spec 明文要求名稱折行而非截斷。**這一項修的是列高不齊，不是折行** |

#### 中文的本系篩選標籤是「★ 屬修」

UI 上那顆鈕的中文標籤是 `★ 屬修`（屬性修正），不是更直譯的「本系」。**文件與程式註解仍然把這個概念叫「本系加成」** —— 只有控制項用短標籤，因為四個字的概念名放不進三顆排序鈕旁邊。英文標籤是 `★ STAB`。

#### ✅ iOS 實機已結清（2026-07-30）

| 項目 | 結果 |
|---|---|
| 105 列（艾路雷朵 #475）的捲動 | **正常。** 從第一列捲到第 105 列無空白列、無錯配內容、無卡頓。**視窗化退路不啟用** —— §12.13 結尾與 §12.15 結尾要求的「面板裝滿內容後重新量」到此結清，答案與網格的 208 張卡一致：這個量級不回收是可接受的 |
| 名稱單列且完整 | **成立。** `Burning Jealousy`（16 字元，且是本系招式所以帶星號、是最壞情況）在手機上完整顯示不截斷。這同時確認了兩件事：`text-maxline` 作為**屬性**在實機生效，而收緊固定欄寬之後名稱欄真的夠寬 |

**注意這兩項是依實機回報結清的，`shots/` 沒有留下對應截圖。** 若日後要重跑回歸，重建條件是：iOS 實機、英文主導、開 #157 火爆獸看 `Burning Jealousy`、開 #475 艾路雷朵捲到底。

**Android 依專案當前決定不在範圍內。** §10 的兩筆 Android 掛帳保留為紀錄，但**該節的阻擋性標題已於 2026-08-08 移除** —— 這一句是權威，§10 現在指回這裡。要翻案就改這裡，不要只改 §10。

### 12.18 佔位字承諾了規格沒要求的東西（2026-07-30，已修）

搜尋框的佔位字寫著「名稱 / 編號 / 屬性 / 形態」，而實作**只比對兩個物種名**。搜 `475` 得到零結果，搜 `dragon`、`mega`、`阿羅拉` 也一樣。

**成因是兩件各自正確的事合起來出錯，這是值得記住的部分：**

| 哪一半 | 它做對了什麼 | 它漏了什麼 |
|---|---|---|
| 實作 | 完全符合 `dex-query` 的需求「Search matches across both languages at all times」 | 那條需求只涵蓋**物種名**的跨語系比對 |
| 佔位字 | 從設計稿的 I18N 表原樣搬過來，字面正確 | 它描述的是**設計稿**的行為（設計稿的 haystack 有九類欄位） |

所以既有的 spec 檢查、樣式檢查、屬性檢查、iOS 驗收表全都不會抓到 —— **缺的東西從來沒有被要求過**，而唯一說出它應該存在的地方是一句 UI 文案。

**教訓：從設計稿原樣搬過來的字串會把設計稿的行為一起承諾出去。** 移植時搬字串比搬邏輯容易得多，於是字串會跑在實作前面。凡是描述能力的文案（佔位字、空狀態說明、按鈕標籤裡的欄位名），搬過來的時候都要當成一條待驗的需求，不是一個待翻譯的值。

#### 修法與一個刻意的偏離

語料改為九類欄位並逐詞比對（`每個詞都要命中`，所以 `mega charizard` 成立），細節在 `dex-query` spec。兩件與設計稿不同的事：

**① 不收錄裸羅馬數字世代 token。** 設計稿的 haystack 含 `GEN_ROMAN[sp.g]`，於是搜 `V` 命中 **208 筆裡的 125 筆** —— 任何名稱含字母 v 的物種（Venusaur、Vileplume、Vaporeon…）。單字母 token 命中六成資料集，畫面上與「搜尋壞了」無法區分。`gen5` 沒有這個問題（29 筆，等於世代鈕選 5 的結果集），所以只留 `gen<n>`。順帶一提佔位字承諾的四件事**不含世代**，拿掉裸數字不減少任何承諾。

**② 卡片形態的選擇不能照搬設計稿。** 設計稿判斷形態是否被查詢命中的條件是「該形態標籤含全部查詢詞」，而 **Mega 的標籤嵌著物種名** —— `Mega Charizard X` 含 `charizard` —— 而基本形態的標籤是空字串會被跳過。結果是**搜 `charizard` 顯示 Mega Charizard X**，回歸前批已實機驗收的行為。

改法是先扣掉**物種兩個名字已經滿足的詞**，剩下的才拿去比對形態，然後四層優先序：形態標籤 → 屬性名（**全等**比對，否則「龍」會把任何含龍的詞當屬性）→ 屬性鈕 → 基本形態。

這造出一個看起來不一致但正確的結果，**改它之前先讀這一段**：

| 查詢 | 顯示 | 為什麼 |
|---|---|---|
| `charizard`／`噴火龍` | 基本形態 | 名字滿足了全部詞，沒有剩餘詞 |
| `dragon` | 超級噴火龍Ｘ（火／龍） | `dragon` 不在名字裡，只能是屬性 |
| `龍` | 基本形態 | 「龍」在「噴火龍」裡，被扣掉了 |

`dragon` 與 `龍` 顯示不同的形態不是 bug。**查詢最具體指認了什麼，卡片就回答什麼** —— 前者只可能是屬性，後者是這個物種名字的一部分。

順帶一個實測數字：`龍` 命中 25 筆而不是 19 筆（屬性鈕 Dragon 是 19 筆），多出的六筆是中文名含「龍」但不是龍屬性的暴鯉龍、化石翼龍、戰槌龍、護城龍、龍頭地鼠、冰雪巨龍。屬性中文名與物種中文名在同一個語料裡，而部分名稱比對是既有需求 —— 這是**預期值**，已寫進 spec 的 Example，不是待修項。

### 12.19 招式表改為自帶捲動區（`bound-learnset-scroll`，2026-07-30）

§12.16 兩列記著「面板只有一個捲動容器」。**那條禁令已被推翻**，例外只給招式表一層，其餘區段仍然一個都不准。這一節記翻案的平台事實、量到的數字，以及一項尚未結清的實機驗收。

#### `<scroll-view>` 沒有巢狀捲動的仲裁屬性 —— `enable-nested-scroll` 是 `<list>` 的

| | |
|---|---|
| 狀態 | `文件實測` 確立（官方 `scroll-view` 屬性表逐項比對） |
| 量到什麼 | `<scroll-view>` 的屬性只有 `bounces`、`enable-scroll`、`scroll-orientation`、`initial-scroll-offset`、`initial-scroll-to-index`、`upper-threshold`、`lower-threshold`、`scroll-bar-enable`。**沒有 `enable-nested-scroll`** —— 那個屬性（預設 `true`、內層先捲）屬於 `<list>` |
| 所以 | 兩層垂直捲動誰吃手勢，在這個平台**沒有可設定的旋鈕**。這不是「照文件設一下就好」的事 |
| 為什麼不改用 `<list>` | §12.13：vue-lynx 只實作尾端追加。招式表有三種排序與本系篩選，序列會變動 —— `<list>` 換得到仲裁屬性，賠掉的是正確性 |

#### 高度：`36vh` 而非設計稿的 400px，且只在列數 > 12 時才套

| | |
|---|---|
| 狀態 | `web 實測`（375 × 812，已依 §12.5 注入字型） |
| 為什麼不能照抄 400px | 設計稿那個值是為不窄於 500px 的瀏覽器調的。面板捲動區是固定 `60vh`，在 667px 高的裝置上剛好等於 400px —— 招式表會吃掉整個可見區，面板變成只有招式表 |
| 量到的列高 | **24px**（不是估算的 22px）。所以 36vh 在 667px 下容 10 列、812px 下容 12 列 |
| 門檻為什麼是 12 | 門檻取 12 使「有界但沒有東西可捲」這個狀態在兩種高度上都到不了：第一個有界的情況是 13 列，13 × 24 = 312px 已超過 292px 的視窗 |
| ⚠️ 兩個值是同一個決定 | 門檻常數在 `LearnsetTable.vue`、高度在 `App.css`，兩處註解互相指名。改一個不改另一個就會生出上面那個狀態 |
| 短表不套高度 | 變隱怪（1 列）實測：容器無 class、高度 24px 等於內容、不可捲、最後一列下方空白 **0px**。永遠有界會在特性與面板底部之間留一個約 290px 的空方框 —— 面板底部的空白讀成「面板結束了」，中段的空方框讀成壞了 |

#### ⚠️ 翻案的理由與原本記的代價都要更正

原本 §12.16 把代價寫成「資料多的物種面板很長 —— 面板由內容決定高度」。**這句話不精確，而且是我提案時照抄的**：

| 量的東西 | 有界後 | 無界（原本） |
|---|---|---|
| 面板高度 | 589px | 589px —— **完全一樣** |
| 面板捲動區視窗 | 487px（60vh） | 487px —— 一樣 |
| 面板捲動區的**內容**長度 | **1372px** | **3600px** |
| 招式表視窗／內容 | 292px／2520px | 2520px／不捲 |

面板從來沒有變長，`60vh` 是固定的。長的是它的捲動內容。所以這次真正換到的是三件事：**表頭在捲動時留得住**、招式表變成一個可掃讀的固定視窗、外層捲動內容從 3600px 降到 1372px。

**沒有換到的一件事要說清楚**：從面板頂端捲到招式表仍然要走 **972px**（約兩屏），這個數字有界前後一樣。提案的動機寫成「要掃讀招式表得先捲過大圖、種族值、特性」，那一半沒有被解決 —— 要解得另外動區段順序或收合，不在這批範圍內。

#### 表頭跨捲動邊界後仍然對齊（捲軸沒有佔寬）

| | |
|---|---|
| 狀態 | `web 實測` |
| 疑慮 | 表頭在捲動容器外、資料列在內。若平台為捲動容器保留捲軸寬度，兩者會差一個捲軸 |
| 實測 | 不會。#475 的表頭與資料列六欄左緣同為 **30／48／235／257／289／321** |
| 退路（未採用） | 若日後某個目標上捲軸真的佔寬，關掉內層的 `scroll-bar-enable` |

#### 門檻看的是當前顯示列數，不是招式總數

`web 實測`：#24 阿柏怪 70 列有界（292px、可捲），開本系篩選後 8 列 → 容器無 class、高度 192px、不可捲、下方零空白；關掉篩選完全復原。資料層算出全 360 個形態裡有 **160 個**會這樣跨過門檻，所以這是常見路徑而不是邊界情況。

#### ✅ iOS 實機已結清（2026-07-30）—— 巢狀同向捲動成立

**這三項只有實機答得出來，web 預覽跑的是瀏覽器的捲動實作而不是 native 的手勢鏈。**

| 項目 | 結果 |
|---|---|
| 手指落在招式表上時捲的是招式表 | **成立。** 內層拿到手勢 |
| 手指落在招式表之外時捲的是面板 | **成立。** 外層沒有被內層搶走 |
| 招式表捲到底之後是否接手外層 | **不接手。** 已預先記為可接受、不阻擋驗收，所以退路不啟用 |
| 表頭在資料列捲動時不動 | **未單獨回報。** 由上面第一項加上「表頭是捲動容器外的兄弟節點」推得 —— 容器內捲動不可能移動容器外的節點，而 web 也實測了六欄左緣一致。**這是推論不是目視**，下次拿到裝置時一眼即可結清 |

**所以「兩層同向捲動會搶同一個手勢」這個顧慮在本平台不成立** —— 手勢依落點分派，沒有 `enable-nested-scroll` 也是如此。這是 §12.16 那兩列原本禁止巢狀捲動的理由，現在有實測答案了。

不接手的代價要說清楚：招式表捲到底之後，**手指必須移到表外才能繼續捲面板**。這件事在這個版面上幾乎不會被察覺，因為招式表是面板的最後一段 —— 捲完它就沒有下一段了，而 292px 的表在 487px 的可見區裡仍留下約 195px 的非表區域可以抓。**若日後在招式表之後再加任何區段，這一項要重新評估**：屆時使用者會需要在表上往上滑卻停住。

重建條件：iOS 實機、開 #475 艾路雷朵。

**已寫好但未啟用的退路**（若日後平台行為改變）：招式表預設收合、標題列既有的列數當提示、點一下展開。它解掉同一個問題而完全不用巢狀捲動，且不需要任何新的平台事實。要切的時候不要試著調參數 —— 沒有參數可調，見本節第一項。

---

### 12.20 氛圍層（ordered dither 暈影）—— 已評估，決定不做（2026-07-30）

§3 把氛圍層列為第七項功能，§9 給了它**四條**設計決策，§11 給了它**三條**檢查項。移植版零實作。這一節結清這個落差：**不是漏做，是評估後決定不做。**

在此之前這是文件狀態最糟的一項 —— `openspec/specs/retro-theme/spec.md` 的四階灰 ramp 需求原本寫著這個 ramp「是之後的 sprite 佔位圖**與氛圍層**的顏色來源」，等於 spec 承諾了一個沒有人在做的東西。**那半句已於本次移除。**

#### 平台障礙

| | |
|---|---|
| 狀態 | `文件實測`（§10 已記元素清單） |
| 障礙 | Lynx 元素清單沒有 `canvas`。設計稿的 4×4 抖動 tile 是 canvas 生成的（§9 第三條決策：「CSS 漸層在非整數裝置像素上會反鋸齒糊掉；canvas 保證點落在精確像素」） |
| 這不是致命傷 | 有可行的替代路徑，見下 |

#### 評估過的替代路徑與代價

| 路徑 | 為什麼不採用 |
|---|---|
| 建置期產出 PNG tile，用 `<image>` 平鋪 | tile 的顏色取自當前模式色盤，而模式可切換 —— 所以要**每模式一組**、每組兩種密度（2/16 與 8/16），共四張資產。這替專案引入第一個建置期資產生成步驟，而目前 `design/pipeline/` 之外沒有任何建置期產物 |
| 以 view 疊出格子 | 4×4 的抖動網格鋪滿外框周圍，是數百個 view 節點。§12.14 已記「208 張卡的首次繪製比直覺慢得多」，為一個裝飾層再加數百個節點的方向是反的 |
| CSS 漸層棋盤 | §9 第三條決策已經否決過，理由在該條 |

#### 決定

**不做。** 為一個純裝飾層引入建置期資產管線（或數百個節點），代價與收益不成比例。氛圍層不承載任何資訊，移植版少了它不會讓任何功能無法使用或無法驗證 —— 這與 footer（唯一的來源聲明）或 tally（唯一的規模陳述）性質不同。

#### 連帶處置

- `openspec/specs/retro-theme/spec.md` 的預告半句已移除。
- `ROADMAP.md` 的 A1 已從「功能差距」移到「已確認不做」。
- §9 的四條決策與 §11 的三條檢查項**原文不動**。那是設計稿的紀錄，不隨移植版的取捨改寫 —— 讀到它們的人由本節得知移植版沒有實作。

#### 重新評估的觸發條件

三者任一成立時這個決定值得重開：

1. Lynx 元素清單加入 `canvas`，或加入其他能在精確像素上生成圖樣的元素。
2. 專案因其他原因已經有了建置期資產生成步驟 —— 屆時四張 tile 的邊際成本接近零。
3. 模式數從二增加，且新模式讓「四階灰以外不得有顏色」的約束鬆動 —— 那會改變 tile 顏色必須隨模式重生的前提。

---

### 12.21 footer 的五段來源說明 —— 已評估，決定不做（2026-07-30）

設計稿的 footer 有六段：陣容與形態、招式、種族值與特性、中文名稱、圖像、字型／版權。移植版
（`surface-dataset-facts`）**只交付第六段**。前五段講資料來源，經討論決定**永久不做**。

#### 決定與代價

| | |
|---|---|
| 交付的 | 字型授權（Silkscreen 與 Literata，皆 OFL）、著作權人、非商業聲明 |
| 不交付的 | 五段來源說明 —— Bulbapedia wikitext 與 learnset 頁、PokeAPI CSV 與繁中命名、PokeAPI/sprites |
| 代價一 | **移植版畫面上沒有任何資料來源聲明。** `README.md` 有，但使用者看不到 |
| 代價二 | §8 那條「第六世代之後是渲染圖」的現況處理在移植版不成立，因為解釋它的圖像段不存在。§8 已標注 |

#### 為什麼這一節存在

`openspec/specs/dataset-statements/spec.md` 明文寫著 footer **不得宣稱任何資料來源**，並附一條
scenario 驗這件事。那是為了讓「沒有來源說明」是一個**被要求的狀態**，而不是一個沒人發現的缺口 ——
ROADMAP 開頭診斷過的失效機制正是「缺的東西從來沒有被要求過」。

#### 重新評估的觸發條件

1. 專案由設計稿轉為對外散布的作品 —— 屆時資料來源聲明的性質從「誠實」變成「義務」。
2. 上游資料來源的授權條款要求標示。目前 Bulbapedia 與 PokeAPI 的使用方式在 `README.md` 已交代，
   但那是給讀原始碼的人看的。
3. 若日後決定重做，`__ROSTER__` 不是障礙：`design/pipeline/build.py:21` 填的是 `meta.roster`，
   而該欄位在 `src/data/dex.json` 的 `meta` 裡，執行期直接讀得到，不需要建置期替換步驟。
   `dex-data` spec 已獨立要求曝露 meta，包含 `roster` 與 `source` 兩個字串欄位。

---

### 12.22 主線程腳本的平台事實（`press-feedback-main-thread`，2026-07-30）

本專案第一次使用主線程腳本（worklet）。這一節記這次量到的五件事。**前三件是關於這個機制本身，
後兩件是關於兩個線程共用一個節點的樣式 —— 那兩件都是通則，任何用得到主線程腳本的地方都適用，不只
按壓回饋。第四件是這次最貴的一條：它推翻了原本的設計，spec 有一句因此改寫。**

失敗形態全是 §12.17 記的第三類：宣告寫得下去、不報錯、行為沒發生。所以這四項一律以「按下去有沒有
動」判定，不以讀原始碼或讀 bundle 判定。

#### 一、主線程事件綁定在本平台成立

| | |
|---|---|
| 狀態 | `iOS 實機實測`（無條件探針：按住模式鈕整顆往右跳 20px、放開回位） |
| 量到什麼 | `vue-lynx` 0.4.0 的主線程腳本在本專案的建置設定下確實生效。背景線程的 `patchProp` 把 `main-thread-` 前綴的屬性轉成 `SET_WORKLET_EVENT` op，主線程的 ops 套用器消費它 |
| 所以 | 「手指按下的當下就畫出反應」在這個平台做得到，不需要等背景線程往返 |
| 若日後為假 | 先確認的不是平台而是三件本地事情，按順序：屬性名拼法（見下一項）、`'main thread'` 指示詞是否為函式的**第一個敘述**、該檔案是否被建置期的 worklet 轉換涵蓋。三者任一不成立，畫面上與「平台不支援」長得一模一樣。**不要從樣式或程式碼推斷，重跑一次無條件探針** —— §12.14 建立 `@keyframes` 時用的就是這個做法 |

#### 二、屬性拼法是 `main-thread-bind` 直接接事件名，中間無分隔符

| | |
|---|---|
| 狀態 | `原始碼實測` + `iOS 實機實測` |
| 正確 | `main-thread-bindtouchstart`、`main-thread-bindtouchend`、`main-thread-bindtouchcancel` |
| 為什麼 | 屬性名去掉 `main-thread-` 前綴後，走的是與一般事件同一套解析 —— `bind` 開頭者視為 bindEvent。所以中間沒有 `-`、沒有 `:`、事件名全小寫 |
| 拼錯的後果 | 靜默。屬性照樣寫得下去、建置照樣通過、按下去沒有反應 |
| 若日後為假 | 從 `vue-lynx` 的 `patchProp` 讀事件名解析，不要從官方文件讀 —— §12.6、§12.13 兩次都是文件與出貨程式碼不一致 |

#### 三、✅ 建置期的 worklet 轉換**涵蓋**元件以外的獨立模組

| | |
|---|---|
| 狀態 | `iOS 實機實測`（同一支探針，函式從 `App.vue` 移到 `src/interaction/press.ts` 後行為不變） |
| 量到什麼 | 標了 `'main thread'` 的函式定義在獨立的 `.ts` 模組、由元件 `import` 進來綁定，轉換照樣生效 |
| 所以 | 主線程函式**集中在一個模組**，五個元件只負責綁定。這是這次採用的做法 |
| 佐證（不是判準） | lynx bundle 裡有 `wkltId` handle、`'main thread'` 字串與 `setStyleProperty` 呼叫。這只能證明轉換跑過，**不能**證明綁定生效 —— 判準仍是實機按下去有沒有動 |
| 若日後為假 | 退路是把函式定義在各元件的 `<script setup>` 內，共用常數以 `with { runtime: 'shared' }` 匯入。代價是同一段兩行邏輯重複在五個元件裡，不是重做設計。**不要預先照退路寫** |

#### 四、⚠️ 主線程寫的行內樣式**不做 `var()` 代換**（通則，這次最貴的一條）

| | |
|---|---|
| 狀態 | `iOS 實機實測`（四臂差異探針，2026-07-30） |
| 量到什麼 | `setStyleProperty` 走 `__AddInlineStyle(el, name, value)`，而 `value` **不經過自訂屬性代換**。`translateY(var(--x))` 解析不到東西，元素完全不動 |
| 探針的四臂與結果 | 字面值 `translateY(20px)` → **動**；`margin-top: 20px` → **動**；`var()` 讀**樣式表**宣告的屬性 → **不動**；`var()` 讀**行內**宣告在 `.Root` 上的屬性 → **不動** |
| 所以（兩件事，不要混） | 1. `transform` 可以在執行期以行內樣式寫入，這條成立。2. 失敗點是 `var()` 本身，**與屬性宣告在哪裡無關** —— 行內宣告那一臂就是為了排除「樣式表宣告的自訂屬性不生效」這個假設而設的，它也不動 |
| 為什麼容易誤判 | 專案裡唯一有證據的方向是**反過來的**：行內宣告（script 寫到 `.Root`）→ 樣式表 `var()` 消費，整套主題十個 token 靠它。`--press-shift` 曾是全專案唯一一個宣告在樣式表裡的自訂屬性，兩端都沒有前例，卻讀起來像是照既有做法寫的 |
| 這次的處置 | 位移量改為 `src/interaction/press.ts` 裡的字面值，全專案唯一一處。`App.css` 不留任何按壓態規則，只留一段說明為什麼沒有 |
| 通則 | **主線程函式寫樣式時，值要自帶最終結果。** 任何要跨線程共享的數值，不能靠 `var()` 讓主線程去讀 —— 這對顏色、長度、任何屬性都一樣 |
| 若日後為假（代換開始生效了） | 位移量可以搬回樣式表，spec 那句「全專案只出現一次」不必改，只是「那一次」的位置變了。**判準仍是實機按下去有沒有動**，不要因為 bundle 裡看得到 `var(--x)` 字串就認定它會解析 —— 那個字串在失敗的那一版裡也在 |
| 沒有量的一項 | 主線程能不能**讀**自訂屬性（`getComputedStyleProperty('--x')`，需 Lynx sdk ≥ 3.5）。若可行，那是「樣式表持有數值」的另一條路，代價是每次按壓多一次讀取 |

#### 五、⚠️ 背景線程的樣式更新是**整份取代**，不是逐屬性合併（通則）

| | |
|---|---|
| 狀態 | `原始碼實測`（背景線程的 `style` prop 更新推 `SET_STYLE` op，主線程收到後呼叫 `__SetInlineStyles(el, value)` —— 傳的是**整個**樣式物件） |
| 通則 | 任何「主線程用 `setStyleProperty` 寫樣式、背景線程也在同一個節點上綁 `:style`」的組合，背景線程**每一次**觸及該綁定的重繪都會把主線程寫的東西整份抹掉。不是只有按壓回饋，也不是只有屬性鈕 |
| 兩類節點的意義相反 | 只綁 class 的節點：背景線程推 `SET_CLASS`、不碰行內樣式，主線程寫的東西會**活著** —— 因此必須由主線程自己清掉。有 `:style` 綁定的節點：主線程寫的東西**活不過**下一次重繪 |
| 這次為什麼可接受 | 屬性鈕是唯一帶行內樣式綁定的控制項。它的按壓態被抹掉的時間點，正好是真正的狀態改變落到畫面上的時間點 —— 也就是按壓態不再需要存在的時間點。要避免的失敗是「卡住」，而整份取代的語意保證了卡不住。所以**沒有**為此改寫屬性鈕背景色的上法，也沒有讓兩個線程協調同一份樣式物件 |
| 若日後改成逐屬性合併 | 屬性鈕的按壓態就不再會被自動清掉了 —— 屆時它與其餘控制項一樣，完全靠自己的 `touchend`／`touchcancel` 清除。**那條路徑已經在寫了**（三個事件一律都綁），所以這個平台行為若反轉，本專案不需要任何改動。要重新評估的是反過來的假設：任何**依賴**整份取代來清狀態的新程式碼 |

#### 連帶：三個觸控事件一律都綁，不是兩個

只綁 `touchend` 會留下一個實際會遇到的壞狀態：形態鈕與招式表的控制項都在詳情面板的捲動容器內
（§12.19），手指按在鈕上然後移動去捲動，這一下**不會**產生 `touchend`。少綁 `touchcancel` 的結果
是一顆永遠凹著的鈕，而且它不會自己好 —— 除非那顆鈕剛好被背景線程重繪。所以固定寫法是三個屬性一起
出現，`touchend` 與 `touchcancel` 接同一支清除函式。

搜尋可以驗這一項：三個屬性在 `src/` 的出現次數必須相等（目前各 11 處，v-for 展開後是 37 個控制項）。

#### ✅ 實機驗收全數結清（2026-07-30）

這一節原本掛著三項只有實機答得出來的東西，現在都有答案了。**第一項（`var()` 的解析方向）驗完發現是
通則而不是這個功能的細節，所以升成上面的第四條。** 另兩項的答案：

**取消路徑成立。** 開 #24 阿柏怪，手指按在招式表的排序鈕上不放開、直接往上滑去捲動面板，放開後該鈕
回到未位移狀態，排序未被改變 —— 所以 `touchcancel` 確實會在「按壓變成捲動」時送到，這是綁三個事件
而不是兩個的直接證據。同一個手勢在面板的形態鈕上結果相同。

**1px 在實機上看得出來。** 這件事本來是設計期答不了的（§12.22 提案時記為風險），實機目視確認
`translateY(1px)` 的位移足以讀成「按下去了」，不需要調大。所以位移量定為 1px，`press.ts` 裡那個字面值
不動。

**重建條件**（若日後要重驗）：iOS 實機。取消路徑開 #24 阿柏怪（70 列，招式表有界可捲）；控制項逐顆
按過一遍開 #475 艾路雷朵。**web 預覽答不了取消路徑那一項** —— 它跑的是瀏覽器的捲動與手勢實作而不是
native 的手勢鏈（§12.19 已記）。

### 12.23 `@media` 在建置期就被丟掉；`Intl` 不存在（2026-08-08，iOS 實機）

為了回答 ROADMAP A3 與 A6 各自卡住的平台問題而量的。兩題的答案都是否定的，但**否定的層次不同**，
而那個差別決定了退路，所以分開記。

#### `@media` 整段消失在 CSS 管線裡，不是執行期被忽略

| | |
|---|---|
| 量的方法 | 一個暫時元件，三個預設紅色的方塊，各由一個 `@media` 區塊改成綠色。**關鍵是 L0 對照組用 `@media (min-width: 1px)`** —— 一個必然成立的條件 |
| 結果 | 三格全紅，L0 也紅。同一份樣式檔的普通規則（底色、標題色）全部生效，所以檔案有載入 |
| 定位到哪一層 | 建置產物裡 grep：`main.web.bundle` 有紅、黑、黃三個色，**只有寫在 `@media` 區塊裡的綠色一次都沒出現**。`prefers-reduced-motion` 與 `min-width` 這兩個字串在 bundle 裡的唯一出處是探針自己的說明文字，不是 CSS |
| 所以結論是 | **CSS 管線在建置期把整個 `@media` 區塊連同內容丟掉**，宣告根本到不了平台。不是「Lynx 執行期不認得這個 media feature」 |
| 為什麼這個差別重要 | 執行期忽略還有版本、旗標、寫法可談；建置期丟掉沒有。同時它把範圍擴大了 —— **這不只影響 `prefers-reduced-motion`，是整個 `@media` 都不能用**，任何響應式斷點的想法一併出局 |
| JS 退路查過了 | `node_modules/@lynx-js/` 底下沒有任何 `SystemInfo`、`getSystemInfo`、`reduceMotion`、`accessibilityInfo`。執行期是原生的，要確認得再跑一次實機探針 —— 尚未做 |
| 決定 | A3 移入 ROADMAP C 節。重新評估的觸發條件：CSS 管線開始保留 `@media`，或平台開放讀系統設定的 API |

#### `Intl` 是 `undefined`，`localeCompare` 就是 code point 相減

| | |
|---|---|
| 量到什麼 | `typeof Intl` → `undefined`。`Intl.Collator` → absent |
| `localeCompare` 的實際行為 | `'a'.localeCompare('B')` → **31**，`'張'.localeCompare('李', 'zh-Hant')` → **−2073**。這兩個數就是 `97−66` 與 `24373−26446`。它不是「近似 code point 的某種比較」，它是相減，而且第二引數的 locale 被完全無視 |
| 為什麼用兩個字對 | 兩對的 code point 順序與定序順序剛好相反，且拼音序與筆畫序在 `張/李` 上同號 —— 所以不必先知道平台會用哪一種定序。**只測一對會被巧合騙過去** |
| 對 A6 的實際影響：比預期小 | 兩個語系都不需要 ICU 就能得到正當的排序。**英文**：全部 208 筆是「首字大寫、其餘小寫」的純 ASCII（唯一含標點的是 `Mr. Rime`），逐筆比對過 code point 排序與不分大小寫字母排序**完全相同**。**中文**：code point 序即 URO 序，也就是部首序 —— 排序結果的結尾是 黑魯加、龍頭地鼠、龜足巨鎧，正是康熙部首表最後的龍(212)、龜(213)兩部。這是字典裡看得到的排法，不是亂序 |
| 唯一的非 URO 字元 | `謎擬Ｑ`（#778）的 `Ｑ` 是全形 U+FF31，排在所有漢字之後 —— 但它不在首字，所以不影響該筆的位置。**零異常** |
| 所以 A6 不是被這一項擋住的 | 它剩下的成本全在排序控制項：`optimize-query-bar` 之後排序是單顆循環晶片，加第三個成員要按兩下才到得了最後一項，且畫面上看不出總共幾個選項。那是版面問題，與定序無關 |
| 若日後 `Intl` 出現 | 上面兩個排序都不必改 —— 它們現在的正確性不依賴 ICU 缺席。要改的是**有意識地**換成 `Intl.Collator` 以取得拼音序，那是一個新決定（部首序 vs 拼音序），不是修 bug |

#### 連帶：這種探針的寫法

兩支探針都刻意**印原始回傳值而不是自己判定通過與否**，並且色塊的預設是紅、由條件命中改綠而不是相反。
理由是 §12.17 記的第三類坑：預設綠、由條件轉紅的寫法分不出「平台忽略了整段宣告」與「條件不成立」，
而預設紅加上一個必然成立的 L0 對照組分得出來 —— 這次正是 L0 那一格把答案從「不支援這個 feature」
改成了「整個 `@media` 到不了平台」。**下次量任何「宣告寫得下去但沒反應」的東西，先放對照組。**

**重建條件**：iOS 實機。探針本身沒有留在樹上（量完即刪，見該次 commit），要重跑就照上面兩段重寫 ——
CSS 那支要三格加一個必然成立的對照組，JS 那支要兩個反號字對。

### 12.24 `<svg content>` 的光柵化成本按元素計價，且走全 app 一條序列佇列（2026-08-10，iOS 實機）

為了回答「按卡片展開詳情、篩選後回到全顯示都要等超過一秒」而量的。**成因與最初的三個猜測全部無關**
—— 不是網路、不是圖片快取、不是渲染派發。是屬性字符。

> ## ⚠️ 本節的歸因錯了一次，已於同日更正
>
> §12.24 最初把詳情面板的等待歸給**屬性字符的光柵化**，並據此開了 `cache-glyph-rasterisation`。
> **那個歸因是錯的**，被同日的對照組推翻（見下面第一段）。**字符不是成本。**
>
> 底下第二、三、四段量到的東西**仍然成立**（SVG 的序列佇列與零快取、data URI 的範圍更正、
> PNG 酬載在 iOS 的實測），錯的只有「所以那就是慢的原因」這一步。
>
> **引用本節之前先讀完這個框。**

#### 一、⚠️ 等待隨招式列數線性成長 —— 但**不是**字符造成的（歸因已被對照組推翻）

| | |
|---|---|
| 量的方法 | 在畫面上顯示時間差（觸發 → `@load` 到達）。挑兩個招式列數極端、而 sprite 條件相同的物種：#132 百變怪（1 招）與 #475 艾路雷朵（105 招） |
| 結果 | **112ms** 對 **897ms** |
| 當初的推論（**錯的**） | 「面板內的字符元素數是 3 對 108，所以斜率是每個字符 ~7.5ms」 |
| **錯在哪** | 招式列數同時決定**兩件事**：字符元素數（108），以及**招式列與其中的文字節點**（105 列 × 6 欄 ≈ **630 個文字節點**）。兩者完全共變，所以那條斜率**無法**分辨是哪一個造成的。當時歸給了字符，理由是讀 Pods 看到 SVG 無快取又走序列佇列 —— 但**「那個機制存在」不等於「它是主因」** |
| 推翻它的對照組 | 保留**每一列與每一個文字節點**、只把招式列的字符元素全部拿掉（`LearnsetTable` 的 `v-if`），重跑 #475 艾路雷朵 |
| 對照組結果 | **903ms** —— 對照 897ms，在雜訊內。**拿掉 105 個字符元素，等待完全沒動** |
| 所以 | **字符（無論 SVG 或 image）不是詳情面板在等的東西。** 成本隨招式列數成長，但來自列與文字節點那一側 |
| 未回答 | 是文字塑形、列的版面、還是捲動容器的內容測量 —— **這三者在上述對照裡仍然共變**，要再一組控制才分得開。不要在量到之前假設是哪一個 |

##### 成本模型：每列 ~7.5ms + 固定 ~105ms（三點共線，2026-08-10）

第三刀把列數當成唯一變數：**真實文字、真實字符、同樣的欄位與捲動容器**，只截斷渲染的列數。
截到 **20** 而不是 12，是為了讓 `bounded` 維持為真（門檻是 12），捲動容器的 class 才不會跟著變。

| 招式列數 | sprite 等待 | |
|---|---|---|
| 1 | 112ms | #132 百變怪 |
| 20 | ~250ms | #475 艾路雷朵截斷 |
| 105 | 897ms | #475 艾路雷朵 |

頭尾兩點解出 **斜率 7.55ms／列、截距 ~105ms**；代入 20 列預測 **255ms**，實測 250ms。**三點共線，模型成立。**

**注意單位**：本節最初寫的「7.5ms」數量級是對的，**但單位是每列不是每字符** —— 而字符對照已證明字符在這
7.5ms 裡佔不到可測量的份額。**一個對的數字配一個錯的歸因，比一個錯的數字更難發現。**

| 一列裡還剩什麼（依可疑度排序） | 狀態 |
|---|---|
| 五到六個 `<text>` 節點的文字塑形（像素字型 + CJK fallback 鏈） | **✅ 已排除**（見下） |
| 每列三個 `main-thread-bind*` 觸控綁定（§12.22），105 列 = **315 個 worklet 事件註冊** | **✅ 已排除**（見下） |
| 列本身的 flex 版面與元素建立 | **✅ 就是這一項 —— 而且是按元素計價，見「答案」一段** |

##### ✅ 文字塑形已排除（2026-08-10，iOS 實機）

**105 列全部保留、字符保留、節點數不變，只把每個文字節點的內容換成同一個兩字元 ASCII 字串**
（既拿掉文字的量也拿掉種類）。#475 艾路雷朵讀三次：**902／877／871ms**，對照基準 897ms。

**文字不是那 7.5ms／列。** 像素字型與 CJK fallback 鏈在這條路徑上不構成可測量的成本 ——
這一項本來是可疑度最高的候選，排除掉它把範圍縮到「列本身」。

##### ✅ 主線程觸控綁定已排除（2026-08-10，iOS 實機）

**只把招式列上的三個 `main-thread-bind*` 拿掉**（排序鈕的保留，所以 worklet 機制在同一個畫面仍然有作用；
`@tap` 也保留，背景線程的處理器不是變數）。105 列 = 315 個 worklet 事件註冊歸零。
讀三次：**914／878／876ms**，對照基準 897ms。

**綁定不是成本。** 這也順帶回答了 §12.22 從未量過的一個問題：**worklet 事件註冊在這個規模下便宜到量不出來**，
所以「三個綁定一律都綁」那條規矩不需要為了效能重新考慮。

##### ✅ 答案：成本按**元素**計價，約 1.3ms 一個（2026-08-10，iOS 實機）

最後一刀把每列的節點數當成唯一變數：**105 列、真實文字、字符、綁定全部保留**，只拿掉尾端五個文字欄，
讓每列從 8–9 個元素降到 4 個。#475 艾路雷朵讀三次：**300／278／280ms**，對照基準 897ms。

| 每列元素數 | 105 列的等待 | 扣掉固定 ~105ms 後的每列成本 |
|---|---|---|
| ~8.5 | 897ms | 7.55ms |
| 4 | ~285ms | 1.71ms |

斜率 ≈ **1.3ms／元素**。**成本不在任何特定功能上 —— 就是建立元素本身。**
（這組量測不區分「元素建立」與「版面計算」，兩者都隨元素數成長；對修法而言不需要區分。）

**這個模型把先前每一個空結果都解釋掉了，這是它可信的主要理由：**

| 先前的觀察 | 用 1.3ms／元素解釋 |
|---|---|
| 拿掉 105 個字符「沒有差別」 | 那是 892 個元素裡的 12%，預測省 ~107ms —— 埋在 200ms 的雜訊裡。不是字符免費，是解析度看不到 |
| 網格最慢 sprite 2327ms | 208 張卡 × 約 20 個元素 ≈ 4000+ 元素，同數量級 |
| §12.14「208 張卡的首次繪製比直覺慢得多」 | 同一件事，現在有數字 |
| 文字內容換成 `AA` 沒有差別 | 文字**內容**不影響元素數 |

**推論（尚未各自量測，不要當成已知）**：任何「畫面上元素很多」的情境都會付這個成本，與那些元素是什麼無關。
所以降低等待的槓桿只有兩個 —— **減少每個項目的元素數**，或**減少同時存在的項目數**。

**這也是 `dex-grid` spec 那條保留退路的觸發條件已經成立的證據**：該 spec 寫明「node growth 不可接受時，
啟用自管的可視範圍視窗並記錄」。現在有數字了。

##### 這一節的調查方法（值得沿用）

五刀，每刀只動一個變數，每個變體讀三次：網路（斷網）→ 字符（拿掉字符元素）→ 文字（內容換成固定短字串）
→ 綁定（拿掉 worklet 註冊）→ 節點數（拿掉尾端欄位）。前四刀全是空結果，**而空結果正是它們的價值** ——
每一刀都把一個看起來很像答案的候選釘死，最後剩下的那一個才站得住。

**過程中犯過兩次同型的錯，都記在本節**：把共變的兩件事歸給其中一件（字符 vs 列），以及拿不同物種的讀數
互相比較（作廢的文字對照）。兩次的形態相同 —— **量測分不出兩種解釋時，它不是弱證據，它不是證據。**

##### ⚠️ 作廢的一組讀數：文字對照量錯了物種

曾經跑過一次「把每列文字換成同一個短字串」的對照，讀數 600–800ms，一度讀成「文字貢獻 100–300ms」。
**那次開的不是 #475 艾路雷朵**，而基準 897ms 是艾路雷朵的 —— 不同物種的招式列數不同，兩個數字**不可比**。
該讀數已作廢，**文字仍然未測**。

順帶確立一件事：這台裝置的單次讀數**擺動可達 200ms**（基準那三次 897／897／903 穩定得反常）。
**小於約 200ms 的差異不要用單次讀數下結論**，每個變體至少讀三次。

**方法論**：這是本文件同一天內第二次踩到同一個坑（第一次是本節第四段那個快取臂）。
**分不出兩種解釋的量測等於沒有量測** —— 而這一次的教訓更貴：它已經足以說服人開一個 change 並做到一半。
下次要主張「X 是成本」，先問「有沒有一個只改變 X、其他都不動的版本」，沒有就先做那個版本。

#### 二、機制：一條序列佇列 + 零快取（讀 Pods 原始碼）

```
layoutDidFinished → invalidateViewOnMainThread → setNeedsDisplay
  → displayLayer: → updateLayoutIfNeed
    → displayComplexBackgroundAsynchronouslyWithDisplay:
      → dispatch_async( displayQueue )        ← 全 app 共用，DISPATCH_QUEUE_SERIAL
        → processSVGData: → [srSvg getSrSvgDrawImageWithData:…]
          → 完整 XML 解析 + 向量光柵化（無快取）
            → 回主線程 applyImage: → 設 layer + 發 load 事件
```

| 位置 | 行為 |
|---|---|
| `LynxUI+AsyncDisplay.m` 的 `displayQueue` | `DISPATCH_QUEUE_SERIAL`，而且**整個 app 共用一條**（背景、陰影、SVG 全在裡面）。543 個字符不是平行光柵化，是一個一個排隊 |
| `LynxUISVG.m` 的 `createView` | **每一個元素各自 `alloc` 一個 `SrSVG`**。沒有任何以 `content` 字串為鍵的快取；裡面唯一的 `imageHolder` 是給 SVG *內部* 的 `<image href>` 用的，不是給 SVG 本身 |
| `LynxUI+AsyncDisplay.m` 的另一條分支 | `enableAsyncDisplay` 為否時 `displayBlock()` **同步跑在呼叫端**（即主線程）。本專案預設為是，走佇列那條 —— 但兩條都是序列化的，差別只在擋不擋主線程 |

**這一段是讀原始碼得到的，仍然成立**：SVG 的解析與光柵化確實按元素實例計價、確實走一條全 app 共用的
序列佇列、確實沒有以 `content` 為鍵的快取。

**但不要再從這裡推出「所以畫面慢是因為它」** —— 第一段的對照組已經證明字符不是詳情面板在等的東西。
這個機制的每元素成本**從未被單獨量過**：唯一量過它的那組數字（7.5ms）是共變污染的產物，已作廢。
要知道它真正多貴，得做一個只改變字符數、其他都不動的版本 —— 那正是第一段那個對照組，而它的答案是
「在 108 個元素的規模下，小到量不出來」。

`TypeGlyph` 的記憶化仍然該留（`type-glyph` spec 要求記憶化，且原本寫在 `<script setup>` 裡等於每個實例
各一份、跨卡片從不命中），但**它不改善任何一個量到的數字**。

#### 三、⚠️ 更正：「data URI 是死路」的適用範圍被放大了

§10 的表格（本文件「Android 的兩筆掛帳」那張）在退路欄寫著「**data URI 是死路**」，而這正好擋住最自然的
修法。追到出處是 §12.10 的四寫法對照表，失敗的那一列是 `<image src="data:image/svg+xml;base64,…">`。

**那筆實測是 macOS 桌面版，酬載是 SVG** —— 而同一節自己的結論是該 build **畫不出任何 SVG**，並明文寫
「它不能用來驗屬性字符」。所以那句話的真正範圍是「macOS 桌面版 + SVG 酬載」：

| 這句話有證據的 | 這句話**沒有**證據的 |
|---|---|
| macOS 桌面版 + `data:image/svg+xml` → 空白 | iOS 上的任何 data URI |
| | **PNG 酬載**（`data:image/png;base64,…`）在任何平台 |

反向證據兩筆：`LynxImageService.m` 有一條明確的 `isBase64 = [urlStr hasPrefix:@"data:image"]` 分支；
§12.8 更直接寫著「base64 是這個專案該用的形式，不是備案」（字型走的就是這條）。

**這是本文件反覆出現的形態**：後半部量到的東西推翻了前半部的假設，但更正沒有傳播回去。§10 那格已就地
加註指回本節。**在引用「data URI 是死路」之前先讀這一段。**

#### 四、✅ 探針結果：`<image>` + PNG data URI 成立，且成本改為按相異標記計價（2026-08-10，iOS 實機）

`cache-glyph-rasterisation` 的第一項任務。三臂探針，酬載在上機前先由 **Apple 的 ImageIO（`sips`）**
解碼驗證過 —— 8×8、24 個不透明像素、圖案確為 Normal 標記。這一步是刻意的：**「平台畫不出這個酬載」與
「我的編碼器寫錯了」在畫面上長得一模一樣**，所以酬載的正確性必須由受測程式碼以外的東西建立。

| 臂 | 問什麼 | 結果 |
|---|---|---|
| 對照組 | 已知能顯示的 sprite URL 放在同一種元素上 | **顯示且 `load` 觸發** —— 底下的結果算數 |
| 顯示 | PNG data URI 的字符放大到 96px，帶最近鄰宣告 | **畫得出來，而且是跳格** |
| 快取 | 108 個相異 URL 與 108 個相同 URL，**依序**各跑一次 | **相異 477ms、相同 29ms** |

**兩個係數**（這是本節第一段那條 7.5ms 的對照組）：

| | 108 張 | 每張 | 對照：`<svg content>` |
|---|---|---|---|
| 相異酬載 | 477ms | **4.4ms／相異標記** | 7.5ms／元素 |
| 相同酬載（1 冷未命中 + 107 命中） | 29ms | **0.27ms／元素** | 同上，SVG 不分相異與否 |

所以成本模型從「每元素 7.5ms」變成「**每相異標記 4.4ms + 每元素 0.27ms**」。相異標記的數量由屬性數決定
（最多 18），元素數量由陣容與招式表長度決定（543 起跳）—— 這正是要把主要項搬到前者的理由。

**未篩選網格的推算**：18 × 4.4 + 543 × 0.27 ≈ **226ms**，對照現況 543 × 7.5 ≈ 4072ms。

##### ⚠️ 第一次的量法量不出東西 —— 方法論，不是結果

第三臂**第一次是「同時渲染兩組」**，讀數是相異 276ms、相同 286ms。那兩個數字**分不出**它要分的東西：
在一條序列佇列上同時渲染，兩組的完成時刻反映的是 source order 而不是各自的成本。同一組數字可以讀成
「快取完全沒生效」，也可以讀成「相同那組只花 10ms 跑完 108 張」，**結論相反**。

改法是兩組**不得同時在場**（相同那組等相異那組全部載完才掛載，各自從自己的起點計時），而且相同那組用的
URL 不出現在探針任何其他地方，所以它的第一張是冷未命中、其餘 107 張量到的只有「同組內重複同一個 URL」。
改完的讀數是 477 對 29，十六倍。

**這是 §12.23 那條規矩的再一次印證，而且這次是自己踩的**：分不出兩種解釋的量測等於沒有量測。
下次設計任何 A／B 對照，先問「如果兩種相反的世界都會產生這組數字，我要怎麼分辨」。

##### 裁決結論

**這三臂量到的是 `<image>` 這條路徑本身的性質，而且都成立**：PNG data URI 在 iOS 畫得出來、
最近鄰宣告有效、而且相同 URL 會被 URL 鍵快取收斂（16 倍）。**這些事實與第一段的歸因錯誤無關，仍可引用。**

⚠️ **但它們不構成「應該把字符改成 `<image>`」的理由。** 那個理由建立在「字符的光柵化是畫面慢的原因」
之上，而第一段的對照組已經推翻它。**換掉繪製基元在實機上量到零改善**（艾路雷朵 897ms → 897ms）。
所以這三臂證明的是「這條路走得通」，不是「這條路值得走」。

仍然**未量測**、不得當成已知的：

| 未量測的東西 | 為什麼沒量 |
|---|---|
| `<image>` 的 `tint-color` | 本方案刻意不倚賴它（它是**屬性**，正是本文件反覆記載的靜默失效形態）。要用它得自己先量 |
| SVG 酬載走 `<image src>` | 本次沒有候選它。§12.10 在 macOS 上量到它可以，但那不是 iOS，且 Podfile 沒有 SVG coder |
| PNG data URI 在 **Android** | Android 不在範圍內（§12.17） |
| 快取條目的記憶體佔用 | 只量了時間。條目上限 162、每個約 115 bytes，但實際佔用未量 |

#### 若日後為假

- **斜率不再是線性**（例如加了字符卻沒變慢）：代表平台補上了以 `content` 為鍵的快取，或 `displayQueue`
  改成並行。屆時整個修法的前提消失，先重跑百變怪／艾路雷朵對照再談。
- **`<image>` 的 PNG data URI 在 iOS 不成立**：那修法要改走打包資產，但 §12.8 記的 `webpack:///` 問題會
  回來，等於要先解決資產 URL。**不要因為這一節推翻了「data URI 是死路」就假設它一定成立** —— 那句話的
  錯誤在於範圍，不在於結論的方向；PNG 酬載在 iOS 仍然是**零證據**，動手前必須先跑無條件探針。

**重建條件**：iOS 實機。開 #132 百變怪與 #475 艾路雷朵各一次，比較 sprite 的等待時間。量測用的
`src/state/debugPerf.ts` 與三處呼叫端標了 `TEMPORARY`。

### 12.25 ✅ `<scroll-view>` 送得出絕對捲動位移（2026-08-10，iOS 實機）

為了 `window-visible-range` 的第一項任務而量。**在此之前本文件全文沒有任何一節提到捲動事件** ——
自管的可視範圍視窗整個壓在它上面，所以它是那個 change 的 gate。

| | |
|---|---|
| 綁定寫法 | 模板上的 `@scroll`。vue-lynx 的 `parseEventProp` 把 `onScroll` 解析成 `bindEvent` 的 `scroll` —— 與 `@tap` 同一套規則，不需要 `bind` 前綴 |
| 量的方法 | 一個 200 列的 `<scroll-view>`，從最頂快速甩到最底。**探針印原始欄位與數值、不自行判定**，並在容器內綁一個 `@tap` 當對照臂 |

| 量到什麼 | 值 |
|---|---|
| 一次完整捲動的事件數 | **241** |
| `scrollTop` | **2626.33** —— **絕對位移可用** |
| 累加的 `deltaY` | **2626.33** —— 與絕對值完全一致，deltas 沒有漂移 |
| 兩次報告之間的最大跳幅 | **118.67px** |
| `detail` 實際帶的欄位 | `deltaX`、`deltaY`、`scrollTop`、`scrollHeight`、`scrollLeft`、`isDragging`、`scrollWidth` |

**所以視窗化吃 `scrollTop` 就好**，不必累加、不必做「捲到頂歸零」的校正 —— 那條設計上的分岔沒有發生。

**118.67px 是緩衝量的下界**，這是它存在的理由：緩衝小於兩次報告之間的跳幅，快速捲動就會來不及補上而露白。
一屏遠大於它，所以緩衝取一屏綽綽有餘；真正的驗收判準仍是「整份捲完不得出現空白」。

**對照臂這次沒有派上用場，而那是對的**：它只在「事件數為零」時才需要用來分辨「平台不送」與「我綁錯」。
事件數是 241，所以綁定與平台都成立，對照臂的讀數不影響任何結論。**留著它仍然正確** —— 若日後重跑時
事件數變成零，沒有對照臂就會浪費一輪去查是哪一邊的問題。

**仍未量**：巢狀情形。招式表與學習者清單的捲動容器都在詳情面板的捲動容器**內**，內層是否同樣收得到事件
尚未驗（§12.19 已確立巢狀同向**捲動**成立，但那是手勢不是事件）。

**重建條件**：iOS 實機。200 列的 `<scroll-view>` 綁 `@scroll`，印出 `detail` 的每個欄位，從頂甩到底。

### 12.26 ✅ 三處長序列的列距，與一筆被 web 量錯的既有數字（2026-08-10，iOS 實機）

`window-visible-range` 需要每個序列的「一列多高」才能從捲動位移推出該渲染哪一段。
**樣式表答不出這件事** —— 三處都沒有宣告高度，卡片的 `height: 100%` 撐的是儲格而儲格沒有高度，
招式列與學習者列則完全靠內容。文字的行高也沒有宣告。

量法用 §12.25 剛確立的 `scrollHeight`：**內容高度除以列數就是列距**，而且是含邊框與間距的有效值 ——
正好是推導要的那個量。三處的容器都沒有 padding（查過 `.Cards`、`.MoveTableBound`、`.LearnersBody`），
所以除法乾淨。

| 序列 | 量到 | 列距 | 每列項目 |
|---|---|---|---|
| 網格卡片 | 104 列 | **201** | 2 |
| 招式列 | `scrollHeight 2520 / 105` | **24.00** | 1 |
| 學習者列 | `scrollHeight 5599.33 / 104` | **53.84** | 1 |

招式列除出整數 24.00 這件事本身就是讀法正確的佐證（欄位讀錯或除錯數不會剛好落在整數上）。

**⚠️ 這些數字綁在這台裝置的寬度（393pt）上。** 卡片是半寬，換一個寬度就會換一個高度。
常數要跟著裝置走這件事是這個做法的已知限制，不是疏忽 —— 驗收判準（整份捲完不得出現空白）會抓到它失準。

#### ✅ 巢狀容器收得到捲動事件

招式表與學習者清單的捲動容器都在詳情面板的容器**內**，兩者都回報了 `scrollTop` 與 `scrollHeight`。
§12.19 先前只確立了巢狀同向**手勢**成立，**事件是另一回事，現在一併結清**：兩個清單都可以視窗化。

#### ⚠️ 更正：`species-card` 那筆「名稱換兩行、209px vs 193px」是 web 量的，實機不成立

`species-card` spec 有一則 Example 寫著：375px 寬下 Crabominable 的名稱換到第二行，該列兩張卡都是 209px，
而較短的列原本是 193px —— 據此推論「卡片列高不一致」。

**實機看不到這個現象。** 四個最壞情形（Crabominable 12 字元、赫拉克羅斯 5 字、
Paldean Form (Combat Breed) 27 字元、以及短名稱對照）在兩種語系下**名稱全部只有一行、形態名不換行**。

成因是 §12.17 早就記過的那一條：**web 預覽量不到文字寬度，它用的是系統字型不是像素字型**。
那則 Example 量的是系統字型的寬度，不是 Silkscreen 的。

**所以卡片列高目前是一致的**，而一致是「碰巧」而不是「被保證」—— 沒有任何宣告擋住日後有人加入更長的名稱、
或在更窄的裝置上換行。處置是把列距以 `min-height` 明文宣告（沿用卡片上 `.CardNameAlt`、`.CardForm`
既有的保留做法），**不改成固定 `height`** —— 固定高度會讓換行的名稱溢出，而
「Long names wrap rather than truncate」是 `species-card` 的既有要求。

**重建條件**：iOS 實機。渲染 208 張真卡於一個無 padding 的 `<scroll-view>`，捲動後讀 `scrollHeight`；
招式表與學習者清單則在真元件的捲動容器上綁 `@scroll` 讀同一個欄位。

### 12.27 `SystemInfo` 在背景線程讀不到；視窗化把詳情面板從 897ms 降到 285ms（2026-08-10，iOS 實機）

#### ⚠️ `SystemInfo` 讀不到 —— 所以可視高度只能用保守常數

| | |
|---|---|
| 為什麼要它 | 區間推導需要「容器的可視高度」。捲動事件帶 `scrollTop` 與 `scrollHeight`，**但不帶可視高度**（§12.25）；而兩個清單的容器高度寫成 `36vh`／`52vh`，`vh` 也要先知道視窗高度才解得開 |
| 原始碼證據 | Lynx 核心的 `GenerateSystemInfo` 造出帶 `pixelWidth`／`pixelHeight`／`pixelRatio`／`platform`／`theme` 的物件 |
| 實測 | `globalThis.SystemInfo` **不存在**（讀取路徑回報 `fallback (no SystemInfo)`）。**引擎裡有，不代表這條線程拿得到** —— 與 §12.23 量到 `Intl` 是 `undefined` 同一類 |
| 處置 | 可視高度用**刻意寬鬆的常數**（900）。方向是安全的：高估只是多渲染幾列（慢一點但正確），低估才會讓捲動前緣露白 |
| 若日後為假 | `SystemInfo` 出現時，`src/state/viewport.ts` 已經有讀取路徑，改的只是它走哪一條分支，元件不必動 |

#### ✅ 視窗化的效果：詳情面板 897ms → 285ms

| 情境 | 改前 | 改後 |
|---|---|---|
| #475 艾路雷朵（105 招式列） | **897ms** | **285ms**（多次讀數的平均） |

**這個數字與另一條路徑吻合**：§12.24 最後一刀把每列元素數從 8.5 砍到 4，量到 300／278／280。
視窗化沒有改變每列的元素數，改變的是渲染的列數 —— 兩種完全不同的減法收斂到同一個值，
是「成本按元素計價」那個模型的又一個佐證。

#### ✅ 三處的最終讀數

| 情境 | 改前 | 改後 | 倍數 |
|---|---|---|---|
| 詳情面板 #475 艾路雷朵（105 招式列） | **897ms** | **285ms** | 3.1× |
| 未篩選網格（208 卡）最慢 sprite | **2327ms** | **約 200ms** | 11.6× |
| 學習者清單（最多 225 列） | 未量 | 見下 | — |

**靜止時網格渲染 16 張卡**（讀數 `grid 0-15 of 208`），而這正是推導的預測值：
可視高度 900（保守常數）÷ 列距 201 = 4 列，緩衝 `ceil(0.5 × 900 / 201)` = 3 列，共 8 列 = 16 張。
**裝置上的區間與 node 下用 spec 的 Example 表格測過的純函式逐格吻合** —— 這是把邊界算術做成純函式最直接的回報。

**快速甩動有輕微 lag，但全程無空白卡、無錯配內容。** lag 的來源是每跨過一列就要建立／銷毀該列的卡片；
判準（無空白、無錯配）通過，所以不為此再調緩衝量 —— 那是調參，而這個 change 的驗收條件已經滿足。

**學習者清單沒有可比的時間讀數，這是刻意不湊的**：那個畫面不畫任何圖片，沒有可以掛完成事件的東西，
而 mount 時間早已量到是弱代理（13ms 對 897ms 的實際等待，§12.24）。它的驗收是目視：
225 列從頭捲到尾無空白、無錯配，標題的總數仍是完整關係大小而非渲染中的列數。

#### 連帶：setup 期的 TDZ 會讓整個元件靜默消失

接線時把視窗化區塊插在容器高度常數**之前**，於是 `const range = ref(rangeAt(0))` 在 setup 期讀到還在
暫時死區的常數、拋錯，**畫面上的表現是招式表整塊不見**，沒有任何錯誤訊息。

`vue-tsc` 不會抓 TDZ、node 下的測試碰不到元件、而症狀看起來像渲染 bug 而不是程式錯誤 ——
與本文件反覆記載的「宣告得下去、不報錯、行為沒發生」同一族。
**元件裡任何在 setup 期就求值的東西，它依賴的常數必須宣告在它前面**；一整塊 UI 無故消失時，先懷疑這個。

### 12.28 元素量測（`SelectorQuery.fields`）在兩個 target 都不回 callback（2026-08-13，web 預覽 + iOS 實機）

主題選單要放在觸發鈕底下，就得知道觸發鈕在哪。**樣式表答不出來**（與 §12.26 同一個形狀）：
鈕的 x 在結果計數之後，而「208 / 208 種類」的寬度隨數字與語言改變；y 取決於標題與副標的行高，
兩者都沒有宣告。

vue-lynx 的 template ref 有 `fields(param, callback)`，轉給 Lynx 的 `SelectorQuery`
（`node_modules/vue-lynx/runtime/dist/shadow-element.js` 就是這樣用的），這是各平台放下拉的標準做法：
畫在最上層容器、位置跟著 anchor 的量測跑。

**實測：`fields({ rect: true }, cb)` 的 callback 在 web 預覽與 iOS 實機都沒有被呼叫，兩邊都沒有任何
錯誤或警告。** 不是回了空值 —— 是完全沒回。所以「量到就校正位置」那段程式一次都沒執行過。

處置：**移除**。留著就是留一條沒人驗過的分支，等平台哪天開始回應時才第一次執行，那比沒有更糟。
選單的位置改用樣式表宣告的偏移（機身 9 + 螢幕 12，自 root 的 padding 邊算起），畫成蓋在 masthead
上的面板。開選單因此不依賴任何量測。

**連帶結論：任何需要「元素現在在哪、有多大」的功能，在本平台目前都沒有可用的來源。**
`SystemInfo` 在背景線程讀不到（§12.27）、`fields` 不回 callback，剩下的只有樣式表的字面值與
`<scroll-view>` 的捲動欄位（§12.25）。要做跟隨 anchor 的浮層之前，先重測這一條。

**重建條件**：在任一元件的 template ref 上呼叫 `fields({ rect: true }, cb)`，在 callback 裡寫一個
可觀察的副作用（不要只 console，背景線程的 log 容易被當成沒印）。iOS 實機與 web 預覽各跑一次。
**若日後 callback 開始回應**：位置可以改回取自 rect（左 = rect.left − root padding，
上 = rect.bottom − root padding + 3），但必須連同「開選單不等量測」一起保留 ——
否則量測回不來的那天，控制項就變成按了沒反應。

> **上面那段粗體的「連帶結論」下得太寬，§12.29 已推翻。** 這一節量的是 `SelectorQuery`，
> 那是「向平台**查詢**元素在哪」；觸控事件自帶的座標是另一個來源，量到成立。這一節關於
> `fields` 本身的結論不變 —— 它仍然不回 callback。

### 12.29 ✅ 觸控事件帶座標、`z-index` 成立（2026-08-13，iOS 實機）

為了回答「主題選單能不能不要固定開在左上角」而量的。兩題都是肯定的，而**肯定的理由互相獨立**，
所以分開記 —— 選單最後只用到第二題，第一題是為了後面的長按選單先存著。

判準一律是畫面上有沒有發生，不看 console（§12.22 開頭那條）。探針是拋棄式分支，量完即砍。

#### 一、✅ 背景線程的觸控事件帶座標，`tap` 也帶

| | |
|---|---|
| 狀態 | `iOS 實機實測`（無條件探針：按鈕把事件物件的欄位直接畫在畫面上） |
| 量到什麼 | `@touchstart` 與 `@tap` 兩者的事件物件都帶座標，欄位如下表 |
| 為什麼這不牴觸 §12.28 | 那一節量的是 `SelectorQuery.fields`，問的是「**元素**在哪」，要平台回答；這裡的座標是**事件自己帶來的**，不需要任何查詢。兩個不同的來源，§12.28 只證偽了其中一個 |

事件物件的頂層欄位是 `[changedTouches, currentTarget, detail, target, timestamp, touches, type]`，
座標分佈如下（同一次按壓的實測值）：

| 讀法 | B1 的值 | 是什麼 |
|---|---|---|
| `event.detail.x / .y` | 118 / 694 | **視窗座標**，與 client 相同 |
| `event.touches[0].clientX / .clientY` | 118 / 694 | 視窗座標 |
| `event.touches[0].pageX / .pageY` | 118 / 694 | 此處與 client 相同 |
| `event.touches[0].x / .y` | 112 / 30 | **元素內相對座標**，不是視窗座標 |
| `event.changedTouches[0]` | 同 `touches[0]` | — |
| `event` 本身 | 無數值欄位 | 座標不在頂層 |

**`touches[0].x/y` 與 `clientX/clientY` 不同義，這是最容易寫錯的一條。** 另一支 arm 按在
右邊那顆鈕上，視窗 x=198 而元素內 x=50，兩顆鈕的左緣差距對得起來 —— 要視窗座標就讀
`detail` 或 `client*`，不要讀 `x/y`。

`pageX` 與 `clientX` 在這次相等，但按壓點在 `<scroll-view>` 外面。**捲動容器內是否仍相等沒有量**，
要用之前先量。

**單位與原點**：與樣式表同一個座標空間，左上為原點，不需要換算。這是連帶量到的（見第三條）。

**沒有量的一項**：同一個節點上「主線程綁 `touchstart` + 背景線程也綁 `touchstart`」能不能共存。
探針有這支 arm（B3）但沒有按。**若日後要在有按壓回饋的控制項上讀座標，先補這一下** —— 不成立的話
按壓回饋（§12.22）與座標就是二選一。走「選單掛在鈕下方」這條路不需要座標，所以當時沒補。

**若日後為假**（座標消失了）：退路是 §12.28 的宣告式位移，選單照樣開得起來。**任何用到座標的
位置計算都要保留「拿不到就用宣告值」的分支** —— 這是 §12.28 那條「開選單不等量測」的同一條理由。

#### 二、✅ `z-index` 成立，且 masthead 的祖先不裁切

| | |
|---|---|
| 狀態 | `iOS 實機實測`（無條件探針：一塊常駐面板掛在 masthead row 下方，`z-index: 10`，壓在 QueryBar 身上） |
| 量到什麼 | 面板把 QueryBar 第一排屬性晶片整排蓋掉，只有底緣從面板下方露出；面板連 masthead 的 3px 下框一起蓋過去 |
| 所以 | `design/theme-menu-variants.html` 的變體 C（選單掛在觸發鈕下方）從「押未量測行為」變成**可選**。這是本專案第一次有 `z-index` 的證據，此前 `src/App.css` 零處 |

**三種結果不是兩種，第三種最容易看漏。** 這次要分辨的是「z-index 被忽略（面板被 QueryBar 蓋）」
與「祖先節點裁切（面板在 masthead 下緣被切齊）」—— 後者就算 z-index 成立也救不回來。
判法是看**誰的邊緣是直的**：被蓋的話面板邊框還在只是被字壓住，被裁的話連邊框一起在同一條
水平線上消失。這次是被蓋的反面（面板贏），兩種失敗都排除。

**量到的範圍**：一個 absolute 節點在 masthead 內、越過 `Masthead` 與 `Screen` 兩層、蓋住
`Screen` 內的後續兄弟。**跨 `<scroll-view>` 邊界、或更深的巢狀沒有量。**

**追記（2026-08-13 稍晚，`anchor-theme-menu` 驗收）：再高一階也成立，而且管得到觸控而不只是繪製。**
選單錨定在 masthead 內宣告 `z-index: 10`，關閉用的攔截層是 `Root` 的直接子節點、蓋滿整個螢幕、
宣告 `z-index: 1`。攔截層在文件順序上是**後面**的節點，若疊層無效它會收走選單列的按壓 —— 實機上
按選單列確實換了模式，不是關掉選單。所以：

- 宣告的 z-index 在 `Root` 直接子層與 masthead 內節點之間也成立，不只在 `Screen` 那一階。
- 這件事管的是**命中測試**而不只是畫在誰上面。上面那一段量的是「選單畫在查詢列之上」，這一段量的是
  「按壓落在選單而不是落在蓋住整個螢幕的攔截層」，兩者是不同的問題，一個成立不蘊含另一個。

仍然沒有量的還是同樣那兩項（跨 `<scroll-view>` 邊界、更深的巢狀）。**這一段不擴大到那兩項。**

**若日後為假**：退路是 §12.28 的 overlay band 面板，也就是這次改動之前的做法。

#### 三、⚠️ absolute 子節點從 **border 邊**起算，不是 padding 邊（§12.15 的措辭更正）

上面第一條的數字順帶答了這個。探針面板 `.Probe` 是 `.Root`（`padding: 12px`）的 absolute 子節點、
`left: 0`、自身 `padding: 6px`。按在它的鈕上量到視窗 x=118、元素內 x=112 —— **差 6，不是 18**。
所以 `left: 0` 落在 root 的 border 邊而不是 padding 邊。

這與 §12.15 觀察到的「覆蓋層蓋得住 `Root` 的 12px padding」是同一件事，但**那一節把機制寫成
「從 padding 邊起算」，兩句話互相矛盾** —— 現在有數字了，以這一條為準。CSS 的規則是相對於
containing block 的 **padding box**，Lynx 這裡不是，所以照 CSS 直覺寫會差一個 padding。

實務上專案早就隱含了這一條：`.ThemeMenuPanel` 的 `left: 21px` 是機身 9 + 螢幕 12，**沒有**把
root 的 12 算進去。若是 padding 邊起算，選單會往右多 12px。
