import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/game/world.js";
import { spawnSquad, spawnCarrier } from "../../src/game/formations.js";
import {
  rollGrade,
  gradeWeights,
  updateResonance,
  makeElite,
  eliteChance,
  tagLevels,
} from "../../src/game/depth.js";
import { RANKS, ELITE, ELITE_AFFIXES } from "../../src/content/depth.js";
import { STAGE, BOUNDS } from "../../src/content/stage.js";
const quiet = (seed = 9) => {
  const w = new World({ seed });
  w.spawnTimer = 1e6;
  w.waveTime = -1e6;
  w.debugInvincible = true;
  return w;
};
test("grades scale with wave, caches never roll common and grade levels respect caps", () => {
  const w = quiet();
  assert.ok(gradeWeights(w)[0] > gradeWeights({ wave: 25 })[0]);
  for (let i = 0; i < 200; i++)
    assert.notEqual(rollGrade(w, true).id, "common");
  w.queueUpgrade(true);
  assert.ok(w.options.every((u) => u.grade && u.grade.id !== "common"));
  const option = w.options[0];
  option.grade = { id: "legendary", levels: 3, heal: 1, reroll: 1 };
  w.player.hp = 1;
  const rerolls = w.rerolls;
  assert.ok(w.choose(option.id));
  assert.equal(w.upgrades[option.id], Math.min(option.max, 3));
  assert.equal(w.player.hp, w.player.maxHp);
  assert.equal(w.rerolls, rerolls + 1);
});
test("resonance tiers apply exactly once when tag levels cross 3 and 6", () => {
  const w = quiet();
  const damage = w.player.damage;
  w.upgrades = { damage: 3 };
  assert.equal(tagLevels(w).火力, 3);
  assert.equal(updateResonance(w).length, 1);
  assert.ok(Math.abs(w.player.damage - damage * 1.1) < 1e-9);
  assert.equal(updateResonance(w).length, 0);
  w.upgrades.damage = 6;
  updateResonance(w);
  assert.equal(w.resonance.火力, 2);
  assert.ok(Math.abs(w.player.damage - damage * 1.1 * 1.2) < 1e-9);
});
test("banish removes a card for the rest of the run and refills only that slot", () => {
  const w = quiet();
  w.queueUpgrade();
  const [gone, ...kept] = w.options.map((u) => u.id);
  assert.ok(w.banish(gone));
  assert.equal(w.options.length, 3);
  assert.ok(!w.options.some((u) => u.id === gone));
  assert.deepEqual(
    w.options.slice(1).map((u) => u.id),
    kept,
  );
  for (let i = 0; i < 30; i++) {
    w.reroll() || (w.rerolls = 3);
    assert.ok(!w.options.some((u) => u.id === gone));
  }
  w.banish(w.options[0].id);
  assert.equal(w.banish(w.options[0].id), false);
});
test("elites gain affixes, toughness and drop a guaranteed cache that opens a graded pick", () => {
  const w = quiet();
  w.wave = 1;
  assert.equal(eliteChance(w), 0);
  w.wave = 10;
  assert.ok(eliteChance(w) > ELITE.chance);
  const [e] = spawnSquad(w, "striker");
  Object.assign(e, { x: 0, y: -200 });
  const hp = e.maxHp;
  makeElite(w, e, "armored");
  assert.equal(e.maxHp, hp * ELITE.hp);
  const before = e.hp;
  w.hit(e, 100);
  assert.ok(
    Math.abs(before - e.hp - 100 * ELITE_AFFIXES.armored.damageTaken) < 1e-9,
  );
  w.hit(e, 1e9);
  const cache = w.drops.find((d) => d.item === "cache");
  assert.ok(cache);
  w.player.x = cache.x;
  w.player.y = cache.y;
  w.step(1 / 60);
  w.step(1 / 60);
  assert.equal(w.state, "playing");
  assert.ok(w.upgradeGuaranteed && w.options.length === 3);
});
test("supply carrier crosses once per wave, pays out when shot and escapes otherwise", () => {
  const w = new World({ seed: 4 });
  w.debugInvincible = true;
  w.spawnTimer = 1e6;
  w.wave = 2;
  w.waveTime = 9;
  w.step(1 / 60);
  const carriers = w.enemies.filter((e) => e.kind === "carrier");
  assert.equal(carriers.length, 1);
  w.step(1 / 60);
  assert.equal(w.enemies.filter((e) => e.kind === "carrier").length, 1);
  w.hit(carriers[0], 1e9);
  assert.ok(w.drops.some((d) => d.item === "cache"));
  assert.ok(w.drops.filter((d) => d.item === "medal").length >= 4);
  const runaway = spawnCarrier(w);
  runaway.x = BOUNDS.right + STAGE.despawn * 3 + 1;
  w.step(1 / 60);
  assert.ok(!w.enemies.includes(runaway));
});
test("routes change risk and reward; sector rank pays out on the boss kill and resets", () => {
  const w = quiet();
  w.state = "intermission";
  assert.ok(w.supply("repair", "hazard"));
  const e = w.spawn("scout");
  const plain = new World().spawn("scout");
  assert.ok(e.maxHp > plain.maxHp * 1.25);
  w.player.shield = 0;
  w.player.invuln = 0;
  w.debugInvincible = false;
  const hp = w.player.hp;
  w.hurt(10);
  assert.ok(hp - w.player.hp > 10 * w.difficulty.damage * 1.19);
  w.debugInvincible = true;
  const credits = w.bonusCredits;
  const boss = w.spawn("boss");
  w.hit(boss, 1e12);
  const rank = w.ranks.at(-1);
  assert.equal(rank.hits, 1);
  assert.equal(rank.rank, RANKS.find((r) => 1 <= r.maxHits).id);
  assert.equal(w.bonusCredits - credits, rank.credits);
  assert.ok(rank.credits >= 150);
  w.state = "intermission";
  w.supply("salvage");
  assert.equal(w.sector.hits, 0);
  assert.equal(w.routeId, "standard");
});
test("picks queue without pausing combat and advance one at a time", () => {
  const w = quiet();
  w.xp = w.nextXp * 4;
  w.step(1 / 60);
  assert.equal(w.state, "playing");
  assert.ok(w.pendingPicks >= 2);
  const time = w.time;
  w.step(1 / 60);
  assert.ok(w.time > time);
  const pending = w.pendingPicks;
  assert.ok(w.choose(w.options[0].id));
  assert.equal(w.pendingPicks, pending - 1);
  while (w.options.length) w.choose(w.options[0].id);
  assert.equal(w.pendingPicks, 0);
  assert.equal(w.choose("damage"), false);
});
