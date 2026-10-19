// Composable attack motifs with deliberate gaps and predictable rhythms.
// Every major attack alternates a telegraph and a finite firing window.
const TAU = Math.PI * 2;
export const bossPatterns = {
  curtain(w, e, phase) {
    const aim = e.aim,
      co = Math.cos(aim + Math.PI / 2),
      si = Math.sin(aim + Math.PI / 2),
      gap = (e.volley % 5) - 2;
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i - gap) <= 1) continue;
      for (let row = 0; row < (phase ? 3 : 2); row++)
        w.enemyBullet(
          { x: e.x + co * i * 48, y: e.y + si * i * 48 },
          aim,
          105 + row * 26,
          "needle",
        );
    }
  },
  braid(w, e, phase) {
    for (const side of [-1, 1])
      for (let i = 0; i < (phase ? 9 : 6); i++)
        w.enemyBullet(
          e,
          e.aim + side * (0.22 + Math.sin(e.age * 1.7 + i * 0.3) * 0.45),
          95 + i * 13,
          "petal",
        );
  },
  pincer(w, e, phase) {
    for (const side of [-1, 1]) {
      const origin = {
        x: e.x + Math.cos(e.aim + Math.PI / 2) * side * 120,
        y: e.y + Math.sin(e.aim + Math.PI / 2) * side * 120,
      };
      for (let i = -2; i <= 2; i++)
        w.enemyBullet(
          origin,
          e.aim - side * 0.25 + i * 0.1,
          phase ? 165 : 130,
          i % 2 ? "plasma" : "needle",
        );
    }
  },
  spiral(w, e, phase) {
    for (let i = 0; i < (phase ? 7 : 5); i++)
      w.enemyBullet(
        e,
        e.age * 0.65 + (i / (phase ? 7 : 5)) * TAU,
        phase ? 145 : 110,
      );
  },
  fan(w, e, phase) {
    const aim = Math.atan2(w.player.y - e.y, w.player.x - e.x);
    for (const side of [-1, 1])
      for (let i = 0; i < 7; i++)
        w.enemyBullet(
          e,
          aim + side * 0.7 + (i - 3) * 0.13,
          95 + i * 9 + (phase ? 20 : 0),
        );
  },
  flower(w, e, phase) {
    const n = phase ? 30 : 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      w.enemyBullet(e, a + e.age * 0.15, 100 + Math.sin(a * 5 + e.age) * 35);
    }
  },
  cross(w, e, phase) {
    const rot = e.age * 0.14;
    for (let arm = 0; arm < 4; arm++)
      for (let i = 0; i < (phase ? 6 : 4); i++)
        w.enemyBullet(e, rot + (arm / 4) * TAU + (i - 2) * 0.055, 100 + i * 13);
  },
  eclipse(w, e, phase) {
    bossPatterns.spiral(w, e, phase);
    if (e.volley % 3 === 0) {
      const safe = Math.atan2(w.player.y - e.y, w.player.x - e.x) + 0.5;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * TAU;
        const delta = Math.atan2(Math.sin(a - safe), Math.cos(a - safe));
        if (Math.abs(delta) > 0.4) w.enemyBullet(e, a, phase ? 135 : 100);
      }
    }
  },
};
export function updateBoss(w, e, dt) {
  const phase = e.hp / e.maxHp < 0.5;
  if (phase && !e.enraged) {
    e.enraged = true;
    e.charge = 1.4;
    e.fire = 1.4;
    w.events.emit("bossPhase", { name: e.bossName });
    w.rings.push({
      x: e.x,
      y: e.y,
      r: 60,
      speed: 90,
      life: 1.2,
      maxLife: 1.2,
      color: e.color,
    });
  }
  const cycle = e.age % 8;
  if (cycle < 1.2) {
    e.telegraph = 1 - cycle / 1.2;
    e.aim = Math.atan2(w.player.y - e.y, w.player.x - e.x);
    return;
  }
  e.telegraph = 0;
  // 1.2-second warning, 4.8-second attack, 2-second breathing room.
  if (cycle > 6) return;
  if (e.fire <= 0) {
    e.volley = (e.volley || 0) + 1;
    const motifs = e.motifs || [e.pattern || "spiral"],
      motif = motifs[Math.floor(e.age / 8) % motifs.length];
    bossPatterns[motif](w, e, phase);
    if (e.volley % 4 === 0) {
      const a = Math.atan2(w.player.y - e.y, w.player.x - e.x);
      for (let i = -2; i <= 2; i++)
        w.enemyBullet(e, a + i * 0.14, 170, "needle");
    }
    e.fire =
      e.pattern === "spiral" || e.pattern === "eclipse"
        ? phase
          ? 0.32
          : 0.5
        : phase
          ? 0.65
          : 1.05;
  }
}
