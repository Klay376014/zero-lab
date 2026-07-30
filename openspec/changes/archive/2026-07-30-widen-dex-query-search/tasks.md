## 1. 搜尋語料

- [x] 1.1 在 `src/data/dex.ts` 新增 `searchHaystack(species)` 存取器，讓「Search matches across both languages at all times」的語料一側成立：回傳該物種的搜尋語料字串（小寫），含中英物種名、中文分類、編號的原始與四位補零兩種寫法、`gen<n>`、每個形態的中英標籤、以及跨全部形態的型別英文名與型別中文名；依 design.md 的「不收錄設計稿的裸羅馬數字世代 token」，**不含** `GEN_ROMAN` 的裸數字。依 design.md 的「haystack 即時組出，不預先建索引」，語料在比對時組出而不預先快取 —— 208 筆全量重算是既有的刻意判斷，語料變寬不改變它；放在資料層是因為它只依賴資料集，日後真的要預先算好時只有這一處要改。驗證：`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過；以腳本對資料集斷言噴火龍的語料同時含 `charizard`、`噴火龍`、`火焰寶可夢`、`6`、`0006`、`gen1`、`mega charizard x`、`超級噴火龍`、`dragon`、`龍`，且**不含** `i`（裸羅馬數字）作為獨立詞。
- [x] 1.2 改寫 `src/state/query.ts` 的搜尋比對，讓「Search matches across both languages at all times」的比對一側成立：查詢以空白切詞，**每個詞都要出現在語料裡**才算命中；只有空白時視為空查詢並回全部 208 筆。依 design.md 的「搜尋語料建成單一 haystack 並逐詞比對」，不做逐欄位分支、不把整串當單一子字串。驗證：以腳本對資料集實算 spec 第二張 Example 的十二列全部相符（`475`→1、`0475`→1、`dragon`→19、`龍`→25、`mega`→73、`超級`→73、`gen5`→29、`alola`→2、`阿羅拉`→2、`火焰寶可夢`→2、`mega charizard`→1、`gen5 dragon`→1），且 `dragon` 的結果集**等於**型別鈕選 Dragon 的結果集、`gen5` 的結果集等於世代鈕選 5 的結果集。
- [x] 1.3 驗證既有名稱行為零回歸，讓 spec 第一張 Example（cross-language and partial matching）逐列仍然成立：`charizard`、`CHARIZARD`、`噴火龍`、`char`、`噴火` 各自命中噴火龍，`ditto` 不命中；切換主導語系不改變任何結果集。這一項單獨列出來是因為前批已在 iOS 實機驗收過這些，本批不得動到它們。驗證：以腳本實算六列並斷言 `噴火` 命中 2 筆（噴火龍、噴火駝）；對全部 208 個物種名逐一搜尋，斷言每個都命中自己。

## 2. 卡片顯示的形態

- [x] 2.1 改寫 `src/state/query.ts` 決定卡片形態的函式，讓「A filtered card displays the form that matched the filter」的四層優先序成立：先扣掉物種兩個名字已滿足的查詢詞，剩餘詞全部命中某形態標籤時取第一個該形態（第 1 層）；否則剩餘詞裡有**全等**於型別名（英或中）者，取帶該型別的第一個形態（第 2 層）；否則沿用型別鈕的既有判定（第 3 層）；否則基本形態（第 4 層）。依 design.md 的「卡片形態的選擇改為四層優先序，且先扣掉物種名已滿足的詞」——**不得照搬設計稿的規則**，它會讓搜 `charizard` 顯示 Mega Charizard X（Mega 標籤嵌著物種名），那會回歸前批已實機驗收的行為。驗證：以腳本實算 spec 第二張形態 Example 的七列全部相符（`charizard`→基本、`噴火龍`→基本、`mega charizard`→Mega X、`mega charizard y`→Mega Y、`dragon`→Mega X、`龍`→基本、`fire`→基本），並斷言型別鈕的既有兩列（無篩選→基本、Dragon→Mega X）不變。

## 3. 收尾

- [x] 3.1 全專案檢查通過且文件與行為一致：`pnpm run check` 四條全綠、`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過；並在 `design/HANDOFF.md` §12 記下這個缺陷的成因與教訓 —— 佔位字從設計稿原樣搬過來、規格只覆蓋名稱、兩者分別正確而合起來成為承諾與實作不符，以及「裸羅馬數字 token 命中六成資料集」這個實測數字。驗證：兩個指令皆零退出；閱讀 HANDOFF 新增段落，確認它記的是成因與可重複的教訓而不只是「已修好」。
