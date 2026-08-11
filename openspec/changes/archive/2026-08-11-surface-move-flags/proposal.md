## Why

`add-moves-tab` 把 21 種招式 flag 的**編號**寫進了每筆招式記錄（`Move.fl`，425 筆有、71 筆省略該鍵），卻刻意一個都不顯示 —— 因為「顯示哪幾種」是一次獨立的取捨。那次取捨已於 2026-08-11 完成並寫在 `ROADMAP.md` A11：判準、四個排除、17 個中英簡稱、三個已查過不成立的風險都已定案。

現在資料在、判準在、標籤在，唯一缺的是呈現。而目前的狀態比「少一個功能」更貴：`move-detail` spec 有一條 Requirement 明文寫著 flag **不顯示**，讀起來是已定案的行為而不是待辦；`dex-data` spec 的 Purpose 也寫著 flag「stored and read by nothing」。兩處都會讓後人相信這是最終行為。

## What Changes

- **招式詳情的屬性清單新增一列「性質」**，顯示 17 種 flag 的中文簡稱（英文語系顯示英文簡稱），每筆招式最多 4 顆。是既有清單（屬性／傷害類別／威力／命中／PP）的第六列，排在 PP 之後 —— 不是說明文字之後的獨立區段
- **排除四種 flag**：`mirror`、`snatch`、`non-sky-battle`、`distance`。判準是「名詞能不能描述招式本身的性質」——能就留，只能描述「與某個機制的關係」而那機制不在這個資料集裡就砍
- **零晶片時這一列不渲染**，不寫「無」、不給計數。71 筆上游沒填與 42 筆被濾光因此無法分辨，這是刻意的
- **pipeline 新增 `move_flags.csv` 來源**，輸出編號到 identifier 的對照表進資料集。簡稱本身歸字串表，不得寫進資料集
- **BREAKING**（對 spec 而非對使用者）：`move-detail` 的 "Move flags are carried by the data layer and are not displayed" 這條 Requirement 被**改寫**成要求顯示，不是新增一條並列的 Requirement。`dex-data` 的 Purpose 第三段「stored and read by nothing」同時失效
- **兩條新測試**：簡稱與招式自身中文名撞名的防護，以及每個保留 identifier 兩語系都有簡稱

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `move-detail`: 「flag 不顯示」這條 Requirement 改寫為「以屬性清單的一列顯示 17 種簡稱、零晶片不渲染該列」；另因新增這一列而需重述該層仍只有一個捲動容器
- `dex-data`: 招式記錄那條 Requirement 新增編號到 identifier 對照表的不變式，並取消「介面不讀 `fl`」的敘述

## Impact

- Affected specs: `move-detail`、`dex-data`
- Affected code:
  - Modified:
    - design/pipeline/fetch_sources.sh
    - design/pipeline/aggregate.py
    - src/data/dex.json
    - design/champions-dex.json
    - src/data/dex.ts
    - src/data/i18n.ts
    - src/components/MoveDetail.vue
    - src/App.css
    - tests/dex-data.test.ts
    - openspec/specs/move-detail/spec.md
    - openspec/specs/dex-data/spec.md
    - ROADMAP.md
  - New: （無）
  - Removed: （無）
- 兩份資料集必須一起重新產生：`src/data/dex.json` 與 `design/champions-dex.json` 由同一個來源序列化，前者緊湊後者縮排，兩份都不得手改
- 不影響 `pnpm run check` 的四項不變式：簡稱全在 U+4E00–9FFF，被 `scripts/check-styles.mjs` 的東亞字排除規則涵蓋；flag 晶片是純文字，不新增 `GlyphSurface` 成員
