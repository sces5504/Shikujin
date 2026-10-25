import { ORBITAL_BARRAGE as ORBITAL } from "../content/combat.js";
import { compact } from "../core/pool.js";
export const LUNAR_RADIUS = 130;
export function startUltimate(w, kind) {
  if (kind !== "stasis") w.clearEnemyBullets();
  w.player.invuln = Math.max(2, w.player.invuln);
  const durations = {
    overdrive: 6,
    stasis: 7,
    repair: 8,
    nova: ORBITAL.duration,
    swarm: 6,
    lunar: 7,
  };
  w.ultimate = {
    kind,
    remaining: durations[kind],
    duration: durations[kind],
    tick: 0,
  };
  if (kind === "overdrive") w.player.overdrive = 6;
  if (kind === "stasis") w.stasis = 7;
  if (kind === "repair") {
    const p = w.player;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45);
    p.shield = p.maxShield;
  }
  if (kind === "nova") w.ultimate.fired = 0;
}
function segmentDistance(e, p, angle) {
  const dx = e.x - p.x,
    dy = e.y - p.y,
    t = dx * Math.cos(angle) + dy * Math.sin(angle);
  if (t < 0 || t > 1050) return Infinity;
  return Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
}
export function updateUltimates(w, dt) {
  const u = w.ultimate,
    p = w.player;
  if (u) {
    u.remaining -= dt;
    u.tick -= dt;
    if (u.kind === "nova" && u.tick <= 0 && u.fired < ORBITAL.count) {
      const targets = w.enemies.filter((e) => e.hp > 0),
        boss = targets.find((e) => e.kind === "boss"),
        i = u.fired++,
        e =
          (i % 3 === 0 ? boss : null) ||
          targets[i % Math.max(1, targets.length)],
        a = i * 2.39996;
      w.strikes.push({
        x: e?.x ?? p.x + Math.cos(a) * 300,
        y: e?.y ?? p.y + Math.sin(a) * 300,
        delay: ORBITAL.warning,
        r: ORBITAL.radius,
      });
      u.tick += ORBITAL.interval;
    }
    if (u.kind === "overdrive")
      for (const e of w.enemies)
        if (e.hp > 0 && segmentDistance(e, p, p.angle) < e.r + 28)
          w.hit(e, p.damage * 8 * dt);
    // Hisa: a continuous homing missile swarm, bounded by the player-bullet cap.
    if (u.kind === "swarm" && u.tick <= 0) {
      for (let i = -1; i <= 1; i++)
        w.playerBullet(
          p.x + i * 18,
          p.y - 10,
          -Math.PI / 2 + i * 0.75 + Math.sin(w.time * 9) * 0.2,
          360,
          p.damage * 2.2,
          0,
          "missile",
        );
      u.tick = 0.16;
    }
    // Sakuya: a moon ring around the ship erases hostile shots and grinds nearby craft.
    if (u.kind === "lunar") {
      const r = LUNAR_RADIUS;
      for (const b of w.bullets)
        if (
          b.enemy &&
          b.life > 0 &&
          (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < r * r
        ) {
          b.life = 0;
          w.score += 2;
        }
      for (const e of w.enemies)
        if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < r + e.r)
          w.hit(e, p.damage * 7 * dt);
    }
    if (u.kind === "repair") {
      p.shield = Math.min(p.maxShield, p.shield + 20 * dt);
      if (u.tick <= 0) {
        w.blast(p.x, p.y, 230, p.damage * 2.5, "#aeffe4");
        u.tick = 0.8;
      }
    }
    if (u.kind === "stasis" && u.tick <= 0) {
      let hits = 0;
      for (const e of w.enemies)
        if (e.hp > 0 && hits++ < 8) {
          w.hit(e, p.damage * 2);
          w.rings.push({
            x: e.x,
            y: e.y,
            r: 5,
            speed: 60,
            life: 0.25,
            maxLife: 0.25,
            color: "#bbaaff",
          });
        }
      u.tick = 0.65;
    }
    if (u.remaining <= 0) w.ultimate = null;
  }
  for (const strike of w.strikes) {
    strike.delay -= dt;
    if (strike.delay <= 0 && !strike.fired) {
      strike.fired = true;
      w.blast(
        strike.x,
        strike.y,
        strike.r,
        p.damage * ORBITAL.damage,
        "#ffb6dc",
      );
      if (w.impacts.length < 24)
        w.impacts.push({
          x: strike.x,
          y: strike.y,
          r: strike.r,
          kind: "orbital",
          life: 0.85,
          maxLife: 0.85,
        });
      if (w.explosions.length < 48)
        w.explosions.push({
          x: strike.x,
          y: strike.y,
          r: 150,
          life: 0.65,
          maxLife: 0.65,
        });
      for (const b of w.bullets)
        if (
          b.enemy &&
          (b.x - strike.x) ** 2 + (b.y - strike.y) ** 2 < strike.r ** 2
        )
          b.life = 0;
    }
  }
  compact(w.strikes, (s) => !s.fired);
}
