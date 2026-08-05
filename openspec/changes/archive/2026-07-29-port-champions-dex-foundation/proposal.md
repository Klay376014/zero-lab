## Why

CHAMPIONS DEX 的設計稿與資料層已在 design/ 完成並可重現，但 src/ 仍是 Vue Lynx 官方 starter 範例。設計稿 302KB 中資料佔 179KB、內嵌字型佔 69KB，真正要重寫的程式與樣式只有 53KB —— 最貴的部分已經做完，卡在沒有落地。

先做垂直切片而不是整份移植，是因為整個像素風格建立在三個「Lynx 到底支不支援」的地基上，而這三件事在文件查證後都與設計稿現有寫法不一致。任何一件在展開 208 張卡片之後才發現，都得回頭重做全部樣式：

1. **image-rendering** —— Lynx 有支援 pixelated（nearest-neighbour），但明確寫著「只作用於元素本身，不作用於子元素」，也不支援 inherit。設計稿是在容器上宣告一次讓子孫繼承，這個寫法在 Lynx 無效。
2. **內嵌字型格式** —— 設計稿三個字型都是 WOFF2（檔頭 d09GMg 已確認）。Lynx 的 font-face 在 Android 只支援 TTF / OTF / TTC，WOFF2 僅限 iOS 10+。且 Lynx 的 font-face 不支援 font-weight，設計稿用同一個 Silk 家族掛 400 / 700 兩筆的作法無法成立。
3. **inset 陰影** —— Lynx 的 box-shadow 明文不支援 inset。卡片的 1px 立體斜角、螢幕內框、MODERN 屬性鈕按下態全部依賴 inset，三處都要改寫。

## What Changes

- 把資料層落地到 src/data/：由 design/pipeline 產生 src/data/dex.json（208 種類 / 360 形態 / 496 招式 / 200 特性），不手抄、不與設計稿產物分家
- 移植屬性資料表（18 色、繁中名、三字母縮寫、8×8 字符點陣）與 I18N 字串表，範圍限本切片畫面用到的鍵
- 移植 POCKET / MODERN 兩組語意 token 與模式切換，含以對比值（而非固定亮度門檻）決定墨色的判定
- 屬性字符由 canvas 產生改為 SVG 繪製 —— Lynx 元素清單沒有 canvas
- 新增單張種類卡片元件，涵蓋編號／世代／MEGA 徽章／96px sprite／雙語名稱／形態標籤／屬性列／形態數徽章
- 註冊像素字型 Silk（regular + bold 兩個獨立家族）為 Lynx 可用格式
- 在 web 與 LynxExplorer 各跑一次，逐項確認上述三個平台事實與其改寫方案在真機成立
- 移除 starter 的 flappy 範例程式與素材
- 把三個平台發現回寫 design/HANDOFF.md，讓下一個切片不必重新查證

## Capabilities

### New Capabilities

- `dex-data`: 打包的 Champions 資料集、屬性資料表、I18N 字串表，以及種族值總和／最強形態／雙語名稱等衍生存取器，含載入期資料完整度斷言
- `retro-theme`: POCKET / MODERN 兩組語意 token、模式切換，以及依實際對比值決定墨色與字符填色的判定
- `pixel-typography`: 像素字型在 Lynx 的註冊方式（格式與家族切分），以及名稱／標籤／數字的字型分工
- `type-glyph`: 18 個屬性字符以 SVG 呈現，固定 16px，填色依所在表面決定
- `species-card`: 單張種類卡片的呈現契約，含 sprite 的最近鄰放大與立體斜角

### Modified Capabilities

(none)

## Impact

- Affected specs: dex-data, retro-theme, pixel-typography, type-glyph, species-card（皆為新增）
- Affected code:
  - New:
    - src/data/dex.json
    - src/data/dex.ts
    - src/data/types.ts
    - src/data/i18n.ts
    - src/theme/contrast.ts
    - src/theme/modes.ts
    - src/state/display.ts
    - src/components/TypeGlyph.vue
    - src/components/SpeciesCard.vue
    - src/assets/fonts/silkscreen-regular.ttf
    - src/assets/fonts/silkscreen-bold.ttf
    - design/pipeline/fetch_fonts.sh
  - Modified:
    - src/App.vue
    - src/App.css
    - design/pipeline/build.py
    - design/pipeline/.gitignore
    - design/HANDOFF.md
  - Removed:
    - src/useFlappy.ts
    - src/lib/flappy.ts
    - src/assets/arrow.png
    - src/assets/vue-logo.png
    - src/assets/lynx-logo.png
- Affected dependencies: 無新增執行期依賴。字型取得走 design/pipeline 既有的 shell 抓取方式，不引入字型轉檔工具
