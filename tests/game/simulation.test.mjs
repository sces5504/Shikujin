import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/game/world.js";
import { applyUpgrade } from "../../src/game/upgrades.js";
import { SaveStore, SAVE_KEY, sanitizeSave } from "../../src/core/storage.js";
import { RULES, SHIPS, PILOTS } from "../../src/content/catalog.js";
const tick = (w, n, input = {}) => {
  for (let i = 0; i < n; i++) w.step(1 / 60, input);
};
test("seeded simulation is reproducible; motion normalized and paused states freeze", () => {
  const a = new World({ seed: 11 }),
    b = new World({ seed: 11 });
  tick(a, 100, { x: 1, y: 1 });
  tick(b, 100, { x: 1, y: 1 });
  assert.equal(a.player.x, b.player.x);
  assert.equal(a.enemies[0].x, b.enemies[0].x);
  assert.ok(Math.abs(Math.hypot(a.player.x, a.player.y) - 400) < 0.01);
  a.pause();
  const time = a.time;
  tick(a, 100);
  assert.equal(a.time, time);
  a.resume();
  tick(a, 1);
  assert.ok(a.time > time);
});
test("auto fire kills an enemy, drops experience and produces three distinct valid upgrades", () => {
  const w = new World({ seed: 7 });
  const e = w.spawn("scout");
  e.x = 80;
  e.y = 0;
  tick(w, 100);
  assert.ok(w.kills >= 1);
  w.xp = w.nextXp;
  tick(w, 1);
  assert.equal(w.state, "upgrade");
  assert.equal(new Set(w.options.map((u) => u.id)).size, 3);
  const id = w.options[0].id;
  assert.equal(w.choose("nonexistent"), false);
  assert.equal(w.choose(id), true);
  assert.equal(w.upgrades[id], 1);
  assert.equal(w.choose(id), false);
});
test("boss blocks next wave until defeated and map changes after boss wave", () => {
  const w = new World({ seed: 1 });
  w.wave = 4;
  w.waveTime = RULES.waveSeconds;
  tick(w, 1);
  assert.equal(w.wave, 5);
  const boss = w.enemies.find((e) => e.kind === "boss");
  assert.ok(boss);
  w.waveTime = RULES.waveSeconds;
  tick(w, 1);
  assert.equal(w.wave, 5);
  w.hit(boss, 1e9);
  tick(w, 1);
  assert.equal(w.wave, 6);
  assert.equal(w.mapIndex, 1);
});
test("all pilot abilities have cooldown, apply only during play and all ships initialize", () => {
  for (const pilot of PILOTS) {
    const w = new World({ pilot: pilot.id });
    w.player.hp = 25;
    w.spawn("tank");
    assert.equal(w.skill(), true);
    assert.ok(w.player.cooldown > 0);
    assert.equal(w.skill(), false);
    w.pause();
    w.player.cooldown = 0;
    assert.equal(w.skill(), false);
  }
  for (const ship of SHIPS) {
    const w = new World({ ship: ship.id });
    assert.equal(w.player.maxHp, ship.hp);
  }
});
test("shields absorb damage, invulnerability prevents repeated contact, defeat settles once", () => {
  const w = new World();
  w.player.shield = 20;
  w.hurt(30);
  assert.equal(w.player.hp, 100);
  w.hurt(30);
  assert.equal(w.player.hp, 100);
  let n = 0;
  w.events.on("defeat", () => n++);
  w.player.invuln = 0;
  w.hurt(999);
  w.finish();
  assert.equal(n, 1);
  assert.equal(w.state, "defeat");
  assert.ok(w.result.reward > 0);
});
test("weapons upgrades scale and unlock missiles, drones and pulse", () => {
  const w = new World();
  for (const id of [
    "damage",
    "multi",
    "pierce",
    "missile",
    "drone",
    "pulse",
    "health",
    "shield",
  ])
    assert.ok(applyUpgrade(w, id));
  assert.equal(w.player.multi, 2);
  assert.equal(w.player.pierce, 1);
  assert.equal(w.player.maxHp, 135);
  const e = w.spawn("tank");
  e.x = 100;
  e.y = 0;
  tick(w, 1);
  assert.ok(w.bullets.some((b) => b.kind === "missile"));
  assert.ok(w.rings.length);
});
test("save sanitizes corruption and unknown content; purchases are atomic and persist", () => {
  const map = new Map([[SAVE_KEY, "broken"]]);
  const storage = {
    getItem: (k) => map.get(k),
    setItem: (k, v) => map.set(k, v),
  };
  const s = new SaveStore(storage);
  assert.equal(s.data.credits, 0);
  assert.equal(s.buy("wraith"), false);
  s.settle({ reward: 200, wave: 5, score: 999 });
  assert.equal(s.buy("wraith"), true);
  assert.equal(s.data.credits, 20);
  assert.equal(s.buy("wraith"), false);
  const restored = new SaveStore(storage);
  assert.ok(restored.data.owned.includes("wraith"));
  assert.equal(restored.data.bestWave, 5);
  assert.equal(
    sanitizeSave({
      version: 1,
      credits: -99,
      owned: ["cheat"],
      pilot: "bad",
      ship: "cheat",
    }).ship,
    "kestrel",
  );
  const unavailable = new SaveStore({
    getItem: () => null,
    setItem: () => {
      throw Error("full");
    },
  });
  assert.equal(unavailable.write(), false);
});
test("high density simulation stays bounded with finite positions and health", () => {
  const w = new World({ seed: 42 });
  w.wave = 18;
  w.player.maxHp = 1e8;
  w.player.hp = 1e8;
  w.player.damage = 70;
  applyUpgrade(w, "missile");
  applyUpgrade(w, "drone");
  for (let i = 0; i < 7200; i++) {
    if (w.state === "upgrade") w.choose(w.options[0].id);
    w.step(1 / 60, { x: Math.sin(i / 180), y: Math.cos(i / 180) });
  }
  assert.ok(w.enemies.length <= RULES.maxEnemies);
  assert.ok(w.bullets.length <= RULES.maxBullets);
  assert.ok(w.particles.length <= RULES.maxParticles);
  assert.ok(Number.isFinite(w.player.hp));
  for (const e of w.enemies)
    assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y));
  assert.ok(w.kills > 0);
});
test("research, achievements and old saves migrate without losing credits", () => {
  const map = new Map([
    [
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        credits: 1000,
        owned: ["kestrel"],
        runs: 1,
      }),
    ],
  ]);
  const s = new SaveStore({
    getItem: (k) => map.get(k),
    setItem: (k, v) => map.set(k, v),
  });
  assert.equal(s.data.credits, 1000);
  assert.ok(s.research("power"));
  assert.equal(s.data.research.power, 1);
  assert.ok(s.claim("first"));
  assert.equal(s.claim("first"), false);
  const w = new World({ research: s.data.research });
  assert.ok(w.player.damage > new World().player.damage);
  assert.equal(s.claim("clear"), false);
});
test("campaign has five distinct bosses, resupply and an actual ending; endless continues", () => {
  for (const mode of ["campaign", "endless"]) {
    const w = new World({ mode, seed: 22 });
    const bosses = [];
    for (let chapter = 0; chapter < 5; chapter++) {
      w.state = "playing";
      w.xp = 0;
      w.drops = [];
      w.wave = 4 + chapter * 5;
      w.waveTime = 24;
      w.step(1 / 60);
      const boss = w.enemies.find((e) => e.kind === "boss");
      assert.ok(boss);
      bosses.push(boss.bossId);
      w.hit(boss, 1e9);
      w.waveTime = 24;
      w.step(1 / 60);
      if (chapter === 4 && mode === "campaign") {
        assert.equal(w.state, "defeat");
        assert.equal(w.result.clear, true);
        assert.equal(w.bossKills, 5);
      } else {
        assert.equal(w.state, "intermission");
        assert.ok(w.supply("repair"));
        assert.equal(w.state, "playing");
      }
    }
    assert.equal(new Set(bosses).size, 5);
    if (mode === "endless") {
      assert.equal(w.wave, 26);
      assert.equal(w.mapIndex, 0);
    }
  }
});
test("weapon combinations evolve exactly once and dash grants short invulnerability", () => {
  const w = new World();
  w.upgrades = { multi: 3, pierce: 1 };
  w.state = "upgrade";
  w.options = [{ id: "pierce" }];
  const old = w.player.damage;
  assert.ok(w.choose("pierce"));
  assert.ok(w.evolutions.includes("prism"));
  assert.equal(w.player.damage, old * 1.3);
  w.state = "upgrade";
  w.options = [{ id: "health" }];
  w.choose("health");
  assert.equal(w.evolutions.length, 1);
  assert.ok(w.dash({ x: 1, y: 0 }));
  assert.equal(w.dash(), false);
  const x = w.player.x;
  w.step(0.05);
  assert.ok(w.player.x - x > w.player.speed * 0.05);
  assert.ok(w.player.invuln > 0);
});
test("all bosses emit different finite patterned bullets with warning and rest windows", () => {
  for (let map = 0; map < 5; map++) {
    const w = new World({ seed: 4 });
    w.mapIndex = map;
    const e = w.spawn("boss");
    e.x = 250;
    e.y = 0;
    e.age = 0;
    w.step(1 / 60);
    assert.ok(e.telegraph > 0);
    e.age = 3;
    e.fire = 0;
    w.step(1 / 60);
    assert.ok(w.bullets.some((b) => b.enemy));
    for (const b of w.bullets)
      assert.ok(Number.isFinite(b.vx) && Number.isFinite(b.vy));
    e.hp = e.maxHp * 0.4;
    e.fire = 0;
    w.step(1 / 60);
    assert.ok(e.enraged);
  }
});

test("boss experience is credited before transition clears battlefield drops", () => {
  const w = new World();
  const boss = w.spawn("boss");
  const before = w.xp;
  w.hit(boss, 1e9);
  assert.equal(w.xp - before, boss.xp * w.player.xpFactor);
});
