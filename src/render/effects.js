const TAU = Math.PI * 2;
function polygon(c, x, y, r, n, a = 0) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const t = a + (i / n) * TAU;
    c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
  }
  c.closePath();
}
function star(c, x, y, r, color) {
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - r, y);
  c.lineTo(x + r, y);
  c.moveTo(x, y - r);
  c.lineTo(x, y + r);
  c.stroke();
}
export function energyBeam(c, b, time) {
  if (b.points) {
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    const path = () => {
      c.beginPath();
      b.points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    };
    for (const [scale, color] of [
      [2.6, b.color + "20"],
      [1.5, b.color + "55"],
      [0.72, b.color],
      [0.23, "#fffaf1"],
    ]) {
      c.lineWidth = b.width * scale;
      c.strokeStyle = color;
      path();
      c.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const index = Math.floor((time * 18 + i * 5) % 20),
        p = b.points[index];
      star(c, p.x, p.y, b.width * 0.4, "#fffaff99");
    }
    const end = b.points.at(-1);
    star(c, end.x, end.y, b.width * 1.1, "#fff5dc");
    c.restore();
    return;
  }
  c.save();
  c.translate(b.x, b.y);
  c.rotate(b.angle);
  const width = b.width,
    pulse = 1 + Math.sin(time * 24) * 0.08;
  const glow = c.createLinearGradient(0, -width * 1.5, 0, width * 1.5);
  glow.addColorStop(0, b.color + "00");
  glow.addColorStop(0.3, b.color + "35");
  glow.addColorStop(0.5, b.color + "c0");
  glow.addColorStop(0.7, b.color + "35");
  glow.addColorStop(1, b.color + "00");
  c.fillStyle = glow;
  c.fillRect(15, -width * 1.5, b.length, width * 3);
  c.fillStyle = b.color;
  c.beginPath();
  c.moveTo(10, 0);
  c.lineTo(50, -width * 0.42 * pulse);
  c.lineTo(b.length, -width * 0.2);
  c.lineTo(b.length, width * 0.2);
  c.lineTo(50, width * 0.42 * pulse);
  c.closePath();
  c.fill();
  c.fillStyle = "#fffaf0";
  c.fillRect(
    25,
    -Math.max(1.5, width * 0.1),
    b.length - 25,
    Math.max(3, width * 0.2),
  );
  c.strokeStyle = "#fff6caaa";
  c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const x = (time * 260 + i * 115) % b.length;
    c.beginPath();
    c.moveTo(x, -width * 0.6);
    c.lineTo(x + 28, -width * 0.2);
    c.lineTo(x + 44, width * 0.6);
    c.stroke();
  }
  star(c, 26, 0, width * 0.9, "#fffbea");
  c.restore();
}
function clock(c, w, remaining) {
  const p = w.player,
    t = w.time,
    r = 215;
  c.save();
  c.translate(p.x, p.y);
  const g = c.createRadialGradient(0, 0, 25, 0, 0, r);
  g.addColorStop(0, "#5a3aab05");
  g.addColorStop(0.8, "#7964d50b");
  g.addColorStop(1, "#bdadff20");
  c.fillStyle = g;
  c.fillRect(-r, -r, r * 2, r * 2);
  c.strokeStyle = "#c6bcff99";
  c.lineWidth = 2;
  polygon(c, 0, 0, r, 12, -Math.PI / 2);
  c.stroke();
  c.strokeStyle = "#c6bcff66";
  c.lineWidth = 1;
  polygon(c, 0, 0, r - 14, 12, -Math.PI / 2);
  c.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU,
      major = i % 5 === 0,
      outer = r - 22,
      inner = outer - (major ? 14 : 5);
    c.strokeStyle = major ? "#e6ddff" : "#9c8cca80";
    c.lineWidth = major ? 3 : 1;
    c.beginPath();
    c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    c.stroke();
    if (major) {
      c.fillStyle = "#f1eaff";
      c.font = "600 14px Rajdhani, sans-serif";
      c.textAlign = "center";
      c.fillText(
        String(i === 0 ? 3 : ((i / 5 + 3 - 1) % 12) + 1),
        Math.cos(a) * (r - 52),
        Math.sin(a) * (r - 52) + 5,
      );
    }
  }
  // Clock hands visibly arrest time instead of resembling a damage pulse.
  for (const [a, len, width] of [
    [-0.9, 105, 4],
    [-2.3, 150, 2],
  ]) {
    c.strokeStyle = "#d6ccffbb";
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    c.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.08;
    star(c, Math.cos(a) * r, Math.sin(a) * r, 6, "#dacfff");
  }
  c.fillStyle = "#e0d5ff";
  c.font = "600 12px Rajdhani, sans-serif";
  c.textAlign = "center";
  c.fillText(`CHRONOSTASIS / ${remaining.toFixed(1)}s`, 0, r + 27);
  c.restore();
}
function sanctuary(c, w) {
  const p = w.player,
    t = w.time;
  c.save();
  c.translate(p.x, p.y);
  for (let side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    c.rotate(Math.sin(t * 2) * 0.035);
    for (let feather = 0; feather < 6; feather++) {
      const x = 45 + feather * 24,
        y = -45 + feather * 9;
      const g = c.createLinearGradient(x, y, x + 45, y + 90);
      g.addColorStop(0, "#e1fff9b0");
      g.addColorStop(0.5, "#79fce559");
      g.addColorStop(1, "#4ab9ea00");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 60, y - 55, x + 75, y - 20);
      c.quadraticCurveTo(x + 30, y + 52, x - 12, y + 64);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.25,
      x = Math.cos(a) * 116,
      y = Math.sin(a) * 116;
    c.fillStyle = "#9affdf14";
    c.strokeStyle = "#b5ffe6b0";
    c.lineWidth = 2;
    polygon(c, x, y, 33, 6, a);
    c.fill();
    c.stroke();
    c.strokeStyle = "#edfff5";
    c.beginPath();
    c.moveTo(x - 9, y);
    c.lineTo(x + 9, y);
    c.moveTo(x, y - 9);
    c.lineTo(x, y + 9);
    c.stroke();
  }
  c.strokeStyle = "#a9ffe680";
  c.lineWidth = 2;
  polygon(c, 0, 0, 145, 6, t * 0.25);
  c.stroke();
  for (let i = 0; i < 14; i++) {
    const x = Math.sin(i * 37.4) * 160,
      y = 110 - ((t * 50 + i * 31) % 230);
    star(c, x, y, 3, "#b9ffdd99");
  }
  c.restore();
}
function targeting(c, st, time) {
  c.save();
  c.translate(st.x, st.y);
  c.rotate(time * 0.4);
  const r = st.r * 0.7;
  c.strokeStyle = "#ffb4d1";
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    c.save();
    c.rotate((i / 4) * TAU);
    c.beginPath();
    c.moveTo(r - 22, -r);
    c.lineTo(r, -r);
    c.lineTo(r, -r + 22);
    c.stroke();
    c.restore();
  }
  c.setLineDash([8, 14]);
  c.strokeStyle = "#ff8dbb80";
  polygon(c, 0, 0, r * 0.78, 8);
  c.stroke();
  c.setLineDash([]);
  c.restore();
  c.fillStyle = "#ffd8e8";
  c.font = "600 11px Rajdhani, sans-serif";
  c.textAlign = "center";
  c.fillText(
    `ORBITAL LOCK ${Math.max(0, st.delay).toFixed(1)}`,
    st.x,
    st.y - r - 12,
  );
  star(c, st.x, st.y, 16, "#fff2f9");
}
function impact(c, ex, time) {
  const age = 1 - ex.life / ex.maxLife,
    r = ex.r * (0.22 + age * 0.95),
    orbital = ex.kind === "orbital";
  c.save();
  c.translate(ex.x, ex.y);
  c.globalAlpha = 1 - age;
  if (orbital) {
    const beam = c.createLinearGradient(-46, 0, 46, 0);
    beam.addColorStop(0, "#e576ff00");
    beam.addColorStop(0.35, "#ff8cd680");
    beam.addColorStop(0.5, "#fff2f9ff");
    beam.addColorStop(0.65, "#ff8cd680");
    beam.addColorStop(1, "#e576ff00");
    c.fillStyle = beam;
    c.fillRect(-46, -1100, 92, 1100);
  }
  c.strokeStyle = orbital ? "#ffc4e6" : "#ffd39d";
  c.lineWidth = 6 * (1 - age) + 1;
  polygon(c, 0, 0, r, 12, time * 0.1);
  c.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    c.strokeStyle = i % 2 ? "#ffb1dd" : "#fff9e8";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    c.lineTo(
      Math.cos(a) * r * (1.1 + Math.sin(i * 17) * 0.15),
      Math.sin(a) * r * 1.2,
    );
    c.stroke();
  }
  star(c, 0, 0, ex.r * (1 - age) * 0.55, "#fff9eb");
  c.restore();
}
export function combatEffects(c, w) {
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const b of w.arcEffects || []) {
    c.globalAlpha = b.life / 0.18;
    energyBeam(c, b, w.time);
  }
  c.globalAlpha = 1;
  for (const b of w.beams) energyBeam(c, b, w.time);
  const u = w.ultimate,
    p = w.player;
  if (u) {
    if (u.kind === "overdrive") {
      energyBeam(
        c,
        {
          x: p.x,
          y: p.y,
          angle: p.angle,
          length: 1050,
          width: 58,
          color: "#ffab51",
        },
        w.time,
      );
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      for (const side of [-1, 1]) {
        c.strokeStyle = "#ffd29a";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-15, side * 57);
        c.lineTo(32, side * 57);
        c.lineTo(54, side * 29);
        c.stroke();
        star(c, 20, side * 48, 11, "#fff5dc");
      }
      c.restore();
    }
    if (u.kind === "stasis") clock(c, w, u.remaining);
    if (u.kind === "repair") sanctuary(c, w);
    if (u.kind === "nova") {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(w.time * 0.2);
      c.strokeStyle = "#ffbfdf99";
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        polygon(c, 100, 0, 18, 4, Math.PI / 4);
        c.stroke();
      }
      c.restore();
    }
  }
  for (const st of w.strikes) targeting(c, st, w.time);
  for (const ex of w.impacts) impact(c, ex, w.time);
  c.restore();
}
