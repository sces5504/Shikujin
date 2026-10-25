// Balance probe: a dodging autopilot plays each airframe; usage: node scripts/balance-sim.mjs [seconds]
import { World } from "../src/game/world.js";
import { BOUNDS } from "../src/content/stage.js";
// A dodging pilot: samples 9 move directions, predicts bullets 0.25s/0.5s ahead, picks the safest
// while drifting under the nearest target. Approximates a competent human.
const dirs = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];
export function run(ship, pilot, seconds, seed = 5, log = false) {
  const w = new World({ ship, pilot, seed });
  let hits = 0;
  w.events.on("hurt", () => hits++);
  const levelAt = [];
  for (let f = 0; f < 60 * seconds && w.state !== "defeat"; f++) {
    if (w.options.length) w.choose(w.options[0].id);
    if (w.state === "intermission") w.supply("repair");
    if (
      w.player.cooldown <= 0 &&
      w.bullets.filter(
        (b) => b.enemy && Math.hypot(b.x - w.player.x, b.y - w.player.y) < 90,
      ).length > 6
    )
      w.skill();
    const p = w.player,
      sp = p.speed;
    const t = w.enemies
      .filter((e) => e.hp > 0 && e.y > BOUNDS.top && e.y < p.y - 60)
      .sort(
        (a, b) =>
          (a.kind === "boss" ? -1 : 0) ||
          Math.abs(a.x - p.x) - Math.abs(b.x - p.x),
      )[0];
    let best = null,
      bestScore = -1e9;
    for (const [dx, dy] of dirs) {
      let score = 0;
      for (const h of [0.15, 0.3, 0.5]) {
        const px = p.x + dx * sp * h,
          py = p.y + dy * sp * h;
        if (
          px < BOUNDS.left + 30 ||
          px > BOUNDS.right - 30 ||
          py < BOUNDS.top + 150 ||
          py > BOUNDS.bottom - 30
        )
          score -= 50;
        for (const b of w.bullets) {
          if (!b.enemy) continue;
          const d = Math.hypot(b.x + b.vx * h - px, b.y + b.vy * h - py);
          if (d < b.r + p.r + 10) score -= 100 / h;
          else if (d < 40) score -= ((40 - d) / h) * 0.3;
        }
        for (const e of w.enemies) {
          const d = Math.hypot(
            e.x + (e.vx || 0) * h - px,
            e.y + (e.vy || 0) * h - py,
          );
          if (d < e.r + 25) score -= 60 / h;
        }
      }
      if (t) score -= Math.abs(t.x - (p.x + dx * sp * 0.3)) * 0.02;
      score -= Math.abs(p.y + dy * 40 - 300) * 0.004;
      if (score > bestScore) {
        bestScore = score;
        best = [dx, dy];
      }
    }
    w.step(1 / 60, { x: best[0], y: best[1] });
    if (f % 3600 === 0) levelAt.push(w.level);
  }
  return {
    ship,
    pilot,
    wave: w.wave,
    t: Math.round(w.time),
    lvl: w.level,
    hits,
    hp: Math.round(w.player.hp),
    state: w.state,
    kills: w.kills,
    levelAt: levelAt.join(","),
    bosses: w.bossKills,
  };
}
const secs = +process.argv[2] || 600;
for (const [s, p] of [
  ["kestrel", "akari"],
  ["wraith", "rin"],
  ["bastion", "yuki"],
  ["seraph", "mio"],
  ["valkyrie", "sakuya"],
])
  console.log(JSON.stringify(run(s, p, secs)));
