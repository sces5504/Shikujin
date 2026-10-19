import { groundTile, groundOffset } from "./camera.js";
// The battle terrain is anchored in world space. No scrolling or player parallax.
export function terrain(
  c,
  cache,
  w,
  W,
  H,
  scale,
  time,
  camera = { x: 0, y: 0 },
) {
  const image = cache.terrainImage(w?.mapIndex || 0);
  c.fillStyle = "#13333d";
  c.fillRect(0, 0, W, H);
  if (!image.complete || !image.naturalWidth) return;
  if (!w) {
    const s = Math.max(W / image.naturalWidth, H / image.naturalHeight);
    c.drawImage(
      image,
      (W - image.naturalWidth * s) / 2,
      (H - image.naturalHeight * s) / 2,
      image.naturalWidth * s,
      image.naturalHeight * s,
    );
    c.fillStyle = "#06101bc9";
    c.fillRect(0, 0, W, H);
    return;
  }
  const { width: tw, height: th } = groundTile,
    offset = groundOffset(camera.x, camera.y, scale, W, H);
  const originX = -tw / 2,
    originY = -th / 2;
  const left = Math.floor((camera.x - W / scale / 2 - originX) / tw),
    right = Math.floor((camera.x + W / scale / 2 - originX) / tw);
  const top = Math.floor((camera.y - H / scale / 2 - originY) / th),
    bottom = Math.floor((camera.y + H / scale / 2 - originY) / th);
  c.save();
  c.translate(offset.x, offset.y);
  c.scale(scale, scale);
  c.translate(originX, originY);
  for (let row = top; row <= bottom; row++)
    for (let col = left; col <= right; col++) {
      c.save();
      c.translate(col * tw + (col & 1 ? tw : 0), row * th + (row & 1 ? th : 0));
      c.scale(col & 1 ? -1 : 1, row & 1 ? -1 : 1);
      c.drawImage(image, 0, 0, tw, th);
      c.restore();
    }
  c.restore();
  // Tone down high-frequency terrain detail so enemies and hostile bullets lead.
  c.fillStyle = "#06151e68";
  c.fillRect(0, 0, W, H);
}
