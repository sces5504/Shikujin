// Ground coordinates never depend on camera easing or player velocity.
export const groundTile = { width: 2048, height: (2048 * 2) / 3 };
export function groundOffset(x, y, scale, W, H) {
  return { x: W / 2 - x * scale, y: H / 2 - y * scale };
}
