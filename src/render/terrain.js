// Full-width orthographic scenes; alternating vertical reflection joins the
// exact same edge pixels, avoiding the visible square atlas seams of a tile grid.
export function terrain(c, cache, w, W, H, scale, time) {
  const index = w?.mapIndex || 0,
    image = cache.terrainImage(index),
    fallback = cache.images.terrain,
    ready = image.complete && image.naturalWidth,
    source = ready ? image : fallback;
  if (!source?.complete || !source.naturalWidth) {
    c.fillStyle = "#173b47";
    c.fillRect(0, 0, W, H);
    return;
  }
  const width = Math.ceil(Math.max(W * 1.12, H * 1.25)),
    height = Math.ceil(
      width * (ready ? source.naturalHeight / source.naturalWidth : 1),
    ),
    key = `${index}:${width}:${!!w}:${ready}`;
  if (cache.terrainKey !== key) {
    const cv = document.createElement("canvas");
    cv.width = width;
    cv.height = height;
    const g = cv.getContext("2d");
    if (ready) g.drawImage(source, 0, 0, width, height);
    else {
      const cell = source.naturalWidth / 3;
      g.drawImage(
        source,
        (index % 3) * cell,
        Math.floor(index / 3) * cell,
        cell,
        cell,
        0,
        0,
        width,
        height,
      );
    }
    g.fillStyle = w ? "#07152128" : "#06101bc9";
    g.fillRect(0, 0, width, height);
    cache.terrainCanvas = cv;
    cache.terrainKey = key;
  }
  const px = w?.player.x || 0,
    py = w?.player.y || 0,
    travel = (w?.time ?? time) * 24 - py * 0.12,
    block = Math.floor(travel / height),
    offset = travel - block * height,
    x = Math.round(
      Math.max(W - width, Math.min(0, (W - width) / 2 - px * 0.08)),
    );
  for (let j = -1; j <= Math.ceil(H / height); j++) {
    const y = Math.round(offset + j * height);
    if ((j - block) & 1) {
      c.save();
      c.translate(x, y + height);
      c.scale(1, -1);
      c.drawImage(cache.terrainCanvas, 0, 0);
      c.restore();
    } else c.drawImage(cache.terrainCanvas, x, y);
  }
}
