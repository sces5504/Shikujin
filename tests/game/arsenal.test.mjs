import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/game/world.js";
import {
  applyUpgrade,
  choices,
  describeUpgrade,
} from "../../src/game/upgrades.js";
import { UPGRADES } from "../../src/content/catalog.js";
import { PROJECTILES } from "../../src/content/projectiles.js";
import { weaponHit, updateBuilds } from "../../src/game/builds.js";
import { updateUltimates } from "../../src/game/ultimates.js";
import { fireMainWeapon } from "../../src/game/weapons.js";
import { bossPatterns, updateBoss } from "../../src/game/boss-patterns.js";
import { checkEvolutions } from "../../src/game/progression.js";
import { SaveStore } from "../../src/core/storage.js";
const target = (w, x = 200, y = 0) => {
  const e = w.spawn("tank");
  Object.assign(e, { x, y, hp: 1e8, maxHp: 1e8, speed: 0 });
  return e;
};
test("upgrade pool has gated paths, distinct rerolls and continuation opportunities", () => {
  const w = new World({ seed: 31 });
  assert.ok(UPGRADES.length >= 28);
  assert.ok(!choices(w).some((u) => u.id === "capacitor"));
  assert.equal(applyUpgrade(w, "capacitor"), false);
  applyUpgrade(w, "pulse");
  assert.ok(applyUpgrade(w, "capacitor"));
  w.queueUpgrade();
  const before = w.options.map((u) => u.id);
  assert.ok(w.reroll());
  assert.ok(w.options.every((u) => !before.includes(u.id)));
  assert.equal(w.rerolls, 2);
  w.reroll();
  w.reroll();
  assert.equal(w.reroll(), false);
  assert.equal(w.rerolls, 0);
  const opts = choices(w);
  assert.equal(new Set(opts.map((u) => u.id)).size, 3);
  assert.ok(opts.some((u) => w.upgrades[u.id]));
  assert.ok(opts.every((u) => u.tags.length));
});
test("laser remains a single wider ribbon, follows curves and collides along rendered path", () => {
  const w = new World({ ship: "wraith" }),
    e = target(w),
    e2 = target(w, 300);
  w.player.angle = 0;
  fireMainWeapon(w, e, 1 / 60);
  const narrow = w.beams[0].width;
  assert.ok(e2.hp < e2.maxHp);
  applyUpgrade(w, "multi");
  w.player.angle = Math.PI / 2;
  e.x = 0;
  e.y = 300;
  fireMainWeapon(w, e, 1 / 60);
  assert.equal(w.beams.length, 1);
  assert.ok(w.beams[0].width > narrow);
  const points = w.beams[0].points;
  assert.ok(points.some((p) => p.x > 10 && p.y > 10));
  const on = target(w, points[10].x, points[10].y),
    off = target(w, -300, -300);
  const previous = on.hp;
  fireMainWeapon(w, e, 1 / 60);
  assert.ok(on.hp < previous);
  assert.equal(off.hp, off.maxHp);
  assert.match(
    describeUpgrade(
      w,
      UPGRADES.find((u) => u.id === "multi"),
    ).description,
    /同一束/,
  );
});
test("archetypes own collision radius, damage and motion; pooled reuse resets type", () => {
  const w = new World(),
    e = target(w);
  for (const [id, def] of Object.entries(PROJECTILES)) {
    const b = w.enemyBullet(e, 0, 100, id);
    assert.equal(b.r, def.radius);
    assert.equal(b.damage, (12 + w.wave * 0.7) * def.damage);
  }
  w.resetProjectiles();
  const b = w.playerBullet(0, 0, 0, 100, 10, 0, "shot");
  assert.equal(b.type, "shot");
  assert.equal(b.age, 0);
  const petal = w.enemyBullet(e, 0, 100, "petal"),
    plasma = w.enemyBullet(e, 0, 100, "plasma");
  w.spawnTimer = 1e6;
  w.player.fire = 1e6;
  w.step(0.05);
  assert.ok(Math.abs(petal.vy) > 0);
  assert.ok(plasma.vx > 100);
});
test("secondary builds damage, slow, chain, mine and evolve without recursive hits", () => {
  const w = new World(),
    a = target(w, 120),
    b = target(w, 240),
    c = target(w, 360);
  w.upgrades = { arc: 3, burn: 3, frost: 3, mines: 3, rate: 3 };
  weaponHit(w, a, 10);
  assert.ok(a.burnUntil > w.time);
  assert.ok(a.chillUntil > w.time);
  updateBuilds(w, 0.1, a);
  assert.ok(b.hp < b.maxHp);
  assert.ok(c.hp < c.maxHp);
  assert.ok(w.arcEffects.length <= 5);
  checkEvolutions(w);
  assert.ok(w.evolutions.includes("thermal"));
  assert.ok(w.evolutions.includes("tempest"));
  const old = a.hp;
  w.mines = [{ x: a.x, y: a.y, life: 2, arm: 0 }];
  updateBuilds(w, 0.1, a);
  assert.ok(a.hp < old - 10);
  assert.equal(w.mines.length, 0);
});
test("pulse reaches practical range and capacitor shortens its cooldown", () => {
  const w = new World();
  w.spawnTimer = 1e6;
  w.player.fire = 1e6;
  w.upgrades = { pulse: 1, capacitor: 2 };
  const e = target(w, 400);
  w.step(1 / 60);
  assert.ok(e.hp < e.maxHp);
  assert.ok(w.pulseTimer < 3.2);
});
test("orbital barrage schedules and detonates all 24 strikes against moving targets", () => {
  const w = new World({ pilot: "mio" }),
    e = target(w);
  w.skill();
  let detonations = 0;
  const blast = w.blast.bind(w);
  w.blast = (...args) => {
    detonations++;
    blast(...args);
  };
  for (let i = 0; i < 510; i++) {
    e.x += 0.2;
    updateUltimates(w, 1 / 60);
    assert.ok(w.strikes.length <= 3);
  }
  assert.equal(detonations, 24);
  assert.equal(w.strikes.length, 0);
  assert.equal(w.ultimate, null);
});
test("each boss rotates three distinct motifs and retains telegraph/rest windows", () => {
  const w = new World();
  for (let i = 0; i < 5; i++) {
    w.mapIndex = i;
    const e = w.spawn("boss");
    assert.equal(new Set(e.motifs).size, 3);
    for (let n = 0; n < 3; n++) {
      w.resetProjectiles();
      e.age = n * 8 + 2;
      e.fire = 0;
      updateBoss(w, e, 1 / 60);
      assert.ok(w.bullets.length > 0);
      assert.ok(w.bullets.every((b) => PROJECTILES[b.type]));
    }
    w.resetProjectiles();
    e.age = 24.1;
    e.fire = 0;
    updateBoss(w, e, 1 / 60);
    assert.equal(w.bullets.length, 0);
    e.age = 30.5;
    updateBoss(w, e, 1 / 60);
    assert.equal(w.bullets.length, 0);
    assert.ok(w.bossArena.r > 700);
  }
});
test("campaign continuation retains build, starts map one wave 26 and settles only new earnings", () => {
  const w = new World();
  w.wave = 25;
  w.kills = 100;
  w.bossKills = 5;
  w.score = 5000;
  applyUpgrade(w, "arc");
  w.finish(true);
  const first = { ...w.result };
  const store = new SaveStore({ getItem: () => null, setItem: () => {} });
  store.settle(first);
  assert.ok(w.continueEndless());
  assert.equal(w.wave, 26);
  assert.equal(w.mapIndex, 0);
  assert.equal(w.upgrades.arc, 1);
  assert.equal(w.continueEndless(), false);
  w.supply("repair");
  assert.equal(w.state, "playing");
  const scaled = w.spawn("scout");
  assert.ok(scaled.maxHp > 23 * 4);
  w.kills += 7;
  w.bossKills++;
  w.score += 1000;
  w.finish(false, "retreat");
  const end = w.result;
  assert.equal(end.kills, 7);
  assert.equal(end.bossKills, 1);
  assert.ok(end.reward >= 0);
  store.settle(end);
  assert.equal(store.data.runs, 1);
  assert.equal(store.data.totalKills, 107);
  assert.equal(store.data.bossKills, 6);
  assert.equal(store.data.clears, 1);
  assert.equal(store.data.credits, first.reward + end.reward);
});

test("exhausted upgrade pool still offers three limit-break choices in endless runs", () => {
  const w = new World({ mode: "endless" });
  for (const u of UPGRADES) if (!u.limitBreak) w.upgrades[u.id] = u.max;
  w.queueUpgrade();
  assert.equal(w.options.length, 3);
  assert.ok(w.options.every((u) => u.limitBreak));
  const damage = w.player.damage;
  assert.ok(w.choose("limitPower"));
  assert.ok(w.player.damage > damage);
});
test("two-minute combined build simulation keeps mines, arcs and projectiles bounded", () => {
  const w = new World({ mode: "endless", ship: "wraith", seed: 97 });
  w.debugInvincible = true;
  w.spawnTimer = 1e6;
  w.waveTime = -1e6;
  w.upgrades = {
    arc: 5,
    burn: 4,
    frost: 4,
    mines: 4,
    wing: 4,
    formation: 3,
    drone: 5,
    pulse: 5,
    missile: 5,
    warhead: 3,
    capacitor: 3,
  };
  w.evolutions = ["tempest", "thermal", "singularity", "seraph"];
  for (let i = 0; i < 40; i++)
    target(w, ((i % 8) - 4) * 110, Math.floor(i / 8) * 120 - 300);
  for (let i = 0; i < 7200; i++) {
    w.step(1 / 60, { x: Math.sin(i / 90) * 0.5, y: Math.cos(i / 110) * 0.5 });
    assert.ok(w.mines.length <= 16);
    assert.ok(w.arcEffects.length <= 11);
    assert.ok(w.bullets.length <= 2000);
    assert.ok(w.impacts.length <= 24);
    assert.ok(w.rings.length <= 32);
  }
  assert.equal(w.state, "playing");
  assert.ok(Number.isFinite(w.player.hp));
});

test("locked plasma ribbon flows over time while its endpoint remains on target", () => {
  const w = new World({ ship: "wraith" }),
    e = target(w, 400);
  w.player.angle = 0;
  fireMainWeapon(w, e, 1 / 60);
  const a = w.beams[0].points.map((p) => ({ ...p }));
  w.time = 0.2;
  fireMainWeapon(w, e, 1 / 60);
  const b = w.beams[0].points;
  assert.ok(a.some((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y) > 2));
  assert.equal(b[0].x, w.player.x);
  assert.equal(b[0].y, w.player.y);
  assert.ok(Math.hypot(b[20].x - e.x, b[20].y - e.y) < 0.001);
});
