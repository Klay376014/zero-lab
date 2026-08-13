## Why

EMERALD 的十個 token 取樣自錯誤的來源區域。`design/emerald-palette-source.jpg` 是一張 460×916 的上下對照圖：上半部（y8–452）是 GBA 世代的地圖，也就是綠寶石本身；下半部（y470–912）是 DS 世代的地圖，屬於另一個世代的美術。目前這個主題整套取自下半部。

錯誤可以量化，不是主觀判斷。以區塊平均與眾數重新量測來源圖後：

| 角色 | 下半部（DS）實測 | 目前 token | 上半部（GBA）實測 |
| --- | --- | --- | --- |
| 沙路 | #E0CF97（該區 30%） | panel #E1CF95 | #D8C780 |
| 寶可夢中心屋頂 | #DE782C | accent #E37C31 | #C5756E |

`design/theme-emerald-mock.html` 頁尾的取樣來源說明也明文寫著「取樣來源：下半部（y470–912）」，與 token 值互相印證。因此這是取樣來源選錯，不是配色偏好問題——這個主題叫 EMERALD，卻沒有一個顏色來自綠寶石。

## What Changes

- EMERALD 的十個 token 全部改為從來源圖上半部重新取樣或衍生。
- 兩個 token 的**角色定義**一併改寫，因為上半部沒有對應的特徵物：
  - accent 由「寶可夢中心屋頂」改為「民宅紅屋頂」。GBA 版的中心屋頂是橘紅漸層條紋，整塊平均會被洗成濁粉色 #C5756E，當強調色過弱；民宅紅屋頂是上半部重複出現最多的飽和平塗色塊。
  - surface2 由「路面陰影」改為「中央建物的深土黃屋頂」。GBA 那半的沙路只有 JPEG 柔邊，沒有 DS 版那種明確的深色描邊帶，原本的取樣對象在上半部並不存在。
- accentInk 由深綠改為淺奶油色。這是被量測逼出來的，不是偏好：新的 accent #AE505D 是深緋紅，深色 ink 疊上去只有 1.97，低於 `scripts/check-contrast.mjs` 記錄的 2.5 下限，會讓 `pnpm run check` 失敗。
- `openspec/specs/retro-theme/spec.md` 的三張 Example 表格重新量測填寫：EMERALD 十個 token 與文字對比、每個組合的對比下限與上限、以及淺表面無法直接承載屬性色的那張表（含表格下方三個計數）。
- `design/theme-emerald-mock.html` 與 `design/theme-menu-variants.html` 的色值與取樣來源說明一併更新。

新舊配色的量測對照（`src/theme/contrast.ts` 的公式）：

| 配對 | 新 | 舊 |
| --- | --- | --- |
| ink on panel | 5.97 | 9.20 |
| ink on surface | 7.50 | 11.50 |
| ink2 on panel | 5.11 | 5.02 |
| ink2 on surface | 6.42 | 6.27 |
| accentInk on accent | 3.80 | 4.88 |

ink 系列的下降是無法避免的，且是正確的結果：GBA 的沙路本來就比 DS 的暗（相對亮度 0.570 對 0.628），樹冠又比 DS 的亮，兩端一起收窄。所有數值仍高於 2.5 下限，主要文字維持在 5.97 以上。

## Non-Goals

- 不改動 POCKET 與 MODERN 的任何 token。
- 不改動 `plateGlyphs` 的機制本身。淺色模式仍然在中性表面後方鋪一層屬性色底板；本次只是底板所疊的中性表面換了顏色，而 glyph 的對比量測與中性 token 無關（fill 與 backdrop 都是屬性色），因此那組 4.47–11.42 的數字不動。
- 不新增第十一個 token，也不引入水面色 #70B8F0。上半部量到的水面非常平整（該區 98%），但目前的 token 契約沒有它的位置，硬塞進去等於為了用掉一個量測值而擴充契約。
- 不調整 `scripts/check-contrast.mjs` 的 2.5 下限。降低下限是決定而非修正，本次的配色不需要它。
- 不重跑 `design/pipeline/`，本次不觸及資料集。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `retro-theme`: EMERALD 宣告的十個 token 值改變，accent 與 surface2 的取樣角色定義改寫，三張記錄實測對比的 Example 表格全部重新量測。

## Impact

- Affected specs: retro-theme
- Affected code:
  - Modified:
    - src/theme/modes.ts
    - tests/theme.test.ts
    - design/theme-emerald-mock.html
    - design/theme-menu-variants.html
  - New: (none)
  - Removed: (none)
- 驗證管道：`pnpm run check`（其中 `scripts/check-contrast.mjs` 會實際量測 accent 與 accentInk 的配對）、`pnpm test`（Example 表格）、`pnpm run typecheck`。
- 不影響：`src/data/`、`design/pipeline/`、其他十九份 spec。`openspec/specs/theme-menu/spec.md` 的選單列表 Example 以 token 名稱而非色值描述 EMERALD，因此不需要跟著改。
