import { WEAPON_AUGMENTS, UPGRADE_TAGS } from "../content/builds.js";
import { EVOLUTIONS } from "../content/progression.js";
import { UPGRADES } from "../content/catalog.js";
export function describeUpgrade(w, u) {
  const routes = EVOLUTIONS.filter(
    (e) => e.needs[u.id] && !w.evolutions.includes(e.id),
  );
  const tags = u.tags || UPGRADE_TAGS[u.id] || ["支援"];
  return {
    ...u,
    description: WEAPON_AUGMENTS[w.ship.weapon]?.[u.id] || u.description,
    tags,
    route: routes
      .map(
        (e) =>
          `${e.name}：${Object.entries(e.needs)
            .map(
              ([id, n]) =>
                `${UPGRADES.find((u) => u.id === id)?.name || id} ${Math.min(n, w.upgrades[id] || 0)}/${n}`,
            )
            .join(" ＋ ")}`,
      )
      .join(" · "),
  };
}
export function choices(world, excluded = []) {
  let pool = UPGRADES.filter(
    (u) =>
      !u.limitBreak &&
      !world.banished?.has(u.id) &&
      (world.upgrades[u.id] || 0) < u.max &&
      Object.entries(u.needs || {}).every(
        ([id, n]) => (world.upgrades[id] || 0) >= n,
      ),
  );
  if (world.player.hp > world.player.maxHp * 0.85)
    pool = pool.filter((u) => u.id !== "heal");
  if (pool.length < 3)
    pool.push(
      ...UPGRADES.filter(
        (u) => u.limitBreak && (world.upgrades[u.id] || 0) < u.max,
      ),
    );
  const fresh = pool.filter((u) => !excluded.includes(u.id));
  if (fresh.length >= 3) pool = fresh;
  const shuffled = world.rng.shuffle(pool),
    selected = [];
  // One continuation opportunity, one new tool, and one unrestricted pick.
  for (const predicate of [
    (u) => (world.upgrades[u.id] || 0) > 0,
    (u) => !world.upgrades[u.id],
    () => true,
  ]) {
    const u = shuffled.find((u) => !selected.includes(u) && predicate(u));
    if (u) selected.push(u);
  }
  for (const u of shuffled)
    if (selected.length < 3 && !selected.includes(u)) selected.push(u);
  return selected.map((u) => describeUpgrade(world, u));
}
export function applyUpgrade(w, id) {
  const u = UPGRADES.find((u) => u.id === id);
  if (
    !u ||
    (w.upgrades[id] || 0) >= u.max ||
    !Object.entries(u.needs || {}).every(
      ([key, n]) => (w.upgrades[key] || 0) >= n,
    )
  )
    return false;
  const p = w.player;
  w.upgrades[id] = (w.upgrades[id] || 0) + 1;
  const effects = {
    limitPower: () => (p.damage *= 1.05),
    limitHull: () => {
      p.maxHp += 10;
      p.hp = Math.min(p.maxHp, p.hp + 10);
    },
    limitLink: () => (p.cooldownFactor *= 0.98),
    overclock: () => {
      p.interval /= 1.35;
      p.damage *= 0.88;
    },
    siege: () => {
      p.damage *= 1.5;
      p.interval /= 0.8;
    },
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
