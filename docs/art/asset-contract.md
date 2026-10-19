# 素材契約 v1.5

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
