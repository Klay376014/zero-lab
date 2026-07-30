## Why

這個移植版的每一顆控制項，按下去到畫面有反應之間，中間隔著一次完整的跨線程往返。事件在主線程發生，處理常式在背景線程執行，狀態改變後才把 ops 送回主線程重繪 —— Lynx 雙線程架構的固有延遲。

而這個延遲目前**完全沒有被遮掩**：`src/App.css` 全檔沒有任何按壓態樣式（平台也沒有 `:active` 這個偽類可用），所以在背景線程算完之前，畫面上沒有任何東西表示「這一下被收到了」。最明顯的是查詢列的型別鈕：按下去之後，要等 208 個物種重新篩選、208 張卡重新 diff、ops 回到主線程，那顆鈕本身才變色。使用者得到的訊號是「按了沒反應」，而不是「正在處理」。

平台為這件事準備的工具是主線程腳本（main thread script）：標了 `'main thread'` 的函式直接在主線程同步執行，零次跨線程。本專案至今一次都沒有用過 —— 全樹搜不到 `main-thread-bind*`、`useMainThreadRef`、`runOnBackground` 或 `'main thread'`。

## What Changes

- 新增一個按壓回饋層：控制項在手指按下的當下就在主線程畫出被按下的樣子，不等背景線程。
- 回饋的形式是**位移一個像素**（`transform: translateY(1px)`），不是改變顏色也不是降低不透明度。理由見 Non-Goals。位移量是 `src/interaction/press.ts` 裡的字面值、全專案唯一一處 —— 原本打算放在樣式表，平台不給（§12.22）。
- 綁定方式是 `main-thread-bindtouchstart` / `main-thread-bindtouchend` / `main-thread-bindtouchcancel`，三個都要 —— 只綁前兩個會讓「按住之後改成捲動」的手勢留下一顆永遠凹著的鈕。
- 既有的 `@tap` 一律不動，仍然由背景線程負責真正的狀態改變。主線程只負責那一格的視覺，兩者互不知道對方存在。
- 涵蓋範圍是 37 個控制項，分佈在五個元件：外殼的模式鈕與語系鈕；查詢列的重置鈕、18 顆型別鈕、9 顆世代鈕、2 顆排序鈕；形態切換器的形態鈕；招式表的 3 顆排序鈕與屬修鈕；詳情面板的關閉鈕。
- 新增一項驗收步驟：在動任何實作之前，先用一個無條件的主線程探針確認綁定真的落到元素上（理由見下）。

## Non-Goals

- **208 張卡不綁。** `design/HANDOFF.md` §12.14 已記「208 張卡的首次繪製比直覺慢得多」，每張卡三個事件就是首屏多 624 個 `SET_WORKLET_EVENT` op，付在這個專案已知最慢的那一段上。卡片按下去的回饋本來就是詳情面板開起來，不需要另一個。
- **遮罩（`DetailVeil`）不綁。** 它不是一顆鈕，按壓態會讀成遮罩本身可以被操作。
- **不用不透明度表示按壓。** `ROADMAP.md` C 節與 `retro-theme` spec 明文禁止遮罩以外的任何半透明表面 —— 半透明會合成出四階灰以外的顏色，而遮罩是唯一例外、不是前例。
- **不用換色表示按壓。** POCKET 的四階灰契約下沒有第五個色可用，而借用既有 token 會與「選中」態撞色：`--accent` 正是選中態的顏色，按一顆未選中的鈕會瞬間看起來像已經選中了。位移完全避開這件事，對選中與未選中兩種底色的效果一致。
- **不順手加無障礙屬性。** `ROADMAP.md` B 節的 a11y 缺口是獨立的一項，Lynx 的 accessibility 屬性本專案從未查過，混進來會讓這個 change 同時扛兩個未量過的平台問題。
- **不處理搜尋輸入的延遲。** 那是背景線程的純計算，主線程腳本對它無效，屬於另一個 change。
- **不引入 `useMainThreadRef`。** 本次每個回饋都只作用在事件自己的 `event.currentTarget` 上，不需要跨元素的引用。

## Capabilities

### New Capabilities

- `press-feedback`: 控制項在主線程畫出的按壓態 —— 哪些控制項有、回饋長什麼樣子、按壓態如何在背景線程重繪之後不殘留、以及取消的手勢如何復原。

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `press-feedback`
- Affected code:
  - New:
    - `src/interaction/press.ts`
  - Modified:
    - `src/App.css`（只有註解 —— 按壓回饋最後在樣式表裡沒有任何規則，理由記在那裡）
    - `src/App.vue`
    - `src/components/QueryBar.vue`
    - `src/components/FormSwitcher.vue`
    - `src/components/LearnsetTable.vue`
    - `src/components/SpeciesDetail.vue`
  - Removed: (none)
- Affected docs:
  - `design/HANDOFF.md` —— 新增一節記錄主線程腳本在本平台的實測結果（這是專案第一次使用它）
- 相依套件不變。主線程腳本的執行期已在裝的 `vue-lynx` 0.4.0 內，不需要升版或新增套件。
