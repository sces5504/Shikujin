# 素材契約 v1.5（2.0 更新見文末）

> 2.0（2026-10-25）：六套駕駛員 CG 改用使用者另一專案 `sces5504/20261020` 的透明全身立繪，經使用者明確同意取用（「素材、立繪你也可以從我這個遊戲抓」，且嚴禁修改該專案）。只以唯讀 clone 讀取，從不提交或推送該 repo。`scripts/art/build-portraits.py <20261020 checkout>` 重現全部輸出：半身裁切、駕駛艙 `art/world/bridge.webp` 背景、cosmos 能量背景、戰損煙灰／刮痕程序疊加。對應：赤璃←stellar10 io、凜←standard maiden-02、雪羽←stellar10 titania、澪←standard maiden-04、緋紗←standard maiden-03、朔夜←stellar10 pluto。新增駕駛員為 `pilot-<id>-<kind>.webp` 單欄 384×1024（kind：portrait／radio／burst／ultimate／memory／damaged，radio／burst 透明）。craft.webp 第 6 格填入戰女神（幽影重新上色與拉寬機翼），cache 讀取 6 格。來源素材在原專案標示為待使用者審閱的候選，本專案沿用使用者授權，不另宣稱商用授權審查。

所有圖像為2026-10-19工具生成的原創資產，附件僅作風格／色彩參考。四人CG從同一新版賽璐璐母圖衍生，原始生成檔留workspace/generated_images；網站只放壓縮WebP。

| 資產 | 尺寸／排列 | 使用 |
| --- | --- | --- |
| pilots.webp | 1536×1024，四等寬直欄 | 赤璃／凜／雪羽／澪日常 |
| pilots-damaged.webp | 同上 | 相同角色戰損 |
| pilots-ultimate.webp | 同上 | 大絕完整CG |
| pilots-memory.webp | 同上 | 回憶休息室 |
| pilots-radio.webp | 同上，透明 | 常駐通訊 |
| pilots-burst.webp | 同上，透明 | 大絕cut-in |
| craft.webp | 1536×1024，3×2，最後一格空 | 五架機體 |
| enemycraft.webp | 1536×1024，3×2 | 六類敵人 |
| bosses.webp | 1536×1024，3×2透明，最後一格空 | 五Boss，原版保留 |
| background-0..4.webp | 各1536×1024 | 五章完整地表，按需載入 |

PILOTS以各種portrait欄位宣告asset／column／columns。四欄CSS為400% auto與水平0/33.333/66.667/100%；支援columns:1新增獨立人物，別改既有排序。戰機中心pivot，combat快取100px、預覽420px；新增機體同步render/cache.js圖集座標，無貼圖時保留幾何fallback。

全部assets約7.5MB，背景逐章載入；新增圖像預算維持整包10MB內並檢查手機記憶體。背景縮放surface僅留目前地圖；精靈texture按圖片快取。建置保留相對路徑且加入內容hash，支援Pages子路徑及版本更新。

assets/fonts為Rajdhani／Noto Sans TC本地子集及OFL授權。不能另加第三方字體runtime依賴。

1.6更新六套角色CG，同尺寸與排序、透明alpha契約不變。最終母圖為exec-2097589b：Akari束髮，Mio保留側分披散長髮。敵彈／敵機輪廓由cache.js一次預繪；敵彈texture帶danger標記進前景批次，單批容量2048大於1500敵彈上限。

## 1.7 投射物契約

所有彈體由`content/projectiles.js`定義，cache一次預繪64×64透明貼圖，中心pivot，原圖朝+X；兩種渲染後端都以atan2(vy,vx)旋轉，不能各自重畫不同材質。danger只用於敵彈；明亮核心、深色外緣、少量色彩光暈為共同家族，避免純色矩形。繪製尺寸與碰撞半徑分開，既有玩家7px判定不變。

| ID | 外觀／顏色 | 行為 | 判定半徑 | 敵方傷害倍率 |
| --- | --- | --- | --- | --- |
| shot / escort | 流線曳光／冰藍、金 | 直射 | 4 | 不適用 |
| spread | 熾紅晶葉 | 直射扇面 | 4 | 不適用 |
| shell | 裝甲砲殼／暖橙 | 命中爆破 | 9 | 不適用 |
| missile | 金色彈頭／尾翼 | 追蹤爆破 | 6 | 不適用 |
| enemy | 環形粉色能量核 | 直射 | 5 | 1 |
| needle | 琥珀流線針 | 直射 | 4 | 0.85 |
| petal | 紫色晶葉 | 正弦擺動 | 5 | 1 |
| plasma | 青綠電漿核 | 漸進加速 | 7 | 1.2 |
| heavy | 橘紅重砲殼 | 慢速直射 | 8 | 1.5 |

敵彈基礎傷害為12+wave×0.7，再乘原型與難度；主武器傷害由機體及WEAPON_TUNING決定。普通敵機保留原圖材質，輪廓改暗底／細金屬邊，不再粗粉色包邊。角色CG資產契約沿用1.6。

使用者髮型PDF存在references，結構化查詢、來源與剪影審核規則見hairstyle-library.json；不能將圖鑑中的角色直接當成新增角色。新增設計至少兩個主要輪廓軸與最接近的既有角色不同。使用者已確認Mio披散側分蓬鬆長髮、Akari紅緞帶束髮。

1.8新增star原型為冰藍晶葉，顯示34世界px、判定半徑4，與既有projectile同貼圖及方向契約；沒有新增或重繪CG／Boss圖集。Boss顯示由r×3.85改r×4.6，碰撞半徑不變。命中火花與砲口光為程序化短效果，保持低動態效果設定。
