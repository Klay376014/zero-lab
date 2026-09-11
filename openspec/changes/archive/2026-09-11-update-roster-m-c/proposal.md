## Why

上游 Bulbapedia 於 2026-09-09 把 Champions 的名單輪替到 **Regular Roster M-C**（賽制頁 Regulation Set M-C，生效至 2026-12-02）。移植版的資料集仍是 M-B：`src/data/dex.json` 的 meta 自述 `Regular Roster M-B (current until 2026-09-02)`，該日期已經過去九天。

這不只是數字過期。上游同時改動了名單頁的結構，而 pipeline 的解析步驟對其中一項改動**不會報錯、只會安靜少掉資料**（見下），所以放著不處理的代價會隨時間增加而不是持平。

同時，`ROADMAP.md` D 節「上游有、但收不進來」的五筆有四筆的重新評估條件已經成立 —— 那一節存在的目的就是讓條件成立時有人回來做這件事。

## What Changes

### 上游實際變動（已於隔離環境實測，非推定）

- 學習表分類成員 208 → **231**（新增 23 篇，無刪除），名單頁 wikitext 28,687 B → 30,611 B
- `==Untransferable Pokémon==` 整節被移除；原本唯一的成員 Pawmot 轉為正式可用（版本欄 `1.0.2` 加註「Became accessible only in Version 1.2.0」）
- 三個原本由 overlay 補的 MEGA（超級阿勃梭魯Ｚ、超級烈咬陸鯊Ｚ、超級路卡利歐Ｚ）成為上游正式列，**且屬性與 overlay 當初記錄的推定完全一致**，所以刪除 overlay 不改變任何輸出值
- 新增兩個 PokeAPI 尚未收錄特性的 MEGA：超級具甲武者、超級戟脊龍

### Pipeline

- `design/pipeline/parse.py`：「其他形態」區段的結束樣式是 `\n==Untransferable`，該節既已被上游刪除，比對失敗會讓 `section()` 回傳空字串。**這是本次唯一一個不會拋錯的失效** —— 其他形態列會從 79 筆變成 0 筆，而該函式沒有任何斷言。改為比對下一個第二層標題。
- `design/pipeline/fetch_sources.sh`：分類成員數斷言 208 → 231（含同一段的提示文字）
- `design/pipeline/build_data3.py`：三個寫死的斷言（種類 208、mega 78、regional 16）更新為實測值；meta 的 `megas` 與 `regional` 目前是**字面值 78／16 而非計算值**，其餘十個計數都是算出來的 —— 一併改為計算，否則它們會與載入期不變式對同一件事給出兩個答案；`roster` 字串換成 M-C
- `design/pipeline/aggregate.py`：M-C 帶進第一組招式機制衝突 —— Wish 與 Strength Sap 的 PP 在不同學習表頁面上是 8 或 12（以 M-B 的 208 份學習表重跑同一步驟確認過，當時零衝突）。現行行為是先到先贏且只印訊息，等於讓輸出取決於解析順序。改為**取上游修訂時間最新的頁面之值**：帶 8 的三份（Pawmot、Arboliva、Indeedee）都晚於帶 12 的各份，而 Champions 會對招式做平衡調整。時間戳相同而值不同時以非零結束碼中止。
- `design/pipeline/fetch_learnsets.py`：一併取得並快取每一份學習表頁面的上游修訂時間，作為上述裁決規則的輸入
- `design/pipeline/overlay.json`：刪除三筆 `megas`（`_delete_when` 條件成立）；新增兩筆 `pokemon_abilities` —— pokemon_id 10316 超級具甲武者 → ability 181 Tough Claws、10325 超級戟脊龍 → ability 270 Thermal Exchange，兩者皆取自 Bulbapedia 各該物種頁 infobox 的 `abilitym` 欄位，且兩個 ability id 都已存在於 PokeAPI，不需要合成 ability

### 資料集實測結果（隔離重跑全程通過）

| 計數 | M-B | M-C |
| --- | --- | --- |
| 種類 | 208 | 231 |
| 形態筆數 | 363 | 396 |
| MEGA 形態 | 78 | 81 |
| 地區形態 | 16 | 17 |
| 共用招式表 | 496 | 511 |
| 特性 | 201 | 215 |
| 招式參照 | 13928 | 15472 |
| 與本傳數值不同的招式 | 401 | 415 |

Wish 與 Strength Sap 的 PP 依裁決規則取新值 **8**。

Mega 中文命名規則對 42 個 PokeAPI 已在地化實例重算，不符數仍為 **0**，所以 HANDOFF §7 的推導維持可信。

### 規格

八個 capability 的 Example 表帶有會隨資料集規模變動的字面值，`pnpm test` 會執行它們，因此必須與資料集同時落地，否則測試在兩者之間是紅的。

## Non-Goals

- **不更動 `press-feedback` 與 `visible-range-window`。** 兩者出現的 208 是情境敘述與視窗演算法的範例輸入（「208 項、96px 列高、480px 可視」的推導），不是對資料集規模的斷言；改它只會讓那段算式失去對照價值。
- **不處理席多藍恩（485）與超級席多藍恩。** 名單頁上這兩筆仍是版本欄 `X.X.X` 的註解列，也不在學習表分類裡，`ROADMAP.md` D 節對它們的判斷不變。
- **不重抓 PokeAPI CSV 與 52poke 快取。** 既有快取已涵蓋新物種（實測全部解析成功），重抓會把一次資料更新變成一次來源更新，兩者的失敗面不同。
- 不調整任何畫面、樣式或互動行為。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `dex-data`: 新增「同一招式在多個來源頁面上機制不一致時的裁決規則」要求；六項載入期不變式、meta 的四項規模計數、招式表總數與機制來源的 Example 值全部更新；並新增 meta 的 MEGA 與地區形態計數必須由資料算出而非寫入字面值的要求；overlay 的角色從「補 roster 列與特性」收斂為「補特性」
- `dataset-statements`: 結果計數語句的 Example 表由 208／496 改為 231／511
- `dex-query`: 「measured result counts」Example 表的每一列重新量測，其中 `mega` 與 `超級` 兩列的意義維持「每一個帶有 MEGA 形態的種類」，實測值為 76（81 個 MEGA 形態分布於 76 個種類）
- `move-detail`: 496 → 511，與本傳數值不同的招式 401 → 415
- `move-index`: 招式分頁未篩選列數 496 → 511
- `move-query`: 兩張以招式表為母體的 Example 表重新量測
- `move-learners`: 招式表總數與「單一招式最多學習者」由 207／208 改為 230／231
- `learnset-table`: 招式表總數 496 → 511，並重新確認最寬招式名仍能容納於欄寬

## Impact

- Affected specs: dex-data, dataset-statements, dex-query, move-detail, move-index, move-query, move-learners, learnset-table
- Affected code:
  - Modified:
    - design/pipeline/parse.py
    - design/pipeline/fetch_sources.sh
    - design/pipeline/aggregate.py
    - design/pipeline/fetch_learnsets.py
    - design/pipeline/.gitignore
    - design/pipeline/build_data3.py
    - design/pipeline/overlay.json
    - design/champions-dex.json
    - design/champions-dex.html
    - design/HANDOFF.md
    - src/data/dex.json
    - src/data/dex.ts
    - src/data/i18n.ts
    - src/state/rowMetrics.ts
    - src/components/MoveIndex.vue
    - src/App.css
    - tests/dex-data.test.ts
    - tests/dex-query.test.ts
    - tests/move-query.test.ts
    - ROADMAP.md
  - New: (none)
  - Removed: (none)
