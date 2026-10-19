# 1.8 手機操作與Boss／構築回饋

來源：使用者本次四項小修。開工/workspace/Shikujin、main1e795ae乾淨，origin sces5504/Shikujin；fetch／ff確認遠端無新差異，分支fix/mobile-combat-impact。沿用授權，不改README。讀AGENTS、memory／1.7交接、規格／架構／美術契約，保留人物與ID。

實作：獨立pointerdown技能按鈕、保留鍵盤／輔助click且防雙觸發；戰場／HUD手勢none、頁面manipulation、選字封鎖但欄位可複製；靜態Boss各章HP15200/25000/37200/51800/72000，顯示約+19.5%與動力光；新增環星／折光／閃避齊射／破盾反擊／低溫碎裂，新增流星火網／不屈壁壘（33一般＋3極限、7進化）；共用star晶彈、砲口光及有界命中火花。無新runtime依賴。

flygame.mp4138.507秒已成功下載並每8秒擷取接觸表檢視，參考放射彈、分岔光束與連鎖節奏；非逐秒完整觀看，選單小字不清不臆造。前次三影片抽樣見video-reference-notes，沒有重製原遊戲美術。

Boss probe基準10組：wave5 build damage2/rate1/multi1/missile1；wave25 damage6/rate5/multi4/missile4/pierce3/drone3/pulse3/arc3/burn3，Mio、seed8、無敵站樁、Boss放(0,-280)、停生成，技能可用即施放。原首關1.6–4.1秒、末關1.0–3.8秒；新首關隼式38.8／幽影51.4／重岳15.1／熾翼57.6／神諭30.6秒，末關11.2–79.9秒。不是所有玩家構築固定TTK；無鎖血／動態調血／傷害上限，強構築仍可更快。

驗證已過：新四模擬、CDP原生多指維持移動＋即時大絕／閃避、不重複click、雙擊／捏合viewport固定、字詞選取策略；手機截圖已檢視。完整release進行中，最終結果、版本、PR／Actions／公開hash待完成填入。部署只用stage.artifacts/site，千彈與新構築壓測預算不放寬、不刪危險彈或停碰撞。後續以最終段落為準，不把1.7歷史測試當本次證明。

壓測補強：--builds延長自然模擬至4秒，統計暖身後全段，覆蓋多次星環／折光與短期電弧；保留240敵，只將與玩家完全重疊的少量fixture目標放至140m，避免星彈發射當幀即全數命中而無法量到繪製。另斷言確有可見星彈與光線；修正後maxArcs12／maxStars24、同場1241彈，原預算通過。此為壓測fixture，未改遊戲生成或刪除敵機／敵彈。

GPU火花／砲口光增加overlay預繪批次，確保在機體上方、危險彈下方；Canvas保持原有繪製。修改後重跑最終release，以下方最終紀錄為準。

## 本機最終驗證

2026-10-19 15:38（Asia/Taipei），1e795ae之上本次dirty工作樹，完整release11命令全過113.98秒；38項邏輯（20+3+11+4）、七個瀏覽器／效能流程，288方向像素、原生多指／無重複／手勢與既有存檔／GPU恢復／續戰均過。其後補驗取消觸控及textarea仍可選取複製，目標mobile-impact-browser再次通過。模板10項、diff檢查通過。手機最終圖已檢視（Boss、星環、光束與可見機體／命中火花）。最終build/stage **9405c712a49a**。

本機軟體GPU、自動解析度0.7：原壓測240敵／1233彈／749掉落，模擬p95 1.0ms、含readback繪製p95 49.0ms；新增全構築240敵／1241彈／749掉落，maxArcs12/maxStars24，模擬p95 1.6ms、繪製median30.7/p95 56.8/max70.0ms，GL error0。最長互動task81ms。回歸預算未放寬；非跨硬體60FPS承諾。
