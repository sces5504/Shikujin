# 2.0 構築深度、新角色與新立繪交接

- 任務／範圍／branch：使用者要求打磨、加新機制與系統、讓三選一更好玩，授權自由改造並新增機體／角色；可取用 `sces5504/20261020` 素材但嚴禁修改該專案（2026-10-25）。branch `claude/lucid-hamilton-ewj3e3`，起點 main 1f61942（1.9 已上線）。
- 狀態：見本檔末段「驗證與部署」。
- 已完成：
  - `src/content/depth.js`／`src/game/depth.js`：稀有度、流派共鳴、精英詞綴、補給運輸艦、航線、章節評價資料與邏輯。
  - `world.js`：offer／queueUpgrade(guaranteed)／banish／choose（稀有度多級、修復、重抽）、精英減傷與死亡分裂、運輸艦掉落、強化晶片、航線生命／傷害／彈速／收益、章節統計 `sector` 與 `ranks`、爆炸倍率 `blastMul`。
  - `systems.js`：每波一次運輸艦、精英齊射倍率、晶片排隊開三選一、航線經驗倍率。`formations.js`：編隊精英晉升、`spawnCarrier`。`patterns.js`：carrier 行為。`catalog.js`：carrier 敵人、緋紗／朔夜、戰女神。
  - 新大絕：`ultimates.js` swarm（追蹤飛彈蜂群）、lunar（月輪清彈切割）；`effects.js` 演出；`abilities.js` 被動。
  - 新武器 rail（`weapons.js`、`content/weapons.js`、`projectiles.js` rail、`builds.js` 武器說明），`craft.webp` 第 6 格與 `cache.js` 6 格。
  - UI：稀有度卡片、共鳴標籤進度、封印按鈕、轉場章節評價＋航線選擇、HUD 共鳴徽章與航線名、結算各章評價、共鳴／運輸艦通訊。
  - 立繪：`scripts/art/build-portraits.py` 從 20261020 唯讀 clone 產生六套 CG（四欄 sheet）與兩位新角色單欄檔。
- 測試：新增 `tests/game/depth.test.mjs`；`simulation.test.mjs` 卡片等級斷言改依稀有度、ultimates 測試加入兩新大絕；`browser.mjs` 駕駛員數 4→6。
- 另一專案安全：只用 add_repo 的匿名唯讀通道 clone 到 `/home/user/sces5504/20261020`，該通道無推送能力；沒有在該 repo 執行任何寫入 git 指令。
- 已知／未完成：
  - 戰損、回憶、大絕 CG 是同一張立繪的程序合成（背景、煙灰、光效），不是原專案的多表情版本。
  - 稀有度加快成長，經驗曲線未調；平衡仍待真人回饋。
  - 來源素材在原專案標記為待使用者審閱候選。
- 下一個 AI：1) 核對 main 與 Pages；2) 依真人回饋調整稀有度權重、精英機率與航線獎勵；3) 若使用者提供更多角色表情，替換程序合成的戰損／回憶 CG。

## 驗證與部署

（提交前填寫）
