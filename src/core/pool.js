// Retain a bounded free list; active objects are owned by World, never by the pool.
export class ObjectPool {
  constructor(create, limit = 2048) {
    this.create = create;
    this.limit = limit;
    this.free = [];
    this.created = 0;
  }
  acquire() {
    if (this.free.length) return this.free.pop();
    this.created++;
    return this.create();
  }
  release(value) {
    if (this.free.length < this.limit) this.free.push(value);
  }
}
export function compact(array, keep, onRemove) {
  let write = 0;
  for (let read = 0; read < array.length; read++) {
    const item = array[read];
    if (keep(item)) array[write++] = item;
    else onRemove?.(item);
  }
  array.length = write;
}
