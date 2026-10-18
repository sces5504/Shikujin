# 模組與擴充指南

## 資料流

`App` 管理畫面、輸入啟用與事件訂閱 → `World.step(1/60, input)` → 獨立 systems 更新 → 事件回傳 UI／音效 → `Renderer` 讀取 world 繪圖。Renderer 不修改玩法，World 不引用 DOM／localStorage。純模擬可在 Node 測試。

- `src/content/catalog.js`：穩定 ID、機體數值、駕駛員、地圖敵群、敵人原型、升級規格與波次設定。
- `src/core/`：可重現隨機、事件匯流排、輸入、版本化存檔、空間索引。
- `src/game/world.js`：單局聚合根、實體生成／傷害／掉落／技能與狀態轉換。
- `src/game/systems.js`：波次導演、移動、自動武器、敵人、投射物連續線段碰撞、拾取及清理。新增複雜系統時可將單一函式再移到同名檔，不變更 World 外部介面。
- `src/game/patterns.js`：`patterns` 彈幕發射器與 `behaviors` 行為 registry。
- `src/game/upgrades.js`：依上限過濾選項，無重複抽樣與效果套用。
- `src/render/`：Canvas 加色光影、程序化幾何機體與 WebAudio。
- `src/ui/app.js`：機庫／HUD／選單／通訊與獎勵結算，`main.js` 只有組裝與固定時間步。

## 新增內容

### 機體
SHIPS 加入唯一 ID、hp/speed/damage/interval/cost/color/shape。新增外觀時延伸 `drawShip` 的 shape。選單與購買會自動列出。儲存 ID 一旦發佈不可任意改名；先新增遷移。

### 駕駛員
PILOTS 加入唯一 ID、成年人年齡、台詞、被動與技能；abilities.js 的 passives／abilities registry 實作能力。portrait 與 defeatPortrait 宣告 asset／column／columns，各角色可使用獨立檔（columns:1），不需改既有四欄圖集或 UI。

### 敵人／Boss／彈幕
ENEMIES 定義數值並指向 `behavior` 名稱，在 `behaviors` registry 實作策略。策略呼叫 `patterns` 或 `world.enemyBullet`，不操作 Canvas。encounters.js 的 BOSSES 宣告名稱、生命、pattern、sprite、arenaRadius；boss-patterns.js registry 實作彈幕策略。五種 Boss 各自兩階段，1.2 秒預告／4.8 秒攻擊／2 秒喘息。新增 Boss 不應複製主迴圈；沒有 sprite 可用程序化 fallback。

### 波次／地圖
RULES 的 bossEvery/surgeEvery/waveSeconds 是頻率設定。MAPS 定義背景／光色／敵人池，Boss 波完成後循環換圖。目前五個地圖，campaign 模式在地圖數 × Boss 頻率後結束，endless 模式持續循環；轉場發出 intermission，玩家選擇補給。地圖與敵人表獨立，無須改 Renderer 或 UI。

### 升級／武器
UPGRADES 加入說明、圖示與上限，upgrades.js 對應即時效果；新持續武器則由 weapons system 讀取等級。穿透彈保存命中 ID，避免同一目標重複傷害；每顆投射物有壽命與全局上限。

## 狀態及持久化

機庫不建立 World；單局 `playing → upgrade → playing`、`playing ↔ paused`，最後 `defeat`。結算狀態有單次 guard；暫停返航同樣結算。隱藏頁面或失焦會暫停，固定步進積分器在非 playing 清空。

SaveStore 隔離瀏覽器 storage adapter；版本 1 儲存信用點、已購機體、選擇、模式難度、研究、成就、默契、十筆作戰紀錄、設定。支援匯出／匯入 JSON。不保存中途戰鬥、不跨裝置同步。讀取時驗證 ID、數值、陣列；儲存失敗透過 UI 提示。未來後端改 repository adapter，戰鬥不依賴網路。

## 效能與品質

空間索引縮小投射物候選集合；每波最多 240 敵人／1000 投射物／350 粒子。固定步進最多補 0.1 秒，避免失焦巨量追幀；Canvas DPR 上限 2。掉落最多 750 筆，超過時合併經驗值，避免長局無限增加。減少效果關閉震動、減少粒子與 shadow blur。目標桌面 Chromium 60 FPS；低階手機實際幀率尚未硬體驗證。

## 局外成長與武器進化

content/progression.js 宣告 RESEARCH／ACHIEVEMENTS／DIFFICULTIES／EVOLUTIONS；SaveStore 驗證及原子扣款／一次性成就領取，MetaUI 管理選單。game/progression.js 將研究套用為單局初始值，並於選擇升級後檢查進化條件。研究不在戰鬥中直接改存檔。World 結果帶出擊殺／Boss／通關／獎勵，App 單次結算 guard 轉交 SaveStore。

## 音訊

render/audio.js 以 WebAudio 振盪器／gain envelope 合成原創配樂與音效；前瞻排程和 scene／boss 參數控制節奏。首次使用者操作才建立 Context。無第三方音樂 runtime 請求，關閉音效會靜音 master，配樂亦可獨立關閉。
