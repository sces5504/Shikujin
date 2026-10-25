import { STAGE, BOUNDS } from "../content/stage.js";
// Vertical-stage dressing: parallax clouds, speed streaks and the arcade side frame.
const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let cloud, panels, panelKey;
function cloudSprite() {
  if (cloud) return cloud;
  cloud = document.createElement("canvas");
  cloud.width = cloud.height = 256;
  const c = cloud.getContext("2d");
  for (let i = 0; i < 9; i++) {
    const x = 70 + hash(i) * 116,
      y = 80 + hash(i + 9) * 96,
      r = 40 + hash(i + 19) * 46,
      g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "#ffffffcc");
    g.addColorStop(0.55, "#e8f4ff55");
    g.addColorStop(1, "#e8f4ff00");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  }
  return cloud;
}
// Low clouds scroll faster than the ground; this parallax sells altitude and speed.
export function drawSky(c, w, reduced) {
  const scroll = w.scroll || 0,
    span = STAGE.height + 700,
    image = cloudSprite();
  for (let i = 0; i < (reduced ? 4 : 7); i++) {
    const size = 340 + hash(i + 3) * 320,
      x = BOUNDS.left + hash(i + 40) * STAGE.width,
      y = ((i * 431 + scroll * 1.9) % span) - span / 2;
    c.globalAlpha = 0.07 + hash(i + 70) * 0.09;
    c.drawImage(image, x - size / 2, y - size / 2, size, size);
  }
  c.globalAlpha = 1;
  if (reduced) return;
  const boost =
    (w.player.overdrive > 0 ? 0.5 : 0) +
    (w.player.dashTime > 0 ? 0.8 : 0) +
    (w.ultimate ? 0.4 : 0);
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "#bfefff";
  c.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) {
    const len = 50 + hash(i + 90) * 120 * (1 + boost),
      x = BOUNDS.left + hash(i + 120) * STAGE.width,
      y =
        ((i * 211 + scroll * (5 + boost * 6)) % (STAGE.height + 300)) -
        STAGE.height / 2 -
        150;
    c.globalAlpha = 0.05 + hash(i + 150) * 0.06 + boost * 0.12;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + len);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
}
// Side panels outside the playable column, with a scrolling altimeter rail.
export function drawFrame(c, w, W, H, scale, time) {
  const sw = STAGE.width * scale,
    left = (W - sw) / 2,
    right = left + sw,
    color = w?.map?.color || "#74f7ed";
  if (left < 2) return;
  const key = `${W}x${H}:${color}:${scale}`;
  if (panelKey !== key) {
    panelKey = key;
    panels = document.createElement("canvas");
    panels.width = Math.ceil(W);
    panels.height = Math.ceil(H);
    const p = panels.getContext("2d");
    const panel = (x0, x1, flip) => {
      const g = p.createLinearGradient(flip ? x1 : x0, 0, flip ? x0 : x1, 0);
      g.addColorStop(0, "#02070ef2");
      g.addColorStop(1, "#06121ed8");
      p.fillStyle = g;
      p.fillRect(x0, 0, x1 - x0, H);
    };
    panel(0, left, false);
    panel(right, W, true);
    // Hex grid texture keeps the panels from reading as dead space.
    p.strokeStyle = color + "14";
    p.lineWidth = 1;
    for (const [x0, x1] of [
      [0, left],
      [right, W],
    ])
      for (let y = -40; y < H + 40; y += 36)
        for (let x = x0 + ((y / 36) & 1 ? 21 : 0); x < x1; x += 42) {
          p.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            p.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
          }
          p.closePath();
          p.stroke();
        }
  }
  c.drawImage(panels, 0, 0, W, H);
  const scroll = w?.scroll || 0;
  for (const [x, dir] of [
    [left, -1],
    [right, 1],
  ]) {
    const glow = c.createLinearGradient(x, 0, x + dir * 26, 0);
    glow.addColorStop(0, color + "55");
    glow.addColorStop(1, color + "00");
    c.fillStyle = glow;
    c.fillRect(Math.min(x, x + dir * 26), 0, 26, H);
    c.fillStyle = color;
    c.fillRect(x - (dir < 0 ? 2 : 0), 0, 2, H);
    // Altimeter ticks travel with the scroll.
    c.fillStyle = color + "88";
    const step = 48,
      off = (scroll * scale) % step;
    for (let y = off - step; y < H; y += step) {
      const big =
        Math.round((y - off) / step + (scroll * scale) / step) % 4 === 0;
      c.fillRect(
        x + dir * 6 - (dir < 0 ? (big ? 16 : 8) : 0),
        y,
        big ? 16 : 8,
        2,
      );
    }
  }
  // Item line markers: flying above them vacuums up every drop.
  const ly = H / 2 + STAGE.collectLine * scale;
  c.fillStyle = "#ffd56b";
  c.globalAlpha = 0.6 + Math.sin(time * 4) * 0.25;
  for (const [x, dir] of [
    [left, 1],
    [right, -1],
  ]) {
    c.beginPath();
    c.moveTo(x, ly - 7);
    c.lineTo(x + dir * 11, ly);
    c.lineTo(x, ly + 7);
    c.fill();
  }
  c.globalAlpha = 1;
}
