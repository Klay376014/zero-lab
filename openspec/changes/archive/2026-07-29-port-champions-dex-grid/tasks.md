## 1. 前置：結清第一個切片的未決事項

- [x] 1.1 在 iOS 實機上判定屬性字符的渲染機制並讓結論成為文件事實（Glyph rendering strategy has a recorded fallback；對應設計決策「先在 iOS 結清字符渲染策略，之後才替換驗證載具」）。這一項必須跑在 App.vue 被改動之前，因為現有的驗證載具就是字符色板與 sprite 放大對照的唯一載體。用 dev server 的 QR code 在實機開啟現有載具，重跑 design/HANDOFF.md §11 的驗收表，並重跑 §12.10 的四種寫法對照：svg 元素的 content 屬性、svg 元素的 src、image 元素指向 SVG 檔、image 元素指向 SVG 的 data URI。完成後 design/HANDOFF.md 有一節逐項記載四種寫法在 iOS 上的結果、判定採用哪一種、以及桌面版是否應標記為不能用來驗字符。驗證：十八個字符乘兩種表面的色板三十六格在實機上逐格確認可見或不可見，結果與判定一起寫進交接文件；§11 驗收表中不依賴卡片區的項目逐項記錄通過或不通過，不通過者指出是哪一個平台事實不成立。

  實測結果（iOS 實機，2026-07-29）：字符色板三十六格全部渲染、POCKET 與 MODERN 皆確認 → `content` 成立，`TypeGlyph` 不動、退路不啟用（§12.10 已結清）。`image-rendering: pixelated` 成立（192px 有宣告銳利、無宣告模糊，並排對照，§12.1）。`@error` 在 iOS **會**觸發而 macOS 不會，`@load` 三個目標都觸發 → `@load` 是交集，反向策略維持（§12.6）。`box-sizing` 預設為 `border-box` 而非 web 的 `content-box`（§12.7）。

  §11 中依賴卡片區的項目（最長名稱不被截斷、卡片高度穩定、POCKET 顏色數）**在這一輪無法執行**：載具沒有捲動容器，卡片區在原生上到不了（正是 §12.12 記的那件事）。這些項目移到 5.2 與 5.3 在真正的網格上執行 —— 在即將被取代的載具上重跑它們沒有價值。

- [x] 1.2 僅在 1.1 判定 content 屬性在 iOS 不成立時執行：讓字符改以 image 元素指向 SVG 資產渲染並依目標表面上色，且呼叫端不受影響（Glyphs render as vector content, not canvas）。字符仍是單一向量節點、模板中不展開方塊子節點、元件輸入仍是屬性與目標表面兩個 prop；資產數為十八個單色 SVG 而非屬性乘表面乘模式的組合數，顏色由 tint 在使用點決定；不使用 data URI。驗證：資產目錄下恰好十八個檔案；grep 確認樣式與模板中沒有 data URI 形式的字符來源；三十六格色板在 iOS 實機重新逐格確認可見；卡片與篩選鈕的模板沒有任何改動。

  **條件未觸發，本任務不執行。** 1.1 在 iOS 實機判定 `<svg content>` 正常渲染（三十六格全部畫得出來），所以 `TypeGlyph` 維持現行實作、`<image src>` 加 `tint-color` 的退路不啟用、十八個單色 SVG 資產不產生。退路的做法仍保留在 §12.10，以備 Android 實測失敗時使用。

- [x] 1.3 讓既有規格內部一致，不再誤導後續實作（POCKET derives its tokens from four tones；對應設計決策「POCKET 顏色數上限更正為四」）。openspec/specs/retro-theme/spec.md 的該條需求散文由「維持三」改為「不超過四」，與它自己的 scenario、archive 的 tasks 記載及 HANDOFF §12.7 的實測值一致，並說明這條不變式真正要防的是引入色盤外的顏色；同時 openspec/specs/ 底下五份規格的 Purpose 段落全部改成描述該能力實際涵蓋範圍的句子，不留 archive 產生的佔位字串。驗證：grep 五份規格確認沒有任何 TBD 或「Update Purpose after archive」字樣；重讀 retro-theme 該條需求，散文的數字與其 scenario 的數字相同。

## 2. 查詢狀態

- [x] 2.1 建立 src/state/query.ts，讓搜尋與三個控制項成為跨元件共享且可獨立設定的狀態，且搜尋永遠跨語系（Query state is shared and independently settable、Search matches across both languages at all times；對應設計決策「查詢狀態放獨立模組，不在 list 之上包抽象層」與「搜尋永遠跨語系比對」）。沿用 src/state/display.ts 的模式：模組層級 refs 加 computed，不透過 props 貫穿。對外暴露搜尋字串、屬性篩選、世代篩選、排序方式四個可寫狀態與一個重設函式；搜尋比對同時涵蓋中文與英文名稱、拉丁比對忽略大小寫、支援部分名稱。驗證：設定屬性篩選後另外三個狀態值不變；重設後四者回到初始值且結果集為 208 筆；以規格的 Example 表格逐筆核對 —— charizard、CHARIZARD、噴火龍、char、噴火 五個字串都命中噴火龍，ditto 不命中；切換主導語系後同一個搜尋字串的結果集不變。

- [x] 2.2 讓屬性與世代篩選以species層級跨所有形態判定（Type and generation filters are evaluated across all of a species' forms）。屬性篩選重用資料層既有的跨形態屬性集合存取器，使只有非基本形態才符合的species仍然命中；世代篩選以species的登場世代判定；搜尋字串與兩個篩選同時作用時取交集。驗證：以規格的 Example 表格核對噴火龍在 Fire、Flying、Dragon 三個篩選下都命中而 Water 不命中，其中 Dragon 只有 Mega 噴火龍 X 帶有；同時給定搜尋字串、屬性、世代三者時，結果集中每一筆都同時滿足三個條件。

- [x] 2.3 讓每一筆結果同時帶出該卡在當前篩選下應顯示的形態索引（A filtered card displays the form that matched the filter；對應設計決策「篩選命中的形態由網格推導後傳入卡片」）。有屬性篩選時取第一個帶有該屬性的形態索引，無屬性篩選時取基本形態索引；推導寫在查詢模組內，src/components/SpeciesCard.vue 的輸入契約不變。驗證：以規格的 Example 表格核對噴火龍在無篩選與 Fire 篩選下配到基本形態、在 Dragon 篩選下配到 Mega 噴火龍 X，且該筆卡片畫面上的屬性列相應為火／飛行或火／龍；grep 確認 SpeciesCard.vue 的 props 沒有增減。

- [x] 2.4 讓種族值排序以每個species最強形態的總和排名（Sorting by base stats uses each species' strongest form；對應設計決策「排序鍵取最強形態的種族值總和」）。重用資料層既有的最強形態總和存取器而非基本形態總和，否則七十五個 MEGA 會被埋在未進化的數值底下；排序方式是封閉集合，至少含編號與種族值總和兩種，種族值由高到低、編號由小到大。驗證：以規格的 Example 表格核對妙蛙花取 625、噴火龍取 634、Crabominable 取 578、百變怪取 288，且這四筆在種族值排序下的順序為噴火龍、妙蛙花、Crabominable、百變怪；切到編號排序時相鄰兩筆的編號嚴格遞增。

## 3. 網格

- [x] 3.1 建立 src/components/DexGrid.vue，讓 208 張卡在自己的捲動容器裡呈現且每張卡的身分不會錯配（The card area scrolls in a plain scrolling container, not the recycling list element、Card identity is composed from species and form, never from position；對應設計決策「長列表用 scroll-view 承載，因為 list 元素在 vue-lynx 尚不可用於會變動的序列」與「卡片的 key 由種類編號與形態索引組成，不用陣列位置」）。卡片放在單一 scroll-view 內、網格中不出現 list 元素；不引入任何第三方虛擬捲動套件；每張卡的 key 由種類編號與顯示形態索引組成而非陣列位置，使排序改變位置時同一species的 key 不變、而屬性篩選改變顯示形態時 key 改變以重建 sprite 載入狀態。驗證：grep 元件確認出現 scroll-view 且沒有 list 或 list-item；grep package.json 確認無虛擬捲動相依；以規格的 Example 表格核對四筆 key（妙蛙花基本 3-0、Mega 妙蛙花 3-1、Mega 噴火龍 X 6-1、百變怪 132-0）；以腳本確認同一species在編號排序與種族值排序下 key 相同、而在無篩選與 Dragon 篩選下 key 不同。

- [x] 3.2 讓網格以佔行比例的儲格排出欄位（The grid lays out columns as a proportion of the row；對應設計決策「網格用 flex-wrap 與佔行比例的儲格排出欄位」）。容器沿用第一個切片的 row 方向 flex-wrap；儲格寬度是佔行的比例、宣告在單一處、不由螢幕寬度查詢推導，且任何儲格都不帶固定像素寬度；欄間留白是儲格的 padding 而非 margin（Lynx 的 box-sizing 預設 border-box，margin 會加在寬度之外把第二格擠到下一行）；卡片的 sprite 維持自身像素尺寸並置中，不隨儲格寬度拉伸。驗證：grep 樣式確認容器為 row 方向且 flex-wrap、儲格比例只有一處來源、無固定像素寬度、留白用 padding 不用 margin；grep 整個 src 確認沒有任何螢幕寬度查詢；以規格的 Example 表格核對 375／390／393／430 四個寬度下都是兩欄；在 iOS 實機確認卡片兩欄並排且 sprite 未被拉伸。

  原本的契約是「沿用固定的 164px 卡片寬度」，iOS 實機推翻了它 —— 該寬度是為 500px 瀏覽器調的，在 375／390／393 三個 iPhone 寬度下都只排得出一欄。契約已改為佔行比例，規格與設計決策同步更新。

- [x] 3.3 讓階梯揭示只在首次繪製播放一次（The reveal animation plays once on first paint；對應設計決策「階梯揭示只在首次載入播放一次，之後進入序列的卡片不重播」）。動態全部使用 steps() 而非平滑 easing；每張卡的延遲隨索引遞增到一個固定上限，超過上限的卡片延遲相同（208 張全部在首次繪製掛上，所以上限是必要的而非優化）；揭示綁在一個開機旗標上，首次繪製完成後移除旗標，使之後任何進入序列的卡片都不播放 —— 包含放寬篩選讓卡片重新掛上的情況；查詢改變不重播。驗證：grep 樣式確認揭示動態的 timing function 是 steps()；以規格的 Example 表格核對索引 0、10、26、100、207 的延遲值，其中 26 之後皆為上限值；改變搜尋字串與屬性篩選、再把篩選清掉，確認三種情況下卡片都直接出現而非重播揭示。

- [x] 3.4 讓無命中的查詢說明原因而不是留白（An empty result set is stated rather than blank）。查詢無命中時卡片區渲染取自字串表的說明文字、不留空白區域、console 不報錯；同時把查詢列與空結果所需的字串補進 src/data/i18n.ts，來源是 design/pipeline/template.html 的 I18N 表而非新編，且 zh 與 en 兩組鍵集必須相同（沿用既有不變式）。驗證：輸入一個不存在的名稱，確認畫面出現說明文字且 console 零錯誤；把查詢改回有命中的字串，確認卡片出現且說明文字消失；以腳本比對 zh 與 en 的鍵集差集為空。

## 4. 畫面組裝

- [x] 4.1 讓網格取代驗證載具成為啟動畫面，且捲動結構明確宣告（Content taller than one screen declares its own scrolling；對應設計決策「長列表用 scroll-view 承載，因為 list 元素在 vue-lynx 尚不可用於會變動的序列」）。這一項必須排在 1.1 之後。masthead 與查詢列放在捲動容器之外因此卡片捲動時保持固定；卡片區的 scroll-view 自己承擔捲動；該 scroll-view 在畫面區內不得有任何其他捲動容器祖先，避免兩層捲動搶手勢；建立從根節點到 scroll-view 的高度鏈使捲動容器有界（無界的捲動容器會長到容納全部子節點而完全不捲動）；App.css 補上查詢列與網格的樣式，顏色一律取自 token、不出現色值字面量，且不使用 inset 陰影。驗證：在 iOS 實機捲動卡片區到底，確認當前結果集最後一筆完整可見、且 masthead 與查詢列沒有跟著捲走；檢視元素樹確認該 scroll-view 沒有其他捲動容器祖先；grep App.css 確認無 inset 關鍵字、無十六進位色值字面量。

## 5. 驗收

- [x] 5.1 在 iOS 實機確認卡片區的捲動與記憶體行為，並讓結論成為文件事實。從第一筆捲到第 208 筆，全程觀察是否出現空白卡或錯配內容，並觀察記憶體是否隨已捲過的筆數持續成長 —— scroll-view 不回收子節點是已知的，要量的是 208 筆在手機上是否可接受。若不可接受，啟用退路：以捲動位移推算可見區間，只渲染區間內加上前後各一屏的卡片。驗證：捲到底的過程中逐屏確認無空白卡與錯配；把記憶體觀察結果與是否啟用退路寫進 design/HANDOFF.md 的平台事實一節，同時在該節記下 vue-lynx 的 list 綁定只支援尾端追加這項證據與重新評估的觸發條件。

- [ ] 5.2 完成功能驗收表並逐項記錄通過或不通過：搜尋 charizard 與 噴火龍 命中同一筆且切換主導語系後結果集不變；屬性篩選 Dragon 時噴火龍卡片的屬性列為火／龍；排序切到種族值總和時相鄰兩筆的最強形態總和遞減；首次載入播放揭示、捲動離開再回來與改變篩選皆不重播；無命中時顯示說明文字且 console 零錯誤。驗證：在 iOS 實機逐項操作並記錄結果，不通過的項目指出是哪一條需求或哪一個平台事實不成立。

  **部分完成 —— 這張表沒有跑完就 archive 了。** iOS 實機已確認：屬性篩選 Dragon 時噴火龍卡片顯示火／龍；搜尋會過濾（標題計數隨輸入變動）；首次載入播放階梯揭示。**未確認**：搜尋 charizard 與 噴火龍 是否命中同一筆、搜尋中切語系結果集是否不變、種族值排序的遞減、改篩選與捲動往返是否不重播動畫、無命中時是否顯示說明文字且 console 零錯誤。前三項在 CI 之外以腳本對真實資料集驗過（規格的 Example 表格全數通過），但**裝置上的呈現未經目視**。

- [ ] 5.3 完成視覺驗收表：兩個色彩模式乘兩個語系四種組合的網格皆無破版、零水平溢出；最長名稱（英文 Crabominable、中文五字名）在網格欄寬下完整可見不被裁切；POCKET 下所有實際上色的顏色都落在四階灰之內且數量不超過四；字型分工未跑偏，卡片名稱與查詢列標籤仍是像素字型、中文自然落到系統字型。驗證：在 iOS 實機逐項目視確認並記錄；顏色數以截圖數相異色值的方式量化而非目視，超出四代表引入了色盤外的顏色。

  **部分完成 —— 這張表沒有跑完就 archive 了。** iOS 實機已確認：MODERN 下屬性鈕底色為各屬性自己的顏色（typechip 表面成立）。POCKET 顏色數以程式驗證：十個 token 全部落在四階灰內、相異數恰為 4、本切片唯一新增的行內顏色（屬性鈕底色）受 `mode.typeColor` 守門而 POCKET 未宣告該旗標，因此結構上不可能引入色盤外的顏色 —— 但**未以截圖量化實際渲染結果**，所以偵測不到平台自身引入的顏色（例如反鋸齒）。**未確認**：兩個模式乘兩個語系四種組合是否無破版與零水平溢出、Crabominable 與中文長名是否不被裁切、卡片名稱與查詢列標籤是否仍為像素字型。
