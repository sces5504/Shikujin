# 1.9 雷電式縱向捲軸改版交接

- 任務／範圍／branch：使用者要求改為雷電式直向、更好玩、畫面更炫（2026-10-25）。branch `claude/lucid-hamilton-ewj3e3`，起點 main ff635af。
- 狀態：已上線。功能 commit b931158，PR #7 合併 68c1a71；Checks 40166589377 與 Pages release 40166589311 成功，https://sces5504.github.io/Shikujin/ 已顯示 VER. 1.9（2026-10-25 05:46 UTC）。
- 已完成：
  - `src/content/stage.js`：720×1200 欄位、捲動速度、道具線、道具與編隊獎勵輪替。
  - `src/game/formations.js`：七種編隊與 `spawnSquad`；`patterns.js` behaviors 改為縱向進場路徑，Boss 進場後上段巡邏。
  - `world.js`：spawn(kind, slot)、編隊獎勵、勳章鏈、道具、popups、flash、清彈火花、Boss 擊破演出；移除 bossArena。
  - `systems.js`：編隊導演、欄位夾限＋觸控相對拖曳、主砲固定向上、只在畫面內開火、出界清除、掉落漂移與道具線吸取。
  - `weapons.js`：無目標也開火、雷射彎向目標、散彈扇角上限。`input.js` 相對拖曳；`main.js` 接 renderer.scale。
  - `render/stage-frame.js`（雲層、速度線、側框）、`renderer.js` 固定鏡頭與縮放、GPU scissor、道具／popup 繪製、DOM 全螢幕閃光；`index.html`／`style.css` 新增 WARNING 與閃光層；`app.js` 導航改顯示航程與勳章鏈、飛行指南更新。
  - 刪除 `render/boundary.js` 與 BattleCamera（`camera.js` 只剩地表座標）。
- 測試（HEAD 為本次提交前工作樹）：`python3 scripts/project.py check daily` 全過（含新 vertical.test.mjs）；`check release` 全過 98 秒，模擬 p95 1.2–1.6ms、繪製 p95 33–38ms。
  - 環境注意：tools 的 Playwright 1.64 需要 chromium 1248，雲端只預裝 1243；本次以 `.cache/ms-playwright` 內 symlink（chromium-1248、chromium_headless_shell-1248 → /opt/pw-browsers/*-1243）並設 `PLAYWRIGHT_BROWSERS_PATH` 執行，未下載瀏覽器。
- 未完成／已知：
  - 立繪未重畫：使用者先要求重畫，後指示「之後再上傳」。收到後依 `docs/art/asset-contract.md` 六套 1536×1024 四欄契約裁切；radio／burst 需透明背景。
  - 地表為原 2048 寬 tile 垂直鏡像接續，鏡像接縫在捲動中可見但短暫；日後可補專用縱向地表。
  - 平衡只用無技巧自動駕駛與 Boss 跟隨模擬，尚無真人回饋。
- 決策：見 decisions.md「2026-10-25：1.9」。
- 下一個 AI：1) 核對 HEAD 與 Pages 部署；2) 若使用者上傳立繪，依素材契約接入並驗證通訊／cut-in／結算畫面；3) 依真人回饋調整編隊密度與道具頻率。
