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
    const count = name === "enemycraft" ? 6 : 5,
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
          [4, "#160e24"],
          [2, "#ff87ae"],
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
    const key = frozen ? "frozen-bullet" : "hostile-bullet";
    if (this.sprites.has(key)) return this.sprites.get(key);
    const cv = surface(40),
      c = cv.getContext("2d");
    cv.danger = true;
    c.fillStyle = "#180b29";
    c.beginPath();
    c.arc(20, 20, 18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ff3297";
    c.beginPath();
    c.arc(20, 20, 13.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff5fd";
    c.beginPath();
    c.arc(20, 20, 8, 0, Math.PI * 2);
    c.fill();
    if (frozen) {
      c.strokeStyle = "#c1b5ff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(20, 20, 16.5, 0, Math.PI * 2);
      c.stroke();
    }
    this.sprites.set(key, cv);
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
