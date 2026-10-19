import { compact } from "../core/pool.js";
export function startUltimate(w, kind) {
  w.clearEnemyBullets();
  w.player.invuln = Math.max(2, w.player.invuln);
  const durations = { overdrive: 6, stasis: 7, repair: 8, nova: 5 };
  w.ultimate = { kind, remaining: durations[kind], tick: 0 };
  if (kind === "overdrive") w.player.overdrive = 6;
  if (kind === "stasis") w.stasis = 7;
  if (kind === "repair") {
    const p = w.player;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45);
    p.shield = p.maxShield;
  }
  if (kind === "nova") {
    for (let i = 0; i < 8; i++) {
      const e = w.enemies[Math.floor((i * w.enemies.length) / 8)];
      const angle = (i / 8) * Math.PI * 2;
      w.strikes.push({
        x: e?.x ?? w.player.x + Math.cos(angle) * 230,
        y: e?.y ?? w.player.y + Math.sin(angle) * 230,
        delay: 0.3 + i * 0.35,
        r: 170,
      });
    }
  }
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
    if (u.kind === "overdrive")
      for (const e of w.enemies)
        if (e.hp > 0 && segmentDistance(e, p, p.angle) < e.r + 28)
          w.hit(e, p.damage * 8 * dt);
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
      w.blast(strike.x, strike.y, strike.r, p.damage * 8, "#ffb6dc");
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
