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
    const count = 1 + p.multi;
    for (let i = 0; i < count; i++) {
      const side = (i - (count - 1) / 2) * 20;
      shot(
        w,
        p.x - Math.sin(p.angle) * side,
        p.y + Math.cos(p.angle) * side,
        p.angle,
        760,
        p.damage * 0.8,
      );
    }
    return true;
  },
  laser(w, target, dt) {
    if (!target) return;
    const p = w.player,
      count = p.multi;
    for (let i = 0; i < count; i++) {
      const a = p.angle + (i - (count - 1) / 2) * 0.12;
      w.beams.push({
        x: p.x,
        y: p.y,
        angle: a,
        length: 1000,
        width: 9 + p.pierce * 2,
        color: "#beaaff",
      });
      for (const e of w.enemies)
        if (e.hp > 0 && segmentProjection(e, p.x, p.y, a, 1000, 8 + p.pierce))
          w.hit(
            e,
            (p.damage / p.interval) * dt * (p.overdrive > 0 ? 2 : 1) * 1.3,
          );
    }
    if (p.fire <= 0) return true;
  },
  cannon(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    for (let i = 0; i < p.multi; i++)
      shot(
        w,
        p.x,
        p.y,
        p.angle + (i - (p.multi - 1) / 2) * 0.19,
        440,
        p.damage * 1.7,
        "shell",
        0,
      );
    return true;
  },
  spread(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    const count = 4 + p.multi;
    for (let i = 0; i < count; i++)
      shot(
        w,
        p.x,
        p.y,
        p.angle + (i - (count - 1) / 2) * 0.17,
        600,
        p.damage * 0.62,
        "spread",
      );
    return true;
  },
  carrier(w, target) {
    const p = w.player;
    if (!target || p.fire > 0) return;
    for (const pos of escortPositions(w)) {
      const a = Math.atan2(target.y - pos.y, target.x - pos.x);
      shot(w, pos.x, pos.y, a, 700, p.damage * 0.7, "escort");
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
