import { BUILD_COMBAT as T } from "../content/combat.js";
export function radialSalvo(w, x, y, count, damage, pierce = 0) {
  for (let i = 0; i < count; i++)
    w.playerBullet(
      x,
      y,
      w.time * 0.7 + (i / count) * Math.PI * 2,
      T.starSpeed,
      damage,
      pierce,
      "star",
    );
}
export function dashBuild(w) {
  const n = w.upgrades.dashburst || 0;
  if (n)
    radialSalvo(
      w,
      w.player.x,
      w.player.y,
      12 + n * 4 + (w.evolutions.includes("meteor") ? 8 : 0),
      w.player.damage * (0.55 + n * 0.15),
      1,
    );
}
export function shieldBreakBuild(w) {
  const n = w.upgrades.volatile || 0;
  if (!n || w.time < (w.shieldBurstReady || 0)) return;
  w.shieldBurstReady = w.time + 8;
  w.blast(
    w.player.x,
    w.player.y,
    320,
    w.player.damage * (3 + n) * (w.evolutions.includes("aegis") ? 2 : 1),
    "#a9f7ed",
  );
}
export function killBuild(w, e) {
  const n = w.upgrades.shatter || 0;
  if (n && e.chillUntil > w.time && w.time >= (w.shatterReady || 0)) {
    w.shatterReady = w.time + 0.2;
    radialSalvo(w, e.x, e.y, 4 + n * 2, w.player.damage * 0.55);
  }
}
// Secondary build systems and on-hit rules; bounded effects, no DOM dependencies.
export function weaponHit(w, e, damage, effects = true) {
  const u = w.upgrades,
    p = w.player;
  const bonus =
    (e.hp / e.maxHp < 0.3 ? (u.execution || 0) * 0.3 : 0) +
    (p.shield > 0 ? (u.reactor || 0) * 0.15 : 0);
  w.hit(e, damage * (1 + bonus));
  if (!effects) return;
  if (u.burn) e.burnUntil = w.time + 3;
  if (u.frost) e.chillUntil = w.time + 2;
}
export function updateBuilds(w, dt, target) {
  const u = w.upgrades,
    p = w.player;
  w.arcEffects ||= [];
  w.arcEffects = w.arcEffects.filter((a) => (a.life -= dt) > 0);
  w.buildTimers ||= {
    starburst: 0,
    refraction: 0,
    arc: 0,
    mines: 0,
    wing: 0,
    formation: 0,
  };
  for (const key of Object.keys(w.buildTimers)) w.buildTimers[key] -= dt;
  for (const e of w.enemies) {
    if (e.hp > 0 && e.burnUntil > w.time)
      w.hit(
        e,
        p.damage *
          (u.burn || 0) *
          0.18 *
          dt *
          (w.evolutions.includes("thermal") ? 2 : 1),
      );
  }
  if (u.starburst && target && w.buildTimers.starburst <= 0) {
    radialSalvo(
      w,
      p.x,
      p.y,
      8 + u.starburst * 4,
      p.damage * 0.6,
      w.evolutions.includes("meteor") ? 1 : 0,
    );
    w.buildTimers.starburst = T.starInterval;
  }
  if (u.refraction && target && w.buildTimers.refraction <= 0) {
    const targets = w.enemies
      .filter((e) => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 900)
      .sort(
        (a, b) =>
          (a.x - p.x) ** 2 +
          (a.y - p.y) ** 2 -
          (b.x - p.x) ** 2 -
          (b.y - p.y) ** 2,
      )
      .slice(0, 1 + u.refraction);
    for (const e of targets) {
      w.arcEffects.push({
        life: 0.18,
        x: p.x,
        y: p.y,
        angle: Math.atan2(e.y - p.y, e.x - p.x),
        length: Math.hypot(e.x - p.x, e.y - p.y),
        width: 7,
        color: "#ffe2a5",
      });
      weaponHit(w, e, p.damage * (1.4 + u.refraction * 0.35));
    }
    w.buildTimers.refraction = T.refractionInterval;
  }
  if (u.arc && target && w.buildTimers.arc <= 0) {
    const used = new Set();
    let from = p,
      next = target;
    const count = 2 + u.arc + (w.evolutions.includes("tempest") ? 4 : 0);
    for (let i = 0; i < count && next; i++) {
      used.add(next.id);
      w.arcEffects.push({
        life: 0.18,
        x: from.x,
        y: from.y,
        angle: Math.atan2(next.y - from.y, next.x - from.x),
        length: Math.hypot(next.x - from.x, next.y - from.y),
        width: 4,
        color: "#9beaff",
      });
      weaponHit(w, next, p.damage * (0.65 + u.arc * 0.18));
      from = next;
      next = null;
      let best = 240 ** 2;
      for (const e of w.enemies) {
        const d = (e.x - from.x) ** 2 + (e.y - from.y) ** 2;
        if (e.hp > 0 && !used.has(e.id) && d < best) {
          best = d;
          next = e;
        }
      }
    }
    w.buildTimers.arc = 1.4;
  }
  if (u.mines && w.buildTimers.mines <= 0 && w.mines.length < 16) {
    w.mines.push({ x: p.x, y: p.y, life: 9, arm: 0.4 });
    w.buildTimers.mines = 2;
  }
  for (const mine of w.mines) {
    mine.life -= dt;
    mine.arm -= dt;
    if (
      mine.arm <= 0 &&
      w.enemies.some(
        (e) => e.hp > 0 && Math.hypot(e.x - mine.x, e.y - mine.y) < 110 + e.r,
      )
    ) {
      w.blast(
        mine.x,
        mine.y,
        180 + (w.evolutions.includes("thermal") ? 100 : 0),
        p.damage * (2 + u.mines),
        "#ffc786",
      );
      mine.life = 0;
    }
  }
  w.mines = w.mines.filter((m) => m.life > 0);
  if (u.wing && target && w.buildTimers.wing <= 0) {
    for (const side of [-1, 1])
      for (let i = 0; i < u.wing + 1; i++)
        w.playerBullet(
          p.x,
          p.y,
          p.angle + side * (0.65 + i * 0.16),
          600,
          p.damage * 0.65,
          1,
          "spread",
        );
    w.buildTimers.wing = 1.8;
  }
  if (u.formation && target && w.buildTimers.formation <= 0) {
    const n = u.drone || 0;
    for (let i = 0; i < n; i++) {
      const a = w.time * 1.8 + (i / n) * Math.PI * 2,
        r = w.evolutions.includes("singularity") ? 125 : 85,
        x = p.x + Math.cos(a) * r,
        y = p.y + Math.sin(a) * r;
      w.playerBullet(
        x,
        y,
        Math.atan2(target.y - y, target.x - x),
        700,
        p.damage * 0.75,
        p.pierce,
        "escort",
      );
    }
    w.buildTimers.formation = 1.1 / (1 + u.formation * 0.3);
  }
}
