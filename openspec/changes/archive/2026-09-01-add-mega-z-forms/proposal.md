## Why

上游為三個既有物種加入了第二個 MEGA 形態 —— 超級阿勃梭魯Ｚ、超級烈咬陸鯊Ｚ、超級路卡利歐Ｚ。三者掛在既有物種底下並共用該物種既有的招式庫，是這批上游新增資料裡唯一資料齊備到能夠出貨的部分。

同一批上游資料裡還有五筆（席多藍恩、轟擂金剛猩、戟脊龍三個物種，以及超級席多藍恩、超級戟脊龍兩個形態）**做不了**：Bulbapedia 的「Pokémon learnsets (Champions)」分類仍然只有 208 篇，不含這三個新物種，`design/pipeline/fetch_learnsets.py` 抓不到它們的招式庫。

而發現這件事的過程本身暴露了一個獨立缺陷：上游把尚未上線的資料以 HTML 註解形式預先排版（版本欄寫 `X.X.X`），而 `design/pipeline/parse.py` 的正規表達式不認得 HTML 註解，會把註解掉的資料當成正式資料吃進去。這次是八筆。這個缺陷與三個形態無關，但只要 pipeline 重跑就會發作，且要到 `design/pipeline/build_data3.py` 的物種數斷言才會爆、爆出來的訊息會誤導成「遊戲名單輪替了」。

## What Changes

- `design/pipeline/parse.py` 在比對 roster 樣板前先剝除 HTML 註解，使 pipeline 只讀取正式上線的資料
- 移除 `design/pipeline/` 裡四處手寫的 `dex != 923` 排除。它們繞過的是上游一筆被註解掉的 Pawmot 列被舊解析器吃進去的問題 —— 與本次八筆是同一個缺陷，剝除註解後這四處全部失效
- 新增一份 pipeline overlay：以手寫且註明出處的方式補上三個形態的 roster 列與三組特性，這是上游現階段給不出來的兩格
- `design/pipeline/zh_forms.py` 的 MEGA 中文名推導規則從 X／Y 擴充到 X／Y／Z，全形轉換一併擴充
- 新增一筆特性「波導防護 Aura Guard」，上游 PokeAPI 完全沒有這筆
- 資料集不變式的六個數字有三個位移：形態總數 360 → 363、MEGA 形態 75 → 78、特性表 200 → 201。物種數 208、地區形態 16、招式 496、招式參照 13928 四項不變 —— 最後一項不變正是招式庫共用的直接證據
- `src/data/dex.json` 與 `design/champions-dex.json`、`design/champions-dex.html` 由 pipeline 重新產生，不手改
- 五筆做不了的上游資料記入 `ROADMAP.md`，附上做不了的原因與重新評估的條件
- 上游快取（`design/pipeline/` 底下的 `*.wiki` 等）本來就不受版控，重抓不產生受版控的異動；全新 checkout 執行抓取步驟時取得的就是含註解的當期 wikitext，由上述解析修正處理

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `dex-data`: 載入期不變式的三個期望值改變（形態總數、MEGA 形態總數、特性表大小）；新增一條規範，要求 roster 解析只採納正式上線的資料而非上游預先排版的註解內容
- `dex-query`: 陳述 MEGA 形態總數的那個計數例子從 75 改為 78。涵蓋 MEGA 的物種數 73 不變，因為三個新形態都掛在既有的 MEGA 物種底下

## Impact

- Affected specs: `dex-data`、`dex-query`
- Affected code:
  - New:
    - `design/pipeline/overlay.json`
  - Modified:
    - `design/pipeline/parse.py`
    - `design/pipeline/aggregate.py`
    - `design/pipeline/resolve_forms.py`
    - `design/pipeline/zh_forms.py`
    - `design/pipeline/build_data3.py`
    - `src/data/dex.json`
    - `src/data/dex.ts`
    - `design/champions-dex.json`
    - `design/champions-dex.html`
    - `tests/dex-data.test.ts`
    - `openspec/specs/dex-data/spec.md`
    - `openspec/specs/dex-query/spec.md`
    - `ROADMAP.md`
  - Removed: (none)
