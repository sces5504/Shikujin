import { fireMainWeapon } from "./weapons.js";
import { compact } from "../core/pool.js";
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
      w.resetProjectiles();
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
  fireMainWeapon(w, target, dt);
  w.missileTimer -= dt;
  const missiles =
    (w.upgrades.missile || 0) +
    (w.ship.weapon === "carrier" ? 1 + p.multi : 0) +
    (w.evolutions.includes("seraph") ? 3 : 0);
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
      for (const e of w.grid.query(x, y, 40, w.candidates)) {
        if (Math.hypot(e.x - x, e.y - y) < e.r + 12)
          w.hit(e, p.damage * dt * 3);
      }
    }
  }
}
export function enemies(w, dt) {
  const slow = w.stasis > 0 ? 0 : 1;
  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    e.age += dt * slow;
    e.fire -= dt * slow;
    e.flash = Math.max(0, e.flash - dt);
    if (
      slow &&
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
    if (slow) behaviors[e.behavior](w, e, dt, dx, dy, d);
    if (d < e.r + w.player.r) w.hurt(e.kind === "boss" ? 35 : 15);
  }
}
export function projectiles(w, dt) {
  for (const b of w.bullets) {
    const frozen = b.enemy && w.stasis > 0;
    b.life -= frozen ? 0 : dt;
    if (b.life <= 0) continue;
    const slow = frozen ? 0 : 1;
    if (b.kind === "missile") {
      let best = b.target;
      if (!best || best.hp <= 0) {
        let dist = Infinity;
        best = null;
        for (const e of w.enemies) {
          const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2;
          if (e.hp > 0 && d < dist) {
            best = e;
            dist = d;
          }
        }
        b.target = best;
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
      ? w.playerTarget
      : w.grid.query(
          (oldX + b.x) / 2,
          (oldY + b.y) / 2,
          Math.hypot(b.x - oldX, b.y - oldY) / 2 + 70,
          w.candidates,
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
          if (b.kind === "missile" || b.kind === "shell") {
            const shell = b.kind === "shell",
              radius = shell ? 105 + w.player.pierce * 20 : 65;
            w.blast(
              b.x,
              b.y,
              radius,
              b.damage * (shell ? 0.85 : 0.45),
              "#ffc18b",
            );
            if (w.impacts.length < 24)
              w.impacts.push({
                x: b.x,
                y: b.y,
                r: radius,
                kind: "shell",
                life: 0.6,
                maxLife: 0.6,
              });
          }
        }
        b.pierce--;
        if (b.pierce < 0) {
          b.life = 0;
          break;
        }
      }
    }
  }
  compact(
    w.bullets,
    (b) => b.life > 0,
    (b) => {
      if (b.enemy) w.enemyBulletCount--;
      else w.playerBulletCount--;
      w.bulletPool.release(b);
    },
  );
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
  compact(w.drops, (d) => !d.dead);
  if (w.xp >= w.nextXp) {
    w.xp -= w.nextXp;
    w.level++;
    w.nextXp = Math.floor(w.nextXp * 1.23 + 12);
    w.queueUpgrade();
  }
}
export function cleanup(w, dt) {
  compact(
    w.enemies,
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
  compact(w.particles, (p) => p.life > 0);
  for (const r of w.rings) {
    r.life -= dt;
    r.r += r.speed * dt;
  }
  compact(w.rings, (r) => r.life > 0);
  for (const e of w.explosions) e.life -= dt;
  compact(w.explosions, (e) => e.life > 0);
  for (const impact of w.impacts) impact.life -= dt;
  compact(w.impacts, (i) => i.life > 0);
  for (const n of w.damageNumbers) {
    n.life -= dt;
    n.y -= 25 * dt;
  }
  compact(w.damageNumbers, (n) => n.life > 0);
  w.comboTime = Math.max(0, w.comboTime - dt);
  if (!w.comboTime) w.combo = 0;
}
