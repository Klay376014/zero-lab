## 1. 重新取樣 EMERALD 的十個 token

- [x] 1.1 取樣區域固定為來源圖上半部，座標寫進註解：`src/theme/modes.ts` 中 EMERALD 上方的註解說明取樣取自來源圖上半部第 8 至 452 列，並逐項列出六個取樣矩形的像素座標與三個衍生係數，不再以特徵名稱作為唯一依據。驗證：人工比對註解中的每個座標與係數與 design.md 的決策表格逐項相符，且註解中不再出現「路面陰影」與「寶可夢中心屋頂」這兩個已淘汰的來源描述。
- [x] 1.2 accent 由寶可夢中心屋頂改為民宅紅屋頂，surface2 由路面陰影改為深土黃屋頂：EMERALD 的 accent 解析為 #AE505D、surface2 解析為 #CCAB67，主題切到 EMERALD 時強調色呈深緋紅、次級表面呈深土黃。驗證：執行 pnpm test，tests/theme.test.ts 中 EMERALD 十個 token 的斷言通過。
- [x] 1.3 accentInk 由深綠翻為淺奶油：EMERALD 的 accentInk 解析為 #E6DDCD，使 glyph 疊在 accent 表面上維持在對比下限之上。驗證：執行 node scripts/check-contrast.mjs，輸出中 EMERALD accent 一列的上下限皆為 3.80，且回報 0 violation。
- [x] 1.4 衍生值以 HSL 明度係數推導：EMERALD 的 bg、ink、line 解析為 #2C491E，ink2 解析為 #265441，surface 解析為 #E6DDCD，shell 解析為 #568E3A，panel 解析為 #D8C780，十個 token 的數量與 `Tokens` 介面的鍵不變。驗證：執行 pnpm run typecheck 通過，且 scripts/check-contrast.mjs 對「每個 mode 十個 token、共三個 mode」的計數斷言未觸發。

## 2. 規格對應的測試

- [x] 2.1 requirement「POCKET derives its tokens from four tones」的新 Example 表在測試中生效：tests/theme.test.ts 的 EMERALD token map 與四個文字對比數字改為 ink on panel 5.97、ink on surface 7.50、ink2 on surface 6.42、accentInk on accent 3.80。驗證：執行 pnpm test，該 describe 區塊全數通過。
- [x] 2.2 requirement「Glyph fill is chosen by the surface it will sit on」的新 Example 表在測試中生效：accent 表面的實測值由 4.88 改為 3.80；第三張表硬寫的 EMERALD surface 色值改為 #E6DDCD，Electric、Ice、Flying 三列對 surface 的數值改為 1.24、1.38、1.54，對白色的 1.67、1.85、2.08 維持不變。驗證：執行 pnpm test，該 describe 區塊全數通過。
- [x] 2.3 glyph 的實測區間不動，文字對比表全部重測：確認 plated 四個表面（surface、panel、surface2、typechip）的 4.47 與 11.42 在 tests/theme.test.ts 中未被更動，因為 plated glyph 的 fill 與背景都來自屬性色、與中性 token 無關。驗證：執行 pnpm test 通過，且該次變更的 diff 中這兩個數字沒有出現。

## 3. 設計樣板頁

- [x] 3.1 `design/theme-emerald-mock.html` 整頁反映新來源，而不只是換色值：DAY 的十個 token 改為新值；十張取樣區塊裁圖依 design.md 的矩形自來源圖上半部重裁並重新內嵌，`A.sampled` 的實測值同步；原本對應寶可夢中心屋頂的那張裁圖改為民宅屋頂；頁面外框 `--pg-*` 九個值一併自上半部重取；頁尾取樣來源說明改為上半部與其正確的列範圍。驗證：以 grep 確認該檔不再含有 #E1CF95、#F0E7C6、#C2BE8E、#15301F、#266047、#E37C31、#3D5A2F 任何一個；人工開啟頁面確認每張裁圖旁標示的色值與該圖的實際顏色相符，且頁尾所述來源與 `src/theme/modes.ts` 的註解一致。
- [x] 3.2 `design/theme-emerald-mock.html` 不再保留依錯誤取樣做出的判斷：移除 `MODES` 中已否決的 NIGHT 變體，以及決策清單中「明度：日間林道」與「accent：中心屋頂的橘 #E37C31」兩項——後者的理由（橘只出現在一個屋頂）已被本次推翻，前者的否決依據是對舊值量測的。驗證：以 grep 確認該檔不再出現 NIGHT 與 #26492E；人工開啟頁面確認模式切換器只剩 POCKET、MODERN、EMERALD 三個，且決策清單其餘各項的敘述沒有引用被移除的兩項。
- [x] 3.3 `design/theme-menu-variants.html` 的頁面外框呈現新配色：`--pg-*` 與邊框色值改為新值。內嵌的四張 app 截圖本次不動，因為它們是實機畫面、無法在此重製。驗證：以 grep 確認該檔不再含有 #15301F、#266047、#E1CF95、#E37C31。

## 4. 驗收

- [x] 4.1 三道檢查全綠：執行 pnpm run check、pnpm test、pnpm run typecheck 皆通過。驗證：三個指令的結束碼皆為 0，且 check 的輸出列出 14 個組合、floor 2.5、0 violation。
- [x] 4.2 裝置驗收 EMERALD 的可讀性：在實機上切換到 EMERALD，確認深緋紅強調色在沙色面板上不致過暗、次要文字（ink2 疊在 surface2 上，本次最低的文字配對 3.95）仍可辨讀。驗證：實機截圖或人工確認；網頁預覽不算數，因為像素字體在預覽環境不載入（`design/HANDOFF.md` §12）。
- [ ] 4.3 `design/theme-menu-variants.html` 的四張截圖呈現新配色：以 4.2 的實機畫面重拍選單版面截圖，替換該頁內嵌的四張舊配色 base64 圖。驗證：人工開啟該頁確認截圖中的面板為沙色 #D8C780 一族而非舊的 #E1CF95，且選單版面與截圖說明所述一致。
