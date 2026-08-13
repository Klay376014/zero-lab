## 1. 主題層的第三個模式

- [x] 1.1 Two colour modes share one token contract：MODES 成為可被控制項讀取的有序三元組，ModeId 加入 'EMERALD'，並依 design 的「EMERALD 的十個 token 從地圖取樣而不是自行調色」直接宣告十個值。完成時 tokensOf 對三個模式都解出十個非空 token，且沒有第十一個 token。驗證：pnpm run typecheck 通過，以及 4.1 的測試斷言三個模式各十個 token。
- [x] 1.2 POCKET derives its tokens from four tones：POCKET 仍由四階灰推導，MODERN 與 EMERALD 各自直接宣告，ramp 本身不動。完成時 POCKET 的畫面顏色與量測值一個都沒變。驗證：pnpm run check 通過，且 check-contrast 輸出裡 POCKET 四列仍是 15.86／15.86／7.52／15.86。
- [x] 1.3 Glyph fill is chosen by the surface it will sit on，實作 design 的「亮底的型別字符改用底板，而不是單色或暗化型別色」：以 glyphPaint(mode, type, surface) 取代 glyphOn，回傳 fill 與選用的 plate；EMERALD 在 surface／panel／surface2 回傳型別色底板加 inkOn(型別色)，accent 與 typechip 不回底板；glyphBackdrop 在有底板時回報底板色。完成時亮底上每個型別字符都量得到 4.47 以上。驗證：pnpm run check 的 check-contrast 列出三個模式的組合，EMERALD 三個中性面最低值為 4.47。

## 2. 字符元件

- [x] 2.1 Glyph accepts a type and a target surface，實作 design 的「底板由字符元件自己畫，呼叫端不動」：TypeGlyph 改讀 glyphPaint，主題層回報底板時在字符後面畫一層底板；元件對外的 type／surface／size 三個輸入不變，九個呼叫點一行都不改。完成時切到 EMERALD 時卡片、學習集表格與招式索引的字符都帶底板，切回 MODERN 就沒有。驗證：grep src/components 確認除 TypeGlyph.vue 外沒有任何呼叫點新增參數，並在實機切換模式各看這三處一次。
- [x] 2.2 Glyph box size is fixed：底板是 1 像素內距的外層，字符自身仍畫進 16 像素格線，大尺寸呼叫仍是 8 的整數倍。完成時字符不因底板變模糊、也不縮小。驗證：pnpm run check 的 check-row-heights 通過，並在實機以放大截圖確認 8×8 格線仍然是整數倍（列距重量在 5.2）。

## 3. 模式狀態與選單控制項

- [x] 3.1 Active language and active mode are shared reactive state，實作 design 的「模式改以識別字選定，`cycleMode` 移除」：display.ts 改為匯出 setMode(id)，移除 cycleMode 與 modeIndex；把同一個模式再設一次不改變任何 token。完成時沒有任何路徑以推進位置的方式換模式。驗證：4.1 的測試斷言三個識別字各自生效且重設同值不變，並 grep 全專案確認 cycleMode 與 modeIndex 沒有殘留呼叫點。
- [x] 3.2 The theme menu is the only control that selects a colour mode，以及 The menu is drawn in the root's overlay band at declared offsets，實作 design 的「選單畫在覆蓋層帶，位置由執行期量測決定」：新增 src/components/ThemeMenu.vue（觸發鈕）與 src/components/ThemeMenuList.vue（列），選單畫在 App.vue 的覆蓋層帶而不是 masthead 裡（掛在 masthead 裡會被查詢列畫在上面）。位置原本取自觸發鈕的執行期 rect，實機驗收後移除那條路徑（量測在兩個 target 都不回 callback，見 design/HANDOFF.md §12.28），改用樣式表宣告的偏移。按一列即切換模式並關閉選單，按已生效的那一列只關閉。完成時 masthead 不再有輪替行為，且量測不回應時選單仍然開得起來。驗證：web preview 實測選單三列完整可見、按鈕可開可關；實機三個模式各切一輪；並以 4.1 的測試斷言選單開合不動到語系。
- [x] 3.3 The menu names every mode and marks the one in force，實作 design 的「選單只有名稱，不附色塊預覽」：選單的列由 MODES 產生（加一個模式就多一列，不改這個元件），生效列用 accent 與 accentInk、其餘用 surface 與 ink，列上只有模式名稱。完成時 POCKET 下的選單只出現四階灰。驗證：pnpm run check 的 check-styles 確認選中規則沒有被自己的基底規則取消，並在 POCKET 下人工檢視選單顏色。
- [x] 3.4 The menu closes without a translucent layer，實作 design 的「選單以再按一次關閉，攔截層完全透明」：再按觸發鈕可關閉，攔截層不宣告任何背景色。完成時選單沒有任何半透明表面。驗證：grep src/App.css 確認選單相關規則不含 opacity 或 rgba，實機驗證兩條關閉路徑；若攔截層收不到觸控就整層移除，不留無效宣告。
- [x] 3.5 The trigger announces the menu with drawn artwork, not a text character，實作 design 的「開選單的箭頭畫成 8×8 點陣而不是字元」：箭頭以 buildGlyphSvg 由 8×8 點陣產生、填 ink token。完成時箭頭與像素字型同格線，且模式換色時箭頭跟著換。驗證：grep template 確認沒有 ▾ 或 ▼ 這類字元，並在實機確認箭頭邊緣沒有反鋸齒。
- [x] 3.6 Press feedback covers the control set and excludes the card sequence and the veil：觸發鈕與選單的每一列都綁 main-thread 按壓位移，攔截層不綁。完成時按下觸發鈕與任一列會下移一像素，按攔截層不會。驗證：實機分別按觸發鈕、選單列與攔截層，確認前兩者位移、後者不位移。

## 4. 檢查腳本與測試

- [x] 4.1 新增 tests/theme.test.ts，把主題狀態的可觀察行為變成會失敗的斷言：三個模式各解出十個 token、setMode 對三個識別字生效、重設同值不變、選單開合與語系互不影響。驗證：pnpm test 通過且新檔案的案例數大於零。
- [x] 4.2 實作 design 的「`check-contrast.mjs` 改讀所有模式」：scripts/check-contrast.mjs 改為解析所有模式的識別字與 token（現在的非全域比對只讀得到第一個 tokens 區塊），重新實作的 glyphPaint 與 glyphBackdrop 跟上底板規則，EXPECTED 改為斷言解析到的宣告 token 模式數與每模式十個 token。完成時漏掉一個模式會讓檢查失敗而不是照樣印 ok。驗證：pnpm run check 印出三個模式的組合列，並暫時把 EMERALD 的 accent 換成低對比值確認它會 FAIL、改回後恢復通過。

## 5. 驗收

- [x] 5.1 三道檢查全綠：pnpm run check、pnpm run typecheck、pnpm test。驗證：三個指令依序執行且都回 0。
- [x] 5.2 實機驗收（LynxExplorer 桌面版畫不出 SVG，必須用實體裝置）。**這一項承接 2.1、2.2、3.2、3.6 的實機條款** —— 那四項的靜態與 web preview 驗證已通過，實機部分集中在這裡：三個模式各切一輪、選單開合各一次、EMERALD 下捲完整個卡片序列與一段學習集表格不出現空白列；並重量 .DexCell 的卡片列距。驗證：若列距不再是 201px，同步更新 src/state/rowMetrics.ts、src/App.css 的保留高度與 visible-range-window spec 的 Example 表；若仍是 201px，在驗收紀錄寫明「底板加寬後重量仍為 201px」。
