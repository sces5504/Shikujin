import { BOSSES } from "../content/encounters.js";
import { RULES } from "../content/catalog.js";
export function drawShip(
  ctx,
  x,
  y,
  angle,
  color,
  shape = 0,
  size = 24,
  time = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.shadowColor = color;
  ctx.shadowBlur = size > 50 ? 24 : 10;
  const forms = [
    [
      [0, -1],
      [0.24, -0.15],
      [0.88, 0.65],
      [0.26, 0.4],
      [0, 0.7],
      [-0.26, 0.4],
      [-0.88, 0.65],
      [-0.24, -0.15],
    ],
    [
      [0, -1.2],
      [0.2, -0.1],
      [0.72, 0.85],
      [0, 0.4],
      [-0.72, 0.85],
      [-0.2, -0.1],
    ],
    [
      [0, -0.95],
      [0.68, -0.35],
      [0.95, 0.5],
      [0.32, 0.8],
      [0, 0.4],
      [-0.32, 0.8],
      [-0.95, 0.5],
      [-0.68, -0.35],
    ],
    [
      [0, -1.1],
      [0.24, -0.2],
      [1, -0.08],
      [0.65, 0.25],
      [0.9, 0.8],
      [0.2, 0.5],
      [0, 0.75],
      [-0.2, 0.5],
      [-0.9, 0.8],
      [-0.65, 0.25],
      [-1, -0.08],
      [-0.24, -0.2],
    ],
    [
      [0, -0.9],
      [0.42, -0.6],
      [0.52, -0.1],
      [0.95, 0.4],
      [0.7, 0.85],
      [0.25, 0.55],
      [0, 0.8],
      [-0.25, 0.55],
      [-0.7, 0.85],
      [-0.95, 0.4],
      [-0.52, -0.1],
      [-0.42, -0.6],
    ],
  ];
  const points = forms[shape] || forms[0];
  const path = () => {
    ctx.beginPath();
    for (const [a, b] of points) ctx.lineTo(a * size, b * size);
    ctx.closePath();
  };
  const hull = ctx.createLinearGradient(-size, -size, size, size);
  hull.addColorStop(0, "#102330");
  hull.addColorStop(0.45, color + "65");
  hull.addColorStop(0.5, "#b1d4da66");
  hull.addColorStop(0.55, "#193441");
  hull.addColorStop(1, "#07131f");
  ctx.fillStyle = hull;
  ctx.strokeStyle = color;
  ctx.lineWidth = size > 50 ? 1.5 : 1.1;
  path();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Separate armor plates and emissive wing tips keep silhouettes readable at combat scale.
  for (const side of [-1, 1]) {
    ctx.fillStyle = color + "28";
    ctx.strokeStyle = color + "77";
    ctx.beginPath();
    ctx.moveTo(side * size * 0.23, -size * 0.1);
    ctx.lineTo(side * size * 0.65, size * 0.5);
    ctx.lineTo(side * size * 0.27, size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(side * size * 0.59, size * 0.36);
    ctx.lineTo(side * size * 0.75, size * 0.59);
    ctx.stroke();
    ctx.fillStyle = "#09121f";
    ctx.fillRect(
      side * size * 0.24 - size * 0.05,
      size * 0.25,
      size * 0.1,
      size * 0.22,
    );
  }
  const glass = ctx.createLinearGradient(0, -size, 0, size * 0.4);
  glass.addColorStop(0, "#f0ffff");
  glass.addColorStop(0.45, color);
  glass.addColorStop(1, "#235767");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.72);
  ctx.lineTo(size * 0.13, size * 0.15);
  ctx.lineTo(0, size * 0.27);
  ctx.lineTo(-size * 0.13, size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e8ffff99";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.67);
  ctx.lineTo(0, size * 0.2);
  ctx.stroke();
  const flame = size * (0.7 + Math.sin(time * 34) * 0.12);
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  for (const side of [-1, 1]) {
    const sx = side * size * 0.21,
      jet = ctx.createLinearGradient(0, size * 0.45, 0, size * 0.5 + flame);
    jet.addColorStop(0, "#ffffff");
    jet.addColorStop(0.2, color);
    jet.addColorStop(1, color + "00");
    ctx.fillStyle = jet;
    ctx.beginPath();
    ctx.moveTo(sx - size * 0.075, size * 0.43);
    ctx.quadraticCurveTo(sx - size * 0.06, size * 0.7, sx, size * 0.5 + flame);
    ctx.quadraticCurveTo(
      sx + size * 0.06,
      size * 0.7,
      sx + size * 0.075,
      size * 0.43,
    );
    ctx.fill();
  }
  ctx.restore();
}
function polygon(c, x, y, r, n, a = 0) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const t = a + (i / n) * Math.PI * 2;
    c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
  }
  c.closePath();
}
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.width = 0;
    this.height = 0;
    this.scale = 1;
    this.reduced = false;
    this.stars = Array.from({ length: 170 }, (_, i) => ({
      x: (Math.sin(i * 127.1) * 43758) % 1,
      y: (Math.sin(i * 311.7) * 96321) % 1,
      z: ((i % 3) + 1) / 3,
    }));
    this.bossAtlas = new Image();
    this.bossAtlas.src = new URL(
      "../../assets/bosses.webp",
      import.meta.url,
    ).href;
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.scale = Math.max(
      0.6,
      Math.min(1.1, Math.min(this.width / 1120, this.height / 750)),
    );
  }
  render(w, time) {
    const c = this.ctx,
      W = this.width,
      H = this.height,
      d = this.dpr;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = w ? w.map.bg : "#050e1b";
    c.fillRect(0, 0, W, H);
    const px = w?.player.x ?? time * 6,
      py = w?.player.y ?? time * 4;
    const nebula = c.createRadialGradient(
      W * 0.6,
      H * 0.3,
      0,
      W * 0.6,
      H * 0.3,
      W * 0.7,
    );
    nebula.addColorStop(0, (w?.map.accent || "#12313e") + "a0");
    nebula.addColorStop(1, "#05091400");
    c.fillStyle = nebula;
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#b8dfe6";
    for (const s of this.stars) {
      const x = (((s.x * W - px * s.z * 0.12) % W) + W) % W,
        y = (((s.y * H - py * s.z * 0.12) % H) + H) % H;
      c.globalAlpha = 0.2 + s.z * 0.45;
      c.fillRect(x, y, s.z * 1.8, s.z * 1.8);
    }
    c.globalAlpha = 1;
    c.save();
    c.translate(W / 2, H / 2);
    c.scale(this.scale, this.scale);
    c.translate(-px, -py);
    if (w && !this.reduced)
      c.translate(Math.sin(time * 87) * w.shake, Math.cos(time * 97) * w.shake);
    c.strokeStyle = (w?.map.color || "#46dcdf") + "0c";
    c.lineWidth = 1;
    const spanX = W / this.scale / 2 + 120,
      spanY = H / this.scale / 2 + 120;
    for (
      let x = Math.floor((px - spanX) / 100) * 100;
      x < px + spanX;
      x += 100
    ) {
      c.beginPath();
      c.moveTo(x, py - spanY);
      c.lineTo(x, py + spanY);
      c.stroke();
    }
    for (
      let y = Math.floor((py - spanY) / 100) * 100;
      y < py + spanY;
      y += 100
    ) {
      c.beginPath();
      c.moveTo(px - spanX, y);
      c.lineTo(px + spanX, y);
      c.stroke();
    }
    // Ancient orbital structures, seen through the scrolling star field.
    c.strokeStyle = (w?.map.color || "#46dcdf") + "12";
    c.lineWidth = 2;
    for (const [x, y, r] of [
      [-400, -200, 290],
      [650, 460, 420],
      [-900, 900, 330],
      [1100, -1100, 470],
    ]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x, y, r - 22, 0.2, Math.PI * 1.5);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * (r - 30), y + Math.sin(a) * (r - 30));
        c.lineTo(x + Math.cos(a) * (r + 30), y + Math.sin(a) * (r + 30));
        c.stroke();
      }
    }
    if (!w) {
      c.restore();
      return;
    }
    if (w.bossArena) {
      const a = w.bossArena;
      c.save();
      c.strokeStyle = a.color + "66";
      c.lineWidth = 3;
      c.setLineDash([25, 15]);
      c.beginPath();
      c.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = a.color + "15";
      c.lineWidth = 22;
      c.stroke();
      c.restore();
    }
    const visible = (e, r = 100) =>
      Math.abs(e.x - px) < spanX + r && Math.abs(e.y - py) < spanY + r;
    c.strokeStyle = "#ff9d782f";
    c.lineWidth = 4;
    c.strokeRect(-RULES.arena, -RULES.arena, RULES.arena * 2, RULES.arena * 2);
    c.globalCompositeOperation = "lighter";
    for (const drop of w.drops) {
      if (!visible(drop)) continue;
      c.fillStyle = "#70f6da";
      c.shadowColor = "#6affd6";
      c.shadowBlur = this.reduced ? 0 : 10;
      polygon(c, drop.x, drop.y, 4, 4, time);
      c.fill();
    }
    c.shadowBlur = 0;
    for (const e of w.enemies) {
      if (!visible(e)) continue;
      const boss = e.kind === "boss";
      if (e.telegraph > 0) {
        c.save();
        c.globalAlpha = e.telegraph * 0.5;
        c.strokeStyle = e.color;
        c.lineWidth = 1;
        c.setLineDash([8, 9]);
        c.beginPath();
        c.arc(e.x, e.y, e.r + 28 + (1 - e.telegraph) * 30, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(
          e.x + Math.cos(e.aim || 0) * 650,
          e.y + Math.sin(e.aim || 0) * 650,
        );
        c.stroke();
        c.setLineDash([]);
        c.restore();
      }

      if (
        boss &&
        Number.isInteger(e.bossSprite) &&
        this.bossAtlas.complete &&
        this.bossAtlas.naturalWidth
      ) {
        const index = e.bossSprite,
          cell = this.bossAtlas.naturalWidth / 3;
        c.save();
        c.globalCompositeOperation = "source-over";
        c.shadowBlur = 0;
        c.translate(e.x, e.y);
        c.rotate(
          e.pattern === "spiral" || e.pattern === "eclipse"
            ? e.age * 0.1
            : Math.atan2(w.player.y - e.y, w.player.x - e.x) + Math.PI / 2,
        );
        c.drawImage(
          this.bossAtlas,
          (index % 3) * cell,
          Math.floor(index / 3) * cell,
          cell,
          cell,
          -e.r * 1.6,
          -e.r * 1.6,
          e.r * 3.2,
          e.r * 3.2,
        );
        c.globalCompositeOperation = "lighter";
        if (e.flash) {
          c.fillStyle = "#ffffff44";
          c.beginPath();
          c.arc(0, 0, e.r * 0.65, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
        continue;
      }
      c.strokeStyle = e.flash ? "#fff" : e.color;
      c.fillStyle = e.color + "18";
      c.lineWidth = boss ? 3 : 1.7;
      c.shadowColor = e.color;
      c.shadowBlur = this.reduced ? 0 : boss ? 24 : 9;
      polygon(c, e.x, e.y, e.r, e.shape, e.age * (boss ? 0.2 : 0.6));
      c.fill();
      c.stroke();
      polygon(c, e.x, e.y, e.r * 0.52, e.shape, -e.age);
      c.stroke();
      c.fillStyle = e.color;
      polygon(c, e.x, e.y, e.r * 0.14, 4, 0);
      c.fill();
      if (boss) {
        for (let i = 0; i < 6; i++) {
          const a = e.age * 0.6 + (i / 6) * Math.PI * 2;
          polygon(
            c,
            e.x + Math.cos(a) * e.r * 0.75,
            e.y + Math.sin(a) * e.r * 0.75,
            7,
            4,
            a,
          );
          c.stroke();
        }
      } else if (e.hp < e.maxHp) {
        c.shadowBlur = 0;
        c.fillStyle = "#ffffff20";
        c.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 2);
        c.fillStyle = e.color;
        c.fillRect(e.x - e.r, e.y - e.r - 8, (e.r * 2 * e.hp) / e.maxHp, 2);
      }
    }
    for (const b of w.bullets) {
      if (!visible(b, 20)) continue;
      const color = b.enemy
        ? "#ff859e"
        : b.kind === "missile"
          ? "#ffc481"
          : b.crit
            ? "#fff4bd"
            : w.ship.color;
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = b.enemy ? 2 : 3;
      c.shadowColor = color;
      c.shadowBlur = this.reduced ? 0 : 10;
      if (b.enemy) {
        c.beginPath();
        c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(b.x, b.y);
        c.lineTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022);
        c.stroke();
      }
    }
    c.shadowBlur = 0;
    for (const p of w.particles) {
      if (this.reduced && p.r < 2) continue;
      c.globalAlpha = Math.min(1, p.life * 2);
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, p.r * 2, p.r * 2);
    }
    c.globalAlpha = 1;
    for (const r of w.rings) {
      c.globalAlpha = r.life / r.maxLife;
      c.strokeStyle = r.color;
      c.lineWidth = 4;
      c.beginPath();
      c.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
    const p = w.player;
    const drones = w.upgrades.drone || 0;
    for (let i = 0; i < drones; i++) {
      const a = w.time * 1.8 + (i / drones) * Math.PI * 2;
      const radius = w.evolutions.includes("singularity") ? 125 : 85;
      drawShip(
        c,
        p.x + Math.cos(a) * radius,
        p.y + Math.sin(a) * radius,
        a + Math.PI / 2,
        "#b9b1ff",
        1,
        9,
        time,
      );
    }
    if (p.shield > 0) {
      c.strokeStyle = w.stasis > 0 ? "#c3b1ff" : "#74f7ed";
      c.globalAlpha = 0.15 + (0.2 * p.shield) / p.maxShield;
      c.lineWidth = 1.5;
      polygon(c, p.x, p.y, 30, 6, time * 0.2);
      c.stroke();
      c.globalAlpha = 1;
    }
    if (p.overdrive > 0) {
      c.strokeStyle = "#ffab82";
      c.beginPath();
      c.arc(p.x, p.y, 40, time * 4, time * 4 + Math.PI * 1.5);
      c.stroke();
    }
    if (p.invuln <= 0 || Math.floor(time * 16) % 2)
      drawShip(c, p.x, p.y, p.angle, w.ship.color, w.ship.shape, 23, time);
    c.fillStyle = "#ffffff";
    c.shadowColor = w.ship.color;
    c.shadowBlur = 8;
    c.beginPath();
    c.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.globalCompositeOperation = "source-over";
    c.restore();
    const bossTarget = w.enemies.find((e) => e.kind === "boss" && e.hp > 0);
    if (bossTarget) {
      const dx = (bossTarget.x - px) * this.scale,
        dy = (bossTarget.y - py) * this.scale;
      if (Math.abs(dx) > W / 2 - 70 || Math.abs(dy) > H / 2 - 110) {
        const angle = Math.atan2(dy, dx),
          distance = Math.min(
            (W / 2 - 50) / Math.max(0.01, Math.abs(Math.cos(angle))),
            (H / 2 - 130) / Math.max(0.01, Math.abs(Math.sin(angle))),
          );
        c.save();
        c.translate(
          W / 2 + Math.cos(angle) * distance,
          H / 2 + Math.sin(angle) * distance,
        );
        c.rotate(angle);
        c.fillStyle = bossTarget.color;
        c.beginPath();
        c.moveTo(10, 0);
        c.lineTo(-7, -7);
        c.lineTo(-7, 7);
        c.fill();
        c.restore();
      }
    }
    if (this.input?.pointer) {
      const rect = this.canvas.getBoundingClientRect(),
        x = this.input.pointer.x - rect.left,
        y = this.input.pointer.y - rect.top;
      c.strokeStyle = "#8bf5e440";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, y, 45, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#8bf5e433";
      c.beginPath();
      c.arc(
        x + this.input.vector.x * 35,
        y + this.input.vector.y * 35,
        17,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    const vignette = c.createRadialGradient(
      W / 2,
      H / 2,
      H * 0.25,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.7,
    );
    vignette.addColorStop(0, "#02050b00");
    vignette.addColorStop(1, "#02050bba");
    c.fillStyle = vignette;
    c.fillRect(0, 0, W, H);
  }
}
