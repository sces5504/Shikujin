# Shikujin 接力索引

已完成並上線：https://sces5504.github.io/Shikujin/ 。repo sces5504/Shikujin，2026-10-19（Asia/Taipei）。使用者本次免 grilling，授權自主規格／提交／合併／部署，並要求完整內容而非第一里程碑原型。

- 規格：docs/spec.md
- 架構與魔改入口：docs/architecture.md
- 操作與開發：docs/guide.md
- 使用者偏好：docs/memory/owner-preferences.md
- 決策：docs/memory/decisions.md
- 美術：docs/art/style-guide.md、asset-contract.md
- 最新打磨交接：docs/handoffs/polish-raiden-20261019.md
- 初版完整交接：docs/handoffs/shikujin-20261019.md

目前本機分支 main。1.5 已整合 PR #3，merge commit `406d6aa61e392d3e5230f7386f8db07a33a3e4d7`，功能 commit `bae7847`。GitHub Checks 39182714718 與 Pages release 39182714735 全成功，完整 release 17 模擬＋三套瀏覽器／效能腳本通過；公開49檔案以HTTPS下載後與stage產物SHA256完全一致，build revision `d4de387bb15f`。正式瀏覽器直連仍受環境代理CA限制，沒有關閉TLS或修改信任庫；本地及CI Chromium驗證正常。

現有內容：五章25波戰役與結局、無盡模式、5 Boss／機體／空域、4成年原創駕駛員與戰損立繪、武器進化、永久研究、成就、默契、圖鑑、作戰紀錄、存檔匯出／匯入、觸控／鍵盤、原創合成器配樂。

後續依真人回饋調整平衡與新增內容；不要從空範本重做，不要把轉蛋／配音／中途續玩／雲端存檔視為現有功能。每次變更只驗證受影響路徑，必要時跑 release。

1.5新增：完整五地表與實體機械戰機、整套動畫賽璐璐CG、放大去背通訊及四種持續大絕、好感互動／故事／畫廊、批次GPU與Canvas備援、自動畫質、投射物物件池及內容hash快取版本。2026-10-19 00:50 UTC工作樹release全過：17模擬含10分鐘無盡、桌面／手機流程、四大絕／好感／GPU恢復、含readback密度壓測。最終CI數據與部署見最新交接。
