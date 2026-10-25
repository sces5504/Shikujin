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
    if (p.fire > 0) return;
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
    const p = w.player,
      tuning = TUNING.laser;
    // Without a lock the plasma ribbon runs straight up the column.
    target ??= { x: p.x, y: p.y - tuning.length };
    const aim = Math.atan2(target.y - p.y, target.x - p.x);
    // Retain one coherent plasma ribbon; the muzzle follows a smoothed angle.
    w.laserAngle ??= aim;
    const delta = Math.atan2(
      Math.sin(aim - w.laserAngle),
      Math.cos(aim - w.laserAngle),
    );
    w.laserAngle += delta * Math.min(1, dt * tuning.tracking);
    const length = Math.min(
        tuning.length,
        Math.hypot(target.x - p.x, target.y - p.y),
      ),
      ex = p.x + Math.cos(aim) * length,
      ey = p.y + Math.sin(aim) * length,
      cx = p.x + Math.cos(w.laserAngle) * length * 0.65,
      cy = p.y + Math.sin(w.laserAngle) * length * 0.65,
      points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20,
        q = 1 - t;
      // A traveling plasma wave keeps a locked ribbon alive, with zero endpoint displacement.
      const wave =
        Math.sin(Math.PI * t) ** 2 *
        Math.sin(
          w.time * tuning.waveSpeed - t * Math.PI * 2 * tuning.waveCycles,
        ) *
        Math.min(tuning.waveAmplitude, length * 0.1);
      points.push({
        x: q * q * p.x + 2 * q * t * cx + t * t * ex - Math.sin(aim) * wave,
        y: q * q * p.y + 2 * q * t * cy + t * t * ey + Math.cos(aim) * wave,
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
    if (p.fire > 0) return;
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
    if (p.fire > 0) return;
    const t = TUNING.spread,
      count = t.baseCount + p.multi,
      spacing = Math.min(t.spacing, t.fan / Math.max(1, count - 1));
    for (let i = 0; i < count; i++)
      shot(
        w,
        p.x,
        p.y,
        p.angle + (i - (count - 1) / 2) * spacing,
        t.speed,
        p.damage * t.damage,
        t.type,
      );
    return true;
  },
  // Rail: one hypersonic piercing slug plus paired side needles per multi level.
  rail(w) {
    const p = w.player;
    if (p.fire > 0) return;
    const t = TUNING.rail;
    shot(
      w,
      p.x,
      p.y - 20,
      p.angle,
      t.speed,
      p.damage * t.damage,
      t.type,
      t.pierce + p.pierce * t.pierceStep,
    );
    for (let k = 1; k < p.multi; k++)
      for (const side of [-1, 1])
        shot(
          w,
          p.x + side * 16,
          p.y,
          p.angle + side * k * t.needleSpread,
          t.speed * 0.7,
          p.damage * t.needleDamage,
          t.needle,
        );
    return true;
  },
  carrier(w, target) {
    const p = w.player;
    if (p.fire > 0) return;
    const t = TUNING.carrier;
    for (const pos of escortPositions(w)) {
      const a = target
        ? Math.atan2(target.y - pos.y, target.x - pos.x)
        : pos.angle;
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
    w.muzzleUntil = w.time + 0.055;
    p.fire = p.interval / (p.overdrive > 0 ? 2 : 1);
    w.events.emit("shoot", {});
  }
}
