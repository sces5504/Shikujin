import { MAPS, RULES } from "../content/catalog.js";
import { applyUpgrade, choices } from "./upgrades.js";
import { checkEvolutions } from "./progression.js";
import { XP_CURVE } from "../content/depth.js";
export function testLevels(w, count) {
  if (!w || w.state === "defeat") return false;
  count = Math.max(1, Math.min(20, Math.floor(count) || 1));
  count = Math.min(count, 999 - w.level);
  if (count <= 0) return false;
  w.testing = true;
  for (let i = 0; i < count; i++) {
    w.level++;
    w.nextXp = Math.floor(w.nextXp * XP_CURVE.mul + XP_CURVE.add);
    const option = choices(w).find((u) => u.id !== "heal");
    if (option) applyUpgrade(w, option.id);
  }
  checkEvolutions(w);
  return true;
}
export function testWave(w, value) {
  if (!w || w.state === "defeat" || !Number.isFinite(value)) return false;
  w.testing = true;
  w.wave = Math.max(1, Math.min(999, Math.floor(value)));
  w.mapIndex = Math.floor((w.wave - 1) / RULES.bossEvery) % MAPS.length;
  w.map = MAPS[w.mapIndex];
  w.waveTime = 0;
  w.spawnTimer = 0.8;
  w.enemies.length = 0;
  w.resetProjectiles();
  w.drops.length = 0;
  w.strikes.length = 0;
  w.beams.length = 0;
  w.ultimate = null;
  w.stasis = 0;
  if (w.wave % RULES.bossEvery === 0) w.spawn("boss");
  return true;
}
