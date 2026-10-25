import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/game/world.js";
import { applyUpgrade } from "../../src/game/upgrades.js";
import { updateBuilds } from "../../src/game/builds.js";
import { checkEvolutions } from "../../src/game/progression.js";
const enemy = (w, x = 180, y = 0) => {
  const e = w.spawn("tank");
  Object.assign(e, { x, y, hp: 1e6, maxHp: 1e6, speed: 0 });
  return e;
};
test("new build tools create radial shots, distinct branching beams and dash salvos", () => {
  const w = new World();
  enemy(w);
  enemy(w, 100, 100);
  w.upgrades = { starburst: 2, refraction: 2, dashburst: 2 };
  updateBuilds(w, 0.01, w.enemies[0]);
  assert.equal(w.bullets.filter((b) => b.kind === "star").length, 16);
  assert.equal(w.arcEffects.length, 2);
  assert.ok(w.enemies.every((e) => e.hp < e.maxHp));
  const before = w.bullets.length;
  assert.ok(w.dash({ x: 1, y: 0 }));
  assert.equal(w.bullets.length - before, 20);
  assert.equal(w.dash(), false);
});
test("shield reaction triggers only on actual shield break with an eight-second cooldown", () => {
  const w = new World(),
    e = enemy(w, 0, w.player.y - 200);
  w.upgrades = { volatile: 2 };
  w.player.shield = 10;
  w.player.invuln = 0;
  w.hurt(5);
  assert.equal(e.hp, e.maxHp);
  w.player.invuln = 0;
  w.hurt(8);
  assert.ok(e.hp < e.maxHp);
  const hp = e.hp;
  w.player.shield = 1;
  w.player.invuln = 0;
  w.hurt(2);
  assert.equal(e.hp, hp);
  w.time = 8;
  w.player.shield = 1;
  w.player.invuln = 0;
  w.hurt(2);
  assert.ok(e.hp < hp);
});
test("cryo shatter needs a chilled kill, stays rate-limited and unlocks new evolutions", () => {
  const w = new World();
  assert.equal(applyUpgrade(w, "shatter"), false);
  applyUpgrade(w, "frost");
  applyUpgrade(w, "shatter");
  const e = enemy(w);
  e.chillUntil = 2;
  w.hit(e, 1e7);
  assert.equal(w.bullets.length, 6);
  const other = enemy(w);
  other.chillUntil = 2;
  w.hit(other, 1e7);
  assert.equal(w.bullets.length, 6);
  w.upgrades = { starburst: 3, dashburst: 2, volatile: 2, reactor: 3 };
  checkEvolutions(w);
  assert.ok(w.evolutions.includes("meteor"));
  assert.ok(w.evolutions.includes("aegis"));
});
test("boss endurance lets representative early and late builds reach both attack phases", () => {
  for (const wave of [5, 25])
    for (const ship of ["kestrel", "wraith", "bastion", "seraph", "oracle"]) {
      const w = new World({ ship, pilot: "mio", seed: 8 });
      w.wave = wave;
      w.mapIndex = wave / 5 - 1;
      w.spawnTimer = 1e8;
      w.waveTime = -1e8;
      w.debugInvincible = true;
      const build =
        wave === 5
          ? { damage: 2, rate: 1, multi: 1, missile: 1 }
          : {
              damage: 6,
              rate: 5,
              multi: 4,
              missile: 4,
              pierce: 3,
              drone: 3,
              pulse: 3,
              arc: 3,
              burn: 3,
            };
      for (const [id, n] of Object.entries(build))
        for (let i = 0; i < n; i++) applyUpgrade(w, id);
      checkEvolutions(w);
      const e = w.spawn("boss");
      e.x = 0;
      e.y = -280;
      e.speed = 0;
      w.skill();
      let frames = 0;
      // A vertical-shooter pilot tracks the patrolling boss from mid-screen.
      const follow = (d) => Math.max(-1, Math.min(1, d / 30));
      while (e.hp > 0 && frames < 120 * 60) {
        w.step(1 / 60, {
          x: follow(e.x - w.player.x),
          y: follow(0 - w.player.y),
        });
        if (w.player.cooldown <= 0) w.skill();
        frames++;
      }
      assert.ok(
        frames / 60 >= 10,
        `${wave}/${ship} boss died in ${frames / 60}s`,
      );
      assert.ok(frames / 60 < 100, `${wave}/${ship} excessive boss duration`);
      assert.ok(e.enraged);
    }
});
