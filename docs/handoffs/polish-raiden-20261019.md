# Raiden 風格與效能／角色互動打磨

使用者 2026-10-19 明確回饋：上一版未對齊 eNAKIEXHRGM 視覺風格；彈幕密集時嚴重卡頓甚至卡死。要求持續打磨到商業完成度，放大角色通訊與大絕演出、每位不同大絕與按鍵、可互動好感度、CG 一致性，新增角色時參考本次五張圖片。沿用原授權，直接整合發佈。

已確認影片標題 Raiden III PS2 Gameplay HD (PCSX2)，本次可從 YouTube 頁面取得標題並檢視搜尋提供的實機截圖。方向為有地表景深的軍事機械縱向射擊、實體戰機、地表陰影、飽和能量武器、火焰爆炸；維持既有自由移動／肉鴿機制。不是上一版黑底幾何線框。參考 https://youtu.be/eNAKIEXHRGM 、https://store.steampowered.com/app/2002860/ 。

初始 main d86821f，工作樹乾淨，fetch 後建立 polish/raiden-performance。當前工作：壓力測試比較、光暈快取／批次繪圖、物件池與空間索引、機械機體／地表美術、角色大絕與互動。

參考原則：MDN Canvas optimization（預繪、批次、避免 shadowBlur），https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas 。好感度借鏡二次元手遊的出擊、對話、禮物、階段台詞與回憶解鎖，不直接複製其角色／文案／美術。

驗收目標：同場景 240 敵／1000 彈／750 掉落，保留所有敵彈碰撞，量測模擬與含 raster 繪製時間；測量前後一致。瀏覽器高壓流程測暫停／大絕／返回選單／存檔、手機布局與互動。數據只代表此 CI／雲端 Chromium，不等同所有實機 FPS。

## 打磨檢查點

- 使用者追加不喜歡舊角色畫風：已整套轉為日系動畫乾淨線稿與賽璐璐風。新主設定圖 exec-6e0b1db5-b952-4e35-93b0-327d77feca09.png；日常／大絕／回憶／戰損均由此母圖衍生，另有去背通訊與去背大絕。
- 五張完整場景圖（海岸、峽谷、空港、冰原、熔爐）取代黑底幾何線框，反射銜接垂直背景避免方格硬接縫。戰機、六類敵機使用原創實體機械圖集與地面投影。
- 舊版24幀240敵／1000彈／750掉落測試超過180秒未完成，手動終止（測試檔出生00:19:58 UTC，超時紀錄00:23:19）。不能宣稱舊版有具體FPS平均。
- 新增批次WebGL sprite／analytic point層、Canvas fallback、context loss恢復、數值空間索引、投射物物件池、原地清理與獨立敵我彈配額。渲染上限2000顆（1500敵／500我）但品質調整不會刪除碰撞。
- 新版相同物件密度、72幀暖機與採樣末24幀：GPU=true、auto resolution0.7、模擬p95 .4ms、含軟體GPU readback的繪製median22.5ms／p9545.3ms。這不是所有裝置60FPS保證。之後換完整背景，需最終重測數據。
- 17項模擬已通過，包含10分鐘連續無盡（36000步）與所有瞬態集合／物件池上限。新版瀏覽器流程已通過好感／禮物／故事／存檔、四大絕、GPU fallback及恢復、4秒密度測試（pool created1000、最長task82ms）、手機與畫質設定。最終整合release仍在執行，資料以最後報告為準。
- 大絕：赤璃6秒殲星光砲、凜7秒時間領域與相位追擊、雪羽8秒修復護盾結界、澪8次預告軌道轟擊。每位有去背CG cut-in及清彈／短暫保護，按Space或右下明確大絕按鍵。
- 好感：舊bond自動遷移初值、出擊增加、每日各3次交流與禮物（Asia/Taipei）、喜好禮物加成、五段故事每位15句、首次回憶獎勵35信用點防重領、20好感回憶CG、日常／大絕／回憶／戰損畫廊。
- 新build以內容hash替HTML／CSS／ES module依賴／美術字體URL加版本，避免新舊模組與角色圖片混用。

## 最終本機驗證

2026-10-19 00:50:05 UTC，d86821f之上dirty工作樹（全部本次修改），release四個命令全部通過，65.59秒。17純模擬含10分鐘連續無盡、桌面／手機與built子路徑、互動／畫廊／四大絕／GPU loss恢復、密度壓測。最新軟體GPU報告：自動解析度0.7，模擬median0.3／p950.6ms；繪製及readback median24.6／p9548.7／max59.5ms。240敵／初始1000彈／750掉落（最後999／749），GL error0；4秒互動壓力測最長task121ms、池建立1000。不是所有硬體60FPS保證。

模板10項測試通過、build revision d4de387bb15f、stage及diff whitespace通過。移除未使用terrain圖集，assets7.5MB；五背景按需載入。更新基準畫面及美術／架構／規格。下一步提交、PR、CI、合併、Pages驗證，勿停在本地。

## 已整合與上線

PR https://github.com/sces5504/Shikujin/pull/3 已合併；功能bae7847，merge406d6aa61e392d3e5230f7386f8db07a33a3e4d7。main Checks run39182714718通過，Pages release run39182714735的完整release／build／stage／deploy皆成功。CI實際軟體GPU自動解析度0.85：模擬p950.5ms、含readback繪製median22.5／p9527.1／max28.8ms，GL error0。與本機0.7數據分列，不能當同解析度速度比。

正式網址 https://sces5504.github.io/Shikujin/?v=1.5 。公開49個網站檔案經TLS驗證curl下載後，SHA256逐一與.artifacts/site相同，沒有缺檔或舊圖混用。build revision d4de387bb15f。正式網址瀏覽器直連受既有代理CA限制，沿用安全的HTTPS逐檔驗證與CI／本地Chromium，未改全域信任或停用驗證。PR附件工具呼叫逾時，未阻擋GitHub正常整合。

本次工作完成；後續根據真人實機回饋調整低階裝置與平衡，不必重做此輪。保留既有v1存檔相容及四人CG家族；新增角色先遵守最新美術契約。
