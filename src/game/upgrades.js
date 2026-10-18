import { UPGRADES } from "../content/catalog.js";
export function choices(world) {
  let pool = UPGRADES.filter((u) => (world.upgrades[u.id] || 0) < u.max);
  if (world.player.hp > world.player.maxHp * 0.85)
    pool = pool.filter((u) => u.id !== "heal");
  return world.rng.shuffle(pool).slice(0, 3);
}
export function applyUpgrade(w, id) {
  const u = UPGRADES.find((u) => u.id === id);
  if (!u || (w.upgrades[id] || 0) >= u.max) return false;
  const p = w.player;
  w.upgrades[id] = (w.upgrades[id] || 0) + 1;
  const effects = {
    damage: () => (p.damage *= 1.25),
    rate: () => (p.interval /= 1.18),
    multi: () => p.multi++,
    pierce: () => p.pierce++,
    speed: () => (p.speed *= 1.12),
    health: () => {
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    },
    shield: () => {
      p.maxShield += 20;
      p.shield = p.maxShield;
    },
    magnet: () => (p.magnet *= 1.4),
    experience: () => (p.xpFactor += 0.15),
    regen: () => (p.regen += 0.7),
    crit: () => (p.crit += 0.1),
    cooldown: () => (p.cooldownFactor *= 0.88),
    heal: () => (p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4)),
  };
  effects[id]?.();
  return true;
}
