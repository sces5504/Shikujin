// Stable weapon IDs decouple airframes from firing strategies and presentation.
export const WEAPONS = {
  twin: {
    name: "雙翼速射砲",
    en: "TWIN VULCAN",
    description: "雙翼平行直射，穩定集中火力；追加彈道擴展左右翼砲。",
    color: "#9cffff",
  },
  laser: {
    name: "相位貫穿雷射",
    en: "PHASE LANCE",
    description:
      "持續追瞄的長距離雷射，穿透整條航線；武裝擴充增加單束寬度與能量，平滑彎曲鎖定目標。",
    color: "#b8a5ff",
  },
  cannon: {
    name: "震地爆破砲",
    en: "SIEGE CANNON",
    description: "低射速重砲，命中爆破範圍內敵群；穿透升級擴大爆破半徑。",
    color: "#ffcc7d",
  },
  spread: {
    name: "熾翼扇形彈幕",
    en: "SCARLET FAN",
    description: "五向扇形散射，近身火力密集；追加彈道擴展覆蓋角度。",
    color: "#ffb5e8",
  },
  carrier: {
    name: "蜂群僚機編隊",
    en: "SWARM COMMAND",
    description: "兩架護衛僚機交叉射擊，自動追蹤導彈處理遠方目標。",
    color: "#ffe9ab",
  },
};

export const WEAPON_TUNING = {
  twin: { type: "shot", speed: 760, damage: 0.8, spacing: 20 },
  laser: {
    length: 1000,
    width: 9,
    multiWidth: 4,
    pierceWidth: 2,
    damage: 1.3,
    multiDamage: 0.35,
    pierceDamage: 0.12,
    tracking: 7,
    waveAmplitude: 24,
    waveSpeed: 7,
    waveCycles: 2,
  },
  cannon: { type: "shell", speed: 440, damage: 1.7, spacing: 0.08 },
  spread: {
    type: "spread",
    speed: 600,
    damage: 0.62,
    spacing: 0.12,
    // Total fan cap keeps late multi-shot builds focused enough for a vertical stage.
    fan: 0.62,
    baseCount: 4,
  },
  carrier: { type: "escort", speed: 700, damage: 0.7, multiDamage: 0.25 },
};
