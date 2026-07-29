## Context

詳情面板切片（`port-champions-dex-detail`，已 archive）讓長文第一次出現在移植版畫面上，並刻意讓它落到系統字型。那個佔位連同它造成的驗收缺口記在 `design/HANDOFF.md` §12.2 與 `pixel-typography` spec 的「Font roles are assigned by content kind」要求裡。

目前指名散文面的三處長文：網格的空結果、詳情面板的兩則警語、特性說明。它們的樣式規則刻意不寫 `font-family`，所以拉丁文字落到平台預設面；中文本來就穿透到系統字型（Silkscreen 無 CJK）。

三個既有的平台約束，全部來自 §12：

1. `@font-face` 在 Android 只吃 TTF / OTF / TTC，iOS 才吃 WOFF2（§12.2）
2. `@font-face` **不支援** `font-style` / `font-weight` / `font-variant` 描述子，所以一個家族名只能掛一個字重（§12.2）
3. 字型資產走 `url()` 指向 bundle 內路徑是已驗證可行的（§12.8 已修）

本批新測到的三個數字（`fonttools` 4.60.2，2026-07-29）：

| | 大小 |
|---|---|
| 上游 `Literata[opsz,wght].ttf`（唯一提供的形式） | 955,132 B（933 KB） |
| 靜態實例 `wght=400 opsz=13` | 270,764 B（264 KB） |
| 再 subset 成 Latin-1 加標點 | **35,788 B（35 KB）** |

對照現有資產：`Silkscreen-Regular.ttf` 32,220 B、`Silkscreen-Bold.ttf` 30,632 B。

**字型資產在 bundle 裡是 base64 內嵌的，所以它的 bundle 成本是檔案大小的 4/3。** `lynx.config.ts` 設了 `dataUriLimit: 64 * 1024`，低於此值的資產會被內嵌成 data URI —— 這正是 §12.8 那條「CSS `url()` 資產在 lynx bundle 裡會變成抓不到的 URL」的修法。所以 35,788 B 的資產進 bundle 是 46.6 KB，而不是 35 KB。

**這也給 subset 範圍訂了一個上限**：資產一旦超過 64 KB 就不再內嵌，會退回成抓不到的 URL —— 字型靜默失效。目前 35.8 KB 距離該上限有很大餘裕，而下面的 30–45 KB 驗收帶同時也是在守這條線。

## Goals / Non-Goals

**Goals:**

- 三處長文用設計稿指定的閱讀襯線體，而不是平台預設面
- 資產體積與既有字型同級，不讓 bundle 因為一個字型翻倍
- 上游資料日後出現未收錄字元時**報錯而不是畫豆腐字**
- 把 §12.2 記錯的體積估計更正，並記下正確的處理步驟

**Non-Goals:**

- 不做 Android 實機驗證（無裝置，掛帳從第一批延續）
- 不動招式表的 `mvNone`（批次 B）
- 不引入粗體散文面（設計稿散文只有一個字重）
- 不改中文的字型穿透行為
- 不把 fonttools 加進 pipeline 的主流程

## Decisions

### 內嵌靜態實例而非可變字型，實例參數取 wght=400 / opsz=13

上游只提供可變字型。直接內嵌它要付 933 KB，而且賭 Lynx 支不支援可變字軸 —— 若不支援，拿到的是字型的預設實例（`opsz=12`），與設計稿在 13px 下由 `font-optical-sizing: auto` 選到的視覺不同，**而且沒有任何錯誤訊息會說明這件事**。靜態實例把這個不確定性整個移除。

`wght=400`：設計稿的散文只有一個字重；需要粗體的地方（footer 的 run-in 標籤）用的是像素面。加上 `@font-face` 不吃 weight 描述子，一個家族名只能掛一個字重，所以多一個字重就是多一個家族名加一份資產 —— 沒有需求就不付。

`opsz=13`：設計稿的散文是 `font-size: 13px` 配 `font-optical-sizing: auto`，所以瀏覽器在該尺寸取到的光學尺寸就是 13。軸範圍是 7–72、預設 12，取 13 是還原設計稿的實際渲染而不是取字型的預設值。

連帶：樣式層**移除** `font-optical-sizing` 宣告。光學尺寸已烘進資產，留著那行宣告只會讓後人以為它還在起作用。

### subset 取 Latin-1 加常用標點，不取資料集當下用到的字元集

Literata 沒有 CJK，中文穿透到系統襯線體，所以 subset 只需要拉丁字。範圍取 `U+0020-007E`（可見 ASCII）、`U+00A0-00FF`（Latin-1 補充，涵蓋 `Pokémon` 的 é）、`U+2010-2015`（各種破折號）、`U+2018-201F`（引號，涵蓋警語裡的 `’`）、`U+2026`（刪節號）、`U+2032-2033`（角分符號）。實測 221 個字形、35 KB。

替代方案是只取資料集當下用到的 63 個字元 —— 實測 9 KB，更小，但把字型綁在當下的資料集上：上游任何新增字元都會是豆腐字。省 26 KB 換不到這個風險。**保留 `kern` 這一個 layout feature**，其餘捨棄；散文需要字距調整，不需要連字與各種替代字。

### 字元覆蓋不變式放在既有的樣式檢查腳本裡

豆腐字是靜默失敗的教科書案例：畫面上有東西、console 零錯誤、建置成功，只有字看起來是方框。`scripts/check-styles.mjs` 已經是這個專案「擋靜默失敗」的地方（選中態級聯順序、`inset` 陰影兩條），這條放進去而不是另開腳本。

檢查的內容：把散文語料的每個字元拿去比對資產的 cmap，任何一個不在裡面就以非零退出並列出缺哪些字元。**語料由程式產生而不是手寫清單** —— 取 `src/data/dex.json` 的英文特性說明，加上字串表裡指定給散文面的英文長句。手寫清單會與資料脫節，那正是這條檢查要防的東西。

代價：這條檢查要讀 TTF 的 cmap，而該腳本目前只讀文字。用 Node 內建的 `fs` 直接解析 TTF 的 `cmap` 表（format 4 與 format 12 兩種子表）即可，不加任何 npm 相依 —— 這與該腳本「不為一條規則加解析器相依」的既有判準一致。

### 家族名 `Lit`，與設計稿一致

沿用設計稿 `--prose` 堆疊的第一個家族名。堆疊的其餘部分（`PingFang TC`、`Songti TC`、`Noto Serif TC`、`serif`）照抄 —— 中文靠它們，而 `serif` 是最後一道。

樣式層有三處要指名它，且**每處都寫完整堆疊**而不是抽成自訂屬性：這與該樣式表對像素面的既有做法一致（註解已寫明理由 —— 字型不依賴變數解析）。

### fonttools 只出現在字型抓取腳本，不進 pipeline 主流程

`design/pipeline/fetch_fonts.sh` 本來就不在 `run.sh` 裡，只在需要更新字型時手動跑，產出的資產進版控。這批照同樣的方式：腳本裡多做實例化與 subset 兩步，並在缺 fonttools 時給出可執行的安裝指示而不是隱晦的 traceback。

因此應用端建置、CI 與任何只跑 `pnpm run build` 的人都不需要 Python 或 fonttools。

## Implementation Contract

**Behavior**

- 特性說明、詳情面板的兩則警語、網格的空結果，其拉丁文字以 Literata 渲染，而不是平台預設面
- 同樣三處的中文仍穿透到系統襯線體
- 名稱／標籤／數字仍是像素面，不受這批影響
- `pnpm run check` 在散文語料出現字型未收錄的字元時失敗，並列出缺少的字元

**Interface**

字型抓取腳本新增的產出：`src/assets/fonts/Literata-Prose.ttf`，靜態、單一字重、Latin-1 subset。檔名帶 `Prose` 而不是 `Regular`，因為它不是上游那個 Regular，是為這個用途實例化並裁切過的衍生資產。

樣式層註冊一個家族名 `Lit`，散文的三處規則指名 `Lit` 開頭的完整堆疊。

樣式檢查腳本新增一條檢查，名稱為 `prose face covers the prose corpus`。

**Failure modes**

- 缺 fonttools：抓取腳本以非零退出，訊息含可直接複製的安裝指令
- 上游檔名或路徑改變：抓取腳本已有的「下載回來的不是 TrueType 就報錯」判斷同樣套用在新資產上（404 頁面存成 `.ttf` 會在渲染期才爆，不是下載期）
- 散文語料出現未收錄字元：樣式檢查失敗。**不做執行期遞補** —— 遞補會讓問題回到靜默
- 資產不存在：樣式檢查失敗並說明要跑哪個腳本，而不是靜默跳過該條檢查

**Acceptance criteria**

- `src/assets/fonts/Literata-Prose.ttf` 在版控內，且大小在 30–45 KB 之間（實測 35,788 B；區間留給上游字型日後的小幅變動）
- 該資產的 cmap 覆蓋散文語料的全部字元，由 `pnpm run check` 斷言；故意在語料裡加一個未收錄字元（例如 `Ω`）會讓檢查失敗
- 資產無 `fvar` 表（確認是靜態實例而非可變字型）
- 樣式表零處 `font-optical-sizing`
- 三處散文規則都指名 `Lit`；`grep` 可確認
- `pnpm run build` 通過，lynx bundle 約 454 KB（實測 453,637 B）—— **注意這不是資產大小加上去而已**，見下面的 base64 那一列
- 實機（iOS）確認特性說明的拉丁文字是襯線體且與像素面明顯有別

**Scope boundaries**

**In scope**：字型抓取腳本的實例化與 subset 兩步、committed 的字型資產、`@font-face` 註冊、三處散文規則指名新家族、移除 `font-optical-sizing`、字元覆蓋檢查、`design/HANDOFF.md` §12.2 的體積更正、OFL 授權文字補上 Literata。

**Out of scope**：招式表的 `mvNone`、粗體散文面、Android 實機驗證、中文字型堆疊、pipeline 主流程、任何執行期相依。

## Risks / Trade-offs

- 上游資料新增未收錄字元 → 檢查會擋住，且失敗訊息直接列出缺哪些字元；補法是放寬 subset 範圍重跑腳本
- Lynx 對 subset 過的 TTF 有未知要求（例如需要某些表） → 資產保留 `cmap`、`glyf`、`hmtx`、`kern`、`name`、`head`、`hhea`、`maxp`、`post`，是 TrueType 的完整必要表集；若實機不吃，退路是不 subset 只實例化（264 KB，仍遠小於 933 KB）並記進 §12
- bundle 增長是 46.6 KB 而非資產的 35.8 KB（base64 內嵌，4/3 倍）→ 已量、可接受；406 → 454 KB 是 +11.8%
- 日後放寬 subset 範圍導致資產超過 `dataUriLimit`（64 KB）→ 資產不再內嵌，變成 lynx bundle 抓不到的 URL，字型靜默失效。放寬範圍時要同時確認資產仍在 64 KB 以下
- 自己解析 TTF 的 cmap 可能踩到子表格式 → 只需支援實際產出的格式，而產出來自固定的 subset 流程；解析失敗要報錯而不是當作「覆蓋通過」
