// Vertical scrolling stage. World units; the renderer fits this column to the viewport.
export const STAGE = {
  width: 720,
  height: 1200,
  margin: 28,
  playerStart: 430,
  scroll: 90,
  bossScroll: 28,
  // Flying above this line pulls every drop to the ship (risk/reward like arcade item lines).
  collectLine: -330,
  despawn: 140,
};
export const BOUNDS = {
  left: -STAGE.width / 2,
  right: STAGE.width / 2,
  top: -STAGE.height / 2,
  bottom: STAGE.height / 2,
};
export const onStage = (x, y, pad = 0) =>
  x > BOUNDS.left - pad &&
  x < BOUNDS.right + pad &&
  y > BOUNDS.top - pad &&
  y < BOUNDS.bottom + pad;
// Squadron rewards rotate so a cleanly destroyed formation always pays out something visible.
export const ITEMS = {
  medal: { label: "★", color: "#ffd56b", name: "勳章" },
  power: { label: "P", color: "#ff6f8c", name: "火力全開" },
  bomb: { label: "B", color: "#7fe8ff", name: "大絕充能" },
  repair: { label: "+", color: "#8dffb0", name: "裝甲修復" },
  cache: { label: "◆", color: "#d59bff", name: "強化晶片" },
};
export const SQUAD_REWARDS = [
  "medal",
  "power",
  "medal",
  "bomb",
  "medal",
  "repair",
];
export const MEDAL_BASE = 100;
export const MEDAL_CHAIN_MAX = 10;
