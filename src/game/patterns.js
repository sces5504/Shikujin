import { updateBoss } from "./boss-patterns.js";
export const patterns = {
  aimed(w, e, count = 1, spread = 0.2, speed = 145) {
    const angle = Math.atan2(w.player.y - e.y, w.player.x - e.x);
    for (let i = 0; i < count; i++)
      w.enemyBullet(e, angle + (i - (count - 1) / 2) * spread, speed);
  },
  ring(w, e, count = 14, offset = 0, speed = 115) {
    for (let i = 0; i < count; i++)
      w.enemyBullet(e, offset + (i / count) * Math.PI * 2, speed);
  },
  spiral(w, e, count = 6, offset = 0, speed = 135) {
    for (let i = 0; i < count; i++)
      w.enemyBullet(e, offset + (i / count) * Math.PI * 2, speed);
  },
};
export const behaviors = {
  chase(w, e, dt, dx, dy, d) {
    e.x += (dx / d) * e.speed * dt;
    e.y += (dy / d) * e.speed * dt;
  },
  shooter(w, e, dt, dx, dy, d) {
    const m = d > 330 ? 1 : d < 240 ? -0.5 : 0;
    e.x += (dx / d) * e.speed * dt * m;
    e.y += (dy / d) * e.speed * dt * m;
    if (e.fire <= 0) {
      patterns.aimed(w, e, 3);
      e.fire = 2.8;
    }
  },
  orbit(w, e, dt, dx, dy, d) {
    e.x += ((dx / d) * 0.35 - (dy / d) * 0.85) * e.speed * dt;
    e.y += ((dy / d) * 0.35 + (dx / d) * 0.85) * e.speed * dt;
    if (e.fire <= 0) {
      patterns.aimed(w, e, 1, 0, 180);
      e.fire = 3.6;
    }
  },
  tank(w, e, dt, dx, dy, d) {
    behaviors.chase(w, e, dt, dx, dy, d);
    if (e.fire <= 0) {
      patterns.ring(w, e, 8, e.age * 0.5, 90);
      e.fire = 4.5;
    }
  },
  charger(w, e, dt, dx, dy, d) {
    const cycle = e.age % 3.5;
    e.telegraph = cycle < 0.6 ? 1 - cycle / 0.6 : 0;
    if (cycle < 0.6) {
      e.aim = Math.atan2(dy, dx);
      return;
    }
    if (cycle < 1.1) {
      e.x += Math.cos(e.aim) * e.speed * 3 * dt;
      e.y += Math.sin(e.aim) * e.speed * 3 * dt;
    } else behaviors.chase(w, e, dt, dx, dy, d);
  },
  healer(w, e, dt, dx, dy, d) {
    behaviors.shooter(w, e, dt, dx, dy, d);
    if (e.age - (e.lastHeal || 0) > 3) {
      e.lastHeal = e.age;
      for (const other of w.grid.query(e.x, e.y, 180))
        if (other.hp > 0 && other.kind !== "boss")
          other.hp = Math.min(other.maxHp, other.hp + 12);
      w.rings.push({
        x: e.x,
        y: e.y,
        r: 0,
        speed: 180,
        life: 0.8,
        maxLife: 0.8,
        color: e.color,
      });
    }
  },
  boss(w, e, dt, dx, dy, d) {
    if (d > 300) {
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
    }
    e.x += Math.cos(e.age * 0.7) * 20 * dt;
    e.y += Math.sin(e.age) * 20 * dt;
    updateBoss(w, e, dt);
  },
};
