# Shikujin 接力索引

已完成並上線：https://sces5504.github.io/Shikujin/ 。repo sces5504/Shikujin，2026-10-19（Asia/Taipei）。使用者本次免 grilling，授權自主規格／提交／合併／部署，並要求完整內容而非第一里程碑原型。

- 規格：docs/spec.md
- 架構與魔改入口：docs/architecture.md
- 操作與開發：docs/guide.md
- 使用者偏好：docs/memory/owner-preferences.md
- 決策：docs/memory/decisions.md
- 美術：docs/art/style-guide.md、asset-contract.md
- 完整交接：docs/handoffs/shikujin-20261019.md

目前本機分支 main。已整合 PR #2，遊戲 merge commit 6f20e9b6db28864f3ffff93a49a1eb65863dbb13，最後功能修正4e6819c。GitHub CI main 的13項純模擬＋桌面／手機 Chromium release 流程通過，Pages build/deploy 成功（run39178662447）。公開30檔案與測試產物逐位元一致。正式網址的額外瀏覽器直連驗證受代理 CA 信任限制，詳見交接；未關閉 TLS 或修改信任庫。

現有內容：五章25波戰役與結局、無盡模式、5 Boss／機體／空域、4成年原創駕駛員與戰損立繪、武器進化、永久研究、成就、默契、圖鑑、作戰紀錄、存檔匯出／匯入、觸控／鍵盤、原創合成器配樂。

後續依真人回饋調整平衡與新增內容；不要從空範本重做，不要把轉蛋／配音／中途續玩／雲端存檔視為現有功能。每次變更只驗證受影響路徑，必要時跑 release。
