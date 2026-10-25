# Shikujin 接力索引

已完成並上線：https://sces5504.github.io/Shikujin/ 。repo sces5504/Shikujin，2026-10-19（Asia/Taipei）。使用者本次免 grilling，授權自主規格／提交／合併／部署，並要求完整內容而非第一里程碑原型。

目前正式版 **1.8**，本機main，PR #6功能7928099、merge／部署來源c8591e3。Checks39217586255、Pages39217586242成功；完整release／build／stage／deploy通過，公開61檔SHA256逐一與stage一致，build **9405c712a49a**。38項邏輯、七個瀏覽器／效能流程、288項方向像素及CDP原生多指通過。最新交接：docs/handoffs/mobile-combat-impact-20261019.md。修正多指與原生手勢、提高Boss耐久／存在感、flygame參考五新構築及兩進化；保留CG與存檔ID。

1.7歷史發布紀錄：**1.7**，本機main，PR #5合併93d9a47，最終文字修正／部署來源b0f9c0c。Checks39211509802與Pages39211509798成功；只部署.artifacts/site，公開61檔SHA256逐一與stage一致，build **9988208a8d76**。34項邏輯＋五套瀏覽器／效能流程，含256項方向像素檢查。三支後補壓縮影片已實際抽樣檢視，細節與本機／CI效能分列於1.7交接。原1.6與中間工作樹數據為歷史，不代表新的測試。

- 另一位AI接手入口／可貼prompt：docs/handoffs/ai-takeover-20261019.md
- 規格：docs/spec.md
- 架構與魔改入口：docs/architecture.md
- 操作與開發：docs/guide.md
- 使用者偏好：docs/memory/owner-preferences.md
- 決策：docs/memory/decisions.md
- 美術：docs/art/style-guide.md、asset-contract.md
- 最新2.0交接：docs/handoffs/depth-roster-20261025.md
- 前版1.9交接：docs/handoffs/vertical-shooter-20261025.md
- 前版1.8交接：docs/handoffs/mobile-combat-impact-20261019.md
- 前版1.7交接：docs/handoffs/arsenal-buildcraft-20261019.md
- 前版1.6交接：docs/handoffs/flight-feedback-20261019.md
- 前版打磨交接：docs/handoffs/polish-raiden-20261019.md
- 初版完整交接：docs/handoffs/shikujin-20261019.md

1.6歷史發布紀錄：已整合PR #4（功能5d2fc15、merge1659feb），最後測試時序修正62e347a。GitHub Checks39188631070、Pages release39188631121完整通過並部署；build revision95ec1d94e68d。公開57檔案經HTTPS下載與stage產物SHA256完全一致。23項邏輯測試、四套瀏覽器／效能流程通過（含10分鐘無盡、密碼、特色武器、凍結彈、返航與GPU恢復）。正式瀏覽器直連沿用既有代理CA限制，沒有停用TLS；本地及CI Chromium正常。前版記錄見polish-raiden交接。

現有內容：五章25波戰役與結局、無盡模式、5 Boss／機體／空域、4成年原創駕駛員與戰損立繪、武器進化、永久研究、成就、默契、圖鑑、作戰紀錄、存檔匯出／匯入、觸控／鍵盤、原創合成器配樂。

後續依真人回饋調整平衡與新增內容；不要從空範本重做，不要把轉蛋／配音／中途續玩／雲端存檔視為現有功能。每次變更只驗證受影響路徑，必要時跑 release。

1.5新增：完整五地表與實體機械戰機、整套動畫賽璐璐CG、放大去背通訊及四種持續大絕、好感互動／故事／畫廊、批次GPU與Canvas備援、自動畫質、投射物物件池及內容hash快取版本。2026-10-19 00:50 UTC工作樹release全過：17模擬含10分鐘無盡、桌面／手機流程、四大絕／好感／GPU恢復、含readback密度壓測。最終CI數據與部署見最新交接。

1.6工作分支polish/flight-feedback已合併，起點0164955。本機完整release通過（20模擬＋3架構／密碼測試、原桌面手機、四大絕／好感／GPU恢復、千彈效能、新回饋瀏覽器；107.56秒）。最後邊界鏡頭留白150世界px與導航避開build圖示有追加目標測試。固定世界地表、五機武器、密碼測試選單、返航reason、凍結彈碰撞、專屬特效與角色CG已整合，正式部署與最後CI數據見最新交接。

2026-10-19使用者要求轉交另一位AI；已新增整合交接與可貼prompt，整理版本、實作、最終角色偏好、驗證證據、擴充入口、環境可攜性與接手規則。這次只更新文件，遊戲仍為已驗證的1.6。

使用者追加：接手prompt只需背景與規則，後半的實際任務由使用者自行填寫；不要替下一位AI新增待辦或安排工作。

1.7開發接力：`docs/handoffs/arsenal-buildcraft-20261019.md`，構築／投射物／彎曲雷射／戰役續無盡及髮型參考庫。驗證與部署以該交接最終證據為準；1.6舊紀錄不代表1.7已測。

1.7本機最終release（2026-10-19 14:35 Asia/Taipei）全過98.02秒、33項邏輯＋5套瀏覽器／效能，build/stage7a8e2b530ad8。PR／部署最終狀態見arsenal-buildcraft交接。

三支壓縮影片已成功抽樣，追加雷射持續蛇行；最終本機release14:40全過98.55秒，34邏輯＋5套瀏覽器／效能，build45780d16ecee。PR #5，最終CI／部署見本次交接。

1.8本次回饋接力：docs/handoffs/mobile-combat-impact-20261019.md，手機多指／原生手勢、Boss耐久及flygame參考的五新構築／兩進化。驗證與部署見該交接，不沿用1.7測試證據。


1.9（2026-10-25）：使用者要求改為雷電式縱向捲軸、更好玩、畫面更炫。編隊、勳章鏈、道具線、Boss WARNING、雲層視差與街機側框；觸控改相對拖曳。立繪待使用者上傳，未改CG。交接：docs/handoffs/vertical-shooter-20261025.md，驗證與部署以該檔為準。已上線：PR #7 merge 68c1a71，Pages 40166589311 成功。

2.0（2026-10-25）：稀有度／共鳴／封印／精英／運輸艦／航線／章節評價；新駕駛員緋紗、朔夜與新機體戰女神；六位立繪改用使用者授權的 sces5504/20261020 素材（嚴禁修改該 repo，只唯讀 clone）。交接：docs/handoffs/depth-roster-20261025.md。
