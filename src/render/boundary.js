import { RULES } from "../content/catalog.js";
export function edgeDistance(w) {
  const p = w.player,
    a = w.bossArena;
  const square = RULES.arena - Math.max(Math.abs(p.x), Math.abs(p.y));
  return a
    ? Math.min(square, a.r - Math.hypot(p.x - a.x, p.y - a.y) - 20)
    : square;
}
export function drawBoundary(c, w, camera, W, H, scale) {
  const halfX = W / scale / 2,
    halfY = H / scale / 2,
    A = RULES.arena;
  c.save();
  c.fillStyle = "#04101cbb";
  const left = camera.x - halfX,
    top = camera.y - halfY;
  if (left < -A) c.fillRect(left, top, -A - left, halfY * 2);
  if (camera.x + halfX > A) c.fillRect(A, top, camera.x + halfX - A, halfY * 2);
  if (top < -A) c.fillRect(left, top, halfX * 2, -A - top);
  if (camera.y + halfY > A)
    c.fillRect(left, A, halfX * 2, camera.y + halfY - A);

  c.lineWidth = 5;
  c.strokeStyle = "#ffb45bab";
  c.fillStyle = "#ec9a3510";
  const edges = [
    [-A, -A, -A, A],
    [A, -A, A, A],
    [-A, -A, A, -A],
    [-A, A, A, A],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    if (x1 === x2 && Math.abs(x1 - camera.x) > halfX + 40) continue;
    if (y1 === y2 && Math.abs(y1 - camera.y) > halfY + 40) continue;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.lineWidth = 2;
    c.strokeStyle = "#ffdc92";
    c.setLineDash([18, 12]);
    c.lineDashOffset = -w.time * 10;
    c.stroke();
    c.setLineDash([]);
    c.lineWidth = 5;
    c.strokeStyle = "#ffb45bab";
    const horizontal = y1 === y2,
      start = Math.max(horizontal ? camera.x - halfX : camera.y - halfY, -A),
      end = Math.min(horizontal ? camera.x + halfX : camera.y + halfY, A);
    for (let v = Math.floor(start / 80) * 80; v < end; v += 80) {
      const x = horizontal ? v : x1,
        y = horizontal ? y1 : v;
      c.beginPath();
      c.moveTo(x - 10, y - 10);
      c.lineTo(x + 10, y + 10);
      c.stroke();
    }
  }
  if (w.bossArena) {
    const a = w.bossArena;
    c.strokeStyle = "#ffb673aa";
    c.lineWidth = 5;
    c.setLineDash([20, 12]);
    c.beginPath();
    c.arc(a.x, a.y, a.r - 20, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }
  c.restore();
}
