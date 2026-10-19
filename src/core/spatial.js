export class SpatialHash {
  constructor(size = 96) {
    this.size = size;
    this.cells = new Map();
    this.buckets = [];
    this.used = 0;
  }
  rebuild(entities) {
    this.cells.clear();
    this.used = 0;
    for (const e of entities) {
      if (e.hp <= 0) continue;
      const key =
        Math.floor(e.x / this.size) * 65536 +
        Math.floor(e.y / this.size) +
        32768;
      let bucket = this.cells.get(key);
      if (!bucket) {
        bucket = this.buckets[this.used] || (this.buckets[this.used] = []);
        bucket.length = 0;
        this.used++;
        this.cells.set(key, bucket);
      }
      bucket.push(e);
    }
  }
  query(x, y, r, out = []) {
    out.length = 0;
    if (!Number.isFinite(x + y + r) || r < 0) return out;
    const minX = Math.floor((x - r) / this.size),
      maxX = Math.floor((x + r) / this.size),
      minY = Math.floor((y - r) / this.size),
      maxY = Math.floor((y + r) / this.size);
    if (maxX - minX > 128 || maxY - minY > 128) return out;
    for (let a = minX; a <= maxX; a++)
      for (let b = minY; b <= maxY; b++) {
        const cell = this.cells.get(a * 65536 + b + 32768);
        if (cell) for (let i = 0; i < cell.length; i++) out.push(cell[i]);
      }
    return out;
  }
}
