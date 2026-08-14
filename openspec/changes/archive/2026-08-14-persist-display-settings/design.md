## Context

`src/state/display.ts` 以兩個模組層級的 ref 持有色彩模式與語言，初值寫死為 `MODES[0]!.id` 與 `'zh'`。這兩個值沒有任何離開記憶體的路徑，所以每次啟動都從預設開始。`theme-menu` 是唯一能改模式的控制項，`toggleLang()` 是唯一能改語言的操作，兩者都只寫記憶體。

平台這邊有三筆事實決定了做法，全部是本次翻程式碼與 pod 標頭查到的，不是假設：

1. **Lynx 4.0.1 沒有任何內建的耐久儲存 API。** 沒有 `localStorage`，`lynx` 物件上也沒有儲存方法。官方文件把「本地持久化」列為自寫 native module 的教學範例。宿主現有的四個 pod（Lynx、PrimJS、LynxService、XElement）沒有一個提供儲存。
2. **`initData` 這條路在 vue-lynx 0.4.0 是死的。** 宿主端 `loadTemplateFromURL:initData:` 收 `LynxTemplateData`，一切正常，但 vue-lynx 的主線程進入點把 `renderPage` 定義成忽略自己的參數，兩個線程的 `updatePage` 都是空函式，而且整包 vue-lynx 從來沒有寫過 `lynx.__initData`。ReactLynx 是在自己的 `renderPage` 裡設這個值的，vue-lynx 沒有做這件事。所以資料交出去之後不會抵達任何地方，也不會報錯 —— 正是 §12 反覆記載的那個形狀。
3. **native module 的方法可以同步回傳值。** `LynxConfig` 有 `registerModule:`，`LynxModule` 協定用 `methodLookup` 把 JS 方法名映到 selector，官方 iOS 範例的 `getLabel:` 直接回傳 `NSString`。HarmonyOS 才需要 `@Sendable` 標註才同步，iOS 不需要。

Vue 應用跑在背景線程（`createApp().mount()` 產生 ops 交給主線程套用），`NativeModules` 在背景線程 JS 可見，這是常態用法。

## Goals / Non-Goals

**Goals:**

- 使用者選定的色彩模式與語言在 app 被殺掉再開之後仍然是選定的那一個。
- 還原值在**第一個畫到的畫面**就生效，不能先畫一帧預設模式再換過去。
- 網頁預覽仍然能跑，沒有儲存區時安靜退化為預設值，不丟例外也不噴訊息。
- 存到的值如果不在值域內（模式被移除、語言字串壞掉），退回預設而不是把壞值送進畫面。
- 持久化邏輯裡可以純函式驗證的那一段能在 node 下被測到。

**Non-Goals:**

- **Android。** §12.17 末尾已定調 Android 不在範圍內，本次不寫 `SharedPreferences` 那一半。
- **其他任何狀態。** 分頁、查詢字串、篩選條件、選中的卡片、捲動位置都不進儲存區。捲動位置另有 `ROADMAP.md` C 節的既有決定（Vue 的響應式更新本來就留著捲動位置，不要「補」上去），不要順手一起做。
- **儲存值的版本化與遷移。** 只有兩個獨立的字串鍵，讀不懂就退回預設，這已經是遷移策略。
- **跨裝置同步。** 不碰 iCloud、不碰任何網路。
- **`lynx.__globalProps` 這條通道。** 引擎端確實在 JS 的 `lynx` 物件上提供 `__globalProps`（可行，見「Decisions」的替代方案），但本次不採用。
- **設定的使用者介面。** 不新增任何控制項；寫入點就是現有的選單與語言鈕。

## Decisions

### 儲存區由自寫的 iOS native module 提供

宿主 app 新增一個 module，把兩個設定寫進 `NSUserDefaults` 並讀回。這不是選擇，是唯一的路：平台沒有內建儲存 API（見 Context 第 1 點）。

module 註冊在 `ViewController` 建立 `LynxConfig` 的同一段，緊接在現有的兩個 `registerUI` 與一個 `registerShadowNode` 之後。專案已經有註冊自訂 native 元件的先例，這只是在同一個位置多一行。Swift 端的方法名是 `register(_:)` —— `registerModule` 在 Swift 3 就被改名，照 ObjC 的名字寫會編譯失敗。

實作時另外加了一處：`AppDelegate` 也把同一個 module 註冊到 `LynxEnv` 的 global config（`prepareConfig:`），因為官方 iOS 文件是在那裡註冊的。**兩處是一起加上去的，所以哪一處才是生效的那個沒有分辨** —— 要分辨得再跑一輪實機，記在 §12.30 第三條的「未解的一項」。

**替代方案：找一個現成的 pod。** 查過了，沒有。Lynx 生態沒有對應 `AsyncStorage` 的官方套件。

### 讀取走 native module 的同步回傳值，不走 `initData`

`getSetting(key)` 直接回傳字串，所以 `display.ts` 在模組層級就能拿到還原值，兩個 ref 的初值一開始就是對的，第一帧不會是預設模式。

**替代方案一：`initData`。** 這是最自然的想法（宿主同步讀 `NSUserDefaults`，塞進 `loadTemplateFromURL:initData:`），而且宿主端那個呼叫已經在那裡、目前傳 nil。**但 vue-lynx 0.4.0 會把它整包丟掉**（Context 第 2 點）。這條路要通得先改 vue-lynx，不在本次範圍。

**替代方案二：`lynx.__globalProps`。** 引擎的 JS 綁定確實回應 `__globalProps`，宿主端用 `updateGlobalPropsWithDictionary:` 在 `loadTemplate` 之前設好就有機會同步讀到。它成立的前提比同步回傳多一個：宿主端的呼叫順序，以及「設定在背景線程求值前就抵達」這個未量過的時序。同步回傳沒有時序前提，所以優先。**這是同步回傳被證偽時的第一退路**，而且它不需要新的 Swift 檔案，只需要在 `ViewController` 多兩行。

**替代方案三：`getSetting(key, callback)` 回呼形式。** 官方文件的儲存範例就是這個形狀。它必然非同步，於是第一帧是預設模式、之後閃成還原值 —— 直接違反「第一個畫到的畫面就生效」這個目標。**不接受，也不當退路**：若同步回傳與 globalProps 兩條都被實機證偽，本次改動停下來重新談規格，不要默默出一個會閃的版本。

### 寫入靠對兩個 ref 的 watch，不是在 `setMode()` 與 `toggleLang()` 裡呼叫

寫穿掛在 ref 的變化上，而不是掛在兩個寫入函式裡。理由是後者可以被繞過：日後任何人多寫一個改 `modeId` 的路徑，就會靜默地不再持久化，而且沒有任何檢查看得到。掛在 ref 上，改變即寫入。

附帶好處是 `retro-theme` 已經要求「把模式設成已經生效的那一個是惰性的」—— ref 的值沒變，watch 不觸發，所以「不重複寫」是免費得到的，不必自己比對。

**替代方案：在兩個 setter 裡呼叫寫入。** 更直白，但把不變式交給每一個未來的呼叫端維護。

### 值域驗證是純函式，與平台讀取分開

`src/platform/settings.ts` 分成兩層：碰平台的 `readSetting`／`writeSetting`，以及不碰平台的 `coerceModeId`／`coerceLang`。後兩者接一個任意字串（含 null 與空字串）回傳合法值，所以 node 測得到，而且是 spec 的 Example 表能直接驅動的形狀。

`display.ts` 現有的 `mode` computed 已經有一層 `?? MODES[0]!` 的保護，但那只擋到 tokens 那一段 —— `modeId` ref 本身還是會持有一個不存在的 id，任何直接讀 `modeId` 的控制項（例如選單的選中列判斷）就會全部落空。所以驗證要在寫進 ref 之前做。

### 平台存取用惰性解析，讓 node 測得到守衛本身

`readSetting`／`writeSetting` 每次呼叫才去看 `NativeModules.DisplaySettingsModule`，不在模組載入時抓一次。這樣測試只要在 import 之前放一個假的 `NativeModules` 就能驅動真正的讀寫路徑（含 module 不存在的那一支），不需要在生產程式碼裡開一個只給測試用的注入口。

> **實作時改過，而且這是本次最貴的一個錯（2026-08-14）。** 原本寫的是 `globalThis.NativeModules?.DisplaySettingsModule`。**在裝置上那永遠是 `undefined`** —— 引擎的 JS 物件（`NativeModules`、`lynx`）是包住 bundle 那層作用域的綁定，不是全域物件的屬性。正確寫法是**裸識別字**加 `typeof` 守衛：`typeof NativeModules === 'undefined'`。不能用 optional chaining，`NativeModules?.x` 在真的不存在的環境（網頁預覽）會丟 `ReferenceError`。
>
> 這個錯誤花了五輪實機探針才定位，原因值得記住：**它與「儲存區不存在就安靜退化」這個刻意的設計疊在一起** —— 存取路徑寫錯的表現與網頁預覽的正常狀態完全一樣，沒有錯誤、沒有訊息、什麼都沒發生。平台事實與教訓都寫進 `design/HANDOFF.md` §12.30 第四條。

### 兩個獨立的字串鍵，不是一個 JSON blob

儲存區用 `display.mode` 與 `display.lang` 兩個鍵，值就是模式 id 與語言碼的字串。理由是兩個設定彼此獨立（`retro-theme` 明文要求它們各自切換互不影響），blob 會把它們綁成一次讀寫，而且引進一個要解析、會解析失敗的格式。空字串或不存在都視為未設定。

## Implementation Contract

**Behavior.** 使用者在主題選單選一個模式、或按語言鈕切換之後把 app 完全關掉（不是切到背景，是從應用切換器移除）再開啟，看到的第一個畫面就是他上次選的模式與語言。全新安裝或清除 app 資料之後開啟，看到的是 POCKET 與中文。網頁預覽下選了模式再重載頁面，回到 POCKET 與中文 —— 這是已知且接受的落差。

**Interface / data shape.**

JS 側的持久化邊界（`src/platform/settings.ts`）對外是六個具名匯出：

- `restoreModeId()` — 回傳一個確實存在於 `MODES` 中的 `ModeId`，還原不到時回傳 `MODES[0]!.id`。
- `restoreLang()` — 回傳 `'zh'` 或 `'en'`，還原不到時回傳 `'zh'`。
- `persistModeId(id)` — 把模式 id 寫進儲存區。
- `persistLang(value)` — 把語言碼寫進儲存區。
- `coerceModeId(raw)` — 接受任意 `string | null | undefined`，回傳一個確實存在於 `MODES` 中的 `ModeId`；認不出來時回傳 `MODES[0]!.id`。
- `coerceLang(raw)` — 同上，回傳 `'zh'` 或 `'en'`；認不出來時回傳 `'zh'`。

碰平台的那一層 —— `readSetting(key)` 回傳儲存的字串或 `null`（儲存區不存在、鍵未設定、值為空字串三者同一個結果），`writeSetting(key, value)` 在儲存區不存在時什麼都不做，兩者都永不拋出 —— **是模組內部的，不對外匯出**。

> 這一段在實作時改過（2026-08-14）。原本寫的是「對外四個匯出：`readSetting`／`writeSetting`／`coerceModeId`／`coerceLang`」，那與下一句自相矛盾：只要 `display.ts` 呼叫 `readSetting('display.mode')`，鍵名就離開了這個模組。改為匯出四個「設定專屬」的函式（把鍵與驗證各綁一次），把泛用的讀寫兩個收回模組內部，鍵名才真的只有這裡知道。附帶好處是測試也不必寫出鍵名 —— 它用 `persist*` 播種、用 `restore*` 讀回。

兩個鍵名是 `display.mode` 與 `display.lang`，且只有這個模組知道它們。

native module 對 JS 呈現的介面是 `NativeModules.DisplaySettingsModule`，兩個方法：`getSetting(key)` 同步回傳字串（未設定時為空字串），`setSetting(key, value)` 無回傳。這個形狀要在 `src/rspeedy-env.d.ts` 以全域宣告寫下來，否則 TypeScript 端只能靠 any。

`src/state/display.ts` 的對外介面**不變** —— `mode`、`tokens`、`tokenStyle`、`setMode`、`toggleLang`、`lang`、`modeId` 的簽章與語意都不動。改變的只有兩個 ref 的初值來源，以及多了兩個寫穿的 watch。任何元件都不需要修改。

**Failure modes.**

- 儲存區不存在（網頁預覽、或 module 註冊失敗）：讀回 `null` 走預設，寫入無作用。**刻意安靜** —— 這是預覽環境的正常狀態，噴訊息只會訓練人忽略它。
- 存到的模式 id 不在 `MODES` 裡（模式被移除或改名）：退回 `MODES[0]!.id`。下一次寫入會自然覆蓋掉壞值。
- 存到的語言不是兩個合法值之一：退回 `'zh'`。
- `getSetting` 拋出（不預期，但 native 邊界可能）：`readSetting` 攔下來當作未設定處理。

**Acceptance criteria.**

node 端（`pnpm test`，新檔 `tests/displayPersistence.test.ts`）：

- `coerceModeId` 與 `coerceLang` 的 Example 表全數通過，含 null、空字串、未知值、以及每一個合法值。
- 放入假的 `NativeModules` 之後 import `display.ts`，兩個 ref 的初值等於假儲存區裡的值。
- 假儲存區為空時，初值是 POCKET 與 `'zh'`。
- 沒有 `NativeModules` 時 import 不拋例外，初值是預設值。
- 呼叫 `setMode()` 換一個模式之後，假儲存區的 `display.mode` 變成新的 id。
- 呼叫 `setMode()` 設成已經生效的模式，假儲存區沒有收到任何寫入。
- `toggleLang()` 之後 `display.lang` 被寫入，且 `display.mode` 未被寫入。

`pnpm run typecheck` 與 `pnpm run check` 通過（本次不新增樣式規則，check 的四項不變）。

實機驗收（iOS，這一段 node 與網頁預覽都到不了）：

1. 選 EMERALD，從應用切換器移除 app，重開 —— 第一個畫到的畫面是 EMERALD，中間沒有任何一帧 POCKET。
2. 切成英文，移除 app，重開 —— 是英文。
3. 選 MODERN 但不切語言，移除 app，重開 —— 模式是 MODERN，語言不變。
4. 刪掉 app 重新安裝，開啟 —— POCKET 與中文。
5. 選單裡重複點同一個模式 —— 畫面完全沒有變化（§12.22 的判準：看畫面不看 console）。

第 1 項是這次唯一有時序風險的驗收，也是「同步回傳成立嗎」的實測。它失敗就走 Decisions 裡的第一退路（globalProps），兩條都失敗就停下來重新談規格。

**Scope boundaries.**

範圍內：`src/platform/settings.ts`（新）、`src/state/display.ts` 的初值與寫穿、`src/rspeedy-env.d.ts` 的型別宣告、iOS 宿主的 module 檔案與註冊、Xcode 專案檔加入新檔案、`tests/` 新增一個測試檔、`design/HANDOFF.md` §12 新增一則、`ROADMAP.md` 記一句。

範圍外：任何元件檔（`src/components/` 一個都不動）、Android、其他狀態模組、樣式表與 `scripts/` 的四項檢查、`src/data/dex.json` 與 `design/pipeline/`（本次完全不碰資料管線）。

## Risks / Trade-offs

**[Swift 對 `LynxModule` 協定的橋接不順]** → **發生了，但不是預期的那個地方（2026-08-14）。** 兩個 class 屬性（`name`、`methodLookup`）用 Swift 的 `static var` 直接就過；卡住的是 initializer：協定把 `init` 與 `initWithParam:` 都標成 `@optional`，而 **Swift 沒有 optional initializer requirement**，少寫 `init(param:)` 不是沿用預設而是整個 conformance 失敗。補上就過，沒有動用 Objective-C 退路。

**[同步回傳沒有被真的同步 marshal 回來]** → **已排除（2026-08-14，iOS 實機）。** 選 EMERALD、從應用切換器移除 app、重開，第一個畫到的畫面就是 EMERALD，沒有任何一帧 POCKET。所以同步回傳在背景線程模組求值時就拿得到，兩條退路都沒有動用。

**[整個 native 邊界不受任何靜態檢查保護]** → `ROADMAP.md` B 節已記：vue-tsc 檢不到 Lynx 元素屬性，native module 的註冊與方法映射同理 —— 名字打錯、selector 對不上、`methodLookup` 少一筆，全都是「宣告了、沒報錯、沒作用」。緩解只有實機驗收，這也是為什麼上面第 1 到第 4 項不能用網頁預覽代替。

**[新增一個宿主 app 的相依]** → 這是移植版第一次為了功能而動 iOS 專案（之前動的是註冊平台既有元件）。代價是從此有一段行為只能在有 Xcode 的機器上驗，且 `.xcodeproj` 的變動不受任何檢查保護。接受，因為沒有替代路徑。

**[持久化把一個壞狀態變成黏的]** → 記住設定的同一個機制也會記住一個讓人不舒服的設定。緩解是值域驗證（壞值退回預設）加上「刪掉 app 就回到乾淨狀態」；不做「重設設定」的控制項，因為選單本身就能改回任何模式。

**[存的是模式 id 這個識別字]** → 於是 id 變成一個有外部持久化契約的東西：改一個既有模式的 id，等於讓所有已經選了它的人退回 POCKET。這條要寫進 spec，否則下一個改 id 的人不會知道。相對地新增模式完全安全。
