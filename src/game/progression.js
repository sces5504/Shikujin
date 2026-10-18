import { EVOLUTIONS } from "../content/progression.js";
export function applyResearch(world, research = {}) {
  const p = world.player;
  p.damage *= 1 + (research.power || 0) * 0.04;
  p.maxHp += (research.armor || 0) * 8;
  p.hp = p.maxHp;
  p.maxShield += (research.reactor || 0) * 8;
  p.shield = p.maxShield;
  p.xpFactor += (research.learning || 0) * 0.04;
  p.cooldownFactor *= 1 - (research.bond || 0) * 0.03;
  world.rewardFactor *= 1 + (research.recovery || 0) * 0.05;
}
export function checkEvolutions(w) {
  for (const e of EVOLUTIONS) {
    if (
      w.evolutions.includes(e.id) ||
      !Object.entries(e.needs).every(([id, n]) => (w.upgrades[id] || 0) >= n)
    )
      continue;
    w.evolutions.push(e.id);
    if (e.id === "prism") {
      w.player.multi += 2;
      w.player.damage *= 1.3;
    }
    w.blast(w.player.x, w.player.y, 200, w.player.damage * 2, e.color);
    w.events.emit("evolution", e);
  }
}
