# 開發與遊玩

遊玩：WASD／方向鍵，或在戰場上拖曳移動；自動射擊最近敵人。空白鍵／右下按鈕釋放技能，Shift／衝刺按鈕短暫無敵閃避。ESC／P 暫停。收集晶體升級，1／2／3 選強化。暫停選單可結算返回機庫，信用點解鎖其他飛機與永久研究。機庫上方可切換25波章節戰役／無盡模式及難度，並開啟成就與資料庫。設定提供存檔匯出／匯入。

本機：先 `bash scripts/setup.sh`，新 shell `source scripts/env.sh`，然後 `python3 scripts/project.py start`，開啟 http://localhost:4173 。遊戲不需要執行期 npm 套件。

驗證：`python3 scripts/project.py check daily`；上線前 `python3 scripts/project.py check release`。release browser 測試自行啟動 4179 測試服務與 Chromium，請勿占用此埠。圖片與模組應同時通過根路徑與 `/dist/` 子路徑載入。

打包：`python3 scripts/project.py build`，再 `python3 scripts/project.py stage`；部署僅使用 `.artifacts/site`。GitHub Pages Source 選 GitHub Actions，推送 main 自動執行 `.github/workflows/pages.yml`。

修改：見 `docs/architecture.md`、`docs/spec.md`、`docs/art/asset-contract.md`。`?qa` 僅供測試，顯示 World 介面給瀏覽器驗證，不改正常遊戲數值。公開頁面不要加這個參數。
