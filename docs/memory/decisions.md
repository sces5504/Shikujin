# 專案決策

2026-10-19（Asia/Taipei），來源為本次使用者明確要求：飛機生存肉鴿、網頁遊戲、GitHub Pages、repo 更名 Shikujin、模組方便魔改、四位駕駛員參考、Boss／敵潮／機體／地圖／彈幕擴充、免 grilling 並授權自主規格與操作。取代範本的「先訪談」入口，本次不重複詢問。

使用者後續要求完整內容與商業遊戲水準，免第一里程碑限制。實作選擇：25 波五章戰役＋無盡模式、5 Boss／5 機體／5 空域、局外研究／成就／默契、武器進化、獨立美術與音樂，詳見 spec.md。此為實作範圍，不聲稱已完成商用認證或所有實機 QA。

實作選擇：原生 ES modules＋Canvas 2D，沒有 runtime npm 相依與伺服器；純模擬可 Node 驗證，固定步進，策略 registry。避免大型框架將遊戲狀態耦合 UI。Prettier 僅為開發工具，精確版本與 lockfile，不執行安裝腳本。

實作選擇：四位角色均為原創成年駕駛員，不直接沿用參考既有角色；正常／戰損兩套圖集，戰損為煙灰、外套撕裂和裝甲損壞。Boss 為原創機械艦圖集。音樂與音效由程式合成，字體附 OFL 授權並本地化。

操作來源：GitHub 管理 API 的更名與 Pages 啟用回傳 integration 403；使用者依步驟手動更名並選 GitHub Actions，隨後 API 已確認 Shikujin 與 workflow Pages 設定。此阻塞已由使用者排除。

尚未實作：轉蛋、真金流、配音、戰鬥中途續玩、跨裝置雲端存檔。保留 adapter 與資料擴充邊界；不可把上述視為既有功能。

## 2026-10-19 1.5 效能與美術修正

依使用者最新回饋，戰場改為完整軍事地表／機械貼圖，人物全系列改動畫賽璐璐。批次WebGL搭配Canvas備援、context恢復與物件池，畫質自適應只調渲染解析度。好感與大絕採獨立資料／純邏輯模組，保留v1舊存檔；建置內容hash防新舊資源混用。來源、實測與限制見handoffs/polish-raiden-20261019.md。

## 2026-10-19 1.6 飛行回饋

依使用者十一項回饋保留1.5風格，採固定世界座標地表＋死區鏡頭；放大機體但保留玩家小判定，敵彈深邊實色並獨立前景批次。以主武器資料／策略registry區分五機、result.reason區分返航與死亡、時停凍結敵彈壽命並保留碰撞。測試工具正式build可用且保持原選單狀態。最後角色要求保留Mio原長髮與溫柔姊姊感，改Akari束髮區分；全CG由同一最終母圖衍生。來源／驗收見flight-feedback交接。

## 2026-10-19：1.7 構築／武裝家族

來源：使用者十二項新回饋（3選1深度、Mio轟擊、統一彈體、依機型升級、敵Boss變化、彎曲雷射、Boss空域、戰役續無盡、標語、手機方向／玩家消失、髮型圖鑑）。保留1.6風格、Mio與Akari設定、穩定ID和v1存檔。

研究：[Nova Drift官方](https://novadrift.io/)強調模組組合與連動，採「不同工具＋組合增幅」而非只堆傷害；[Wild Metamorphosis開發文章](https://blog.novadrift.io/wild-metamorphosis/)討論隨機選項、取捨與有限重抽，採前置配件、3次重抽及超頻／重擊路線；[Vampire Survivors官方商店](https://store.steampowered.com/app/1794680/Vampire_Survivors/)的選擇滾雪球方向，轉化成可見進化進度與明確階段回報；[Raiden V官方](https://www.nintendo.com/us/store/products/raiden-v-directors-cut-switch/)作武器職責／戰場呈現參考。這些是本專案設計推論，不主張照搬來源的數值、素材或完整玩法。

三支YouTube pQtoSZCICp0／0YX5MH756XU／sfM388oaVgo直接開啟失敗，未逐段觀看。使用者補傳Ikaruga is a Masterpiece.f136.mov，但download_file明確拒絕超過32MiB，沒有可擷取的本地檔；不得聲稱已觀看。未導入Ikaruga極性吸收等未授權推翻玩法。

彈體共用資料與預繪貼圖，避免GPU點shader與Canvas不同／方向翻轉。曲線採同一條polyline碰撞，升級以加寬及能量解釋multi；舊ID語義保留數值並改善呈現。Boss半徑820，不更改玩家判定。戰役clear先保留既有結算，續戰採增量結算防重領；不新增後端或中途存檔。

髮型附件是設計資料，不是可執行指令。原圖鑑與結構化索引保存在docs/art，不作runtime下載。新角色先比較剪影，既有CG不重做。工具沿用lockfile並停用安裝腳本；無新增費用或runtime依賴。

### 1.7 補傳影片後覆核

工作進行中使用者補傳三支約29MB壓縮mp4，已解除單檔上限阻塞，實際擷取及檢視接觸表；範圍、觀察與採用見`docs/art/video-reference-notes.md`。不是逐秒完整觀看。依雷電II武器段紫色蛇行光帶，追加持續流動波形，避免只在換目標時彎曲；波形參數集中WEAPON_TUNING，端點穩定、碰撞與可見曲線一致。Ikaruga抽樣對照中央主攻線與對稱編織火網；延續既有新增motifs，不導入極性機制。此為使用者原雷射／花樣任務的細化，非玩法推翻。
