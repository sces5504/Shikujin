import { RULES, ENEMIES, MAPS } from "../content/catalog.js";
import { behaviors } from "./patterns.js";
export function director(w, dt) {
  w.waveTime += dt;
  w.spawnTimer -= dt;
  const boss = w.wave % RULES.bossEvery === 0;
  const surge = w.wave % RULES.surgeEvery === 0;
  if (w.spawnTimer <= 0 && w.enemies.length < RULES.maxEnemies) {
    const n = boss ? 1 : surge ? 4 : Math.min(3, 1 + Math.floor(w.wave / 7));
    for (let i = 0; i < n; i++) w.spawn(w.rng.pick(w.map.enemies));
    w.spawnTimer =
      Math.max(0.13, 0.8 - w.wave * 0.025) * (boss ? 2 : surge ? 0.55 : 1);
  }
  if (
    w.waveTime >= RULES.waveSeconds &&
    (!boss || !w.enemies.some((e) => e.kind === "boss" && e.hp > 0))
  ) {
    if (boss) {
      if (w.mode === "campaign" && w.wave >= MAPS.length * RULES.bossEvery) {
        w.finish(true);
        return;
      }
      w.mapIndex = (w.mapIndex + 1) % MAPS.length;
      w.map = MAPS[w.mapIndex];
      w.enemies = [];
      w.bullets = [];
      w.drops = [];
      w.events.emit("map", w.map);
    }
    w.wave++;
    w.waveTime = 0;
    w.events.emit("wave", w.wave);
    if (boss) {
      w.state = "intermission";
      w.events.emit("intermission", w.map);
    }
    if (w.wave % RULES.bossEvery === 0) {
      w.spawn("boss");
      w.events.emit("boss", {});
    }
  }
}
export function movement(w, dt, input) {
  const p = w.player;
  let x = input.x || 0,
    y = input.y || 0;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  p.dash = Math.max(0, p.dash - dt);
  p.dashTime = Math.max(0, p.dashTime - dt);
  if (p.dashTime > 0) {
    x = w.dashVector.x;
    y = w.dashVector.y;
  }
  const speed =
    p.speed * (p.overdrive > 0 ? 1.35 : 1) * (p.dashTime > 0 ? 4 : 1);
  p.x = Math.max(-RULES.arena, Math.min(RULES.arena, p.x + x * speed * dt));
  p.y = Math.max(-RULES.arena, Math.min(RULES.arena, p.y + y * speed * dt));
  if (w.bossArena) {
    const a = w.bossArena,
      dx = p.x - a.x,
      dy = p.y - a.y,
      d = Math.hypot(dx, dy);
    if (d > a.r - 20) {
      p.x = a.x + (dx / d) * (a.r - 20);
      p.y = a.y + (dy / d) * (a.r - 20);
    }
  }
  p.moving = len > 0.05;
  p.invuln = Math.max(0, p.invuln - dt);
  p.overdrive = Math.max(0, p.overdrive - dt);
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  p.sinceHit += dt;
  if (p.sinceHit > 5) p.shield = Math.min(p.maxShield, p.shield + 5 * dt);
  w.stasis = Math.max(0, w.stasis - dt);
}
export function weapons(w, dt) {
  const p = w.player;
  p.fire -= dt;
  let target = null,
    dist = Infinity;
  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    const d =
      ((e.x - p.x) ** 2 + (e.y - p.y) ** 2) * (e.kind === "boss" ? 0.4 : 1);
    if (d < dist) {
      dist = d;
      target = e;
    }
  }
  if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
  if (target && p.fire <= 0) {
    for (let i = 0; i < p.multi; i++)
      w.playerBullet(
        p.x,
        p.y,
        p.angle + (i - (p.multi - 1) / 2) * 0.14,
        620,
        p.damage,
        p.pierce,
        "shot",
      );
    p.fire = p.interval / (p.overdrive > 0 ? 2 : 1);
    w.events.emit("shoot", {});
  }
  w.missileTimer -= dt;
  const missiles =
    (w.upgrades.missile || 0) + (w.evolutions.includes("seraph") ? 3 : 0);
  if (missiles && target && w.missileTimer <= 0) {
    for (let i = 0; i < missiles; i++)
      w.playerBullet(
        p.x,
        p.y,
        p.angle + (i - (missiles - 1) / 2) * 0.7,
        310,
        p.damage * (w.evolutions.includes("seraph") ? 4 : 2),
        0,
        "missile",
      );
    w.missileTimer = 1.6;
  }
  w.pulseTimer -= dt;
  const pulse = w.upgrades.pulse || 0;
  if (pulse && w.pulseTimer <= 0) {
    w.blast(
      p.x,
      p.y,
      130 + pulse * 25 + (w.evolutions.includes("singularity") ? 130 : 0),
      p.damage * (2 + pulse * 0.4),
      "#74f7ed",
    );
    w.pulseTimer = 4;
  }
  const drones = w.upgrades.drone || 0;
  if (drones) {
    for (let i = 0; i < drones; i++) {
      const a = w.time * 1.8 + (i / drones) * Math.PI * 2;
      const x =
          p.x + Math.cos(a) * (w.evolutions.includes("singularity") ? 125 : 85),
        y =
          p.y + Math.sin(a) * (w.evolutions.includes("singularity") ? 125 : 85);
      for (const e of w.grid.query(x, y, 40)) {
        if (Math.hypot(e.x - x, e.y - y) < e.r + 12)
          w.hit(e, p.damage * dt * 3);
      }
    }
  }
}
export function enemies(w, dt) {
  const slow = w.stasis > 0 ? 0.25 : 1;
  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    e.age += dt * slow;
    e.fire -= dt * slow;
    e.flash = Math.max(0, e.flash - dt);
    if (
      e.kind === "boss" &&
      Math.hypot(e.x - w.player.x, e.y - w.player.y) > 1300
    ) {
      const a = Math.atan2(e.y - w.player.y, e.x - w.player.x);
      e.x = w.player.x + Math.cos(a) * 700;
      e.y = w.player.y + Math.sin(a) * 700;
    }
    const dx = w.player.x - e.x,
      dy = w.player.y - e.y,
      d = Math.hypot(dx, dy) || 1;
    behaviors[e.behavior](w, e, dt * slow, dx, dy, d);
    if (d < e.r + w.player.r) w.hurt(e.kind === "boss" ? 35 : 15);
  }
}
export function projectiles(w, dt) {
  for (const b of w.bullets) {
    b.life -= dt;
    if (b.life <= 0) continue;
    const slow = b.enemy && w.stasis > 0 ? 0.25 : 1;
    if (b.kind === "missile") {
      let best = null,
        dist = Infinity;
      for (const e of w.enemies) {
        const d = Math.hypot(e.x - b.x, e.y - b.y);
        if (e.hp > 0 && d < dist) {
          best = e;
          dist = d;
        }
      }
      if (best) {
        const a = Math.atan2(best.y - b.y, best.x - b.x);
        const delta = Math.atan2(Math.sin(a - b.angle), Math.cos(a - b.angle));
        b.angle += Math.max(-dt * 5, Math.min(dt * 5, delta));
        b.vx = Math.cos(b.angle) * b.speed;
        b.vy = Math.sin(b.angle) * b.speed;
      }
    }
    if (
      b.enemy &&
      !b.grazed &&
      w.player.invuln <= 0 &&
      Math.hypot(b.x - w.player.x, b.y - w.player.y) < 30 &&
      Math.hypot(b.x - w.player.x, b.y - w.player.y) > 14
    ) {
      b.grazed = true;
      w.grazes++;
      w.score += 2;
      w.player.cooldown = Math.max(0, w.player.cooldown - 0.06);
      w.events.emit("graze", {});
    }
    const oldX = b.x,
      oldY = b.y;
    b.x += b.vx * dt * slow;
    b.y += b.vy * dt * slow;
    const hits = b.enemy
      ? [w.player]
      : w.grid.query(
          (oldX + b.x) / 2,
          (oldY + b.y) / 2,
          Math.hypot(b.x - oldX, b.y - oldY) / 2 + 70,
        );
    for (const e of hits) {
      if (e.hp <= 0 || b.hit.has(e.id)) continue;
      const vx = b.x - oldX,
        vy = b.y - oldY,
        len = vx * vx + vy * vy;
      const t = len
        ? Math.max(
            0,
            Math.min(1, ((e.x - oldX) * vx + (e.y - oldY) * vy) / len),
          )
        : 0;
      if (Math.hypot(e.x - oldX - vx * t, e.y - oldY - vy * t) < e.r + b.r) {
        b.hit.add(e.id);
        if (b.enemy) w.hurt(b.damage);
        else {
          w.hit(e, b.damage);
          if (b.kind === "missile")
            w.blast(b.x, b.y, 65, b.damage * 0.45, "#ffc18b");
        }
        b.pierce--;
        if (b.pierce < 0) {
          b.life = 0;
          break;
        }
      }
    }
  }
  w.bullets = w.bullets.filter((b) => b.life > 0);
}
export function pickups(w, dt) {
  const p = w.player;
  for (const drop of w.drops) {
    const dx = p.x - drop.x,
      dy = p.y - drop.y,
      d = Math.hypot(dx, dy);
    if (d < p.magnet) {
      drop.x += (dx / (d || 1)) * (260 + (p.magnet - d) * 3) * dt;
      drop.y += (dy / (d || 1)) * (260 + (p.magnet - d) * 3) * dt;
    }
    if (d < 23) {
      drop.dead = true;
      w.xp += drop.value * p.xpFactor;
      w.events.emit("pickup", {});
    }
  }
  w.drops = w.drops.filter((d) => !d.dead);
  if (w.xp >= w.nextXp) {
    w.xp -= w.nextXp;
    w.level++;
    w.nextXp = Math.floor(w.nextXp * 1.23 + 12);
    w.queueUpgrade();
  }
}
export function cleanup(w, dt) {
  w.enemies = w.enemies.filter(
    (e) =>
      e.hp > 0 &&
      (e.kind === "boss" ||
        Math.hypot(e.x - w.player.x, e.y - w.player.y) < 1800),
  );
  for (const p of w.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
  }
  w.particles = w.particles.filter((p) => p.life > 0);
  for (const r of w.rings) {
    r.life -= dt;
    r.r += r.speed * dt;
  }
  w.rings = w.rings.filter((r) => r.life > 0);
}
