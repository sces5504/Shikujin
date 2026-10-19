import { projectileType } from "../content/projectiles.js";
import { BattleCamera } from "./camera.js";
import { combatEffects } from "./effects.js";
import { drawBoundary } from "./boundary.js";
import { escortPositions } from "../game/weapons.js";
import { GPULayer } from "./gpu.js";
import { RenderCache, blit } from "./cache.js";
import { terrain } from "./terrain.js";
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
    this.cache = new RenderCache();
    this.camera = new BattleCamera();
    this.fx = new GPULayer();
    this.width = 0;
    this.height = 0;
    this.scale = 1;
    this.reduced = false;
    this.quality = "auto";
    this.resolution = 1;
    this.stats = { renderMs: 0, ema: 16.7 };
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    const max =
      this.quality === "performance" ? 1 : this.quality === "high" ? 2 : 1.5;
    this.dpr = Math.min(window.devicePixelRatio || 1, max) * this.resolution;
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.fx.resize(this.width, this.height, this.dpr);
    this.scale = Math.max(
      0.6,
      Math.min(1.1, Math.min(this.width / 1120, this.height / 750)),
    );
    this.vignette = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.height * 0.25,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.65,
    );
    this.vignette.addColorStop(0, "#030c1200");
    this.vignette.addColorStop(1, "#020811a0");
  }
  adapt(frameMs, playing) {
    if (!playing || document.hidden || this.quality !== "auto") return;
    this.stats.ema = this.stats.ema * 0.96 + Math.min(100, frameMs) * 0.04;
    this.adaptFrames = (this.adaptFrames || 0) + 1;
    if (this.adaptFrames > 600 && this.stats.ema < 19 && this.resolution < 1) {
      this.resolution = Math.min(1, this.resolution + 0.1);
      this.resize();
      this.adaptFrames = 0;
    }
    if (
      this.adaptFrames > 24 &&
      this.stats.ema > 27 &&
      this.resolution > 0.72
    ) {
      this.resolution = Math.max(0.7, this.resolution - 0.15);
      this.resize();
      this.adaptFrames = 0;
    }
  }
  render(w, time) {
    const start = performance.now(),
      c = this.ctx,
      W = this.width,
      H = this.height;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const camera = this.camera.update(w, W, H, this.scale, time);
    this.fx.begin(
      W,
      H,
      camera.x - (this.reduced ? 0 : Math.sin(time * 87) * (w?.shake || 0)),
      camera.y - (this.reduced ? 0 : Math.cos(time * 97) * (w?.shake || 0)),
      this.scale,
    );
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.shadowBlur = 0;
    terrain(c, this.cache, w, W, H, this.scale, time, camera);
    if (!w) {
      this.stats.renderMs = performance.now() - start;
      return;
    }
    const p = w.player,
      px = camera.x,
      py = camera.y,
      sx = W / this.scale / 2 + 120,
      sy = H / this.scale / 2 + 120,
      visible = (x, y, r = 70) =>
        Math.abs(x - px) < sx + r && Math.abs(y - py) < sy + r;
    c.save();
    c.translate(W / 2, H / 2);
    c.scale(this.scale, this.scale);
    c.translate(-px, -py);
    if (!this.reduced && w.shake)
      c.translate(Math.sin(time * 87) * w.shake, Math.cos(time * 97) * w.shake);
    drawBoundary(c, w, camera, W, H, this.scale);
    // Drop cores are batched. Glows are pre-rasterized once, never shadowBlur per item.
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "#91ffe0";
    const dropGlow = this.cache.glow("#67ffd5");
    for (const d of w.drops) {
      if (!visible(d.x, d.y, 15)) continue;
      if (this.fx.available) this.fx.point(d.x, d.y, 10, 3);
      else c.drawImage(dropGlow, d.x - 6, d.y - 6, 12, 12);
    }
    c.globalCompositeOperation = "source-over";
    const kinds = ["scout", "striker", "orbiter", "tank", "charger", "healer"];
    for (const e of w.enemies) {
      if (e.hp <= 0 || !visible(e.x, e.y, 130)) continue;
      const boss = e.kind === "boss",
        angle = boss
          ? e.pattern === "spiral" || e.pattern === "eclipse"
            ? e.age * 0.1
            : Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2
          : Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2,
        group = boss ? "bosses" : "enemycraft",
        index = boss ? e.bossSprite || 0 : Math.max(0, kinds.indexOf(e.kind)),
        sprite = this.cache.sprite(group, index),
        size = e.r * (boss ? 3.85 : 4);
      if (e.telegraph > 0) {
        c.strokeStyle = e.color + "99";
        c.lineWidth = 1;
        c.setLineDash([7, 9]);
        c.beginPath();
        c.arc(e.x, e.y, e.r + 25 + (1 - e.telegraph) * 30, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(
          e.x + Math.cos(e.aim || 0) * 450,
          e.y + Math.sin(e.aim || 0) * 450,
        );
        c.stroke();
        c.setLineDash([]);
      }
      if (this.quality === "high" || w.enemies.length < 120 || e.id % 3 === 0) {
        c.globalAlpha = 0.4;
        this.sprite(
          c,
          this.cache.sprite(group, index),
          e.x + 15,
          e.y + 24,
          size,
          angle,
          true,
        );
      }
      c.globalAlpha = 1;
      if (sprite) this.sprite(c, sprite, e.x, e.y, size, angle);
      else {
        c.fillStyle = e.color;
        c.beginPath();
        c.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        c.fill();
      }
      if (e.flash) {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = 0.6;
        c.drawImage(
          this.cache.glow("#ffdd9c"),
          e.x - e.r,
          e.y - e.r,
          e.r * 2,
          e.r * 2,
        );
        c.globalAlpha = 1;
        c.globalCompositeOperation = "source-over";
      }
      if (!boss && e.hp < e.maxHp) {
        c.fillStyle = "#07131dcc";
        c.fillRect(e.x - e.r, e.y - size / 2 - 8, e.r * 2, 3);
        c.fillStyle = "#ffcc87";
        c.fillRect(
          e.x - e.r,
          e.y - size / 2 - 8,
          (e.r * 2 * e.hp) / e.maxHp,
          2,
        );
      }
    }
    for (const m of w.mines || []) {
      c.strokeStyle = m.arm > 0 ? "#9eacb5" : "#ffc786";
      c.lineWidth = 2;
      polygon(c, m.x, m.y, 13, 6, w.time * 0.4);
      c.stroke();
      c.fillStyle = "#fff0bf";
      c.fillRect(m.x - 3, m.y - 3, 6, 6);
    }
    this.projectiles(c, w, visible);
    c.globalCompositeOperation = "lighter";
    for (const ex of w.explosions || []) {
      if (!visible(ex.x, ex.y, ex.r)) continue;
      const age = 1 - ex.life / ex.maxLife,
        r = ex.r * (0.45 + age * 0.9);
      c.globalAlpha = Math.max(0, ex.life / ex.maxLife);
      if (this.fx.available)
        this.fx.sprite(this.cache.fire, ex.x, ex.y, r * 2, 0, c.globalAlpha);
      else c.drawImage(this.cache.fire, ex.x - r, ex.y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    const fire = this.cache.glow("#ffaf54");
    for (let i = 0; i < w.particles.length; i++) {
      const a = w.particles[i];
      if (!visible(a.x, a.y, 10) || (this.reduced && i % 2)) continue;
      c.globalAlpha = Math.min(1, a.life * 2);
      const r = a.r * 3;
      if (this.fx.available)
        this.fx.point(a.x, a.y, r * 2, 4, 0, 0, c.globalAlpha);
      else c.drawImage(fire, a.x - r, a.y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    for (const r of w.rings) {
      c.globalAlpha = Math.max(0, r.life / r.maxLife);
      c.strokeStyle = r.color;
      c.lineWidth = 2;
      const alpha = Math.max(0, r.life / r.maxLife);
      c.lineWidth = 1 + alpha * 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + w.time * 0.12;
        c.beginPath();
        c.arc(r.x, r.y, r.r, a, a + 0.7);
        c.stroke();
        const x = r.x + Math.cos(a) * r.r,
          y = r.y + Math.sin(a) * r.r;
        c.fillStyle = r.color;
        c.fillRect(x - 2, y - 2, 4, 4);
      }
      c.lineWidth = 1;
      polygon(c, r.x, r.y, r.r * 0.93, 12, w.time * 0.1);
      c.stroke();
    }
    c.globalAlpha = 1;
    combatEffects(c, w);
    c.globalCompositeOperation = "source-over";
    for (const n of w.damageNumbers || []) {
      if (!visible(n.x, n.y, 40)) continue;
      c.globalAlpha = Math.min(1, n.life * 3);
      c.drawImage(this.cache.number(n.value), n.x - 34, n.y - 12);
    }
    c.globalAlpha = 1;
    if (w.ship.weapon === "carrier")
      for (const pos of escortPositions(w))
        this.sprite(
          c,
          this.cache.sprite("craft", 4),
          pos.x,
          pos.y,
          39,
          pos.angle + Math.PI / 2,
        );
    const drones = w.upgrades.drone || 0;
    for (let i = 0; i < drones; i++) {
      const a = w.time * 1.8 + (i / drones) * Math.PI * 2,
        r = w.evolutions.includes("singularity") ? 125 : 85;
      this.sprite(
        c,
        this.cache.sprite("craft", 4),
        p.x + Math.cos(a) * r,
        p.y + Math.sin(a) * r,
        24,
        a,
      );
    }
    if (p.shield > 0) {
      c.strokeStyle = "#9defff70";
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(p.x, p.y, 32, w.time, w.time + Math.PI * 1.7);
      c.stroke();
    }
    const angle = p.angle + Math.PI / 2,
      shipSize = 86,
      shadow = this.cache.sprite("craft", w.ship.shape);
    c.globalAlpha = 0.45;
    this.sprite(c, shadow, p.x + 20, p.y + 34, shipSize, angle, true);
    c.globalAlpha = 1;
    {
      c.globalAlpha =
        p.invuln > 0 ? 0.65 + 0.35 * Math.abs(Math.sin(time * 18)) : 1;
      const sprite = this.cache.sprite("craft", w.ship.shape);
      if (sprite) this.sprite(c, sprite, p.x, p.y, shipSize, angle);
      else drawShip(c, p.x, p.y, p.angle, w.ship.color, w.ship.shape, 23, time);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = "lighter";
    const jet = this.cache.glow(w.ultimate ? "#ffda8a" : "#73d6ff");
    c.drawImage(
      jet,
      p.x - Math.cos(p.angle) * 26 - 17,
      p.y - Math.sin(p.angle) * 26 - 17,
      34,
      34,
    );
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
    c.fill();
    c.restore();
    if (this.fx.available) this.fx.point(p.x, p.y, 13, 8);
    this.fx.flush();
    const boss = w.enemies.find((e) => e.kind === "boss" && e.hp > 0);
    if (boss) {
      const dx = (boss.x - px) * this.scale,
        dy = (boss.y - py) * this.scale;
      if (Math.abs(dx) > W / 2 - 70 || Math.abs(dy) > H / 2 - 120) {
        const a = Math.atan2(dy, dx),
          r = Math.min(
            (W / 2 - 35) / Math.max(0.01, Math.abs(Math.cos(a))),
            (H / 2 - 120) / Math.max(0.01, Math.abs(Math.sin(a))),
          );
        c.save();
        c.translate(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r);
        c.rotate(a);
        c.fillStyle = "#ffca85";
        c.beginPath();
        c.moveTo(11, 0);
        c.lineTo(-7, -7);
        c.lineTo(-7, 7);
        c.fill();
        c.restore();
      }
    }
    this.pointer(c);
    c.fillStyle = this.vignette;
    c.fillRect(0, 0, W, H);
    this.stats.renderMs = performance.now() - start;
  }
  sprite(c, image, x, y, size, angle = 0, black = false) {
    if (this.fx.available)
      this.fx.sprite(image, x, y, size, angle, c.globalAlpha, black);
    else
      blit(
        c,
        black ? this.cache.shadows.get(image) || image : image,
        x,
        y,
        size,
        angle,
      );
  }
  projectiles(c, w, visible) {
    for (const b of w.bullets) {
      if (b.life <= 0 || !visible(b.x, b.y, 40)) continue;
      const id = b.type || b.kind,
        def = projectileType(id),
        sprite = this.cache.projectile(id, b.enemy, w.stasis > 0 && b.enemy),
        angle = Math.atan2(b.vy, b.vx);
      if (this.fx.available) this.fx.sprite(sprite, b.x, b.y, def.size, angle);
      else blit(c, sprite, b.x, b.y, def.size, angle);
    }
  }

  pointer(c) {
    if (!this.input?.pointer) return;
    const rect = this.canvas.getBoundingClientRect(),
      x = this.input.pointer.x - rect.left,
      y = this.input.pointer.y - rect.top;
    c.strokeStyle = "#b2f5e460";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, 45, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#b2f5e433";
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
}
