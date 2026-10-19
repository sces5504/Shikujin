# 模組與擴充指南

## 資料流

`App` 管理畫面、輸入啟用與事件訂閱 → `World.step(1/60, input)` → 獨立 systems 更新 → 事件回傳 UI／音效 → `Renderer` 讀取 world 繪圖。Renderer 不修改玩法，World 不引用 DOM／localStorage。純模擬可在 Node 測試。

- `src/content/catalog.js`：穩定 ID、機體數值、駕駛員、地圖敵群、敵人原型、升級規格與波次設定。
- `src/core/`：可重現隨機、事件匯流排、輸入、版本化存檔、空間索引。
- `src/game/world.js`：單局聚合根、實體生成／傷害／掉落／技能與狀態轉換。
- `src/game/systems.js`：波次導演、移動、自動武器、敵人、投射物連續線段碰撞、拾取及清理。新增複雜系統時可將單一函式再移到同名檔，不變更 World 外部介面。
- `src/game/patterns.js`：`patterns` 彈幕發射器與 `behaviors` 行為 registry。
- `src/game/upgrades.js`：依上限過濾選項，無重複抽樣與效果套用。
- `src/render/`：WebGL 批次精靈／彈幕、Canvas 地表及備援、資產快取與 WebAudio。
- `src/ui/app.js`：機庫／HUD／選單／通訊與獎勵結算，`main.js` 只有組裝與固定時間步。

## 新增內容

### 機體
SHIPS 加入唯一 ID、hp/speed/damage/interval/cost/color/shape。新增外觀時在 render/cache.js 宣告圖集座標；缺少圖像則由 `drawShip` 的 shape 備援。選單與購買會自動列出。儲存 ID 一旦發佈不可任意改名；先新增遷移。

### 駕駛員
PILOTS 加入唯一 ID、成年人年齡、台詞、被動與技能；abilities.js 的 passives／abilities registry 與 ultimates.js 實作持續技能。portrait、defeatPortrait、ultimatePortrait、memoryPortrait、radioPortrait、burstPortrait 宣告 asset／column／columns，各角色可使用獨立檔（columns:1），不需改既有四欄圖集或 UI。

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

空間索引縮小投射物候選集合；最多 240 敵人／2000 投射物（1500敵、500我）／350 粒子。固定步進最多補3步（0.05秒），避免失焦巨量追幀；Canvas DPR 上限 2。掉落最多 750 筆，超過時合併經驗值，避免長局無限增加。減少效果關閉震動、減少粒子與 shadow blur。目標桌面 Chromium 60 FPS；低階手機實際幀率尚未硬體驗證。

## 局外成長與武器進化

content/progression.js 宣告 RESEARCH／ACHIEVEMENTS／DIFFICULTIES／EVOLUTIONS；SaveStore 驗證及原子扣款／一次性成就領取，MetaUI 管理選單。game/progression.js 將研究套用為單局初始值，並於選擇升級後檢查進化條件。研究不在戰鬥中直接改存檔。World 結果帶出擊殺／Boss／通關／獎勵，App 單次結算 guard 轉交 SaveStore。

## 音訊

render/audio.js 以 WebAudio 振盪器／gain envelope 合成原創配樂與音效；前瞻排程和 scene／boss 參數控制節奏。首次使用者操作才建立 Context。無第三方音樂 runtime 請求，關閉音效會靜音 master，配樂亦可獨立關閉。

## 1.5 渲染與互動擴充

`render/gpu.js` 管理獨立透明 WebGL canvas，按texture批次精靈，預配置點buffer繪彈幕／掉落。Canvas層繪完整背景與少量大範圍效果。GPU context失效退回Canvas，恢復重建program及texture。`cache.js` 將機體／光暈／爆炸／數字預繪；背景按需載入，`terrain.js` 只保留目前地圖縮放surface，交替垂直反射連接。自動畫質只改解析度，不能影響模擬或刪除危險物件。

`core/pool.js` 提供投射物池與原地compact；World保留敵我計數，清彈只標記過期，統一cleanup歸還，避免迭代中重複釋放。空間索引重用cell及query陣列，飛彈保留目標，減少整場掃描與垃圾回收。變更上限須同步壓測及長局測試。

`content/affection.js` 定義人物故事／偏好／階段；`core/affection.js` 純邏輯驗證額度、扣款、獎勵防重領；SaveStore持久化，`ui/bond.js` 僅管理休息室畫面。台北日界獨立函式可注入測試。版本維持v1並清理缺漏／無效舊值。角色CG仍由catalog的肖像資料提供，新增角色需同時加入故事設定與能力registry。

`game/ultimates.js` 更新持續大絕／預告轟擊，不引用DOM。App接skill事件呈現cut-in，Renderer讀狀態畫效果。新增大絕以能力ID dispatch，不改主迴圈。

build.mjs對來源／資產計算內容hash並更新相依模組及圖片URL；沒有Service Worker。部署只發佈stage產物。效能重現：`node tests/game/performance.mjs`；包含GPU readback避免只測CPU提交時間。

## 1.6 擴充入口

content/weapons.js定義主武器描述；catalog每機weapon穩定ID；game/weapons.js的mainWeapons策略registry實作射線／炮彈／編隊等，systems只呼叫fireMainWeapon。共用升級仍由player數值提供，beams是當幀純模擬幾何，impacts為有界24個視覺事件。新增武器不要在renderer按ship ID分支。

render/camera.js提供死區攝影機與地表座標；terrain按固定世界tile繪圖，無戰鬥時間捲動。boundary.js繪可見圍欄與量測距離。Renderer使用camera而非player作GPU／Canvas共同投影。effects.js集中可辨識的各能力演出；敵彈預繪texture在GPU最後獨立批次，與一般裝飾粒子分離。高密度只減裝飾陰影，保留所有敵機與危險彈。

core/secret-code.js只識別完整密碼＋Enter，忽略表單及重複鍵；ui/debug.js保留原畫面／暫停、管理測試工具；game/debug.js純邏輯跳波與等級，正式build也提供且不用QA網址。World.result.reason區分clear/retreat/defeat；內部終止state沿用defeat以保持事件相容，UI以reason選CG及文案。存檔v1新增reason並遷移舊紀錄。

## 1.7 構築與彈體入口

- `content/projectiles.js`是投射物外觀、判定半徑、敵彈傷害倍率、motion與爆破資料registry。新增彈體先定義此處，發射器只傳ID／角度／速度；renderer不按機體ID分支。`type`保留精確原型，舊`kind=enemy`繼續維持陣營相容；pool每次重設type/age/speed/target。
- `content/weapons.js`的WEAPON_TUNING集中主武器速度、傷害倍率、散布與雷射成長；`content/combat.js`宣告敵人／Boss loadout、motifs輪替與軌道轟擊排程。patterns處理發射編排，systems依motion執行擺動、加速、追蹤。
- `content/builds.js`宣告新增強化／前置／標籤／機型說明與極限強化；`game/upgrades.js`負責有界候選抽樣、重抽及數值效果。`game/builds.js`集中武器命中附加效果、電弧、地雷、側翼、僚機火控。燃燒不遞迴觸發命中；Boss低溫效果減半。瞬態地雷最多16、電弧每次最多11段且0.18秒消失。脈衝等原系統沿用既有爆破入口。
- 雷射`beams.points`是玩法與渲染共用線段，單束加寬／能量成長，砲口角度保存在world而非renderer。GPU彈體走可旋轉精靈而非方向不一致的點shader；敵彈仍danger前景批次，context恢復重建texture。
- `World.continueEndless`只接受campaign clear終局一次。保留構築，wave26、map0、intermission；previousSettlement只存於單局記憶體，後續finish回傳增量並帶continuation/bondWaves，SaveStore不重算runs。v1舊檔無需更改；沒有中途續存功能。
- 髮型參考庫見`docs/art/hairstyle-library.json`及原始參考PDF，供新角色設計查詢，不打包至網站。

## 1.8 輸入與回饋入口

`core/input.js`的bindCombatAction為技能按鈕綁定獨立pointerdown與detail=0 click，不與移動pointer ID共用；App只提供動作callback。CSS以touch-action控制原生手勢，欄位保留user-select:text，不修改固定步進或World操作條件。

`game/builds.js`增加radialSalvo及dashBuild／shieldBreakBuild／killBuild，World在對應既有事件發生時呼叫，保留模擬無DOM；低溫擊殺0.2秒節流、破盾8秒內置冷卻，避免擊殺碎片無界連鎖。折光與連鎖共用arcEffects短期光線，star為共用投射物原型。一般星環與折光頻率集中content/combat.js，強化／前置及進化仍由既有registry定義。

World.hit增加有界命中視覺記錄，不改傷害運算；Renderer以effects.impact分支畫短火花，fireMainWeapon記錄短砲口亮光；Boss生命在encounters資料表，顯示大小與判定分開。

GPU新增overlay精靈批次：一般機體→裝飾→命中火花／砲口光→danger敵彈。overlay不蓋敵彈；Canvas沿同樣可讀性原則繪製，context恢復仍由既有texture重建流程處理。短火花cache一次預繪，避免每幀逐條重畫；CPU記錄仍有24筆上限。
