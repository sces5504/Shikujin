export class SpatialHash {
  constructor(size = 90) {
    this.size = size;
    this.cells = new Map();
  }
  rebuild(entities) {
    this.cells.clear();
    for (const e of entities) {
      if (e.hp <= 0) continue;
      const key = `${Math.floor(e.x / this.size)},${Math.floor(e.y / this.size)}`;
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(e);
    }
  }
  query(x, y, r) {
    const out = [];
    for (
      let a = Math.floor((x - r) / this.size);
      a <= Math.floor((x + r) / this.size);
      a++
    )
      for (
        let b = Math.floor((y - r) / this.size);
        b <= Math.floor((y + r) / this.size);
        b++
      ) {
        const cell = this.cells.get(`${a},${b}`);
        if (cell) out.push(...cell);
      }
    return out;
  }
}
