## 1. 宿主端的儲存區

- [x] 1.1 在 iOS 宿主新增一個 native module，讓 JS 能以 `NativeModules.DisplaySettingsModule.getSetting(key)` 同步取回一個字串（未設定時為空字串）、以 `setSetting(key, value)` 寫入一個字串，值存在 `NSUserDefaults`。實作 design 的「儲存區由自寫的 iOS native module 提供」：新檔 `src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift` 遵循 `LynxModule` 協定，以 `name` 與 `methodLookup` 兩個 class 屬性宣告方法映射，並在 `ViewController` 建立 `LynxConfig` 的那一段以 `registerModule` 註冊，位置緊接在現有的 `registerUI` 與 `registerShadowNode` 之後。若 Swift 對 class 屬性的橋接卡住，改用 Objective-C 實作同一個介面（專案已有 bridging header），**不得**改成回呼形式。驗證：Xcode 建置成功，且 app 能啟動並顯示畫面（註冊失敗會讓載入中斷）。

- [x] 1.2 讓新檔案成為建置的一部分，使 `src/ios/Zero Lab/Zero Lab.xcodeproj` 在乾淨 checkout 後建置即包含這個 module，不需要手動在 Xcode 裡再拉檔案。驗證：清空建置資料夾後重新建置成功，且 1.1 的 app 啟動仍然正常。

## 2. 通道時序的實機量測（後續工作的閘門）

- [x] 2.1 在實機上確認「native module 的同步回傳值在背景線程模組求值時就拿得到」，這是 spec requirement「Restored settings are in force on the first painted frame」唯一的技術前提，也是 design 的「讀取走 native module 的同步回傳值，不走 `initData`」所賭的那件事。做法：拋棄式探針 —— 在應用進入點之前先寫入一個已知值，再於模組層級讀回並據以決定啟動時的模式，看第一個畫到的畫面是不是那個模式。判準是畫面而不是 console（§12.22）。同步回傳成立 → 繼續第 3 組。不成立 → 改走 design 的第一退路 `lynx.__globalProps`（宿主端在 `loadTemplate` 之前以 `updateGlobalPropsWithDictionary` 設值），再不成立 → **停下來重新談規格，不要交出一個會閃的版本**。驗證：探針畫面符合寫入的值，量完即砍掉探針。

## 3. JS 側的持久化邊界

- [x] 3.1 提供兩個純函式，把任意 `string | null | undefined` 收斂成合法的模式 id 與語言碼：未知值、空字串與 null 一律回傳預設（`MODES[0]!.id` 與 `'zh'`），交付 spec requirement「Stored values are validated against their domain on restore」，並落實 design 的「值域驗證是純函式，與平台讀取分開」。新檔 `src/platform/settings.ts` 匯出 `coerceModeId` 與 `coerceLang`，兩者都不碰平台。驗證：`pnpm test` 跑過 spec 兩張 Example 表（模式七列、語言五列）。

- [x] 3.2 提供讀寫兩個函式，在儲存區不存在時讀回 `null`、寫入無作用，且兩者都不拋例外也不輸出任何訊息，交付 spec requirement「An absent store degrades silently to the defaults」。同一檔案以模組內部的 `readSetting` 與 `writeSetting` 承擔這一層（不對外匯出，鍵名因此不離開這個模組；對外是 `restoreModeId`／`restoreLang`／`persistModeId`／`persistLang` 四個設定專屬函式），依 design 的「平台存取用惰性解析，讓 node 測得到守衛本身」在**每次呼叫時**才解析 `globalThis.NativeModules?.DisplaySettingsModule`，並把 `getSetting` 拋出的情形當作未設定處理；同時在 `src/rspeedy-env.d.ts` 以全域宣告寫下這個 module 的形狀，讓 TypeScript 端不必用 any。驗證：`pnpm run typecheck` 通過；`pnpm test` 中沒有 `NativeModules` 的情形下 import 不拋例外且讀回 `null`。

- [x] 3.3 讓兩個儲存鍵 `display.mode` 與 `display.lang` 只出現在持久化邊界內，並在 `src/theme/modes.ts` 的模式集合處留下一段註解，說明既有模式 id 是被寫進耐久儲存的外部契約 —— 新增模式安全，改名或移除等於讓所有選過它的人退回預設。交付 spec requirement「Persisted keys and mode identifiers carry an external contract」，並落實 design 的「兩個獨立的字串鍵，不是一個 JSON blob」（兩個獨立鍵、兩個字串值，不引入會解析失敗的格式）。驗證：全庫搜尋兩個鍵名只在 `src/platform/settings.ts` 命中；註解內容經人工複閱，說得出改 id 的代價。

## 4. 接進共享的顯示狀態

- [x] 4.1 讓啟動時的模式與語言初值來自還原值而非固定預設，還原不到時仍是 POCKET 與中文，交付 spec requirement「The two display settings survive a relaunch」的還原半邊，以及 `retro-theme` 的 requirement「Active language and active mode are shared reactive state」改動後的初值來源。`src/state/display.ts` 的兩個 ref 改為以 `restoreModeId()` 與 `restoreLang()` 取得初值；`mode`、`tokens`、`tokenStyle`、`setMode`、`toggleLang`、`lang`、`modeId` 的對外簽章與語意**一個都不變**，元件檔一個都不改。驗證：`pnpm run typecheck` 通過；`pnpm test` 斷言假儲存區有值時初值等於該值、為空時等於預設值；`src/components/` 的 `git diff` 為空。

- [x] 4.2 讓模式或語言的每一次改變都寫進儲存區，而設成已經生效的值則什麼都不寫，交付 spec requirement「A change writes through, and an inert change writes nothing」。依 design 的「寫入靠對兩個 ref 的 watch，不是在 `setMode()` 與 `toggleLang()` 裡呼叫」，在 `src/state/display.ts` 對兩個 ref 各掛一個 watch 寫穿 —— 於是 ref 值未變時 watch 不觸發，「不重複寫」不需要自己比對。驗證：`pnpm test` 斷言換模式後假儲存區收到新 id、重設同一個模式後零寫入、切語言只寫語言鍵。

## 5. 測試

- [x] 5.1 新增 `tests/displayPersistence.test.ts`，把 spec 兩張 Example 表逐列驅動真正的 `coerceModeId` 與 `coerceLang`（不重寫它們的判斷），並涵蓋還原與寫穿：有值／空／未知／無 `NativeModules` 四種初值情形，以及換模式、重設同一模式、切語言三種寫入情形。測試以 `vi.resetModules()` 加動態 import 的方式在放好假 `NativeModules` 之後才載入 `src/state/display.ts`，因為初值是在模組層級決定的。驗證：`pnpm test` 全綠，且測試數比改動前增加。

## 6. 實機驗收（node 與網頁預覽都到不了）

- [x] 6.1 在 iOS 實機逐項驗證 design 的五項驗收並記錄結果：(1) 選 EMERALD → 從應用切換器移除 app → 重開，第一個畫面就是 EMERALD 且中間沒有任何一帧 POCKET；(2) 切英文 → 移除 → 重開，是英文；(3) 選 MODERN 不動語言 → 移除 → 重開，模式變語言不變；(4) 刪除 app 重新安裝 → 開啟，POCKET 加中文；(5) 選單裡重複點同一個模式，畫面完全無變化。第 1 項同時是 spec requirement「Restored settings are in force on the first painted frame」的唯一實測。驗證：五項逐一目視通過，判準一律看畫面不看 console；任一項失敗則回到第 2 組的退路階梯。

## 7. 文件

- [x] 7.1 在 `design/HANDOFF.md` 新增 §12.30，記下本次量到的平台事實，讓下一個想用 `initData` 的人不必重新踩：vue-lynx 0.4.0 的主線程進入點把 `renderPage` 定義成忽略自己的參數、兩個線程的 `updatePage` 都是空函式、整包 vue-lynx 從不寫 `lynx.__initData`，所以宿主端 `loadTemplateFromURL:initData:` 交出去的資料不會抵達任何地方且不會報錯；以及本次改採的通道（native module 同步回傳）與第 2 組實機量到的結果。依 §12 的慣例附上「若日後為假」的退路（vue-lynx 開始轉發 initData 時可回頭簡化）。驗證：人工複閱該節，確認每一句都是量到的而非推論，且第 2 組的實測結果有寫進去。

- [x] 7.2 在 `ROADMAP.md` 記一句，說明顯示設定的跨啟動保存已交付、行為寫在 `openspec/specs/display-persistence/`，並註明它原本不在 A／B／C 三節裡（不是「已決定不做」，是從沒被任何一批 spec 要求過），以免下一次對照時被當成新缺口重新提出。驗證：人工複閱，確認沒有把它寫成 C 節那種「已確認不做」的條目。
