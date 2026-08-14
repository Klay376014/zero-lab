## Why

主題與語言目前只活在記憶體裡。`src/state/display.ts` 的兩個 ref 每次啟動都回到 `MODES[0]`（POCKET）與 `'zh'`，所以在三個色彩模式裡選了 EMERALD 的人，下次開啟看到的仍然是 POCKET，得重新走一次選單。選單本身（`theme-menu`）已經做到「用名字選模式」這件事，代價卻是每次啟動都要付一次。

這件事不在 `ROADMAP.md` 的 A／B／C 三節裡 —— 它不是「已決定不做」，而是從沒被任何一批 spec 要求過，所以三道檢查全都看不到它缺席。

## What Changes

- 新增一個持久化邊界：把使用者選定的色彩模式與語言寫進宿主的耐久儲存區，並在下次啟動時讀回。
- `setMode()` 與 `toggleLang()` 之後的狀態改變會寫穿到儲存區；設成同一個值仍然是惰性的，不寫。
- 啟動時兩個 ref 的初值改為來自還原值而非固定預設；還原不到、或讀到不認得的值時退回原本的預設。
- iOS 宿主 app 新增一個 native module（`NSUserDefaults`），因為 Lynx 4.0.1 沒有任何內建的儲存 API。
- 網頁預覽（`rspeedy dev`）沒有 native module，讀寫都退化為無作用，設定不會被記住。
- 把量到的兩筆平台事實寫進 `design/HANDOFF.md` §12：`initData` 這條路在 vue-lynx 0.4.0 是死的，以及 native module 的同步回傳值是本次採用的通道。

## Capabilities

### New Capabilities

- `display-persistence`: 顯示設定（色彩模式與語言）跨啟動保存的邊界。涵蓋儲存區的鍵與值域、寫穿的時機、啟動時的還原與值域驗證、拿不到儲存區時的退化行為，以及這條邊界刻意只收兩項設定。

### Modified Capabilities

- `retro-theme`: 「Active language and active mode are shared reactive state」這條需求的初值來源從固定預設改為還原值，並新增改變要寫穿的要求。

## Impact

- Affected specs: `display-persistence`（新增）、`retro-theme`（修改）
- Affected code:
  - New:
    - `src/platform/settings.ts`
    - `src/ios/Zero Lab/Zero Lab/DisplaySettingsModule.swift`
    - `tests/displayPersistence.test.ts`
  - Modified:
    - `src/state/display.ts`
    - `src/theme/modes.ts`
    - `src/ios/Zero Lab/Zero Lab/ViewController.swift`
    - `src/ios/Zero Lab/Zero Lab/AppDelegate.swift`
    - `src/rspeedy-env.d.ts`
    - `src/ios/Zero Lab/Zero Lab.xcodeproj/project.pbxproj`
    - `design/HANDOFF.md`
    - `ROADMAP.md`
  - Removed: （無）
