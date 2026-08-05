## 1. 選取狀態與存取層

- [x] 1.1 建立 `src/state/selection.ts`，讓「Selection is owned by one module that clamps the form index」成立：導出 `selected`、`selectedFormIndex`、`openDetail`、`selectForm`、`closeDetail`，索引一律夾限到 `[0, species.f.length - 1]`，關閉時種類與索引一起重設，未選取時 `selectForm` 不做事也不報錯。依 design.md 的「選取狀態放在模組層級的 selection.ts，觸發綁在網格自己的儲格節點上」，沿用 `display.ts` 的模組層級 ref 慣例，不放進 `query.ts`。驗證：`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過，且模組本身不 import 任何元件（單向依賴）。
- [x] 1.2 依 design.md 的「字串表用具名存取器承接新形狀，t() 維持只回字串」擴充 `src/data/i18n.ts`：新增詳情面板的純字串鍵（關閉、四項屬性標籤、陣容內外、種族值與總和、特性與隱藏、警語前綴與兩則警語），並新增 `statLabels`、`kindLabel`、`genOfLabel`、`formsOfLabel`、`abilityName` 五個具名存取器；`t()` 的簽章不變。驗證：`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過，且 `statLabels` 在兩個語系都回六個標籤、`kindLabel` 四個類別都有值（以 TypeScript 的 `Record` 完整性強制，非目視）。
- [x] 1.3 在 `src/data/dex.ts` 新增 `abilityOf(ref)` 與 `isHidden(ref)` 兩個特性槽存取器，讓元件不必自己索引 `dex.abilities`；既有導出一律不動。驗證：`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過，且既有的資料層載入期斷言仍全數通過（`pnpm run dev` 啟動時 console 零錯誤）。

## 2. 面板外殼（裝置驗收前只做到這裡）

- [x] 2.1 讓「The grid cell is the tap target and reports the species with the form it displays」、「The grid does not own the selection」與「A card tap opens the detail on the form that card displays」的開啟一側成立（兩條關閉路徑在 2.2）：`@tap` 綁在 `DexGrid` 模板自己的儲格 view 上（不綁在 `<SpeciesCard>` 上），回報該儲格當時顯示的形態索引；`SpeciesCard` 不新增任何點擊處理或選取知識。驗證：以屬性篩選 Dragon 後點 Charizard，開啟的是 Mega Charizard X 而非基本形態；`grep` 確認 `SpeciesCard.vue` 內無 tap 綁定與無 selection import。
- [x] 2.2 建立 `SpeciesDetail.vue` 的外殼，讓「The detail panel overlays the dex without relying on viewport-fixed positioning」、「The panel has exactly one scrolling container and its header sits outside it」、「The panel is mounted on open and unmounted on close」三條同時成立：面板與遮罩掛在 `Root` 底下與 `Shell` 同級並以 `position: absolute` 撐滿（依 design.md 的「覆蓋層是 Root 內的 absolute 兄弟節點，不用 position: fixed」）；標題列在單一 `<scroll-view>` 之外（依「整個面板只有一個捲動容器」）；以 `v-if` 掛載與卸載（依「面板用 v-if 掛載與卸載，不用 v-show」）。標題列含名稱、副名稱、編號・世代・形態數・分類與關閉鈕，關閉有 ✕ 與遮罩兩條路徑，且關閉後網格捲動位置與查詢不變。驗證：web 目標上開關各三次，`grep` 確認樣式表零處 `position: fixed`、零處 `position: sticky`，且關閉後元素樹中無面板節點。
- [x] 2.3 依 design.md 的「內凹陰影改為分邊框，格線佈局改為 flex 固定欄寬」寫入面板外殼與遮罩的樣式，含 `panelIn` / `veilIn` 的 `steps()` 逐格動畫，並讓「Layout uses the row-and-column primitives already in use, not a grid」成立（零處 grid 宣告）。驗證：`pnpm run check` 通過；`grep` 確認新樣式零處 `display: grid`、零處 `inset` 陰影；web 目標上開啟時看得出逐格而非平滑。
- [x] 2.4 **裝置驗收關卡**（design.md 的「實作順序即風險順序：外殼先過裝置驗收，才填內容」）：在 iOS 實機確認覆蓋層滿版壓在網格上、標題列不隨內容捲動、內容可捲到底、開關重複多次後仍流暢。把結果寫進 `design/HANDOFF.md` §12 新的一節（§12 明文要求詳情面板重新量而非沿用網格結論）。驗證：HANDOFF 新節記載實測日期、裝置與結論；若覆蓋層不成立，改採 design.md 記載的「詳情整頁取代網格」退路並同樣記錄，**再往下做**。

## 3. 內容區塊

- [x] 3.1 讓「The panel states the species' identity, artwork, and four attributes」成立：192px 大圖（縮放宣告寫在該 `image` 元素本身）、形態標題、以及屬性／形態與類別／加入版本／當前陣容四項屬性列；大圖沿用卡片的「佔位字符從一開始蓋著、`@load` 才移除」機制，不依賴 native 不會觸發的 `@error`。依 design.md 的「觸控裝置沒有 hover，所以 title 提示整批移除，圖像預熱也移除」，不做 title 替代物、不預熱其他形態圖像。驗證：斷網開啟任一隻，圖框內是屬性字符而非空白；四項屬性在中英兩語系都有值。
- [x] 3.2 讓「Type pills spend type colour only in the mode allowed to」成立：MODERN 下藥丸填 `typeColor(type)`、文字用 `inkOn(...)`、字符表面 `typechip`；POCKET 下只留邊框、字符表面 `surface`（依 design.md 的「屬性藥丸在 MODERN 填屬性色，在 POCKET 只留邊框」）。驗證：以 `src/theme/contrast.ts` 的對比函式計算兩個模式下藥丸字符對其實際背景的對比，全部不低於既有下限 2.9；POCKET 下面板實際上色的顏色數仍在四階灰之內。
- [x] 3.3 讓「Roster and shared-artwork conditions are stated as warnings」成立：形態不在當前陣容顯示陣容警語、圖像為種類共用圖顯示近似警語、形態或種類帶備註時顯示該備註；三者皆取自字串表，普通形態則一則都不顯示。驗證：開啟一隻不在陣容的形態、一隻共用圖形態、一隻普通形態，三種結果各自符合。
- [x] 3.4 建立 `StatBars.vue`，讓「Base stats are six rows and a total, with the form's best row emphasised」成立：六列（標籤／數值／條）加總和，條的填充是對固定上限 230 的百分比且下限 2%，最高值那列只以顏色與條的濃度強調、行高不變。依 design.md 的「詳情拆成四個元件」，此元件只收六元組數值。驗證：Mega 班基拉斯（總和 700）條不溢出；六列行高相同（量測截圖）；切換形態後強調跟著換到新的最高值那列。
- [x] 3.5 建立 `AbilityList.vue`，讓「Abilities are listed with both languages, a hidden marker, and prose descriptions」成立：每個特性槽一塊，含主語言名、另一語言名（存在時）、隱藏標記、說明；缺說明時整段不渲染而非留空框，缺主語言名時退回存在的那個名稱。驗證：找出一個缺中文說明的特性開啟確認無空框；隱藏特性的槽顯示標記。
- [x] 3.6 依 design.md 的「散文面暫用系統字型」讓「Font roles are assigned by content kind」成立：特性說明與兩則警語不指名 `Silk` / `SilkBold`，落到系統字型；同時把這個佔位與它造成的驗收缺口寫進 `design/HANDOFF.md`（§12.2 的 Literata 掛帳改為明確狀態）。驗證：`grep` 確認長文樣式未指名像素字族、字型資產目錄零個 WOFF2；HANDOFF 記載佔位理由與未滿足的驗收項。

## 4. 形態切換器

- [x] 4.1 建立 `FormSwitcher.vue`，讓「The switcher appears only for species with more than one form」與「Forms are grouped by kind in a fixed order」成立：單形態種類完全不渲染切換器；多形態依基本／形態／地區形態／MEGA 固定順序分組，空組省略，組標籤取自字串表。驗證：Ditto 無切換器；Vivillon（20 形態，全部是 `other` 類別）在最窄目標寬度下組標籤可讀、鈕換行、無水平溢出；Floette（無基本形態）只出現地區形態與 MEGA 兩組。
- [x] 4.2 讓「A form button carries type marks only when that form retypes the species」成立：只有屬性組合與該種類第一個形態不同的形態才在鈕上帶屬性字符，MEGA 形態另帶星號。驗證：Mega 妙蛙花（同屬性）無字符、Mega 噴火龍 X（Fire/Dragon）有字符、Mega 噴火龍 Y（同屬性）無字符、Vivillon 任一花紋無字符、阿羅拉九尾（Fire → Ice/Fairy）有字符。
- [x] 4.3 讓「The selected button is visibly distinct and its rule cannot be cancelled by its base」成立：任一時刻恰有一顆鈕為選中態，選中態的 class 沿用 `XOn` 命名慣例且其規則寫在基底規則之後；選中鈕上的字符依選中表面上色。驗證：`pnpm run check` 通過（既有的選中態順序檢查會蓋到新的 class）；兩個模式下選中與未選中鈕目視有別；選中鈕字符對比以 `contrast.ts` 計算不低於下限。
- [x] 4.4 讓「Selecting a form replaces the panel's content without moving the scroll position」成立：切換形態後大圖、形態標題、屬性藥丸、屬性、種族值、特性全換成新形態，捲動位置不動；切換器以事件回報所選形態而不自行寫入選取狀態。依 design.md 的「切換形態時捲動位置自然保持，不需要程式介入」，程式中不得出現任何讀寫捲動位置的呼叫。驗證：捲到特性區後切換形態，位置不動；`grep` 確認面板與切換器皆無捲動位置存取。

## 5. 不變式與收尾

- [x] 5.1 依 design.md 的決定「樣式檢查新增一條「不得出現 inset 陰影」」，在 `scripts/check-styles.mjs` 加入第二條檢查，讓「Inset shadows are absent and asserted by the style check」成立：任何 `box-shadow` 含 `inset` 即以非零退出並指出檔案。驗證：故意在任一樣式表加一條 `box-shadow: inset 0 0 0 1px red` 後 `pnpm run check` 失敗並列出該檔，移除後通過。
- [ ] 5.2 四種組合（POCKET／MODERN × 中文／英文）與邊界案例逐一驗收：Vivillon（20 形態）、Floette（無基本形態）、Mega 班基拉斯（種族值 700）、變隱怪（資料最稀），確認無破版、無水平溢出、最長名稱不截斷、console 零錯誤。驗證：每個組合與案例各留一張截圖，異常者修正後重驗。
- [x] 5.3 更新 `design/HANDOFF.md` 與 `README.md`：HANDOFF 記錄這批新測到的平台事實與所有因平台而偏離設計稿之處（單一捲動容器、取消 sticky、移除 title 與圖像預熱、inset 改分邊框、grid 改 flex），README 的 `src/` 說明從「第一個垂直切片」更新為含詳情面板、並註明招式表仍在批次 B。驗證：閱讀兩份文件，確認偏離清單與 design.md 的 Decisions 一一對得上，且沒有任何偏離只出現在程式碼裡。
- [x] 5.4 讓詳情遮罩在**兩個模式**都壓暗網格而不是遮住它，並讓「POCKET derives its tokens from four tones」的例外明列在 spec 裡：遮罩以 `opacity` 作用在 `var(--bg)` 上（不寫死 `rgba`，不命名 theme 層不擁有的顏色），且遮罩是唯一被允許以疊色跨出四階灰的一層。驗證：`grep` 確認全 `src/` 只有 `.DetailVeil` 一條規則降低已上色表面的不透明度；`retro-theme` 的 delta spec 明列 sprite 圖像與遮罩兩個例外；目視確認兩個模式下網格都從遮罩後透出。
