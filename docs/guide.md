# 開發與遊玩

遊玩：WASD／方向鍵，或在戰場上拖曳移動；自動射擊最近敵人。空白鍵／右下按鈕釋放技能，Shift／衝刺按鈕短暫無敵閃避。ESC／P 暫停。收集晶體升級，1／2／3 選強化。暫停選單可結算返回機庫，信用點解鎖其他飛機與永久研究。機庫上方可切換25波章節戰役／無盡模式及難度，並開啟成就與資料庫。設定提供存檔匯出／匯入。

本機：先 `bash scripts/setup.sh`，新 shell `source scripts/env.sh`，然後 `python3 scripts/project.py start`，開啟 http://localhost:4173 。遊戲不需要執行期 npm 套件。

驗證：`python3 scripts/project.py check daily`；上線前 `python3 scripts/project.py check release`。release browser 測試自行啟動 4179 測試服務與 Chromium，請勿占用此埠。圖片與模組應同時通過根路徑與 `/dist/` 子路徑載入。

打包：`python3 scripts/project.py build`，再 `python3 scripts/project.py stage`；部署僅使用 `.artifacts/site`。GitHub Pages Source 選 GitHub Actions，推送 main 自動執行 `.github/workflows/pages.yml`。

修改：見 `docs/architecture.md`、`docs/spec.md`、`docs/art/asset-contract.md`。`?qa` 僅供測試，顯示 World 介面給瀏覽器驗證，不改正常遊戲數值。公開頁面不要加這個參數。

1.5：機庫「駕駛員休息室」可交流、送禮、閱讀階段故事及切換CG。每日額度以台北日界計算；出擊也增加好感。設定可切換自動／高畫質／效能；自動模式依負載調整解析度，不影響敵彈碰撞。大絕會清彈與提供短暫保護，各角色持續效果不同。

新增release腳本自行使用4182／4184埠；請勿同時開多套release。壓測可單獨執行 `node tests/game/performance.mjs`，報告位於test-results/performance-after.json；測量包含GPU同步readback。

1.6測試工具：在機庫或戰鬥依序輸入 `wwssadadba` 再按Enter。開啟後可用右上測試工具按鈕再次進入。錢／解鎖即時存檔；局內提供等級、指定強化、補滿／無敵、技能重置、清彈、跳波、地圖及Boss。關閉回到原狀態，不需加網址參數。主動結算是平安返航，只有生命歸零才使用戰損畫面。凜的時停會保留敵彈，停止期間仍須避開。
