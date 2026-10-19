export const ORBITAL_BARRAGE = {
  duration: 8,
  count: 24,
  interval: 0.28,
  warning: 0.48,
  radius: 185,
  damage: 6,
};
// Enemy loadouts refer to shared archetypes, never renderer-specific constants.
export const ENEMY_LOADOUTS = {
  scout: "needle",
  striker: "needle",
  orbiter: "petal",
  tank: "heavy",
  charger: "plasma",
  healer: "plasma",
};
export const BOSS_LOADOUTS = {
  arbiter: { projectile: "petal", motifs: ["spiral", "curtain", "pincer"] },
  phoenix: { projectile: "needle", motifs: ["fan", "pincer", "curtain"] },
  leviathan: { projectile: "petal", motifs: ["flower", "braid", "pincer"] },
  oracle: { projectile: "plasma", motifs: ["cross", "curtain", "braid"] },
  eclipse: { projectile: "heavy", motifs: ["eclipse", "braid", "curtain"] },
};

export const BUILD_COMBAT = {
  starSpeed: 480,
  starInterval: 2.4,
  refractionInterval: 2.8,
};
