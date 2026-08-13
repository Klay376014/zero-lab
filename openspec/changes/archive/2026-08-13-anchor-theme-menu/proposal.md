## Why

主題選單目前固定開在畫面左上角（機身 9 + 螢幕 12 的宣告位移），與使用者按下觸發鈕的位置無關，讀起來不像那顆鈕開出來的東西。

這個位置不是偏好，是當時唯一有證據的排列。`design/HANDOFF.md` §12.28 量到 `SelectorQuery.fields` 的 callback 在 web 預覽與 iOS 實機都不回，所以「量到觸發鈕的 rect 再定位」那條路被移除；`design/theme-menu-variants.html` 的變體 C（掛在鈕下方）則因為要靠 `z-index`，而本專案當時零處 `z-index`、平台也沒量過，被記為「押未量測行為」而否決。

2026-08-13 的實機探針把這個賭注結清了。§12.29 量到兩件事：`z-index` 在本平台成立，且 masthead 的祖先節點不裁切 —— 一塊掛在 masthead row 下方、`z-index: 10` 的面板確實蓋過 `Screen` 內後續的 QueryBar，面板連 masthead 的 3px 下框一起蓋過去，不是被裁也不是被蓋。變體 C 因此從「押注」變成「可選」。

而且錨定做法不需要任何座標：選單掛在觸發鈕的 containing block 上、`top: 100%`，位置由版面決定。§12.28 那個洞是繞開而不是補上的。

## What Changes

- 主題選單從 root 的 overlay band 移到觸發鈕底下：觸發鈕外包一層 `position: relative` 的 wrapper 當 containing block，選單 `position: absolute` + `top: 100%` + `z-index`。
- wrapper 是**新增的一層**，不是把 `position: relative` 加在觸發鈕本身。觸發鈕帶著 `press-feedback` 的主線程 `transform: translateY(1px)`；選單若以它為 containing block，會跟著按壓一起位移，而 `transform` 在 CSS 還會另外產生 containing block（Lynx 的行為未量）。wrapper 不綁任何按壓事件，兩件事因此互不相干。
- 關閉用的攔截層留在 overlay band，但改為明確宣告一個**低於**選單的 `z-index`，讓兩者的上下關係由數值決定而不是由子樹位置決定。這是本次唯一未被 §12.29 直接涵蓋的疊層關係（攔截層在 root 層級，比 §12.29 量到的高一層），退路寫在 design。
- `src/App.css` 首次出現 `z-index`。此前全檔零處，`theme-menu` spec 也明文寫著「不得引入 stacking index」—— 該句連同整條 placement requirement 一起改寫。
- 選單元件做成可被其他控制項沿用的形狀（wrapper 類別 + 面板類別的組合，不綁定主題語意），但本次只接上主題選單一個消費者。

## Non-Goals

- **不做 `ROADMAP.md` A6 的兩個排序控制項**（圖鑑第三種排序、招式分頁排序）。它們日後可以沿用同一組類別，但排序集合本身要不要擴充、垂直空間怎麼算，是 A6 自己未完成的決定，不在本次範圍。
- **不把錨定選單寫成獨立的 capability spec。** 目前只有一個消費者，第二個消費者的行為還沒被決定，先寫規格等於替尚未存在的東西定契約。本次只在 `theme-menu` 內描述，形狀留給 A6 接手時再抽。
- **不改用觸控事件座標定位。** §12.29 第一條量到座標可用（`event.detail.x/y` 與 `client*` 是視窗座標），但具名觸發鈕的選單應該每次都開在同一處；跟著指尖跑會讓同一顆鈕按不同位置就跑到不同地方，還可能被手指壓住。座標那條路留給日後的長按選單。
- **不重拍 `design/theme-menu-variants.html` 的截圖。** 那四張已經停在舊配色（`ROADMAP.md` 已記錄），重拍需要實機，與本次無關。本次只補上「變體 C 已量到成立、且是最後採用的做法」的文字說明。
- **不改按壓回饋的任何行為。** `press-feedback` 的控制項清單（含觸發鈕與選單列）與位移量都不動。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `theme-menu`: 第三條 requirement（選單畫在 root overlay band 的宣告位移）整條改寫為錨定在觸發鈕下方，包含新增的 containing block 規定與 stacking 規定；第四條 requirement（關閉層）補上攔截層與選單的疊層順序，以及疊層若不成立時攔截層要被移除而不是留著。

## Impact

- Affected specs: `theme-menu`
- Affected code:
  - Modified:
    - src/components/ThemeMenu.vue
    - src/components/ThemeMenuList.vue
    - src/App.vue
    - src/App.css
    - design/theme-menu-variants.html
  - New: (none)
  - Removed: (none)
