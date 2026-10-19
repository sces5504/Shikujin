import test from "node:test";
import assert from "node:assert/strict";
import { SecretCode } from "../../src/core/secret-code.js";
import { BattleCamera, groundOffset } from "../../src/render/camera.js";
import { World } from "../../src/game/world.js";
import { RULES } from "../../src/content/catalog.js";
import { testWave, testLevels } from "../../src/game/debug.js";
test("secret code requires exact trailing password and enter, ignores forms and repeat", () => {
  const code = new SecretCode(),
    key = (key, extra = {}) => code.feed({ key, ...extra });
  for (const k of "wwssadadbx") assert.equal(key(k), false);
  assert.equal(key("Enter"), false);
  for (const k of "wwssadadba") key(k);
  assert.equal(key("Enter"), true);
  assert.equal(key("Enter"), false);
  for (const k of "wwssadadba") key(k, { target: { closest: () => true } });
  assert.equal(key("Enter"), false);
  for (const k of "wwssadadba") key(k.toUpperCase());
  assert.equal(key("Enter"), true);
});
test("camera lets player move in a dead zone, ground remains world anchored and edge clamp is visible", () => {
  const w = new World(),
    c = new BattleCamera();
  c.update(w, 1440, 960, 1, 0);
  w.player.x = 100;
  c.update(w, 1440, 960, 1, 1 / 60);
  assert.equal(c.x, 0);
  const before = groundOffset(c.x, c.y, 1, 1440, 960);
  assert.equal(before.x, 720);
  w.player.x = 800;
  for (let i = 1; i < 120; i++) c.update(w, 1440, 960, 1, i / 60);
  assert.ok(c.x > 500 && c.x < 800);
  const after = groundOffset(c.x, c.y, 1, 1440, 960);
  assert.equal(before.x - after.x, c.x);
  w.player.x = RULES.arena;
  for (let i = 120; i < 300; i++) c.update(w, 1440, 960, 1, i / 60);
  assert.equal(c.x, RULES.arena - 720 + 150);
});
test("debug wave and level changes are bounded and preserve pause with valid boss and map", () => {
  const w = new World();
  w.pause();
  testLevels(w, 10);
  assert.equal(w.level, 11);
  assert.equal(w.state, "paused");
  assert.equal(testWave(w, 10), true);
  assert.equal(w.mapIndex, 1);
  assert.equal(w.wave, 10);
  assert.ok(w.bossArena);
  assert.ok(w.enemies.some((e) => e.kind === "boss"));
  assert.equal(w.state, "paused");
  testWave(w, 11);
  assert.equal(w.mapIndex, 2);
  assert.equal(w.bossArena, null);
  assert.equal(w.bullets.length, 0);
  assert.equal(testWave(w, NaN), false);
});
