// Stable archetypes: all weapons use these simulation and presentation contracts.
// Sprites face +X; the renderer rotates by the actual velocity in BOTH backends.
const type = (
  name,
  shape,
  color,
  size,
  radius,
  damage = 1,
  motion = "linear",
) => ({ name, shape, color, core: "#fff9ef", size, radius, damage, motion });
export const PROJECTILES = {
  shot: type("離子曳光彈", "lance", "#78dfff", 32, 4),
  spread: type("熾翼晶彈", "rice", "#ff92bd", 30, 4),
  escort: type("僚機脈衝彈", "lance", "#ffe09b", 30, 4),
  shell: type("高爆穿甲砲", "shell", "#ffbb64", 38, 9),
  missile: type("追星導彈", "missile", "#ffdb91", 34, 6, 1, "homing"),
  enemy: type("環形能量彈", "orb", "#ff6dba", 24, 5),
  needle: type("高速針彈", "lance", "#ffad65", 30, 4, 0.85),
  petal: type("擺動晶彈", "rice", "#b59aff", 28, 5, 1, "weave"),
  plasma: type("加速電漿彈", "orb", "#72e5d6", 30, 7, 1.2, "accelerate"),
  heavy: type("重裝榴彈", "shell", "#ff876c", 34, 8, 1.5),
};
export const projectileType = (id) => PROJECTILES[id] || PROJECTILES.shot;

PROJECTILES.shell.explosion = { radius: 105, pierceRadius: 20, damage: 0.85 };
PROJECTILES.missile.explosion = { radius: 65, warheadRadius: 30, damage: 0.45 };
