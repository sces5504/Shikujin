import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../../src/game/world.js";
import { spawnSquad } from "../../src/game/formations.js";
import {
  STAGE,
  BOUNDS,
  SQUAD_REWARDS,
  MEDAL_BASE,
} from "../../src/content/stage.js";
const quiet = (seed = 2) => {
  const w = new World({ seed });
  w.spawnTimer = 1e6;
  w.waveTime = -1e6;
  w.debugInvincible = true;
  return w;
};
test("destroying a whole squadron drops the rotating reward; an escapee voids it", () => {
  const w = quiet();
  const squad = spawnSquad(w, "scout");
  assert.equal(squad.length, 5);
  for (const e of squad) w.hit(e, 1e9);
  const item = w.drops.find((d) => d.item);
  assert.equal(item.item, SQUAD_REWARDS[0]);
  const broken = spawnSquad(w, "scout");
  broken[0].y = BOUNDS.bottom + STAGE.despawn + 1;
  w.step(1 / 60);
  for (const e of broken.slice(1)) w.hit(e, 1e9);
  assert.equal(w.drops.filter((d) => d.item).length, 1);
});
test("medal chain multiplies score and breaks when a medal falls off-screen", () => {
  const w = quiet();
  for (let i = 1; i <= 3; i++) {
    const score = w.score;
    w.collectItem({ x: 0, y: 0, item: "medal" });
    assert.equal(w.score - score, MEDAL_BASE * i);
  }
  w.dropItem(0, BOUNDS.bottom + 29, "medal");
  w.drops.at(-1).age = 5;
  w.player.x = -300;
  w.step(1 / 60);
  assert.equal(w.medalChain, 0);
  w.collectItem({ x: 0, y: 0, item: "power" });
  assert.ok(w.player.overdrive > 0);
});
test("flying above the item line vacuums every drop to the ship", () => {
  const w = quiet();
  w.player.x = 0;
  w.player.y = STAGE.collectLine - 20;
  w.dropItem(300, 500, "medal");
  w.drops.push({ x: -300, y: 400, value: 5 });
  for (let i = 0; i < 120; i++) w.step(1 / 60);
  assert.equal(w.drops.length, 0);
});
test("player fire always points up, bullets leaving the column are culled, bosses descend and patrol", () => {
  const w = quiet();
  for (let i = 0; i < 30; i++) w.step(1 / 60);
  const own = w.bullets.filter((b) => !b.enemy);
  assert.ok(own.length > 0 && own.every((b) => b.vy < 0));
  for (let i = 0; i < 120; i++) w.step(1 / 60);
  assert.ok(w.bullets.every((b) => b.y > BOUNDS.top - 41));
  const boss = w.spawn("boss");
  assert.ok(boss.y < BOUNDS.top);
  for (let i = 0; i < 60 * 8; i++) w.step(1 / 60);
  assert.ok(boss.entered && boss.y > BOUNDS.top && boss.y < 0);
  assert.ok(w.scrollSpeed < STAGE.scroll);
});
