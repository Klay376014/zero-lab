## 1. 資料層：編號到 identifier 的對照表

- [x] 1.1 pipeline 取得上游 flag 清單：`design/pipeline/fetch_sources.sh` 多抓 `move_flags.csv`。交付的契約是取得步驟結束後工作目錄裡有這份檔案，且既有的 `move_flag_map.csv` 仍然被抓。驗證：重跑取得步驟，確認兩份檔案都存在且 `move_flags.csv` 含 21 列
- [x] 1.2 資料集帶出「The dataset names every move flag identifier」要求的對照表：`design/pipeline/aggregate.py` 依 `move_flags.csv` 輸出一個頂層鍵，鍵為編號的字串形式、值為上游 identifier，收錄全部 21 種（含四種不顯示的）。依 design 的「排除四種 flag 的方式是不給它們簡稱」，這一層不得過濾。驗證：重跑 pipeline 後 `src/data/dex.json` 與 `design/champions-dex.json` 除了新增那一個頂層鍵之外沒有任何差異（前者緊湊、後者縮排，兩份都不得手改）
- [x] 1.3 載入期不變式讓自我矛盾的資料集拋錯：任何招式 `fl` 裡出現對照表沒有的編號時，載入期斷言拋出，而不是留給介面靜默跳過。這是「The dataset names every move flag identifier」的第二個 scenario。驗證：`pnpm test` 新增一條斷言，餵一個含未知編號的資料集會拋錯
- [x] 1.4 `src/data/dex.ts` 為對照表加上型別，介面讀它時不需要型別斷言。驗證：`pnpm run typecheck`（`vue-tsc`，不是 `tsc`）通過
- [x] 1.5 `tests/dex-data.test.ts` 斷言對照表收錄 21 種、且每個出現在任一招式 `fl` 裡的編號都在表內；既有六條 flag 斷言（425／71／21 種／單筆最多 6／升冪／無空陣列）維持不變，因為這一批不改 `fl` 的內容。驗證：`pnpm test`

## 2. 字串表：17 組簡稱

- [x] 2.1 交付「The string table carries a short label for each displayed move flag」：`src/data/i18n.ts` 收錄 17 種 identifier 的簡稱，中英各一組，值以 `ROADMAP.md` A11 表格的「簡稱」與「英文」兩欄為準。依 design 的「編號到 identifier 到簡稱的兩段式綁定」，鍵是 identifier 字串而非編號 —— 上游重編號因此不會靜默錯標。驗證：`pnpm test` 斷言 17 種在兩個語系都有非空簡稱
- [x] 2.2 四種被排除的 flag 在字串表兩個語系都沒有條目，且這是排除的唯一表達方式 —— 不建立第二份排除清單。依 design 的「排除四種 flag 的方式是不給它們簡稱」與「判準是「名詞能否描述招式本身的性質」，不是覆蓋率」（`protect` 覆蓋 340 筆仍然保留）。驗證：`pnpm test` 斷言 `mirror`／`snatch`／`non-sky-battle`／`distance` 兩語系都查不到簡稱
- [x] 2.3 依 identifier 與語系取簡稱的函式查不到時回傳空值而不拋錯，供介面跳過該顆標記。驗證：`pnpm test` 斷言查一個不存在的 identifier 得到空值且不拋錯
- [x] 2.4 新增列標籤字串鍵 `mdFlags`：中文「性質」、英文 `Flags`。依 design 的「`Flags` 這個列標籤是量出來的，不是挑好看的」—— `Flags` 在 `.MoveDetailAttrKey` 的 88px 欄裡是 47.0px，而 `Properties`（91.0px）會斷行並把列基線拉歪，已棄用。中英不對譯的理由與 `authentic`／`reflectable` 同列，一併寫進 change。驗證：`pnpm test` 的 `tests/i18n.test.ts` 斷言兩語系都有 `mdFlags`；量測用 `src/assets/fonts/Silkscreen-Regular.ttf` 自己的 advance width 在 12px + 1px tracking 下複算，方法須先重現 `App.css` 註解裡 `ACCURACY` 81.5 那四個既有數字

## 3. 招式詳情的「性質」列

- [x] 3.1 交付「Move detail states the move's flags as short labels」：`src/components/MoveDetail.vue` 在既有屬性清單（屬性／傷害類別／威力／命中／PP）後面多一列「性質」，值是簡稱標記，順序沿用 `fl` 既有的編號升冪（不另排序），切換語系時整列重述，查不到簡稱的 flag 靜默跳過。依 design 的「簡稱是屬性清單的一列，不是說明之後的獨立區段」—— 走 `src/components/SpeciesDetail.vue` 屬性列那條既有路徑（`.DetailAttrKey` 標籤 + 會換行的值欄容器），不新增標題也不新增第四塊。同時換掉檔頭那段「flags 刻意缺席」的註解，它描述的是已被推翻的行為。驗證：`pnpm run typecheck`；迷人（Attract）顯示四顆、尖石攻擊（Stone Edge）顯示一顆
- [x] 3.2 交付「Move detail states no flag section when no flag can be stated」：沒有任何可顯示 flag 的招式，那一列的標籤、容器與佔位文字全部不建立，清單少一列；任何招式都不顯示「無」或 flag 計數。依 design 的「零晶片時整個區段不渲染」—— 113 筆零晶片招式（71 筆上游沒填 + 42 筆被濾光）在畫面上因此無法分辨，這是刻意的。驗證：極光幕（Aurora Veil，只帶 `snatch`）與冰旋（Ice Spinner，無 `fl` 欄位）都只顯示五列且看不出少了什麼
- [x] 3.3 交付「Move detail declares its own scrolling container only if its description overflows」的更新版：`src/App.css` 新增一組**顯示用**標記樣式，四顆簡稱在值欄內換行，不宣告自己的捲動區，招式詳情仍然恰好一個捲動容器。依 design 的「簡稱是顯示用標記，不是控制項」——**不得沿用 `.Chip` 系列**（它有 `.ChipOn` 且在 `QueryBar` 帶按壓回饋，是控制項語言，會招來沒有反應的點擊），也不直接沿用 `.TypePill`（3px 框與字符槽是為層級更高的「屬性」設計的）；要的是 1px 框、無字符槽、無狀態的安靜版本，換行沿用值欄既有的換行原語。驗證：`pnpm run check` 四項不變式通過（標記是純文字，不新增 `GlyphSurface` 成員）；元素樹裡這些標記沒有任何觸控綁定；實機確認四顆標記在值欄內換行且該層只有一個捲動容器
- [x] 3.4 撞名防護：`tests/dex-data.test.ts` 斷言沒有任何招式帶著簡稱與自己中文名同字的 flag。目前成立（招式「守住」不帶 `protect`、「蓄力」不帶 `charge`、「重力」只帶已排除的 `non-sky-battle`）但是剛好成立而非結構上成立，上游一變就可能出現。驗證：`pnpm test`

## 4. 實機驗收與文件收尾

- [x] 4.1 實機驗收（`vue-tsc` 不檢查 Lynx 元素屬性，這一列是全新的元素樹，網頁預覽量到的文字寬度也不可信）：四顆標記的招式在值欄內換行且不溢出；`Flags` 標籤在 88px 欄內一行放得下、列基線與上方五列對齊（這是 `.MoveDetailAttrKey` 註解記載過的失效）；零晶片的招式清單少一列且看不出空洞；切換語系兩組簡稱都正確重述；招式詳情仍然只有一個捲動容器。驗證：依 `design/HANDOFF.md` §12 的做法在裝置上逐項確認，並補進 `shots/`
- [x] 4.2 確認 archive 移除了「Move flags are carried by the data layer and are not displayed」這條 Requirement，且新增的兩條沒有與它並存 —— 依 design 的「改寫 move-detail 的 flag Requirement 而非新增一條」，spec 不得同時要求顯示與不顯示。移除是由 delta 的 REMOVED 區塊表達、由 `spectra archive` 套用，這一項是驗收而非動手改 spec。驗證：archive 後 `openspec/specs/move-detail/spec.md` 搜不到該 Requirement 名稱，且「Move detail states the move's flags as short labels」與「Move detail states no flag section when no flag can be stated」兩條都在
- [x] 4.3 archive 之後修正兩份 spec 的 Purpose 段落 —— deltas 不帶 Purpose 文字，所以 `spectra archive` 不會動它們：`openspec/specs/move-detail/spec.md` 的「It deliberately displays no move flags」那一段，與 `openspec/specs/dex-data/spec.md` 的「The flag identifiers are stored and read by nothing」那一句，兩處都已不成立。驗證：內容審閱，並確認兩份 spec 全文再也搜不到這兩句
- [x] 4.4 `ROADMAP.md` 的 A11 整節移除（依該檔「維護方式」：一項做完就從 A 移走，行為由 `openspec/specs/` 承載），A 節開頭的項目計數與「最後對照」行一併更新。編號不重編，所以 A 節之後會有 A11 缺號。驗證：內容審閱，確認 A 節不再有 A11 且計數與實際 `### A` 標題數一致
