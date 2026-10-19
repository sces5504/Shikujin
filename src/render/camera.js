import { RULES } from "../content/catalog.js";
// Ground coordinates never depend on camera easing or player velocity.
export const groundTile = { width: 2048, height: (2048 * 2) / 3 };
export function groundOffset(x, y, scale, W, H) {
  return { x: W / 2 - x * scale, y: H / 2 - y * scale };
}
export class BattleCamera {
  update(w, W, H, scale, time) {
    if (this.world !== w) {
      this.world = w;
      this.x = w?.player.x || 0;
      this.y = w?.player.y || 0;
      this.time = time;
    }
    const dt = Math.max(0, Math.min(0.05, time - (this.time ?? time)));
    this.time = time;
    if (!w) return this;
    const p = w.player,
      halfX = W / scale / 2,
      halfY = H / scale / 2;
    const dx = (W / scale) * 0.12,
      dy = (H / scale) * 0.12;
    const targetX =
      p.x - this.x > dx ? p.x - dx : p.x - this.x < -dx ? p.x + dx : this.x;
    const targetY =
      p.y - this.y > dy ? p.y - dy : p.y - this.y < -dy ? p.y + dy : this.y;
    const amount = 1 - Math.exp(-9 * dt);
    this.x += (targetX - this.x) * amount;
    this.y += (targetY - this.y) * amount;
    this.x = Math.max(
      -RULES.arena + halfX - 150,
      Math.min(RULES.arena - halfX + 150, this.x),
    );
    this.y = Math.max(
      -RULES.arena + halfY - 150,
      Math.min(RULES.arena - halfY + 150, this.y),
    );
    return this;
  }
}
