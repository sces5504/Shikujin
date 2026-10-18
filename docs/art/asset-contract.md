# 素材契約 v1

- `assets/pilots.webp`：1536×1024、四等寬直欄、依赤璃／凜／雪羽／澪順序，sRGB、不透明。原始生成圖留在 workspace/generated_images，不放大圖進網站。生成工具於 2026-10-19 產出四位原創成年角色，使用者提供參考氣質，不直接重製附件角色。
- assets/pilots-damaged.webp 同尺寸與排序，戰損為煙灰、凌亂髮型、外套及裝甲損傷。
- assets/bosses.webp：1536×1024、3×2 透明格圖集，前五格依 encounters.js 的 sprite 0–4，右下保留空格。
- CSS 以 `background-size:400% auto`、水平 0/33.333/66.667/100% 顯示單位肖像，直向偏移約18%。PILOTS 以 portrait／defeatPortrait 宣告圖集座標，也支援 columns:1 的獨立新角色圖。
- 程序化飛機與敵人無外部貼圖；Renderer 座標單位為世界像素，中心 pivot。新增 ship shape 應維持同等光影與線條品質。
- 建置將 assets 複製至 dist/assets；所有資源用相對路徑，支援 GitHub Pages repo 子路徑。
- 圖片整體預算 <3 MB；新角色如改獨立立繪須一起修改資料模型與 CSS，不得直接覆蓋四欄排序。
- assets/fonts 包含 Rajdhani 與 Noto Sans TC 本地子集及各自 OFL 授權；加入新中文字時重建子集或用系統 fallback。
