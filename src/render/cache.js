import { projectileType } from "../content/projectiles.js";
const surface = (w, h = w) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
export class RenderCache {
  constructor() {
    this.images = {};
    this.sprites = new Map();
    this.glows = new Map();
    this.texts = new Map();
    this.shadows = new WeakMap();
    for (const name of ["craft", "enemycraft", "bosses"]) {
      const im = new Image();
      this.images[name] = im;
      im.onload = () => this.prepare(name, im);
      im.src = new URL(`../../assets/${name}.webp`, import.meta.url).href;
    }
    this.fire = this.explosion();
  }
  prepare(name, image) {
    if (name === "terrain") return;
    const count = name === "bosses" ? 5 : 6,
      size = name === "bosses" ? 220 : 100,
      cell = image.naturalWidth / 3;
    for (let i = 0; i < count; i++) {
      const tile = surface(size);
      tile
        .getContext("2d")
        .drawImage(
          image,
          (i % 3) * cell,
          Math.floor(i / 3) * cell,
          cell,
          cell,
          0,
          0,
          size,
          size,
        );
      if (name === "enemycraft") {
        const original = surface(size),
          oc = original.getContext("2d");
        oc.drawImage(tile, 0, 0);
        const tint = surface(size),
          tc = tint.getContext("2d");
        tc.drawImage(tile, 0, 0);
        tc.globalCompositeOperation = "source-in";
        const t = tile.getContext("2d");
        t.clearRect(0, 0, size, size);
        for (const [r, color] of [
          [3, "#08151e"],
          [1, "#bdc9d477"],
        ]) {
          tc.fillStyle = color;
          tc.fillRect(0, 0, size, size);
          for (const [dx, dy] of [
            [r, 0],
            [-r, 0],
            [0, r],
            [0, -r],
          ])
            t.drawImage(tint, dx, dy);
        }
        t.drawImage(original, 0, 0);
      }
      this.sprites.set(`${name}:${i}`, tile);
      if (name === "craft") {
        const preview = surface(420);
        preview
          .getContext("2d")
          .drawImage(
            image,
            (i % 3) * cell,
            Math.floor(i / 3) * cell,
            cell,
            cell,
            0,
            0,
            420,
            420,
          );
        this.sprites.set(`preview:${i}`, preview);
      }
      const shadow = surface(size);
      const c = shadow.getContext("2d");
      c.drawImage(tile, 0, 0);
      c.globalCompositeOperation = "source-in";
      c.fillStyle = "#07121d";
      c.fillRect(0, 0, size, size);
      this.sprites.set(`${name}:${i}:shadow`, shadow);
      this.shadows.set(tile, shadow);
    }
  }
  terrainImage(index) {
    const name = `background-${index}`;
    if (!this.images[name]) {
      const image = new Image();
      this.images[name] = image;
      image.src = new URL(`../../assets/${name}.webp`, import.meta.url).href;
    }
    return this.images[name];
  }
  sprite(group, index) {
    return this.sprites.get(`${group}:${index}`);
  }
  enemyBullet(frozen = false) {
    return this.projectile("enemy", true, frozen);
  }
  projectile(id, hostile = false, frozen = false) {
    const key = `projectile:${id}:${hostile}:${frozen}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const def = projectileType(id),
      cv = surface(64),
      c = cv.getContext("2d");
    cv.danger = hostile;
    c.translate(32, 32);
    const path = () => {
      c.beginPath();
      if (def.shape === "orb") c.arc(0, 0, 17, 0, Math.PI * 2);
      else if (def.shape === "rice") {
        c.moveTo(24, 0);
        c.quadraticCurveTo(0, -14, -22, 0);
        c.quadraticCurveTo(0, 14, 24, 0);
      } else if (def.shape === "missile") {
        c.moveTo(25, 0);
        c.lineTo(7, -7);
        c.lineTo(-18, -6);
        c.lineTo(-25, -12);
        c.lineTo(-21, 0);
        c.lineTo(-25, 12);
        c.lineTo(-18, 6);
        c.lineTo(7, 7);
      } else if (def.shape === "shell") {
        c.moveTo(23, 0);
        c.lineTo(10, -9);
        c.lineTo(-20, -7);
        c.lineTo(-24, 0);
        c.lineTo(-20, 7);
        c.lineTo(10, 9);
      } else {
        c.moveTo(27, 0);
        c.lineTo(5, -5);
        c.lineTo(-25, -3);
        c.lineTo(-29, 0);
        c.lineTo(-25, 3);
        c.lineTo(5, 5);
      }
      c.closePath();
    };
    c.shadowColor = def.color;
    c.shadowBlur = 9;
    path();
    c.fillStyle = def.color;
    c.fill();
    c.shadowBlur = 0;
    path();
    c.strokeStyle = "#091321";
    c.lineWidth = 5;
    c.stroke();
    const g = c.createLinearGradient(0, -16, 0, 16);
    g.addColorStop(0, def.color);
    g.addColorStop(0.4, def.core);
    g.addColorStop(0.55, def.color);
    g.addColorStop(1, def.color + "88");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = def.core;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(def.shape === "orb" ? -7 : -15, -1);
    c.lineTo(def.shape === "orb" ? 7 : 16, -1);
    c.stroke();
    if (frozen) {
      c.strokeStyle = "#d5c4ff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.stroke();
    }
    this.sprites.set(key, cv);
    return cv;
  }
  overlayGlow(color) {
    const key = `overlay:${color}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const cv = surface(40);
    cv.getContext("2d").drawImage(this.glow(color), 0, 0);
    cv.overlay = true;
    this.sprites.set(key, cv);
    return cv;
  }
  hitSpark() {
    if (this.sprites.has("hitSpark")) return this.sprites.get("hitSpark");
    const cv = surface(64),
      c = cv.getContext("2d");
    cv.overlay = true;
    c.translate(32, 32);
    c.strokeStyle = "#fff1bb";
    c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.7;
      c.beginPath();
      c.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      c.lineTo(Math.cos(a) * 27, Math.sin(a) * 27);
      c.stroke();
    }
    this.sprites.set("hitSpark", cv);
    return cv;
  }
  glow(color) {
    if (this.glows.has(color)) return this.glows.get(color);
    const cv = surface(40),
      c = cv.getContext("2d"),
      g = c.createRadialGradient(20, 20, 0, 20, 20, 20);
    g.addColorStop(0, color);
    g.addColorStop(0.18, color + "c0");
    g.addColorStop(0.45, color + "45");
    g.addColorStop(1, color + "00");
    c.fillStyle = g;
    c.fillRect(0, 0, 40, 40);
    this.glows.set(color, cv);
    return cv;
  }
  explosion() {
    const cv = surface(128),
      c = cv.getContext("2d"),
      g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "#fffff2");
    g.addColorStop(0.15, "#fff4a9");
    g.addColorStop(0.32, "#ffc33cee");
    g.addColorStop(0.54, "#ff691cc0");
    g.addColorStop(0.76, "#b5281740");
    g.addColorStop(1, "#47120a00");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return cv;
  }
  number(value) {
    const key = String(value);
    if (this.texts.has(key)) return this.texts.get(key);
    const cv = surface(68, 24),
      c = cv.getContext("2d");
    c.font = "700 15px Rajdhani, sans-serif";
    c.textAlign = "center";
    c.strokeStyle = "#07131c";
    c.lineWidth = 3;
    c.strokeText(key, 34, 17);
    c.fillStyle = "#fff1bb";
    c.fillText(key, 34, 17);
    if (this.texts.size > 128)
      this.texts.delete(this.texts.keys().next().value);
    this.texts.set(key, cv);
    return cv;
  }
}
export function blit(c, sprite, x, y, size, angle = 0) {
  if (!sprite) return;
  c.save();
  c.translate(x, y);
  if (angle) c.rotate(angle);
  c.drawImage(sprite, -size / 2, -size / 2, size, size);
  c.restore();
}
