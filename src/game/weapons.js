import { WEAPON_TUNING as TUNING } from "../content/weapons.js";
import { weaponHit } from "./builds.js";
// Main weapons share upgrades, but retain distinct targeting, geometry and cadence.
export const segmentProjection = (e, x, y, angle, length, radius) => {
  const dx = e.x - x,
    dy = e.y - y,
    co = Math.cos(angle),
    si = Math.sin(angle),
    t = dx * co + dy * si;
  return t >= 0 && t <= length && Math.abs(dx * si - dy * co) < e.r + radius;
};
export function escortPositions(w) {
  const p = w.player,
    a = p.angle,
    co = Math.cos(a),
    si = Math.sin(a);
  return [-1, 1].map((side) => ({
    x: p.x - co * 25 - si * side * 61,
    y: p.y - si * 25 + co * side * 61,
    angle: a,
  }));
}
const shot = (w, x, y, a, s, d, kind = "shot", pierce = w.player.pierce) =>
  w.playerBullet(x, y, a, s, d, pierce, kind);
export const mainWeapons = {
  twin(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    const t = TUNING.twin,
      count = 1 + p.multi;
    for (let i = 0; i < count; i++) {
      const side = (i - (count - 1) / 2) * t.spacing;
      shot(
        w,
        p.x - Math.sin(p.angle) * side,
        p.y + Math.cos(p.angle) * side,
        p.angle,
        t.speed,
        p.damage * t.damage,
        t.type,
      );
    }
    return true;
  },
  laser(w, target, dt) {
    if (!target) return;
    const p = w.player,
      tuning = TUNING.laser;
    // Retain one coherent plasma ribbon; the muzzle follows a smoothed angle.
    w.laserAngle ??= p.angle;
    const delta = Math.atan2(
      Math.sin(p.angle - w.laserAngle),
      Math.cos(p.angle - w.laserAngle),
    );
    w.laserAngle += delta * Math.min(1, dt * tuning.tracking);
    const length = Math.min(
        tuning.length,
        Math.hypot(target.x - p.x, target.y - p.y),
      ),
      ex = p.x + Math.cos(p.angle) * length,
      ey = p.y + Math.sin(p.angle) * length,
      cx = p.x + Math.cos(w.laserAngle) * length * 0.65,
      cy = p.y + Math.sin(w.laserAngle) * length * 0.65,
      points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20,
        q = 1 - t;
      points.push({
        x: q * q * p.x + 2 * q * t * cx + t * t * ex,
        y: q * q * p.y + 2 * q * t * cy + t * t * ey,
      });
    }
    const last = points.at(-1),
      prev = points.at(-2),
      tangent = Math.atan2(last.y - prev.y, last.x - prev.x);
    if (length < tuning.length)
      points.push({
        x: last.x + Math.cos(tangent) * (tuning.length - length),
        y: last.y + Math.sin(tangent) * (tuning.length - length),
      });
    const width =
      tuning.width +
      (p.multi - 1) * tuning.multiWidth +
      p.pierce * tuning.pierceWidth;
    w.beams.push({
      x: p.x,
      y: p.y,
      angle: w.laserAngle,
      length,
      width,
      color: "#beaaff",
      points,
    });
    for (const e of w.enemies) {
      if (e.hp <= 0) continue;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          dx = b.x - a.x,
          dy = b.y - a.y,
          len = dx * dx + dy * dy,
          t = len
            ? Math.max(
                0,
                Math.min(1, ((e.x - a.x) * dx + (e.y - a.y) * dy) / len),
              )
            : 0;
        if (
          Math.hypot(e.x - a.x - dx * t, e.y - a.y - dy * t) <
          e.r + width / 2
        ) {
          weaponHit(
            w,
            e,
            (p.damage / p.interval) *
              dt *
              (p.overdrive > 0 ? 2 : 1) *
              tuning.damage *
              (1 +
                (p.multi - 1) * tuning.multiDamage +
                p.pierce * tuning.pierceDamage),
          );
          break;
        }
      }
    }
    if (p.fire <= 0) return true;
  },
  cannon(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    const t = TUNING.cannon;
    for (let i = 0; i < p.multi; i++)
      shot(
        w,
        p.x,
        p.y,
        p.angle + (i - (p.multi - 1) / 2) * t.spacing,
        t.speed,
        p.damage * t.damage,
        t.type,
        0,
      );
    return true;
  },
  spread(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    const t = TUNING.spread,
      count = t.baseCount + p.multi;
    for (let i = 0; i < count; i++)
      shot(
        w,
        p.x,
        p.y,
        p.angle + (i - (count - 1) / 2) * t.spacing,
        t.speed,
        p.damage * t.damage,
        t.type,
      );
    return true;
  },
  carrier(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    const t = TUNING.carrier;
    for (const pos of escortPositions(w)) {
      const a = Math.atan2(target.y - pos.y, target.x - pos.x);
      shot(
        w,
        pos.x,
        pos.y,
        a,
        t.speed,
        p.damage * t.damage * (1 + (p.multi - 1) * t.multiDamage),
        t.type,
      );
    }
    return true;
  },
};
export function fireMainWeapon(w, target, dt) {
  const p = w.player;
  p.fire -= dt;
  w.beams.length = 0;
  const fired = (mainWeapons[w.ship.weapon] || mainWeapons.twin)(w, target, dt);
  if (fired) {
    p.fire = p.interval / (p.overdrive > 0 ? 2 : 1);
    w.events.emit("shoot", {});
  }
}
