// 2.0 run-depth systems: card grades, tag resonance, elites, routes and stage ranks.
// Pure data; game/depth.js applies it and the UI only reads it.
export const GRADES = [
  {
    id: "common",
    name: "普通",
    en: "COMMON",
    levels: 1,
    weight: 70,
    color: "#9fd8e0",
  },
  {
    id: "rare",
    name: "稀有",
    en: "RARE",
    levels: 2,
    weight: 22,
    color: "#6fb6ff",
  },
  {
    id: "epic",
    name: "史詩",
    en: "EPIC",
    levels: 2,
    weight: 7,
    color: "#c58bff",
    heal: 0.3,
    reroll: 1,
  },
  {
    id: "legendary",
    name: "傳說",
    en: "LEGENDARY",
    levels: 3,
    weight: 1,
    color: "#ffc857",
    heal: 1,
    reroll: 1,
  },
];
// Later waves tilt the odds upward; a guaranteed cache roll never offers common cards.
export const GRADE_WAVE_SHIFT = 0.9;
// Thresholds count total upgrade levels carrying the tag.
export const RESONANCE_TIERS = [3, 6];
export const RESONANCE = {
  火力: {
    name: "火力壓制",
    text: ["主砲傷害 +10%", "主砲傷害再 +20%"],
    stat: [
      ["damage", 1.1],
      ["damage", 1.2],
    ],
  },
  高頻: {
    name: "高頻共振",
    text: ["射速 +8%", "射速再 +15%"],
    stat: [
      ["rate", 1.08],
      ["rate", 1.15],
    ],
  },
  彈幕: {
    name: "彈幕風暴",
    text: ["彈道 +1", "彈道再 +1"],
    stat: [
      ["multi", 1],
      ["multi", 1],
    ],
  },
  精準: {
    name: "鷹眼",
    text: ["暴擊率 +8%", "暴擊率再 +12%"],
    stat: [
      ["crit", 0.08],
      ["crit", 0.12],
    ],
  },
  護盾: {
    name: "堡壘",
    text: ["最大護盾 +20", "最大護盾再 +40"],
    stat: [
      ["shield", 20],
      ["shield", 40],
    ],
  },
  生存: {
    name: "不屈",
    text: ["最大生命 +20", "每秒回復 +1"],
    stat: [
      ["health", 20],
      ["regen", 1],
    ],
  },
  技能: {
    name: "神經加速",
    text: ["大絕冷卻 -8%", "大絕冷卻再 -15%"],
    stat: [
      ["cooldown", 0.92],
      ["cooldown", 0.85],
    ],
  },
  爆破: {
    name: "連環爆破",
    text: ["爆炸傷害 +20%", "爆炸傷害再 +25%"],
    stat: [
      ["blast", 1.2],
      ["blast", 1.25],
    ],
  },
};
// Tags without a bespoke bonus still pay out, so every route through the pool matters.
export const RESONANCE_DEFAULT = {
  text: ["主砲傷害 +6%", "主砲傷害再 +10%"],
  stat: [
    ["damage", 1.06],
    ["damage", 1.1],
  ],
};
export const ELITE_AFFIXES = {
  armored: { name: "重裝", color: "#ffd27a", damageTaken: 0.55 },
  swift: { name: "迅捷", color: "#8ff7ff", speed: 1.55 },
  volley: { name: "齊射", color: "#ff8fb0", fireRate: 2 },
  splitter: { name: "分裂", color: "#c8a2ff", deathRing: 12 },
};
export const ELITE = {
  fromWave: 3,
  chance: 0.16,
  perWave: 0.012,
  maxChance: 0.45,
  hp: 4,
  size: 1.25,
  score: 5,
  xp: 3,
};
export const CARRIER = { fromWave: 2, at: 9, medals: 4 };
export const ROUTES = [
  {
    id: "standard",
    name: "標準航線",
    icon: "➤",
    description: "照預定航道前進，沒有額外風險。",
  },
  {
    id: "hazard",
    name: "高危空域",
    icon: "☠",
    description:
      "敵機生命 +30%、傷害 +20%；分數與經驗 ×1.5，擊破首領額外 +150 信用點。",
    enemyHp: 1.3,
    enemyDamage: 1.2,
    gain: 1.5,
    credits: 150,
  },
  {
    id: "nest",
    name: "精英巢穴",
    icon: "♛",
    description:
      "精英敵機出現率 ×2.5。精英擊破必掉強化晶片，構築成長更快，但更危險。",
    eliteMul: 2.5,
  },
  {
    id: "convoy",
    name: "補給航線",
    icon: "⛟",
    description: "每波出現兩艘補給運輸艦，但敵機子彈速度 +15%。",
    carriers: 2,
    bulletSpeed: 1.15,
  },
];
// Ranked on hull hits taken during the sector; medals keep the chain flowing toward S.
export const RANKS = [
  { id: "S", maxHits: 0, credits: 160, score: 5000, color: "#ffd56b" },
  { id: "A", maxHits: 2, credits: 100, score: 3000, color: "#9dfcff" },
  { id: "B", maxHits: 5, credits: 60, score: 1500, color: "#8dffb0" },
  { id: "C", maxHits: 9, credits: 25, score: 600, color: "#c9d6e0" },
  { id: "D", maxHits: Infinity, credits: 0, score: 0, color: "#ff8fa0" },
];
