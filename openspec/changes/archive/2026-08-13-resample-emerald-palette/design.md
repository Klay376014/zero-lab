## Context

`src/theme/modes.ts` 的 EMERALD 以十個 token 直接宣告，其上方註解說明每個值的來源：「shell 是樹冠、panel 是沙路、surface2 是路面陰影、accent 是寶可夢中心屋頂，各為取樣區塊的平均；bg、ink、line 是樹冠壓暗，surface 是建物牆提亮，ink2 是草地壓暗」。也就是四個取樣值加六個衍生值。

`design/emerald-palette-source.jpg` 是 460×916 的上下對照圖，上半部（y8–452）為 GBA 世代、下半部（y470–912）為 DS 世代。那十個值全部取自下半部。

本次的量測方法與原本一致：對來源圖的指定矩形取 RGB 通道平均。來源圖是 JPEG，單一像素帶壓縮噪點，因此區塊平均是唯一穩定的量法；眾數只在色塊夠平整時才有參考價值（例如上半部水面該區 98% 為同一值，深土黃屋頂該區 29% 為 #CFAA63）。

限制條件：

- `scripts/check-contrast.mjs` 記錄的下限是 2.5，且會實際解析 `src/theme/modes.ts`，斷言恰好三個 mode、每個 mode 十個 token。
- EMERALD 帶 `plateGlyphs`，所以 glyph 在 surface / panel / surface2 上量到的是「屬性色底板上的高對比 ink」，與中性 token 無關；只有 accent 表面量的是 accentInk 對 accent。
- `tests/theme.test.ts` 逐字釘住 spec 三張 Example 表的數字，配色一動兩邊必須一起動。

## Goals / Non-Goals

**Goals:**

- EMERALD 的十個 token 全部可回溯到來源圖上半部的具體矩形座標或具體衍生公式。
- 取樣座標與衍生係數寫進原始碼註解與 spec，使日後任何人可以重新推導出同一組值，不需要重新猜。
- `pnpm run check`、`pnpm test`、`pnpm run typecheck` 三者皆綠。

**Non-Goals:**

- 不動 POCKET 與 MODERN。
- 不動 `plateGlyphs` 機制、`GlyphSurface` 的成員、或 `scripts/check-contrast.mjs` 的 2.5 下限與 `EXPECTED` 計數。
- 不新增第十一個 token（水面色 #70B8F0 量到了但不採用）。
- 不追求維持舊配色的對比數值。GBA 的沙路比 DS 暗、樹冠比 DS 亮，兩端本來就窄；硬把 ink 壓到原本的 9.20 會讓它離「樹冠壓暗」這個來源定義越來越遠。

## Decisions

### 取樣區域固定為來源圖上半部，座標寫進註解

上半部 y8–452 是 GBA 世代，也就是綠寶石。每個取樣值都記下它在來源圖中的矩形（左上到右下的像素座標），寫在 `src/theme/modes.ts` 的 EMERALD 註解裡與 spec 的 Example 表旁。

替代方案是只寫「上半部」而不寫座標，如同目前的註解只寫特徵名稱。否決的理由正是這次的事故：「寶可夢中心屋頂」這句描述在上下兩半都成立，所以它無法阻止取錯半邊，也無法讓人事後查核。座標可以。

採用的取樣矩形與結果：

| 角色 | 特徵 | 矩形（左上 → 右下） | 平均值 |
| --- | --- | --- | --- |
| shell | 密林樹冠 | (120,246) → (132,304) | #568E3A |
| panel | 沙路主幹道 | (218,145) → (252,190) | #D8C780 |
| surface2 | 中央建物深土黃屋頂 | (196,62) → (264,96) | #CCAB67 |
| accent | 民宅紅屋頂 | (141,258) → (194,276) | #AE505D |
| （衍生 ink2 用）| 草地 | (202,142) → (212,180) | #73BF9F |
| （衍生 surface 用）| 民宅木牆 | (142,284) → (151,300) | #BAA376 |

### accent 由寶可夢中心屋頂改為民宅紅屋頂

GBA 版的寶可夢中心屋頂是橘紅條紋加深紅帶的漸層，整塊取平均得到 #C5756E，是低飽和的濁粉色。強調色需要的是一塊夠飽和、面積夠大、在畫面中重複出現的顏色，濁粉色兩項都不符。上半部有四棟民宅共用同一種紅屋頂，是該半部重複最多的飽和平塗色塊，取其平均 #AE505D。

替代方案一是只取中心屋頂的深紅帶（#BC5F68），仍偏濁且是對單一漸層的任意切片。替代方案二是沿用原角色定義取整塊平均 #C5756E，忠於原設計但得到一個弱強調色。使用者選定民宅紅屋頂，角色定義隨之改寫。

### surface2 由路面陰影改為深土黃屋頂

上半部的沙路邊緣只有 JPEG 的柔化過渡，沒有 DS 那半明確的深色描邊帶——原本的取樣對象在上半部不存在。改取中央大型建物的土黃屋頂 #CCAB67：同屬沙色系、比 panel 暗（相對亮度 0.429 對 0.570），正是 surface2 在這個主題裡要扮演的角色，且該區塊 29% 為單一值 #CFAA63，非常平整。

替代方案是把 surface2 改成 panel 壓暗的衍生值，讓它與 panel 必然同色相。否決的理由是那會讓取樣值從四個減為三個，配色會更向「一個綠加一個沙推導出全部」傾斜，離「這是一張地圖的顏色」越遠。

### accentInk 由深綠翻為淺奶油

這是量測逼出來的結果，不是偏好。新的 accent #AE505D 相對亮度 0.155，屬深色；`glyphPaint` 在 accent 表面回傳 accentInk 當 fill，backdrop 就是 accent 本身，所以這一對直接受 2.5 下限管轄：

| accentInk 候選 | 疊在 #AE505D 上 |
| --- | --- |
| #2C491E（新的 bg／ink） | 1.97 — 低於下限，`pnpm run check` 會失敗 |
| #15301F（舊的 accentInk） | 2.78 |
| #E6DDCD（新的 surface） | 3.80 |

採用 #E6DDCD，直接重用 surface 而不另造一個值——舊配色的 accentInk 也是重用 bg，這維持了「accentInk 不是第十一個顏色」的性質。

### 衍生值以 HSL 明度係數推導

三個衍生角色各自的係數：

- bg / ink / line ＝ shell 的 HSL 明度 ×0.5149。這個係數是從既有配色反推出來的：舊的 shell #266047 明度 0.2627，舊的 bg #15301F 明度 0.1353，比值 0.5149。沿用同一個係數，代表這次換的是取樣來源而不是推導方法。結果為 #2C491E。
- ink2 ＝ 草地的 HSL 明度 ×0.40，結果 #265441。係數選定的依據是讓 ink2 落在舊配色實測值的 ±0.15 內（ink2 on panel 5.11 對舊 5.02、on surface 6.42 對舊 6.27）。次要文字的可讀性沒有理由跟著來源圖變動。
- surface ＝ 木牆的 HSL 明度 ×1.43，結果 #E6DDCD。

三者都保持原色相與飽和度，只縮放明度。

替代方案是三個角色共用一個係數。否決的理由是它們的來源特徵亮度差距很大（樹冠 0.215、草地 0.434、木牆 0.379），單一係數無法同時讓 ink 夠深、ink2 落在既有可讀性、surface 夠淺。舊配色的係數本來就是逐角色手調的。

### glyph 的實測區間不動，文字對比表全部重測

EMERALD 的 `plateGlyphs` 讓 glyph 在 surface / panel / surface2 / typechip 上的 fill 與 backdrop 都由屬性色決定，與中性 token 無關，所以 4.47（Fire）至 11.42（Electric）這組數字不受本次影響，spec 表中這四列維持原值。只有 accent 那一列會從 4.88 變成 3.80。

文字對比則全部重測並改寫。同時 spec「為何淺表面無法直接承載屬性色」那張表的欄位標題（含 surface 與 panel 的色值）、三個型別的數值、以及表格下方的計數句都要更新——新的中性表面較暗，低於下限的屬性色數量由 10 / 13 / 15 變為 11 / 13 / 17。

## Implementation Contract

**行為：** 使用者在主題選單選擇 EMERALD 後，畫面呈現 GBA 綠寶石的配色——深綠外殼、偏黃的沙色面板、深緋紅的強調色。POCKET 與 MODERN 切換後的外觀完全不變。

**資料形狀：** `src/theme/modes.ts` 中 `MODES` 陣列第三個元素的 `tokens` 物件，十個鍵不變、型別不變（`Tokens` 介面不動），值改為：

| Token | 值 | 來源 |
| --- | --- | --- |
| bg | #2C491E | shell 明度 ×0.5149 |
| shell | #568E3A | 取樣：密林樹冠 |
| panel | #D8C780 | 取樣：沙路主幹道 |
| surface | #E6DDCD | 木牆明度 ×1.43 |
| surface2 | #CCAB67 | 取樣：深土黃屋頂 |
| ink | #2C491E | 同 bg |
| ink2 | #265441 | 草地明度 ×0.40 |
| line | #2C491E | 同 bg |
| accent | #AE505D | 取樣：民宅紅屋頂 |
| accentInk | #E6DDCD | 同 surface |

`Mode` 介面、`tokensOf`、`glyphPaint`、`glyphBackdrop`、`GlyphSurface` 的行為與簽章一律不動——本次只換值，不換機制。

**失敗模式：** 這個主題的錯誤是靜默的。色值打錯不會有任何錯誤訊息，畫面照樣會畫出來，只是顏色不對。三道防線各自攔的東西不同：

- `scripts/check-contrast.mjs` 只會攔到 accentInk 對 accent 低於 2.5 的情形，以及 token 數量、mode 數量、`GlyphSurface` 成員的變動。它不會檢查文字對比，也不會知道色值是否來自正確的半邊。
- `pnpm test` 會攔到 token 值或對比數字與 spec 表格不一致。
- 兩者都無法驗證「取樣自上半部」這件事本身。這一點只能靠註解中的座標與人工核對來守。

**驗收條件：**

- `pnpm run check` 通過，且其輸出中 EMERALD accent 那一列顯示 3.80。
- `pnpm test` 通過。`tests/theme.test.ts` 中 EMERALD 的十個 token、四個文字對比數字、accent 表面的 4.88 改為 3.80、以及第三張表硬寫的 surface 色值與三個數值，全部依 spec 更新。plated 四個表面的 4.47 / 11.42 應維持不變——若它動了，代表誤改到了 `plateGlyphs` 的機制，屬於超出範圍。
- `pnpm run typecheck` 通過。
- `src/theme/modes.ts` 的 EMERALD 註解說明取樣來自來源圖上半部、附上六個矩形座標與三個衍生係數。
- `design/theme-emerald-mock.html` 頁尾那句取樣來源說明改為上半部與正確的 y 範圍，頁面色值同步更新。
- 裝置驗收：在實機上切到 EMERALD，確認深緋紅的強調色在沙色面板上不會過暗、次要文字仍可讀。網頁預覽不算數（`design/HANDOFF.md` §12 記載像素字體在預覽環境不載入）。

**範圍內：** `src/theme/modes.ts` 的 EMERALD tokens 與其註解、`tests/theme.test.ts` 的 EMERALD 相關斷言、`openspec/specs/retro-theme/spec.md` 的三張 Example 表、`design/theme-emerald-mock.html`、`design/theme-menu-variants.html`。

**範圍外：** POCKET 與 MODERN 的任何值；`scripts/check-contrast.mjs`（本次不需要改動它，包含 `FLOOR` 與 `EXPECTED`）；`src/theme/contrast.ts`；`src/data/`；`design/pipeline/`；來源圖檔案本身（不裁切、不改名）；其餘十九份 spec。

## Risks / Trade-offs

- **主要文字對比由 9.20 降到 5.97** → 這是換對來源後的必然結果，且仍高於 WCAG AA 的 4.5。已在 spec 的 Example 表中記錄實測值，而非只記錄「通過」。
- **accentInk 從深色翻成淺色，是本次唯一改變 token 語意方向的一步** → 已在 Decisions 中附上三個候選的實測值，說明深色候選 1.97 會使 `pnpm run check` 失敗。若日後有人把 accent 改回淺色，accentInk 必須一起翻回去，否則同一個檢查會再攔一次。
- **取樣值無法被自動檢查** → 沒有任何 CI 步驟會重新開啟來源圖驗證平均值。緩解方式是把矩形座標寫進註解，讓核對成為可能而非不可能；這也是本次事故之所以能被發現與證明的唯一原因。
- **`design/theme-menu-variants.html` 是設計樣板頁，不在測試覆蓋範圍** → 若漏改，`pnpm run check` 與 `pnpm test` 都不會發現。列為明確的任務項而非順手處理。
- **surface2 的角色定義改變後，主題的三個中性表面亮度階梯變陡**（0.729 / 0.570 / 0.429，舊為 0.798 / 0.628 / 0.502）→ 對比階層更分明，但 ink2 疊在 surface2 上為 3.95，是本次最低的文字配對。仍高於 2.5 下限，且 surface2 上不放主要文字。列入裝置驗收的觀察項。
