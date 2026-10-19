# 1.7 構築與彈體打磨

使用者本次十二項任務見spec 1.7及decisions；歷史1.6已完成，不重做。開工/workspace/Shikujin、branch work、HEAD b339632乾淨，遠端origin為sces5504/Shikujin。fetch確認main b664412，安全快轉後開feat/arsenal-buildcraft。沒有覆蓋他人未提交內容。README由使用者管理。

實作：28一般強化＋3極限，5進化、3重抽、前置配件／路線提示；單束彎曲雷射與共同線段碰撞／依武器multi效果；10投射物資料／motion／傷害／預繪GPU與Canvas、細金屬敵機邊；玩家受擊保持可見；24次動態軌道轟擊；普通敵人擴充齊射、5Boss各3motifs且預告喘息保留、半徑820；戰役clear續第一圖wave26，保留構築與差額結算；新標語；髮型PDF／JSON資料庫。所有現有ID及存檔v1保留，CG家族不改。

參考影片限制：YouTube直接讀取失敗；補傳Ikaruga mov超過download_file 32MiB上限，尚未觀看。PDF已實際擷取／檢視，按髮長、瀏海、髮量、束髮、飾品編索引與剪影差異規則，不重新設計既有角色。

環境：read cloud-environment-runtime，連線與網路狀態ready/enforced。沙箱內代理／Chromium socket不可用，require_escalated後正常git fetch與Chromium。未改代理、未停TLS。沿用現有工具lockfile，ignore-scripts安裝格式工具。

驗證進度：新增10項模擬（含2分鐘全構築）、新增桌面手機流程及256項GPU／Canvas實際像素角度檢查。已檢視build-mobile及arsenal桌面／手機畫面。最終release、commit、Actions與公開hash證據待發佈後填入，不能用歷史1.6記錄代替。

後續：完成當前release／build／stage，提交PR並整合，等待Pages與Checks，核對所有公開資源SHA256。維持千彈模擬p95<20ms／readback繪製p95<60ms預算，不減危險彈或碰撞。低階真機、WebKit／Firefox與真人長期構築平衡仍待實機回饋。

## 本機完成驗證

2026-10-19 14:35（Asia/Taipei），b664412之上的本次dirty工作樹：最終release八命令全過98.02秒，20原模擬＋3原feedback＋10新模擬，五套瀏覽器／效能流程。10分鐘既有無盡、2分鐘全構築有界、桌面手機256項實際像素方向、重抽／曲線／可見機身／clear續戰／存檔差額均通過。模板10項與template contracts、diff格式通過。完整release期間僅同步澪技能說明為24次；最終build／stage版本7a8e2b530ad8。

最終千彈本機軟體GPU，自動解析度0.7：240敵／1233彈／749掉落，模擬p95 0.8ms、含readback繪製median27.8／p95 51.4／max69.8ms，GL error0。互動壓測最長task62ms、pool created1458。維持p95原預算，不是全硬體60FPS保證。截圖已檢視升級手機、雷射桌面手機；test-results不作跨環境交付來源。

## 合併前追加影片覆核

使用者在PR #5建立後補傳三支約29MB壓縮mp4（雷電II攻略974.433秒、Ikaruga評論651.567秒、雷電系列531.933秒），已成功下載並擷取／檢視全片間隔接觸表及武器／Boss片段。先前「受上限影響未觀看」只描述大型mov初次失敗，現在改以這三支壓縮檔完成畫面抽樣，沒有宣稱逐秒完整觀看。完整觀察見docs/art/video-reference-notes.md。

雷射追加持續流動的蛇行波形（資料參數振幅24、2波節、相位速度7），兩端包絡穩定且同points碰撞；新增第11項模擬確認鎖定時也會流動、端點不漂移。合併前重跑本版release，最終build與CI數據以下方紀錄為準，7a8e2b530ad8是追加前版本。

影片追加後最終本機release：2026-10-19 14:40（Asia/Taipei），b45462d之上dirty工作樹八命令全過98.55秒、34項邏輯（20＋3＋11）及五套瀏覽器／效能。軟體GPU解析度0.7，模擬p95 0.8ms、繪製含readback median41.5／p95 59.2／max63.1ms，GL error0；240敵／1233彈／749掉落。互動壓測最長task65ms。最終build/stage45780d16ecee。該數據反映本機負載，不是跨硬體效能保證。發布只用.artifacts/site。

PR #5的最終head7155375（Checks39211277781成功）已整合為93d9a47。合併後文字覆核發現萬華稜鏡藍圖仍用舊顯示名「分裂光束」，追加同步成「武裝擴充」；ID與需求不變。此文字修正另建置／stage並由最新main Pages完整release驗證，最終公開版本以下方部署證據為準。
