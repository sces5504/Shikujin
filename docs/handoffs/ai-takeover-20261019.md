# Shikujin：另一位 AI 接手入口

> 此入口原為1.6交接；目前1.8已發布。先以docs/memory/index.md及docs/handoffs/mobile-combat-impact-20261019.md核對最新版本／驗證／部署，再查下方歷史背景。後補三支壓縮影片已抽樣檢視，並非仍受原mov上限阻塞。

來源：使用者於2026-10-19（Asia/Taipei）要求產生交接prompt並完整記錄已完成工作。此文件整理已確認的需求與現況，不新增玩法要求。歷史實作與驗證細節保留在其他交接文件。

## 先讀與核對

1. `AGENTS.md`、`docs/memory/index.md`、`docs/memory/owner-preferences.md`。
2. 本文件；實作1.6時讀`docs/handoffs/flight-feedback-20261019.md`，查1.5效能／美術沿革再讀`polish-raiden-20261019.md`。
3. 依變更範圍讀`docs/spec.md`、`docs/architecture.md`、`docs/art/style-guide.md`、`docs/art/asset-contract.md`。
4. 先核對branch、HEAD、dirty狀態及遠端；文件記錄不是當前檔案已測試的證明。不要覆蓋其他人新修改。

## 專案與已上線版本

- Repo：https://github.com/sces5504/Shikujin 。正式遊戲：https://sces5504.github.io/Shikujin/?v=1.6 。GitHub Pages Source已設定Actions；不用再請使用者更名repo或啟用Pages。
- 本工作區repo位於`/workspace/261013-test`；新環境可能路徑不同，請找repo root，不要把這個絕對路徑當部署設定。
- 接手文件整理前HEAD為`b339632`（文件提交），branch `main`，工作樹乾淨。最後功能`5d2fc15`，PR #4 merge `1659feb`；最後測試程式修正與正式CI驗證commit為`62e347a8a4e4b922f80a0d8d110ff3f3f8f0c503`。
- 最後成功Checks run `39188631070`、Pages release run `39188631121`（完整檢查／build／stage／deploy成功）。網站內容版本`95ec1d94e68d`。前次發布已下載公開57檔案，SHA256逐一與stage一致。
- 交接整理時再次fetch確認main沒有領先／落後，並重新檢查公開HTML build版本及上述部署狀態。這次只整理文件，沒有修改玩法或素材，不把歷史測試冒稱為新環境測試。

## 使用者最重要的要求

- 繁體中文，持續打磨完整、有刺激感與爽感的遊戲，朝商業遊戲完成度前進；不是只做第一里程碑或停在規格。尚未有跨裝置商用品質認證，不要宣稱已完成所有商用驗收。
- 深模組、資料驅動、策略registry，方便日後擴充Boss、敵潮、機體、角色、武器與地圖。保留目前可玩內容，不從空範本重做。
- 使用者已授權自主規格、修改、提交、PR、合併與部署，本次免grilling。新增費用、AI主動推翻已確認玩法／架構、其他破壞性操作依AGENTS規則處理；授權不超越平台實際權限。
- **README.md由使用者管理，不能建立或修改，也不要加它是否變動的檢查。**
- 使用者明確喜歡1.5／1.6目前風格，要保留。戰場為軍事機械俯視射擊、實體戰機、地表、陰影、光束與爆炸；角色為乾淨日系動畫線稿、賽璐璐陰影，CG必須一致。
- **Mio最終要求：保留原側分、蓬鬆披散長髮、柔和波浪、側辮／星飾與溫柔成熟大姊姊感，胸型可稍豐滿。不要把Mio改成馬尾或大改齊瀏海／螺旋捲。** 為避免與Mio髮型相同，現在Akari採紅緞帶束髮。六套CG已同步；不要拿中間被棄用的Mio草稿當新設定。
- 密集彈幕曾嚴重卡死，效能與危險物件可讀性是核心要求。不要用刪除危險彈／停掉碰撞掩飾效能問題；裝飾陰影可依畫質減量。

## 已完成的遊戲內容

### 原有完整循環

5章25波戰役與結局、無盡模式、3難度、5機體／5空域／5 Boss、6普通敵人、每3波敵潮與每5波Boss、Boss二階段與預告節奏、換圖補給、升級三選一、16強化與3武器進化、6永久研究、8成就、作戰紀錄、存檔匯入匯出、鍵盤／滑鼠／觸控、合成器配樂及音效。

### 1.5 已完成

- WebGL批次精靈／彈幕＋Canvas備援、GPU context loss／恢復、物件池、可重用空間索引、原地清理與集合上限；固定步進防追幀卡死，自動畫質。
- 五張完整軍事地表、實體機械戰機／敵機、投影與火焰爆炸，重繪四位原創成年角色。
- 放大去背通訊、四位不同持續大絕及大型cut-in。
- 駕駛員休息室、好感交流／禮物（台北每日各3次）、五階故事、首次獎勵防重領、回憶與畫廊；舊默契遷移。
- 建置對模組、字體及美術加內容hash，避免舊新資源混用。

### 1.6 最新已完成

- 固定6400×6400世界地表，移除戰鬥時間漂移與黏玩家的小視差；12%死區與平滑鏡頭；邊界圍欄／外圍壓暗、320m內警示，鏡頭保留150世界px外側視野。
- 敵我機體約28%放大、Boss約10%；玩家判定仍7px。敵機輪廓預烘焙，敵彈深邊／粉白核心24世界px、獨立前景批次，不被裝飾粒子遮住。
- 五機主武器：隼式雙翼直射、幽影持續穿透雷射、重岳爆破砲、熾翼扇形散彈、神諭僚機＋自動追蹤導彈；共用肉鴿強化。
- **正式版輸入`wwssadadba`再Enter開測試選單**，不需`?qa`。加錢／解鎖即存檔；等級／指定強化／補滿／無敵／重置技能／清彈／跳波／地圖／Boss。返回原選單，保留暫停與升級選擇。
- 主動結算`reason=retreat`：平安返航文案＋正常CG；只有死亡用戰損，通關也獨立。內部終止state沿用`defeat`是相容設計，不代表UI仍當作戰敗。
- 凜時停7秒凍結敵人／射擊、敵彈位置與壽命；不清彈，凍結彈仍可碰撞，結束正常恢復。施放初期有短暫保護供cut-in。
- 赤璃光束波導／雙翼發射器、凜停滯鐘面、雪羽光翼／盾片／回復十字、Mio軌道鎖定倒數／垂直光柱／爆破碎片；一般脈衝也改分段能量波。
- Akari與Mio最終角色設定同步到日常／戰損／完整大絕／回憶／透明通訊／透明大絕六套CG。

## 架構與魔改入口

原生ES modules，沒有執行期npm依賴或遊戲後端。

| 範圍 | 入口 |
| --- | --- |
| 機體、人物、地圖、敵人、升級、上限 | `src/content/catalog.js` |
| 主武器資料／策略 | `src/content/weapons.js`、`src/game/weapons.js` |
| Boss／彈幕策略 | `src/content/encounters.js`、`src/game/boss-patterns.js`、`src/game/patterns.js` |
| 純模擬聚合與系統 | `src/game/world.js`、`src/game/systems.js` |
| 大絕玩法／特效 | `src/game/ultimates.js`、`src/render/effects.js` |
| GPU／快取／鏡頭／地表／邊界 | `src/render/gpu.js`、`cache.js`、`camera.js`、`terrain.js`、`boundary.js` |
| 好感資料／純邏輯／畫面 | `src/content/affection.js`、`src/core/affection.js`、`src/ui/bond.js` |
| 測試工具 | `src/core/secret-code.js`、`src/game/debug.js`、`src/ui/debug.js` |
| 版本化存檔／UI協調／主迴圈 | `src/core/storage.js`、`src/ui/app.js`、`src/main.js` |
| 內容版本與部署輸出 | `scripts/build.mjs`、`scripts/project.py`、`.template/project.json` |

localStorage key `shikujin.save.v1`，版本維持1、向後相容；穩定資料ID不可隨意改名。World不引用DOM或localStorage。新增內容走資料與registry，不複製主迴圈。

上限敵240／敵彈1500／我彈500／掉落750／粒子350；爆炸48／impact24等瞬態集合有界。密集敵潮自動／效能模式只保留1/3裝飾敵機陰影，高畫質保留全陰影。不得放寬測試預算來藏回歸。

## 美術資產交付

`assets/`中的壓縮WebP是可攜帶的正式資產，尺寸／圖集座標見asset-contract。六張角色圖均1536×1024、四等寬欄，依Akari／Rin／Yuki／Mio；radio、burst需保留alpha。`PILOTS`各portrait欄位支援獨立圖，新增人物不要打亂舊圖集。

原始生成圖在舊工作區`/workspace/generated_images`，**未納入git，新環境不保證存在**。最終母圖檔名與家族來源見flight-feedback交接；不能依賴`/tmp`或舊工作區檔案才能開發。可直接以repo現有WebP作一致性參考。字體是本地Noto Sans TC子集／Rajdhani，加入新中文字需注意字形覆蓋。

基準畫面在`docs/art/baselines/`；`test-results/`、`dist/`、`.artifacts/`皆忽略，不當跨環境交付來源。

## 開發、測試與部署

```bash
bash scripts/setup.sh          # 需要安裝工具時，先審閱現有腳本
source scripts/env.sh          # 每個新shell都做
python3 scripts/project.py start
python3 scripts/project.py check daily
python3 scripts/project.py check release
python3 scripts/project.py build
python3 scripts/project.py stage
```

本機4173；測試自行使用4179、4182、4184、4186埠，不要同時開多套release。`?qa`只暴露瀏覽器測試介面，不是玩家測試選單的前提。

最後已驗證：20項模擬（含10分鐘無盡）＋3項密碼／攝影機／debug測試，桌面手機／存檔／子路徑、好感／四大絕／GPU恢復、壓測、新回饋瀏覽器四套流程。CI軟體GPU0.7解析度：模擬p950.5ms、含readback繪製p9522.9ms；本機同設定p9551.9ms。數據受主機負載影響，不是所有硬體60FPS保證。Safari／Firefox、低階真機及真人長期平衡尚未全面驗證。

曾修正一個CI假失敗：導彈在截圖完成前已命中，所以不能靠截圖後的存活彈陣列判定是否發射。現在記錄實際發射種類，不要改回脆弱的時間截點斷言。

Pages只部署`stage`的`.artifacts/site`，不能發repo root。main推送自動完整檢查／部署；文件提交可`[skip ci]`。發布後核對公開HTML版本及資源。此環境之前正式網址Chromium直連受代理CA信任限制，採本地／CI瀏覽器＋TLS驗證公開檔案hash；沒有關閉TLS或改信任庫。這是環境限制，接手時重新判斷，不要當作網站一定壞掉。

## 尚未實作與接下來怎麼做

目前沒有未提交的遊戲功能、未處理的部署失敗或已確認的新bug。原十一項回饋已交付；不要把這份交接當作使用者又回報了同一批未修問題。

轉蛋、真金流、配音、中途續玩、跨裝置雲端存檔尚未實作；不要宣稱已有，也不因初始構想就直接引入付費服務。

使用者已明確表示，下一位AI的修正與新增任務由使用者自己接在prompt後面。本文件只提供背景與接手規則，不安排新待辦、優先順序或要求AI自行選題；以使用者後續任務為準。

## 可直接貼給下一位 AI 的 prompt

```text
請接手我的網頁飛機肉鴿遊戲 Shikujin，依照我在這段背景後面列出的任務，繼續修正與新增內容。

Repo：https://github.com/sces5504/Shikujin
正式版：https://sces5504.github.io/Shikujin/?v=1.6

先核對工作區、branch與遠端，保留其他人的修改。閱讀 AGENTS.md、docs/memory/index.md、docs/memory/owner-preferences.md、docs/handoffs/ai-takeover-20261019.md，再依任務讀規格、架構和美術契約。交接中的歷史回饋已完成，不是這次的新待辦；不要從頭重做，也不要把歷史測試當成你已驗證。

目前1.6已發布：完整25波戰役與無盡模式、Boss／肉鴿升級／局外成長、固定大地圖與邊界提示、清晰敵彈、五機專屬武器、時停彈碰撞、正常返航結算、四種專屬大絕、好感與一致CG。輸入wwssadadba再Enter可開測試工具。

我喜歡目前風格，維持軍事機械地表與乾淨動畫賽璐璐畫風。Mio保留原本側分蓬鬆長髮和溫柔成熟姊姊感，不要馬尾／大改齊瀏海；現在Akari束髮，CG家族已同步。維持美術、敵彈辨識與密集彈幕效能。架構要深模組、資料驅動，方便之後魔改；保留舊存檔與穩定ID。

使用繁體中文。我已授權此repo自主修改、提交、PR、合併與部署，不需重做grilling；新增費用或AI主動推翻已確認玩法／架構，依AGENTS規則先確認。README.md由我管理，不要建立／修改，也不要加入它是否變動的檢查。

依下方任務完成實作與適當測試，不只給計畫。效能修正不得刪危險彈或停碰撞。上線跑release、build、stage，只部署.artifacts/site，確認Actions與公開資源版本，更新規格與交接紀錄。

以下是這次要做的任務：
```
