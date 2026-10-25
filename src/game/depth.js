import {
  GRADES,
  GRADE_WAVE_SHIFT,
  RESONANCE,
  RESONANCE_DEFAULT,
  RESONANCE_TIERS,
  ELITE,
  ELITE_AFFIXES,
  ROUTES,
  RANKS,
} from "../content/depth.js";
import { UPGRADE_TAGS } from "../content/builds.js";
import { UPGRADES } from "../content/catalog.js";
export const route = (w) => ROUTES.find((r) => r.id === w.routeId) || ROUTES[0];
// Odds climb with the wave; caches (elite / carrier drops) never roll common.
export function gradeWeights(w, guaranteed = false) {
  const k = w.wave * GRADE_WAVE_SHIFT;
  return [
    guaranteed ? 0 : Math.max(25, 70 - k * 2),
    22 + k,
    7 + k * 0.55,
    1 + k * 0.13,
  ];
}
export function rollGrade(w, guaranteed = false) {
  const weights = gradeWeights(w, guaranteed),
    total = weights.reduce((a, b) => a + b, 0);
  let roll = w.rng.next() * total;
  for (let i = 0; i < GRADES.length; i++) {
    roll -= weights[i];
    if (roll < 0) return GRADES[i];
  }
  return GRADES[GRADES.length - 1];
}
export const upgradeTags = (u) => u?.tags || UPGRADE_TAGS[u?.id] || ["支援"];
export function tagLevels(w) {
  const levels = {};
  for (const [id, n] of Object.entries(w.upgrades)) {
    const u = UPGRADES.find((u) => u.id === id);
    for (const tag of upgradeTags(u)) levels[tag] = (levels[tag] || 0) + n;
  }
  return levels;
}
export const resonanceOf = (tag) =>
  RESONANCE[tag] || { name: `${tag}共鳴`, ...RESONANCE_DEFAULT };
function applyStat(w, [kind, v]) {
  const p = w.player;
  if (kind === "damage") p.damage *= v;
  else if (kind === "rate") p.interval /= v;
  else if (kind === "multi") p.multi += v;
  else if (kind === "crit") p.crit += v;
  else if (kind === "shield") {
    p.maxShield += v;
    p.shield = p.maxShield;
  } else if (kind === "health") {
    p.maxHp += v;
    p.hp += v;
  } else if (kind === "regen") p.regen += v;
  else if (kind === "cooldown") p.cooldownFactor *= v;
  else if (kind === "blast") p.blastMul = (p.blastMul || 1) * v;
}
// Crossing a tier applies its bonus exactly once; tiers never revoke.
export function updateResonance(w) {
  const levels = tagLevels(w),
    gained = [];
  for (const [tag, n] of Object.entries(levels)) {
    const have = w.resonance[tag] || 0;
    let tier = have;
    while (tier < RESONANCE_TIERS.length && n >= RESONANCE_TIERS[tier]) {
      applyStat(w, resonanceOf(tag).stat[tier]);
      tier++;
    }
    if (tier > have) {
      w.resonance[tag] = tier;
      gained.push({ tag, tier, ...resonanceOf(tag) });
    }
  }
  for (const g of gained) w.events.emit("resonance", g);
  return gained;
}
export function eliteChance(w) {
  if (w.wave < ELITE.fromWave) return 0;
  return Math.min(
    ELITE.maxChance * (route(w).eliteMul || 1),
    (ELITE.chance + w.wave * ELITE.perWave) * (route(w).eliteMul || 1),
  );
}
export function makeElite(
  w,
  e,
  affix = w.rng.pick(Object.keys(ELITE_AFFIXES)),
) {
  const def = ELITE_AFFIXES[affix];
  e.elite = affix;
  e.eliteColor = def.color;
  e.eliteName = def.name;
  e.hp = e.maxHp = e.maxHp * ELITE.hp;
  e.r *= ELITE.size;
  e.score *= ELITE.score;
  e.xp *= ELITE.xp;
  if (def.speed) e.speed *= def.speed;
  if (def.fireRate) e.fireRate = def.fireRate;
  return e;
}
// Sector rank from hull hits; pays credits and score at the boss kill.
export function rankSector(w) {
  const hits = w.sector.hits,
    rank = RANKS.find((r) => hits <= r.maxHits);
  w.bonusCredits += rank.credits;
  w.score += rank.score;
  const r = route(w);
  if (r.credits) w.bonusCredits += r.credits;
  const record = {
    rank: rank.id,
    color: rank.color,
    hits,
    kills: w.kills - w.sector.kills,
    medals: w.medals - w.sector.medals,
    time: w.time - w.sector.start,
    credits: rank.credits + (r.credits || 0),
    score: rank.score,
  };
  w.ranks.push(record);
  w.events.emit("rank", record);
  return record;
}
export function resetSector(w) {
  w.sector = { hits: 0, start: w.time, kills: w.kills, medals: w.medals };
}
