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
const move = (e, vx, vy, dt) => {
  e.vx = vx;
  e.vy = vy;
  e.x += vx * dt;
  e.y += vy * dt;
};
// Shared entry paths for squadron members; everything flows down the vertical stage.
function flight(w, e, dt, dx) {
  const path = e.path || { mode: "dive" },
    s = e.speed;
  if (path.mode === "snake") {
    const x = path.cx + Math.sin(e.y * 0.0085 + path.phase) * path.amp;
    e.vx = (x - e.x) / Math.max(dt, 1e-6);
    e.x = x;
    e.vy = s * 1.55;
    e.y += e.vy * dt;
  } else if (path.mode === "sweep")
    move(e, path.dir * s * 2.1, s * 0.35 + e.age * 26, dt);
  else if (path.mode === "arc")
    move(e, path.dir * s * 1.7 * Math.cos(e.age * 0.85), s * 1.15, dt);
  else {
    // Dive: drift toward the ship until level with it, then commit.
    const steer =
      e.y < w.player.y - 220 ? Math.max(-0.55, Math.min(0.55, dx / 300)) : 0;
    const vx = e.vx || 0;
    move(e, vx + (steer * s - vx) * Math.min(1, dt * 2), s * 1.7, dt);
  }
}
export const behaviors = {
  chase(w, e, dt, dx, dy, d) {
    if (e.kind === "scout" && e.fire <= 0) {
      // Early squadrons only take potshots; later waves add a second barrel.
      if (w.wave >= 6 || e.id % 2)
        patterns.aimed(w, e, w.wave >= 6 ? 2 : 1, 0.2, 165);
      e.fire = 4.4;
    }
    flight(w, e, dt, dx);
  },
  shooter(w, e, dt, dx, dy, d) {
    const path = e.path || {};
    const stopY = path.stopY ?? -380;
    if (!e.leaving && e.y < stopY) move(e, 0, e.speed * 2.6, dt);
    else {
      e.hold = (e.hold || 0) + dt;
      if (e.hold > (path.hold || 6)) e.leaving = true;
      move(
        e,
        Math.sin(e.age * 0.9 + e.id) * e.speed * 0.6,
        e.leaving ? Math.min(e.speed * 2.2, (e.vy || 0) + 160 * dt) : 0,
        dt,
      );
    }
    if (e.fire <= 0) {
      e.salvo = (e.salvo || 0) + 1;
      if (e.salvo % 3 === 0) {
        for (let i = -2; i <= 2; i++)
          w.enemyBullet(
            e,
            Math.atan2(dy, dx) + i * 0.12,
            130 + Math.abs(i) * 22,
            "plasma",
          );
      } else patterns.aimed(w, e, 3, 0.18, 160);
      e.fire = 2.8;
    }
  },
  orbit(w, e, dt, dx, dy, d) {
    flight(w, e, dt, dx);
    if (e.fire <= 0) {
      for (let i = -1; i <= 1; i++)
        w.enemyBullet(e, Math.atan2(dy, dx) + i * 0.28, 155, "petal");
      e.fire = 3.6;
    }
  },
  tank(w, e, dt, dx, dy, d) {
    // Heavy gunships crawl with the scroll and act as a moving turret.
    move(e, Math.sin(e.age * 0.5) * 18, e.y < -420 ? 120 : 52, dt);
    if (e.fire <= 0) {
      e.salvo = (e.salvo || 0) + 1;
      patterns.ring(w, e, 12, e.age * 0.5, 95);
      if (e.salvo % 2 === 0) patterns.aimed(w, e, 3, 0.22, 190);
      e.fire = 3.4;
    }
  },
  charger(w, e, dt, dx, dy, d) {
    if (!e.armed) {
      move(e, 0, e.speed * 2.6, dt);
      if (e.y > -380) {
        e.armed = true;
        e.cycleAge = 0;
      }
      e.aim = Math.atan2(dy, dx);
      return;
    }
    e.cycleAge += dt;
    const cycle = e.cycleAge % 3.2;
    e.telegraph = cycle < 0.7 ? 1 - cycle / 0.7 : 0;
    if (cycle < 0.7) {
      e.discharged = false;
      e.aim = Math.atan2(dy, dx);
      move(e, 0, 0, dt);
      return;
    }
    if (!e.discharged) {
      e.discharged = true;
      for (const side of [-1, 1])
        for (let i = -1; i <= 1; i++)
          w.enemyBullet(
            e,
            e.aim + (side * Math.PI) / 2 + i * 0.2,
            125,
            "plasma",
          );
    }
    const burst = cycle < 1.5 ? 4.2 : 0.9;
    move(
      e,
      Math.cos(e.aim) * e.speed * burst,
      Math.sin(e.aim) * e.speed * burst,
      dt,
    );
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
  carrier(w, e, dt) {
    const dir = e.path?.dir || 1;
    move(e, dir * e.speed, Math.sin(e.age * 0.8) * 14 + 6, dt);
  },
  boss(w, e, dt, dx, dy, d) {
    // Descend into the upper third, then patrol side to side above the player.
    const home = -250;
    if (!e.entered) {
      move(e, 0, 120, dt);
      if (e.y >= home) e.entered = true;
      e.fire = Math.max(e.fire, 0.6);
      return;
    }
    e.patrol = (e.patrol || 0) + dt;
    const tx = Math.sin(e.patrol * 0.32) * 190,
      ty = home + Math.sin(e.patrol * 0.55) * 36 + (e.enraged ? 40 : 0);
    move(e, (tx - e.x) * 1.6, (ty - e.y) * 1.6, dt);
    updateBoss(w, e, dt);
  },
};
