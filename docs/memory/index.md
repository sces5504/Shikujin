# Shikujin 接力索引

已完成並上線：https://sces5504.github.io/Shikujin/ 。repo sces5504/Shikujin，2026-10-19（Asia/Taipei）。使用者本次免 grilling，授權自主規格／提交／合併／部署，並要求完整內容而非第一里程碑原型。

- 另一位AI接手入口／可貼prompt：docs/handoffs/ai-takeover-20261019.md
- 規格：docs/spec.md
- 架構與魔改入口：docs/architecture.md
- 操作與開發：docs/guide.md
- 使用者偏好：docs/memory/owner-preferences.md
- 決策：docs/memory/decisions.md
- 美術：docs/art/style-guide.md、asset-contract.md
- 最新回饋交接：docs/handoffs/flight-feedback-20261019.md
- 前版打磨交接：docs/handoffs/polish-raiden-20261019.md
- 初版完整交接：docs/handoffs/shikujin-20261019.md

目前本機分支main。1.6已整合PR #4（功能5d2fc15、merge1659feb），最後測試時序修正62e347a。GitHub Checks39188631070、Pages release39188631121完整通過並部署；build revision95ec1d94e68d。公開57檔案經HTTPS下載與stage產物SHA256完全一致。23項邏輯測試、四套瀏覽器／效能流程通過（含10分鐘無盡、密碼、特色武器、凍結彈、返航與GPU恢復）。正式瀏覽器直連沿用既有代理CA限制，沒有停用TLS；本地及CI Chromium正常。前版記錄見polish-raiden交接。

現有內容：五章25波戰役與結局、無盡模式、5 Boss／機體／空域、4成年原創駕駛員與戰損立繪、武器進化、永久研究、成就、默契、圖鑑、作戰紀錄、存檔匯出／匯入、觸控／鍵盤、原創合成器配樂。

後續依真人回饋調整平衡與新增內容；不要從空範本重做，不要把轉蛋／配音／中途續玩／雲端存檔視為現有功能。每次變更只驗證受影響路徑，必要時跑 release。

1.5新增：完整五地表與實體機械戰機、整套動畫賽璐璐CG、放大去背通訊及四種持續大絕、好感互動／故事／畫廊、批次GPU與Canvas備援、自動畫質、投射物物件池及內容hash快取版本。2026-10-19 00:50 UTC工作樹release全過：17模擬含10分鐘無盡、桌面／手機流程、四大絕／好感／GPU恢復、含readback密度壓測。最終CI數據與部署見最新交接。

1.6工作分支polish/flight-feedback已合併，起點0164955。本機完整release通過（20模擬＋3架構／密碼測試、原桌面手機、四大絕／好感／GPU恢復、千彈效能、新回饋瀏覽器；107.56秒）。最後邊界鏡頭留白150世界px與導航避開build圖示有追加目標測試。固定世界地表、五機武器、密碼測試選單、返航reason、凍結彈碰撞、專屬特效與角色CG已整合，正式部署與最後CI數據見最新交接。

2026-10-19使用者要求轉交另一位AI；已新增整合交接與可貼prompt，整理版本、實作、最終角色偏好、驗證證據、擴充入口、環境可攜性與接手規則。這次只更新文件，遊戲仍為已驗證的1.6。

使用者追加：接手prompt只需背景與規則，後半的實際任務由使用者自行填寫；不要替下一位AI新增待辦或安排工作。

1.7開發接力：`docs/handoffs/arsenal-buildcraft-20261019.md`，構築／投射物／彎曲雷射／戰役續無盡及髮型參考庫。驗證與部署以該交接最終證據為準；1.6舊紀錄不代表1.7已測。

1.7本機最終release（2026-10-19 14:35 Asia/Taipei）全過98.02秒、33項邏輯＋5套瀏覽器／效能，build/stage7a8e2b530ad8。PR／部署最終狀態見arsenal-buildcraft交接。
