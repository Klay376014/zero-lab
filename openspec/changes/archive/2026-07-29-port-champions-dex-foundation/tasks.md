## 1. 資料層落地

- [x] 1.1 讓 design/pipeline 的組裝步驟在寫出 design/champions-dex.json 的同時，多寫一份 compact separators 的 src/data/dex.json，兩份內容同源（Dataset provenance；對應設計決策「資料集由 pipeline 產生 src/data/dex.json，不手抄也不跨界匯入」）。驗證：執行該步驟兩次，第二次產出與已進版控的 src/data/dex.json 位元相同（md5 比對）；並以 grep 確認 src/ 底下沒有任何 import 指向 design/。

- [x] 1.2 建立資料層的型別與載入期把關：JSON 邊界以 *.json 的 unknown 模組宣告承接、不啟用 resolveJsonModule，由 src/data/dex.ts 收斂成 Dex / Species / Form / Move / Ability 具名型別（Typed dataset access），並在模組初始化時斷言六項不變式，違反時丟出含「不變式名稱 / 期望值 / 實際值」的錯誤且不做靜默降級（Dataset integrity is asserted at load time；對應設計決策「JSON 邊界不啟用 resolveJsonModule，型別責任收在資料層並以載入期斷言把關」）。驗證：npm run build 通過且 tsc 無錯誤；暫時把任一期望值改錯，確認丟出的錯誤訊息含三項資訊，改回後恢復正常。

- [x] 1.3 提供資料層的讀取介面：bst / bestBst / allTypes / hasMega 四個衍生存取器（Derived value accessors）、依語系解析主副名稱且兩者同時可得的名稱解析（Bilingual name resolution）、十八個型別的五張參照表（Type reference tables），以及 zh / en 鍵集相同的畫面字串表（User-facing string table）。驗證：以 spec 中的 Example 表格逐筆手動核對 —— Venusaur 525/625、Charizard 634、Ditto 288/單一 Normal/無 Mega、Crabominable 578；妙蛙花與 Venusaur 在兩個語系下主副互換；基本形態主標籤落到「基本形態」；五張表各為十八筆、縮寫皆三字元、字符皆八列八字元；zh 與 en 鍵集差集為空。

## 2. 主題層

- [x] 2.1 建立兩個模式的色彩契約：POCKET 由四階灰推導、MODERN 直接給定，兩者都解析出同樣十個語意 token（Two colour modes share one token contract、POCKET derives its tokens from four tones）；墨色選擇比較兩個候選墨色對背景的實際 WCAG 對比值後取高者，不使用固定亮度門檻（Ink colour is chosen by measured contrast；對應設計決策「對比度決定墨色的判定原樣移植，不改成亮度門檻」）；字符填色依 surface / accent / typechip 三種目標表面決定（Glyph fill is chosen by the surface it will sit on）。驗證：以腳本計算 inkOn('#AFA981') 回傳 #101010，且兩個候選值分別為 7.99 與 2.38；計算 spec 表列的五組 (模式, 表面) 對比範圍，確認無任何組合低於 2.9；確認 POCKET 十個 token 的值全部落在四階灰之內。

- [x] 2.2 讓模式與語系成為跨元件共享的響應式狀態，兩者可獨立切換（Active language and active mode are shared reactive state），並把當前模式的 token 以 inline CSS 變數掛在 App.vue 最外層 view 上（Tokens are applied as inline CSS variables on the root view；對應設計決策「模式 token 以根節點 inline CSS 變數注入」）。驗證：在 web 執行 npm run dev，切換模式時畫面所有表面／邊框／文字換色且元件未重新掛載（以 onMounted 只印一次確認）；切換語系時模式不變。

## 3. 像素字型

- [x] 3.1 讓像素字型在 Lynx 可用：新增 design/pipeline/fetch_fonts.sh 抓取 Silkscreen 的 TTF 到 src/assets/fonts/ 並進版控（Font assets are obtained by a scripted step），以 TTF 註冊而非 WOFF2（Pixel face is registered in a format both platforms accept），Regular 與 Bold 註冊為 Silk / SilkBold 兩個獨立家族名、不依賴 font-weight 描述子（Weights are registered as separate families；對應設計決策「像素字型改用 TTF 並拆成 Silk / SilkBold 兩個家族」），並把名稱／標籤／數字指定到像素字型、本切片不引入襯線體（Font roles are assigned by content kind）。驗證：以 file 指令確認兩個資產為 TrueType；grep 確認 font-face 規則中沒有 woff2 與 font-weight；在 web 目視確認拉丁名稱為像素字型、中文自然落到系統字型且在 11px 仍可讀；npm run build 在未跑抓取腳本的乾淨檢出下成功。

## 4. 型別字符

- [x] 4.1 建立 src/components/TypeGlyph.vue：由程式組出 SVG XML 字串餵給 svg 元素的 content 屬性，不使用 canvas、模板中不展開 rect 子節點（Glyphs render as vector content, not canvas；對應設計決策「型別字符改用 SVG 方塊網格，取代 canvas」）；每列連續填滿的像素合併成單一 rect、viewBox 為 0 0 8 8（Bitmap rows are emitted as merged horizontal runs）；渲染盒固定 16px 見方不隨字級變動（Glyph box size is fixed）；以 (模式, 型別, 表面) 為鍵記憶化字串並在模式切換時失效（Glyph strings are memoised）；元件輸入為 type 與 surface 兩個 prop、填色取自主題層（Glyph accepts a type and a target surface）。驗證：Normal 字符第 0 列產出恰為一個 x=2 y=0 width=4 height=1 的 rect；同一型別在 surface 與 accent 兩個表面產出不同填色；未知型別名回退到 Normal 且不丟錯；在 web 渲染十八個字符 × 兩種表面的色板，三十六格全部可見。

## 5. 種類卡片

- [x] 5.1 建立 src/components/SpeciesCard.vue 的組成與輸入契約：依序渲染標頭（四位補零編號、MEGA 星號徽章、世代羅馬數字）、sprite、主名稱、副名稱、形態標籤、型別列（字符 + 三字母縮寫）與形態數徽章（Card composition）；主副名稱同時在畫面上、切換語系只交換主導權（Both languages stay on the card）；元件輸入為 species 與 formIndex，渲染指定索引的形態、不含形態切換互動（Card takes a species and a form index）。驗證：以 spec 的 Example 表格逐筆核對 Venusaur（No.0003 / I / 星號 / 2 / GRS,PSN）、Charizard（星號+2 / 3）、Ditto（無徽章 / NRM）、Heracross（No.0214 / II）；傳入指向 Mega 形態的 formIndex 時卡片顯示該形態的圖像、標籤與型別。

- [x] 5.2 讓卡片版面在內容缺漏與內容過長時都不破版：副名稱列與形態標籤列在內容為空時仍保留高度（Card height is stable when optional rows are empty）；過長名稱換行而不裁切、不加省略號、不溢出卡片（Long names wrap rather than truncate）。驗證：基本形態卡片與有形態標籤的卡片高度相同；Crabominable 與五字中文名（例如麻麻鰻魚王）完整可見；在 500px 寬視窗下零水平溢出。

- [x] 5.3 讓 sprite 在放大時維持像素銳利並在失敗時仍有內容：image-rendering: pixelated 宣告寫在每個 image 元素本身、不依賴祖先繼承（Sprite upscaling declares nearest-neighbour on the image element itself；對應設計決策「image-rendering: pixelated 逐元素宣告，並在驗證載具放大兩倍才看得出差異」）；兩個模式下 sprite 都不重新著色、不套 tint 或量化（Sprite artwork is never recoloured）；載入失敗時以 surface2 底、中央 48px 型別字符的替代圖塊填滿同樣的圖框，不出現破圖、不留空白、console 不報錯（Sprite load failure falls back to a glyph tile；對應設計決策「sprite 載入失敗改用型別字符替代圖塊」）。驗證：檢視套用在 sprite 上的樣式確認宣告在 image 元素本身；192px 的同一張圖在 web 呈現方格而非模糊插值；切斷網路後卡片顯示替代圖塊、卡片高度不變、console 零錯誤。

- [x] 5.4 用巢狀 view 的分邊框線重建卡片立體斜角：內層 view 上／左邊框色取 --panel、下／右取 --surface2，樣式中不出現 inset 陰影，且不引入當前模式色盤外的顏色（Card bevel is built from per-side border colours；對應設計決策「立體斜角改用巢狀 view 的分邊框線，取代不支援的 inset 陰影」）；卡片在模式與語系切換時就地更新而非重新掛載（Card reflects mode and language without remounting）。驗證：grep 確認樣式中無 inset 關鍵字；在 web 目視確認左上亮邊與右下暗邊各 1px；POCKET 下所有實際上色的顏色都落在四階灰之內（上限 4，非固定 3）；切換模式時卡片的 onMounted 不再觸發。

## 6. 驗證載具與平台實測

- [x] 6.1 把 App.vue 改成本切片的驗證載具：縱向排列模式切換、語系切換、三到四張邊界案例卡片（雙型別多形態含 MEGA 的妙蛙花、名稱最長的 Crabominable、單型別無形態的百變怪）、十八個型別字符 × 兩種表面的色板，以及 96px 與 192px 並排的同一張 sprite；同時移除 starter 的 flappy 範例程式與三個 logo 素材，不留無人引用的死程式（對應設計決策「本切片以 App.vue 作為驗證載具，不建立網格」）。驗證：npm run dev 開起來看得到上述五個區塊；grep 確認 useFlappy 與 flappy 已無任何引用且檔案已刪除；npm run build 成功。

- [x] 6.2 在 web 環境完成驗收表：console 零錯誤；兩個模式 × 兩個語系四種組合的卡片與色板皆無破版；192px sprite 為銳利像素格；拉丁字為像素字型；1400px 與 500px 兩個寬度下零水平溢出。驗證：以 npm run dev 逐項確認並把每一項的結果（通過／不通過）記錄下來，不通過的項目要指出是哪一個平台事實不成立。

- [x] 6.3 在 LynxExplorer 掃碼開啟同一份並重跑 6.2 的驗收表，額外確認斜角在原生渲染下可見、字型以打包資源路徑載入是否成立（Font asset reference strategy has a recorded fallback），三項平台事實（逐元素 image-rendering、TTF 兩家族字型、分邊框線斜角）逐項判定成立或啟用退路；最後把實測結果、實際使用的寫法、以及 Vue Lynx 對 image 錯誤事件的正確綁定方式回寫 design/HANDOFF.md。驗證：HANDOFF.md 中新增一節，逐項記載三個平台事實的實測結論與退路啟用狀況，且 §11 的驗證方式清單補上本切片新增的檢查項。
